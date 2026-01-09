import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Heart, TrendingUp, Flame } from 'lucide-react';
import { useAddToCart } from '@/hooks/useCart';
import { useToggleWishlist, useWishlistIds } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Bestsellers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const { toggle: toggleWishlist } = useToggleWishlist();
  const { data: wishlistIds = [] } = useWishlistIds();

  const { data: products, isLoading } = useQuery({
    queryKey: ['bestsellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .or('is_featured.eq.true,is_trending.eq.true')
        .order('created_at', { ascending: false });
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bestsellers</h1>
            <p className="text-muted-foreground">
              Our most loved products by customers
            </p>
          </div>
        </div>

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
                : 0;

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
                    
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {product.is_trending && (
                        <Badge className="bg-orange-500">
                          <Flame className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {product.is_featured && !product.is_trending && (
                        <Badge className="bg-primary">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    {discountPercent > 0 && (
                      <Badge className="absolute top-3 right-12 bg-destructive">
                        -{discountPercent}%
                      </Badge>
                    )}

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
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">₹{Number(product.price).toLocaleString()}</span>
                      {product.mrp && Number(product.mrp) > Number(product.price) && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{Number(product.mrp).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Bestsellers Yet</h2>
            <p className="text-muted-foreground mb-6">Check back soon for our top products!</p>
            <Button asChild>
              <Link to="/products">Browse All Products</Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
