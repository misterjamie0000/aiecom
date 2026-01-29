import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Clock, ShoppingCart, Heart, ChevronRight } from 'lucide-react';
import { useActiveFlashSales } from '@/hooks/useFlashSales';
import { useAddToCart } from '@/hooks/useCart';
import { useToggleWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CountdownProps {
  endsAt: string;
  size?: 'sm' | 'lg';
}

function CountdownTimer({ endsAt, size = 'lg' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endsAt).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const isLarge = size === 'lg';

  return (
    <div className={`flex gap-2 ${isLarge ? 'justify-center' : ''}`}>
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map((item, index) => (
        <div
          key={index}
          className={`flex flex-col items-center ${
            isLarge
              ? 'bg-background/20 backdrop-blur-sm rounded-lg px-4 py-2 min-w-[70px]'
              : 'bg-destructive/10 rounded px-2 py-1 min-w-[45px]'
          }`}
        >
          <span className={`font-bold ${isLarge ? 'text-2xl text-white' : 'text-lg text-destructive'}`}>
            {String(item.value).padStart(2, '0')}
          </span>
          <span className={`${isLarge ? 'text-xs text-white/80' : 'text-[10px] text-muted-foreground'}`}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FlashSales() {
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const addToCart = useAddToCart();
  const { toggle: toggleWishlist, isInWishlist } = useToggleWishlist();

  const handleAddToCart = (product: any) => {
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  const handleToggleWishlist = (productId: string) => {
    toggleWishlist(productId);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-48 w-full mb-8 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!flashSales || flashSales.length === 0) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Active Flash Sales</h1>
          <p className="text-muted-foreground mb-6">
            Check back soon for amazing deals and discounts!
          </p>
          <Button asChild>
            <Link to="/products">Browse All Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-destructive via-orange-500 to-yellow-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container py-12 relative z-10"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Zap className="w-10 h-10" fill="currentColor" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold">Flash Sales</h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Zap className="w-10 h-10" fill="currentColor" />
            </motion.div>
          </div>
          <p className="text-center text-white/90 text-lg mb-6">
            Limited time offers - Don't miss out on these amazing deals!
          </p>
        </motion.div>
      </div>

      {/* Flash Sales List */}
      <div className="container py-8 space-y-12">
        {flashSales.map((sale, saleIndex) => (
          <motion.section
            key={sale.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: saleIndex * 0.1 }}
            className="bg-card rounded-2xl border shadow-sm overflow-hidden"
          >
            {/* Sale Header */}
            <div className="bg-gradient-to-r from-destructive to-orange-500 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-6 h-6" fill="currentColor" />
                    <h2 className="text-2xl font-bold">{sale.name}</h2>
                  </div>
                  {sale.description && (
                    <p className="text-white/90">{sale.description}</p>
                  )}
                  <Badge variant="secondary" className="mt-2 bg-white/20 text-white hover:bg-white/30">
                    {sale.discount_type === 'percentage' 
                      ? `${sale.discount_value}% OFF` 
                      : `₹${sale.discount_value} OFF`}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center md:justify-end">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Ends In</span>
                  </div>
                  <CountdownTimer endsAt={sale.ends_at} size="lg" />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-6">
              {sale.products && sale.products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {sale.products.map((item: any, index: number) => {
                    const product = item.product;
                    if (!product) return null;

                    const originalPrice = product.price;
                    const discountedPrice = item.special_price || 
                      (sale.discount_type === 'percentage'
                        ? originalPrice * (1 - sale.discount_value / 100)
                        : originalPrice - sale.discount_value);
                    const savings = originalPrice - discountedPrice;
                    const savingsPercent = Math.round((savings / originalPrice) * 100);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-background rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <Link to={`/products/${product.slug}`}>
                            <img
                              src={product.image_url || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </Link>
                          
                          {/* Discount Badge */}
                          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                            {savingsPercent}% OFF
                          </Badge>

                          {/* Wishlist Button */}
                          <button
                            onClick={() => handleToggleWishlist(product.id)}
                            className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isInWishlist(product.id)
                                  ? 'fill-destructive text-destructive'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>

                          {/* Quick Add Button */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>

                        <div className="p-3">
                          <Link to={`/products/${product.slug}`}>
                            <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-lg font-bold text-destructive">
                              ₹{discountedPrice.toFixed(0)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{originalPrice}
                            </span>
                          </div>
                          <p className="text-xs text-green-600 font-medium mt-1">
                            You save ₹{savings.toFixed(0)}
                          </p>
                          {item.max_quantity_per_user && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Max {item.max_quantity_per_user} per customer
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products in this flash sale yet.</p>
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Browse More CTA */}
      <div className="container pb-12">
        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/products" className="gap-2">
              Browse All Products
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
