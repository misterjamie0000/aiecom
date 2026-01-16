import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MarketingEmailRequest {
  action: 'send_campaign' | 'send_cart_reminder';
  campaignId?: string;
  cartId?: string;
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GlowMart <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to send email");
  }
  return data;
}

function replaceTemplateVars(content: string, vars: Record<string, string>) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function sendCampaign(campaignId: string) {
  console.log(`Starting campaign send for: ${campaignId}`);

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    throw new Error('Campaign already sent or cancelled');
  }

  // Update campaign status to sending
  await supabaseAdmin
    .from('email_campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId);

  // Get target recipients based on segment
  let recipients: { id: string; email: string; full_name: string | null }[] = [];

  if (campaign.target_segment_id) {
    // Get members of the segment
    const { data: members } = await supabaseAdmin
      .from('customer_segment_members')
      .select('customer_id')
      .eq('segment_id', campaign.target_segment_id);

    if (members && members.length > 0) {
      const customerIds = members.map(m => m.customer_id);
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', customerIds)
        .not('email', 'is', null);

      recipients = profiles || [];
    }
  } else {
    // Send to all customers with email
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .not('email', 'is', null);

    recipients = profiles || [];
  }

  console.log(`Found ${recipients.length} recipients for campaign`);

  // Update total recipients
  await supabaseAdmin
    .from('email_campaigns')
    .update({ total_recipients: recipients.length })
    .eq('id', campaignId);

  let sentCount = 0;
  let failedCount = 0;

  // Send emails to each recipient
  for (const recipient of recipients) {
    try {
      if (!recipient.email) continue;

      const personalizedContent = replaceTemplateVars(campaign.content, {
        customer_name: recipient.full_name || 'Valued Customer',
        shop_url: `${SUPABASE_URL.replace('.supabase.co', '')}.lovable.app`,
        campaign_content: campaign.content,
      });

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ${personalizedContent}
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>You received this email because you're subscribed to GlowMart updates.</p>
              <p><a href="#" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </body>
        </html>
      `;

      await sendEmail(recipient.email, campaign.subject, emailHtml);

      // Record recipient
      await supabaseAdmin
        .from('campaign_recipients')
        .insert({
          campaign_id: campaignId,
          user_id: recipient.id,
          email: recipient.email,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

      sentCount++;
    } catch (error: any) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      
      await supabaseAdmin
        .from('campaign_recipients')
        .insert({
          campaign_id: campaignId,
          user_id: recipient.id,
          email: recipient.email || '',
          status: 'failed',
          error_message: error?.message || 'Unknown error',
        });

      failedCount++;
    }
  }

  // Update campaign with final stats
  await supabaseAdmin
    .from('email_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      total_sent: sentCount,
    })
    .eq('id', campaignId);

  console.log(`Campaign completed: ${sentCount} sent, ${failedCount} failed`);

  return { sent: sentCount, failed: failedCount };
}

async function sendCartReminder(cartId: string) {
  console.log(`Sending cart reminder for: ${cartId}`);

  // Get abandoned cart details
  const { data: cart, error: cartError } = await supabaseAdmin
    .from('abandoned_carts')
    .select('*')
    .eq('id', cartId)
    .single();

  if (cartError || !cart) {
    throw new Error('Abandoned cart not found');
  }

  // Get customer profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email')
    .eq('id', cart.user_id)
    .single();

  if (!profile?.email) {
    throw new Error('Customer email not found');
  }

  // Get cart items
  const { data: cartItems } = await supabaseAdmin
    .from('cart_items')
    .select(`
      quantity,
      products(name, price, image_url)
    `)
    .eq('user_id', cart.user_id);

  // Get template
  const { data: template } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .eq('template_type', 'abandoned_cart')
    .eq('is_default', true)
    .single();

  // Build cart items HTML
  const cartItemsHtml = (cartItems || []).map((item: any) => `
    <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">
      <img src="${item.products?.image_url || '/placeholder.svg'}" alt="${item.products?.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 12px;">
      <div>
        <p style="margin: 0; font-weight: 500;">${item.products?.name}</p>
        <p style="margin: 4px 0 0 0; color: #6b7280;">Qty: ${item.quantity} × ₹${item.products?.price}</p>
      </div>
    </div>
  `).join('');

  const subject = template?.subject || 'You left something behind! 🛒';
  let content = template?.content || `
    <h1>Don't forget your items!</h1>
    <p>Hi {{customer_name}},</p>
    <p>You have items waiting in your cart. Complete your purchase before they're gone!</p>
    <div>{{cart_items}}</div>
    <p><a href="{{cart_url}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Complete Your Order</a></p>
  `;

  content = replaceTemplateVars(content, {
    customer_name: profile.full_name || 'Valued Customer',
    cart_items: cartItemsHtml,
    cart_url: `${SUPABASE_URL.replace('.supabase.co', '')}.lovable.app/cart`,
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${content}
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>You received this email because you have items in your cart at GlowMart.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail(profile.email, subject, emailHtml);

  // Update abandoned cart record
  await supabaseAdmin
    .from('abandoned_carts')
    .update({
      reminder_sent_at: new Date().toISOString(),
      reminder_count: cart.reminder_count + 1,
    })
    .eq('id', cartId);

  console.log(`Cart reminder sent to ${profile.email}`);

  return { success: true, email: profile.email };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-marketing-email");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { action, campaignId, cartId }: MarketingEmailRequest = await req.json();

    let result;

    switch (action) {
      case 'send_campaign':
        if (!campaignId) throw new Error('Campaign ID required');
        result = await sendCampaign(campaignId);
        break;

      case 'send_cart_reminder':
        if (!cartId) throw new Error('Cart ID required');
        result = await sendCartReminder(cartId);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-marketing-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
