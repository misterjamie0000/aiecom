import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface SendOrderEmailParams {
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

export async function sendOrderEmail(params: SendOrderEmailParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-order-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending order email:', error);
      return false;
    }

    console.log('Order email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error invoking send-order-email function:', error);
    return false;
  }
}

// Helper to build order email params from order data
export function buildOrderEmailParams(
  order: any,
  emailType: SendOrderEmailParams['emailType'],
  userEmail: string,
  trackingNumber?: string,
  trackingUrl?: string,
  cancelReason?: string
): SendOrderEmailParams {
  const shippingAddress = order.shipping_address as ShippingAddress;
  
  return {
    email: userEmail,
    customerName: shippingAddress?.full_name || 'Customer',
    orderNumber: order.order_number,
    emailType,
    orderDetails: {
      items: (order.order_items || []).map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        variant_info: item.variant_info,
      })),
      subtotal: Number(order.subtotal || 0),
      taxAmount: Number(order.tax_amount || 0),
      shippingAmount: Number(order.shipping_amount || 0),
      discountAmount: Number(order.discount_amount || 0),
      totalAmount: Number(order.total_amount),
      paymentMethod: order.payment_method || 'cod',
      shippingAddress: {
        full_name: shippingAddress?.full_name || '',
        address_line1: shippingAddress?.address_line1 || '',
        address_line2: shippingAddress?.address_line2,
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        pincode: shippingAddress?.pincode || '',
        phone: shippingAddress?.phone || '',
      },
    },
    trackingNumber,
    trackingUrl,
    cancelReason,
  };
}
