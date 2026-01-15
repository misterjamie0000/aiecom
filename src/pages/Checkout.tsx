import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, CheckCircle2, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, useCartSummary, useClearCart } from '@/hooks/useCart';
import { useRazorpay } from '@/hooks/useRazorpay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CheckoutAddressSection from '@/components/checkout/CheckoutAddressSection';

type Step = 'address' | 'payment' | 'confirmation';

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

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cartItems } = useCart();
  const summary = useCartSummary(cartItems || []);
  const clearCart = useClearCart();
  const { initiatePayment, loadScript, isLoading: isPaymentLoading } = useRazorpay();
  
  const [step, setStep] = useState<Step>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');

  // Preload Razorpay script
  useEffect(() => {
    loadScript();
  }, [loadScript]);

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
        payment_method: paymentMethod,
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
      if (paymentMethod === 'razorpay') {
        // Create order first
        const order = await createOrder();

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
          // Clear cart and show confirmation
          await clearCart.mutateAsync();
          setOrderId(order.order_number);
          setStep('confirmation');
        } else {
          // Payment failed or cancelled - update order status
          await supabase
            .from('orders')
            .update({ 
              status: 'cancelled',
              payment_status: 'failed',
              cancel_reason: 'Payment failed or cancelled by user'
            })
            .eq('id', order.id);
          
          // Optionally keep the order in pending for retry
          toast.error('Payment was not completed. Please try again.');
        }
      } else {
        // Cash on Delivery
        const order = await createOrder();
        
        // Update order status for COD
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', order.id);

        // Clear cart
        await clearCart.mutateAsync();

        setOrderId(order.order_number);
        setStep('confirmation');
        toast.success('Order placed successfully!');
      }
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error('Failed to place order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
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

            {/* Info Cards */}
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
                  {paymentMethod === 'razorpay' ? 'Paid Online' : 'Cash on Delivery'}
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
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as 'cod' | 'razorpay')}
                    className="space-y-4"
                  >
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}>
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Pay Online</p>
                            <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking, Wallets</p>
                          </div>
                        </div>
                      </Label>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Recommended
                      </span>
                    </div>

                    <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex gap-4 mt-6">
                    <Button variant="outline" onClick={() => setStep('address')}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="lg" 
                      onClick={handlePlaceOrder}
                      disabled={isButtonDisabled}
                    >
                      {isButtonDisabled ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : paymentMethod === 'razorpay' ? (
                        `Pay ₹${summary.total}`
                      ) : (
                        `Place Order • ₹${summary.total}`
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

              {paymentMethod === 'razorpay' && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  🔒 Secured by Razorpay
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
