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
      if (typeof window !== 'undefined' && window.Razorpay) {
        setIsScriptLoaded(true);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setIsScriptLoaded(true);
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        toast.error('Failed to load payment gateway. Please refresh and try again.');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (options: RazorpayOptions): Promise<boolean> => {
    setIsLoading(true);
    console.log('Initiating Razorpay payment for amount:', options.amount);

    try {
      // Ensure script is loaded
      if (typeof window === 'undefined' || !window.Razorpay) {
        console.log('Razorpay not loaded, loading script...');
        const loaded = await loadScript();
        if (!loaded) {
          setIsLoading(false);
          throw new Error('Failed to load payment gateway');
        }
      }

      console.log('Calling razorpay-create-order edge function...');
      
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

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        setIsLoading(false);
        toast.error('Failed to create payment order. Please try again.');
        return false;
      }

      if (!data?.success) {
        console.error('Razorpay order creation failed:', data?.error);
        setIsLoading(false);
        toast.error(data?.error || 'Failed to create payment order');
        return false;
      }

      const { order, key_id } = data;
      console.log('Razorpay order created:', order.id, 'Key ID:', key_id?.substring(0, 10) + '...');

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
            console.log('Payment successful, verifying...', response.razorpay_payment_id);
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
                setIsLoading(false);
                resolve(false);
                return;
              }

              console.log('Payment verified successfully');
              toast.success('Payment successful!');
              setIsLoading(false);
              resolve(true);
            } catch (err) {
              console.error('Error verifying payment:', err);
              toast.error('Payment verification failed');
              setIsLoading(false);
              resolve(false);
            }
          },
          modal: {
            ondismiss: () => {
              console.log('Razorpay modal dismissed');
              toast.error('Payment cancelled');
              setIsLoading(false);
              resolve(false);
            },
          },
        };

        console.log('Opening Razorpay checkout...');
        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.on('payment.failed', (response: any) => {
          console.error('Payment failed:', response.error);
          toast.error(`Payment failed: ${response.error.description}`);
          setIsLoading(false);
          resolve(false);
        });
        razorpay.open();
      });
    } catch (error: any) {
      console.error('Razorpay error:', error);
      toast.error(error.message || 'Payment failed');
      setIsLoading(false);
      return false;
    }
  }, [loadScript]);

  return {
    isLoading,
    isScriptLoaded,
    initiatePayment,
    loadScript,
  };
}
