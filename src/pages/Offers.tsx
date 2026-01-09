import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Heart, Percent, Tag, Copy, Check } from 'lucide-react';
import { useAddToCart } from '@/hooks/useCart';
import { useToggleWishlist, useWishlistIds } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Offers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const { toggle: toggleWishlist } = useToggleWishlist();
  const { data: wishlistIds = [] } = useWishlistIds();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Get products with discounts
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['offers-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .gt('discount_percent', 0)
        .order('discount_percent', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get active coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or('valid_until.is.null,valid_until.gt.now()')
        .order('discount_value', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddToCart = (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }
    addToCart.mutate({ productId, quantity: 1 });
  };

  const handleToggleWishlist = (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      navigate('/auth');
      return;
    }
    toggleWishlist(productId);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isLoading = productsLoading || couponsLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Percent className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Special Offers</h1>
            <p className="text-muted-foreground">
              Exclusive deals and discounts just for you
            </p>
          </div>
        </div>

        {/* Coupons Section */}
        {coupons && coupons.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Available Coupons
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="relative overflow-hidden border-dashed border-2 border-primary/30">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}% OFF` 
                              : `₹${coupon.discount_value} OFF`}
                          </Badge>
                          <h3 className="font-bold text-lg">{coupon.code}</h3>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(coupon.code)}
                          className="shrink-0"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {coupon.description}
                        </p>
                      )}
                      {coupon.min_order_value && Number(coupon.min_order_value) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Min. order: ₹{Number(coupon.min_order_value).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Discounted Products Section */}
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5 text-destructive" />
          Discounted Products
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => {
              const isInWishlist = wishlistIds.includes(product.id);
              const discountPercent = product.mrp 
                ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
                : Number(product.discount_percent) || 0;
              const savings = product.mrp ? Number(product.mrp) - Number(product.price) : 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
                    <Link to={`/products/${product.slug}`}>
                      <img
                        src={(product as any).image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    
                    <Badge className="absolute top-3 left-3 bg-destructive text-lg px-3">
                      -{discountPercent}%
                    </Badge>

                    <Button
                      size="icon"
                      variant="secondary"
                      className={cn(
                        "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity",
                        isInWishlist && "opacity-100 bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleToggleWishlist(product.id)}
                    >
                      <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
                    </Button>

                    <Button
                      size="sm"
                      className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addToCart.isPending}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>

                  <Link to={`/products/${product.slug}`}>
                    <p className="text-xs text-muted-foreground mb-1">
                      {(product.categories as any)?.name}
                    </p>
                    <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold">₹{Number(product.price).toLocaleString()}</span>
                      {product.mrp && Number(product.mrp) > Number(product.price) && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{Number(product.mrp).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {savings > 0 && (
                      <Badge variant="secondary" className="mt-2 text-green-600">
                        Save ₹{savings.toLocaleString()}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Percent className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Offers Available</h2>
            <p className="text-muted-foreground mb-6">Check back soon for amazing deals!</p>
            <Button asChild>
              <Link to="/products">Browse All Products</Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
