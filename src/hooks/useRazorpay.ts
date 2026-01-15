import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  amount: number;
  currency?: string;
  name: string;
  description?: string;
  orderId: string; // Our internal order ID
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface UseRazorpayReturn {
  isLoading: boolean;
  isScriptLoaded: boolean;
  initiatePayment: (options: RazorpayOptions) => Promise<boolean>;
  loadScript: () => Promise<boolean>;
}

export function useRazorpay(): UseRazorpayReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(
    typeof window !== 'undefined' && !!window.Razorpay
  );

  const loadScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        setIsScriptLoaded(true);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (options: RazorpayOptions): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Ensure script is loaded
      if (!window.Razorpay) {
        const loaded = await loadScript();
        if (!loaded) {
          throw new Error('Failed to load payment gateway');
        }
      }

      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount: options.amount,
          currency: options.currency || 'INR',
          receipt: `order_${options.orderId}`,
          notes: {
            internal_order_id: options.orderId,
          },
        },
      });

      if (error || !data?.success) {
        console.error('Error creating Razorpay order:', error || data?.error);
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const { order, key_id } = data;

      // Open Razorpay checkout
      return new Promise((resolve) => {
        const razorpayOptions = {
          key: key_id,
          amount: order.amount,
          currency: order.currency,
          name: options.name,
          description: options.description || 'Order Payment',
          order_id: order.id,
          prefill: options.prefill || {},
          theme: {
            color: options.theme?.color || '#6366f1',
          },
          handler: async (response: any) => {
            try {
              // Verify payment
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                'razorpay-verify-payment',
                {
                  body: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    order_id: options.orderId,
                  },
                }
              );

              if (verifyError || !verifyData?.success) {
                console.error('Payment verification failed:', verifyError || verifyData?.error);
                toast.error('Payment verification failed. Please contact support.');
                resolve(false);
                return;
              }

              toast.success('Payment successful!');
              resolve(true);
            } catch (err) {
              console.error('Error verifying payment:', err);
              toast.error('Payment verification failed');
              resolve(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast.error('Payment cancelled');
              resolve(false);
            },
          },
        };

        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();
      });
    } catch (error: any) {
      console.error('Razorpay error:', error);
      toast.error(error.message || 'Payment failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadScript]);

  return {
    isLoading,
    isScriptLoaded,
    initiatePayment,
    loadScript,
  };
}
