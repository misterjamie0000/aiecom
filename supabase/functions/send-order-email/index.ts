import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_info?: string;
}

interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface OrderEmailRequest {
  email: string;
  customerName: string;
  orderNumber: string;
  emailType: 'order_placed' | 'order_confirmed' | 'order_shipped' | 'order_delivered' | 'order_cancelled';
  orderDetails: {
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    shippingAddress: ShippingAddress;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  cancelReason?: string;
}

const getEmailSubject = (emailType: string, orderNumber: string): string => {
  switch (emailType) {
    case 'order_placed':
      return `Order Confirmed! #${orderNumber}`;
    case 'order_confirmed':
      return `Your Order #${orderNumber} is Being Processed`;
    case 'order_shipped':
      return `Your Order #${orderNumber} Has Been Shipped! 🚚`;
    case 'order_delivered':
      return `Your Order #${orderNumber} Has Been Delivered! ✅`;
    case 'order_cancelled':
      return `Order #${orderNumber} Has Been Cancelled`;
    default:
      return `Order Update - #${orderNumber}`;
  }
};

const getEmailContent = (
  emailType: string, 
  customerName: string, 
  orderNumber: string,
  orderDetails: OrderEmailRequest['orderDetails'],
  trackingNumber?: string,
  trackingUrl?: string,
  cancelReason?: string
): { heading: string; message: string; showTracking: boolean; showItems: boolean } => {
  switch (emailType) {
    case 'order_placed':
      return {
        heading: 'Thank You for Your Order! 🎉',
        message: `Hi ${customerName}, your order has been successfully placed. We'll notify you once it's confirmed and shipped.`,
        showTracking: false,
        showItems: true,
      };
    case 'order_confirmed':
      return {
        heading: 'Order Confirmed ✓',
        message: `Hi ${customerName}, great news! Your order has been confirmed and is being prepared for shipping.`,
        showTracking: false,
        showItems: true,
      };
    case 'order_shipped':
      return {
        heading: 'Your Order is On Its Way! 🚚',
        message: `Hi ${customerName}, exciting news! Your order has been shipped and is on its way to you.`,
        showTracking: true,
        showItems: true,
      };
    case 'order_delivered':
      return {
        heading: 'Order Delivered! ✅',
        message: `Hi ${customerName}, your order has been successfully delivered. We hope you love your purchase!`,
        showTracking: false,
        showItems: true,
      };
    case 'order_cancelled':
      return {
        heading: 'Order Cancelled',
        message: `Hi ${customerName}, your order has been cancelled.${cancelReason ? ` Reason: ${cancelReason}` : ''} If you have any questions, please contact our support team.`,
        showTracking: false,
        showItems: true,
      };
    default:
      return {
        heading: 'Order Update',
        message: `Hi ${customerName}, there's an update on your order.`,
        showTracking: false,
        showItems: true,
      };
  }
};

const getStatusColor = (emailType: string): string => {
  switch (emailType) {
    case 'order_placed':
    case 'order_confirmed':
      return '#22c55e';
    case 'order_shipped':
      return '#3b82f6';
    case 'order_delivered':
      return '#6b7280';
    case 'order_cancelled':
      return '#ef4444';
    default:
      return '#eab308';
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-order-email");
  
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
      emailType,
      orderDetails,
      trackingNumber,
      trackingUrl,
      cancelReason,
    }: OrderEmailRequest = await req.json();

    console.log(`Sending ${emailType} email to ${email} for order ${orderNumber}`);

    const subject = getEmailSubject(emailType, orderNumber);
    const content = getEmailContent(emailType, customerName, orderNumber, orderDetails, trackingNumber, trackingUrl, cancelReason);
    const statusColor = getStatusColor(emailType);

    const itemsHtml = orderDetails.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500;">${item.product_name}</div>
          ${item.variant_info ? `<div style="font-size: 12px; color: #6b7280;">${item.variant_info}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.unit_price}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">₹${item.total_price}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${content.heading}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Order #${orderNumber}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 24px; color: #374151;">
              ${content.message}
            </p>
            
            ${content.showTracking && trackingNumber ? `
            <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">📦 Tracking Information</p>
              <p style="margin: 0; color: #1e3a8a;">Tracking Number: <strong>${trackingNumber}</strong></p>
              ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; margin-top: 12px; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">Track Your Order</a>` : ''}
            </div>
            ` : ''}
            
            ${content.showItems ? `
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #111827;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Subtotal</td>
                    <td style="padding: 4px 0; text-align: right;">₹${orderDetails.subtotal}</td>
                  </tr>
                  ${orderDetails.taxAmount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Tax (GST)</td>
                    <td style="padding: 4px 0; text-align: right;">₹${orderDetails.taxAmount}</td>
                  </tr>
                  ` : ''}
                  ${orderDetails.shippingAmount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Shipping</td>
                    <td style="padding: 4px 0; text-align: right;">₹${orderDetails.shippingAmount}</td>
                  </tr>
                  ` : ''}
                  ${orderDetails.discountAmount > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #22c55e;">Discount</td>
                    <td style="padding: 4px 0; text-align: right; color: #22c55e;">-₹${orderDetails.discountAmount}</td>
                  </tr>
                  ` : ''}
                  <tr style="font-size: 18px; font-weight: 700;">
                    <td style="padding: 12px 0 0 0;">Total</td>
                    <td style="padding: 12px 0 0 0; text-align: right;">₹${orderDetails.totalAmount}</td>
                  </tr>
                </table>
              </div>
            </div>
            ` : ''}
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #111827;">Shipping Address</h3>
              <p style="margin: 0; font-size: 14px; color: #374151;">
                <strong>${orderDetails.shippingAddress.full_name}</strong><br>
                ${orderDetails.shippingAddress.address_line1}<br>
                ${orderDetails.shippingAddress.address_line2 ? `${orderDetails.shippingAddress.address_line2}<br>` : ''}
                ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} - ${orderDetails.shippingAddress.pincode}<br>
                📞 ${orderDetails.shippingAddress.phone}
              </p>
            </div>
            
            <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">
                Need help? Contact our support team
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Payment Method: <strong>${orderDetails.paymentMethod === 'razorpay' ? 'Paid Online' : 'Cash on Delivery'}</strong>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>This is an automated email from GlowMart. Please do not reply directly.</p>
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
        from: "GlowMart <onboarding@resend.dev>",
        to: [email],
        subject,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error from Resend API:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Order email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
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
