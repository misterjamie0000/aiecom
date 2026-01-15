import { motion } from 'framer-motion';
import { Truck, Tag, ShieldCheck, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useValidateCoupon } from '@/hooks/useCoupons';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

interface CartSummaryProps {
  subtotal: number;
  totalMrp: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  isCheckingOut?: boolean;
  onCouponApplied?: (couponCode: string, discountAmount: number) => void;
}

export default function CartSummary({
  subtotal,
  totalMrp,
  discount,
  shipping,
  total,
  itemCount,
  onCheckout,
  isCheckingOut,
  onCouponApplied,
}: CartSummaryProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    coupon: Tables<'coupons'>;
  } | null>(null);

  const validateCoupon = useValidateCoupon();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const result = await validateCoupon.mutateAsync({
        code: couponCode.trim(),
        orderTotal: subtotal,
      });

      setAppliedCoupon({
        code: result.coupon.code,
        discountAmount: result.discountAmount,
        coupon: result.coupon,
      });
      
      toast.success(`Coupon "${result.coupon.code}" applied! You save ₹${result.discountAmount}`);
      onCouponApplied?.(result.coupon.code, result.discountAmount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponApplied?.('', 0);
  };

  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const finalTotal = total - couponDiscount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border p-6 sticky top-4"
    >
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Price ({itemCount} items)</span>
          <span>₹{totalMrp}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}

        {appliedCoupon && (
          <div className="flex justify-between text-green-600 items-center">
            <span className="flex items-center gap-1">
              Coupon ({appliedCoupon.code})
              <button 
                onClick={handleRemoveCoupon}
                className="p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
            <span>-₹{couponDiscount}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span className={shipping === 0 ? 'text-green-600' : ''}>
            {shipping === 0 ? 'FREE' : `₹${shipping}`}
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-bold text-lg mb-4">
        <span>Total</span>
        <span>₹{finalTotal}</span>
      </div>

      {(discount > 0 || couponDiscount > 0) && (
        <p className="text-sm text-green-600 mb-4">
          You're saving ₹{discount + couponDiscount} on this order!
        </p>
      )}

      {/* Coupon Section */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Have a coupon?</label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={!!appliedCoupon || validateCoupon.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !appliedCoupon) {
                handleApplyCoupon();
              }
            }}
          />
          <Button 
            variant="outline" 
            onClick={handleApplyCoupon}
            disabled={!!appliedCoupon || !couponCode.trim() || validateCoupon.isPending}
          >
            {validateCoupon.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : appliedCoupon ? (
              'Applied'
            ) : (
              'Apply'
            )}
          </Button>
        </div>
        {!appliedCoupon && (
          <p className="text-xs text-muted-foreground mt-1">
            Try: WELCOME20 for 20% off
          </p>
        )}
      </div>

      <Button 
        className="w-full" 
        size="lg" 
        onClick={onCheckout}
        disabled={isCheckingOut}
      >
        {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
      </Button>

      {/* Trust Badges */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Truck className="w-4 h-4 text-primary" />
          <span>Free delivery on orders above ₹499</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Tag className="w-4 h-4 text-primary" />
          <span>Best prices guaranteed</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>100% secure payments</span>
        </div>
      </div>
    </motion.div>
  );
}
