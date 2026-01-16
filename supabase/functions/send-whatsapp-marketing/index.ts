import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppAPISettings {
  whatsapp_enabled: boolean;
  phone_number_id: string;
  access_token: string;
  business_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id, cart_id, type } = await req.json();
    console.log('Request received:', { campaign_id, cart_id, type });

    // Fetch WhatsApp API settings from site_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'whatsapp_api')
      .single();

    if (settingsError || !settingsData) {
      console.error('WhatsApp settings not found:', settingsError);
      return new Response(
        JSON.stringify({ error: 'WhatsApp API not configured. Please configure it in Marketing Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappSettings = settingsData.value as WhatsAppAPISettings;

    if (!whatsappSettings.whatsapp_enabled) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp marketing is disabled. Enable it in Marketing Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!whatsappSettings.phone_number_id || !whatsappSettings.access_token) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp API credentials not configured properly.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'campaign') {
      return await handleCampaign(supabase, campaign_id, whatsappSettings);
    } else if (type === 'cart_reminder') {
      return await handleCartReminder(supabase, cart_id, whatsappSettings);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid request type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in send-whatsapp-marketing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCampaign(supabase: any, campaignId: string, settings: WhatsAppAPISettings) {
  console.log('Processing campaign:', campaignId);

  // Fetch campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('whatsapp_campaigns')
    .select('*, template:whatsapp_templates(*), segment:customer_segments(*)')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error('Campaign not found:', campaignError);
    return new Response(
      JSON.stringify({ error: 'Campaign not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update campaign status to sending
  await supabase
    .from('whatsapp_campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId);

  // Fetch recipients based on segment
  let recipients: any[] = [];
  
  if (campaign.target_segment_id) {
    // Get customers from segment
    const { data: segmentMembers } = await supabase
      .from('customer_segment_members')
      .select('customer_id')
      .eq('segment_id', campaign.target_segment_id);

    if (segmentMembers && segmentMembers.length > 0) {
      const customerIds = segmentMembers.map((m: any) => m.customer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, phone, full_name')
        .in('id', customerIds)
        .not('phone', 'is', null);
      
      recipients = profiles || [];
    }
  } else {
    // Get all customers with phone numbers
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone, full_name')
      .not('phone', 'is', null);
    
    recipients = profiles || [];
  }

  console.log(`Found ${recipients.length} recipients`);

  let sentCount = 0;
  let failedCount = 0;

  // Send messages to each recipient
  for (const recipient of recipients) {
    try {
      // Create recipient record
      await supabase
        .from('whatsapp_campaign_recipients')
        .insert({
          campaign_id: campaignId,
          user_id: recipient.id,
          phone_number: recipient.phone,
          status: 'pending',
        });

      // Format phone number (remove non-digits, add country code if needed)
      let phoneNumber = recipient.phone.replace(/\D/g, '');
      if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      }

      // Prepare message content
      let messageContent = campaign.message_content;
      messageContent = messageContent.replace('{{1}}', recipient.full_name || 'Customer');

      // Send WhatsApp message via Meta API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${settings.phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: { body: messageContent },
          }),
        }
      );

      const result = await response.json();
      console.log('WhatsApp API response:', result);

      if (result.messages && result.messages[0]) {
        // Update recipient status to sent
        await supabase
          .from('whatsapp_campaign_recipients')
          .update({
            status: 'sent',
            message_id: result.messages[0].id,
            sent_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId)
          .eq('user_id', recipient.id);
        
        sentCount++;
      } else {
        // Update recipient status to failed
        await supabase
          .from('whatsapp_campaign_recipients')
          .update({
            status: 'failed',
            error_message: result.error?.message || 'Unknown error',
            failed_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId)
          .eq('user_id', recipient.id);
        
        failedCount++;
      }
    } catch (error) {
      console.error('Error sending to recipient:', error);
      failedCount++;
    }
  }

  // Update campaign status and counts
  await supabase
    .from('whatsapp_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      total_recipients: recipients.length,
      total_sent: sentCount,
      total_failed: failedCount,
    })
    .eq('id', campaignId);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Campaign sent to ${sentCount} recipients`,
      total_recipients: recipients.length,
      sent: sentCount,
      failed: failedCount,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCartReminder(supabase: any, cartId: string, settings: WhatsAppAPISettings) {
  console.log('Processing cart reminder:', cartId);

  // Fetch abandoned cart details
  const { data: cart, error: cartError } = await supabase
    .from('abandoned_carts')
    .select('*')
    .eq('id', cartId)
    .single();

  if (cartError || !cart) {
    console.error('Cart not found:', cartError);
    return new Response(
      JSON.stringify({ error: 'Cart not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, full_name')
    .eq('id', cart.user_id)
    .single();

  if (!profile || !profile.phone) {
    return new Response(
      JSON.stringify({ error: 'Customer phone number not available' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('*, product:products(name)')
    .eq('user_id', cart.user_id);

  // Format phone number
  let phoneNumber = profile.phone.replace(/\D/g, '');
  if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
    phoneNumber = '91' + phoneNumber;
  }

  // Prepare reminder message
  const itemCount = cart.total_items || cartItems?.length || 0;
  const cartValue = cart.total_value || 0;
  const message = `Hi ${profile.full_name || 'there'}! 🛒\n\nYou left ${itemCount} item(s) in your cart worth ₹${cartValue.toLocaleString()}.\n\nComplete your purchase now and don't miss out on these items!\n\nShop now: ${Deno.env.get('SITE_URL') || 'https://yourstore.com'}/cart`;

  try {
    // Send WhatsApp message
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${settings.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const result = await response.json();
    console.log('WhatsApp reminder response:', result);

    if (result.messages && result.messages[0]) {
      // Update abandoned cart with reminder info
      await supabase
        .from('abandoned_carts')
        .update({
          reminder_count: (cart.reminder_count || 0) + 1,
          reminder_sent_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp reminder sent successfully',
          message_id: result.messages[0].id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error?.message || 'Failed to send WhatsApp message',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error sending WhatsApp reminder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
