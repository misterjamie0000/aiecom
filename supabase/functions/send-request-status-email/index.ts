import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  email: string;
  customerName: string;
  orderNumber: string;
  requestType: 'return' | 'replace';
  oldStatus: string;
  newStatus: string;
  adminNotes?: string;
  refundAmount?: number;
  refundStatus?: string;
}

const getStatusMessage = (requestType: string, status: string): string => {
  const type = requestType === 'replace' ? 'replacement' : 'return';
  
  switch (status) {
    case 'approved':
      return `Great news! Your ${type} request has been approved.`;
    case 'rejected':
      return `We regret to inform you that your ${type} request has been rejected.`;
    case 'processing':
      return `Your ${type} request is now being processed.`;
    case 'completed':
      return `Your ${type} request has been completed successfully.`;
    default:
      return `The status of your ${type} request has been updated.`;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':
      return '#22c55e';
    case 'rejected':
      return '#ef4444';
    case 'processing':
      return '#3b82f6';
    case 'completed':
      return '#6b7280';
    default:
      return '#eab308';
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-request-status-email");
  
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
    const {
      email,
      customerName,
      orderNumber,
      requestType,
      oldStatus,
      newStatus,
      adminNotes,
      refundAmount,
      refundStatus,
    }: StatusEmailRequest = await req.json();

    console.log(`Sending status update email to ${email} for order ${orderNumber}`);

    const typeLabel = requestType === 'replace' ? 'Replacement' : 'Return';
    const statusMessage = getStatusMessage(requestType, newStatus);
    const statusColor = getStatusColor(newStatus);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${typeLabel} Request Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${typeLabel} Request Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${customerName || 'Valued Customer'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${statusMessage}
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Order Number</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Request Type</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">${typeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Previous Status</td>
                  <td style="padding: 8px 0; text-align: right;">${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">New Status</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 9999px; font-weight: 600;">
                      ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                    </span>
                  </td>
                </tr>
                ${refundAmount && requestType === 'return' ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Refund Amount</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600;">₹${refundAmount}</td>
                </tr>
                ` : ''}
                ${refundStatus && requestType === 'return' ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Refund Status</td>
                  <td style="padding: 8px 0; text-align: right;">${refundStatus.charAt(0).toUpperCase() + refundStatus.slice(1)}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${adminNotes ? `
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: 600; color: #92400e;">Message from our team:</p>
              <p style="margin: 8px 0 0 0; color: #78350f;">${adminNotes}</p>
            </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              If you have any questions about your ${requestType} request, please don't hesitate to contact our support team.
            </p>
            
            <p style="font-size: 14px; color: #6b7280;">
              Best regards,<br>
              <strong>The Shop Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Shop Updates <onboarding@resend.dev>",
        to: [email],
        subject: `${typeLabel} Request Update - Order #${orderNumber}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error from Resend API:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Status update email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-request-status-email function:", error);
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
