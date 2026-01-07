import { motion } from 'framer-motion';
import { Truck, Tag, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface CartSummaryProps {
  subtotal: number;
  totalMrp: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  isCheckingOut?: boolean;
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
}: CartSummaryProps) {
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'FIRST20') {
      setCouponApplied(true);
    }
  };

  const couponDiscount = couponApplied ? Math.round(subtotal * 0.2) : 0;
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

        {couponApplied && (
          <div className="flex justify-between text-green-600">
            <span>Coupon (FIRST20)</span>
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

      {discount > 0 && (
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
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={couponApplied}
          />
          <Button 
            variant="outline" 
            onClick={handleApplyCoupon}
            disabled={couponApplied || !couponCode}
          >
            {couponApplied ? 'Applied' : 'Apply'}
          </Button>
        </div>
        {!couponApplied && (
          <p className="text-xs text-muted-foreground mt-1">
            Try: FIRST20 for 20% off
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
