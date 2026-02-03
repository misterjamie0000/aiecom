import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, CheckCircle2, Package, Loader2, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, useCartSummary, useClearCart } from '@/hooks/useCart';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CheckoutAddressSection from '@/components/checkout/CheckoutAddressSection';
import { sendOrderEmail } from '@/hooks/useOrderEmails';

type Step = 'address' | 'payment' | 'confirmation';
type PaymentMethodType = 'cod' | 'razorpay' | 'phonepe' | 'paytm';

interface AddressData {
  id?: string;
  fullName: string;
  phone: string;
  alternativePhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface PaymentGateway {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommended?: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cartItems } = useCart();
  const { data: siteSettings } = useSiteSettings();
  const summary = useCartSummary(cartItems || []);
  const clearCart = useClearCart();
  const { initiatePayment, loadScript, isLoading: isPaymentLoading } = useRazorpay();
  
  const [step, setStep] = useState<Step>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('razorpay');

  // Get payment settings from site settings
  const paymentSettings = useMemo(() => {
    const paymentSetting = siteSettings?.find(s => s.key === 'payment_gateway');
    return {
      razorpay_enabled: true,
      phonepe_enabled: false,
      paytm_enabled: false,
      cod_enabled: true,
      cod_min_order: 0,
      cod_max_order: 50000,
      ...(paymentSetting?.value as any || {}),
    };
  }, [siteSettings]);

  // Build available payment gateways based on settings
  const availableGateways = useMemo(() => {
    const gateways: PaymentGateway[] = [];
    
    if (paymentSettings.razorpay_enabled) {
      gateways.push({
        id: 'razorpay',
        name: 'Razorpay',
        description: 'UPI, Cards, Net Banking, Wallets',
        icon: <CreditCard className="w-5 h-5 text-white" />,
        color: 'bg-blue-600',
        recommended: true,
      });
    }
    
    if (paymentSettings.phonepe_enabled) {
      gateways.push({
        id: 'phonepe',
        name: 'PhonePe',
        description: 'PhonePe UPI & Wallet',
        icon: <Smartphone className="w-5 h-5 text-white" />,
        color: 'bg-purple-600',
      });
    }
    
    if (paymentSettings.paytm_enabled) {
      gateways.push({
        id: 'paytm',
        name: 'Paytm',
        description: 'Paytm UPI, Wallet & Net Banking',
        icon: <Wallet className="w-5 h-5 text-white" />,
        color: 'bg-sky-500',
      });
    }
    
    // Check COD eligibility based on order value
    const isCodEligible = 
      paymentSettings.cod_enabled && 
      (paymentSettings.cod_min_order === 0 || summary.total >= paymentSettings.cod_min_order) &&
      (paymentSettings.cod_max_order === 0 || summary.total <= paymentSettings.cod_max_order);
    
    if (isCodEligible) {
      gateways.push({
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: <Truck className="w-5 h-5 text-white" />,
        color: 'bg-amber-500',
      });
    }
    
    return gateways;
  }, [paymentSettings, summary.total]);

  // Set default payment method to first available gateway
  useEffect(() => {
    if (availableGateways.length > 0 && !availableGateways.find(g => g.id === paymentMethod)) {
      setPaymentMethod(availableGateways[0].id);
    }
  }, [availableGateways, paymentMethod]);

  // Preload Razorpay script if enabled
  useEffect(() => {
    if (paymentSettings.razorpay_enabled) {
      loadScript();
    }
  }, [loadScript, paymentSettings.razorpay_enabled]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please login to continue checkout.</p>
        <Button asChild className="mt-4">
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  // Only show empty cart if not in confirmation step
  if ((!cartItems || cartItems.length === 0) && step !== 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Your cart is empty.</p>
        <Button asChild className="mt-4">
          <Link to="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  const handleAddressContinue = (addressData: AddressData) => {
    setAddress(addressData);
    setStep('payment');
  };

  const createOrder = async () => {
    // Generate order number
    const { data: orderNumber } = await supabase.rpc('generate_order_number');

    if (!address) throw new Error('Address not set');

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber || `ORD-${Date.now()}`,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod as 'razorpay' | 'cod' | 'phonepe' | 'paytm',
        subtotal: summary.subtotal,
        shipping_amount: summary.shipping,
        discount_amount: summary.discount,
        total_amount: summary.total,
        shipping_address: {
          full_name: address.fullName,
          phone: address.phone,
          alternative_phone: address.alternativePhone || null,
          address_line1: address.addressLine1,
          address_line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: 'India',
        },
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cartItems!.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      gst_percent: item.product.gst_percent || 18,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      const isOnlinePayment = paymentMethod === 'razorpay' || paymentMethod === 'phonepe' || paymentMethod === 'paytm';
      
      if (isOnlinePayment) {
        // Create order first
        const order = await createOrder();

        if (paymentMethod === 'razorpay') {
          // Initiate Razorpay payment
          const paymentSuccess = await initiatePayment({
            amount: summary.total,
            name: 'GlowMart',
            description: `Order #${order.order_number}`,
            orderId: order.id,
            prefill: {
              name: address?.fullName,
              contact: address?.phone,
              email: user.email || undefined,
            },
            theme: {
              color: '#6366f1',
            },
          });

          if (paymentSuccess) {
            await handlePaymentSuccess(order);
          } else {
            await handlePaymentFailure(order);
          }
        } else if (paymentMethod === 'phonepe' || paymentMethod === 'paytm') {
          // PhonePe and Paytm integration - placeholder for now
          // In production, you would integrate their SDK similar to Razorpay
          toast.info(`${paymentMethod === 'phonepe' ? 'PhonePe' : 'Paytm'} integration coming soon. Using demo mode.`);
          
          // Demo: simulate successful payment
          await supabase
            .from('orders')
            .update({ 
              status: 'confirmed',
              payment_status: 'paid'
            })
            .eq('id', order.id);
          
          await handlePaymentSuccess(order);
        }
      } else {
        // Cash on Delivery
        const order = await createOrder();
        
        // Update order status for COD
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', order.id);

        await handlePaymentSuccess(order);
        toast.success('Order placed successfully!');
      }
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error('Failed to place order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (order: any) => {
    // Clear cart
    await clearCart.mutateAsync();
    
    // Send order confirmation email
    sendOrderEmail({
      email: user.email || '',
      customerName: address?.fullName || 'Customer',
      orderNumber: order.order_number,
      emailType: 'order_placed',
      orderDetails: {
        items: cartItems!.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: Number(item.product.price),
          total_price: Number(item.product.price) * item.quantity,
        })),
        subtotal: summary.subtotal,
        taxAmount: 0,
        shippingAmount: summary.shipping,
        discountAmount: summary.discount,
        totalAmount: summary.total,
        paymentMethod: paymentMethod,
        shippingAddress: {
          full_name: address?.fullName || '',
          address_line1: address?.addressLine1 || '',
          address_line2: address?.addressLine2,
          city: address?.city || '',
          state: address?.state || '',
          pincode: address?.pincode || '',
          phone: address?.phone || '',
        },
      },
    });
    
    setOrderId(order.order_number);
    setStep('confirmation');
  };

  const handlePaymentFailure = async (order: any) => {
    await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        payment_status: 'failed',
        cancel_reason: 'Payment failed or cancelled by user'
      })
      .eq('id', order.id);
    
    toast.error('Payment was not completed. Please try again.');
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-xl p-8 text-center border"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2 text-foreground"
            >
              Order Confirmed! 🎉
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mb-6"
            >
              Thank you for shopping with us!
            </motion.p>

            {/* Order Number Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-muted/50 rounded-xl p-6 mb-8"
            >
              <p className="text-sm text-muted-foreground mb-2">Your Order Number</p>
              <p className="text-2xl font-mono font-bold text-primary">
                {orderId}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                We've sent a confirmation email with order details
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <Truck className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Expected Delivery</p>
                <p className="text-sm font-semibold">3-5 Business Days</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                <CreditCard className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-semibold">
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                   paymentMethod === 'razorpay' ? 'Paid via Razorpay' :
                   paymentMethod === 'phonepe' ? 'Paid via PhonePe' :
                   paymentMethod === 'paytm' ? 'Paid via Paytm' : 'Paid Online'}
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3"
            >
              <Button asChild size="lg" className="w-full">
                <Link to="/orders">
                  <Package className="w-4 h-4 mr-2" />
                  Track Your Order
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Help Text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Need help? Contact us at support@store.com
          </motion.p>
        </div>
      </div>
    );
  }

  const isButtonDisabled = isProcessing || isPaymentLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['Address', 'Payment'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                (step === 'address' && i === 0) || (step === 'payment' && i <= 1)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span className="ml-2 text-sm font-medium">{s}</span>
            {i < 1 && <div className="w-12 h-0.5 bg-muted mx-4" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 'address' && (
            <CheckoutAddressSection onContinue={handleAddressContinue} />
          )}

          {step === 'payment' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableGateways.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No payment methods available for this order.</p>
                      <p className="text-sm mt-2">Please contact support.</p>
                    </div>
                  ) : (
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}
                      className="space-y-4"
                    >
                      {availableGateways.map((gateway) => (
                        <div 
                          key={gateway.id}
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                            paymentMethod === gateway.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <RadioGroupItem value={gateway.id} id={gateway.id} />
                          <Label htmlFor={gateway.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${gateway.color} rounded-lg flex items-center justify-center`}>
                                {gateway.icon}
                              </div>
                              <div>
                                <p className="font-medium">{gateway.name}</p>
                                <p className="text-sm text-muted-foreground">{gateway.description}</p>
                              </div>
                            </div>
                          </Label>
                          {gateway.recommended && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  <div className="flex gap-4 mt-6">
                    <Button variant="outline" onClick={() => setStep('address')}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="lg" 
                      onClick={handlePlaceOrder}
                      disabled={isButtonDisabled || availableGateways.length === 0}
                    >
                      {isButtonDisabled ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : paymentMethod === 'cod' ? (
                        `Place Order • ₹${summary.total}`
                      ) : (
                        `Pay ₹${summary.total}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {cartItems?.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">₹{item.product.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{summary.subtotal}</span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{summary.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{summary.total}</span>
              </div>

              {paymentMethod !== 'cod' && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  🔒 Secured by {paymentMethod === 'razorpay' ? 'Razorpay' : paymentMethod === 'phonepe' ? 'PhonePe' : paymentMethod === 'paytm' ? 'Paytm' : 'Gateway'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
