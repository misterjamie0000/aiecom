import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, useCartSummary } from '@/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';

export default function Cart() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: cartItems, isLoading } = useCart();
  const summary = useCartSummary(cartItems || []);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    navigate('/checkout');
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Login to view your cart</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Sign in to your account to view and manage your shopping cart.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">Login / Sign Up</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">{summary.itemCount} items in your cart</p>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <AnimatePresence>
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </AnimatePresence>

          <div className="flex justify-center sm:justify-start pt-4">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary - Fixed on mobile */}
        <div className="order-first lg:order-last">
          <CartSummary
            subtotal={summary.subtotal}
            totalMrp={summary.totalMrp}
            discount={summary.discount}
            shipping={summary.shipping}
            total={summary.total}
            itemCount={summary.itemCount}
            onCheckout={handleCheckout}
            isCheckingOut={isCheckingOut}
          />
        </div>
      </div>
    </div>
  );
}
