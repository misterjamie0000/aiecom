import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  Minus,
  Plus,
  Package
} from 'lucide-react';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }
    if (product) {
      addToCart.mutate({ productId: product.id, quantity });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const savings = product.mrp ? Number(product.mrp) - Number(product.price) : 0;
  const discountPercent = product.mrp ? Math.round((savings / Number(product.mrp)) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-foreground">Products</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            <img
              src={(product as any).image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discountPercent > 0 && (
              <Badge className="absolute top-4 left-4 bg-destructive text-lg px-3 py-1">
                -{discountPercent}% OFF
              </Badge>
            )}
            {product.is_trending && (
              <Badge className="absolute top-4 right-4 bg-primary">
                Trending
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {(product.categories as any)?.name || 'Uncategorized'}
            </p>
            <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-primary text-primary' : 'text-muted'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(128 reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">₹{Number(product.price).toLocaleString()}</span>
            {product.mrp && Number(product.mrp) > Number(product.price) && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ₹{Number(product.mrp).toLocaleString()}
                </span>
                <Badge variant="secondary" className="text-green-600">
                  Save ₹{savings.toLocaleString()}
                </Badge>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <Separator />

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {product.stock_quantity <= product.low_stock_threshold && (
                <Badge variant="destructive">Only {product.stock_quantity} left!</Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addToCart.isPending || product.stock_quantity === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/50">
              <Truck className="w-5 h-5 text-primary mb-2" />
              <span className="text-xs font-medium">Free Shipping</span>
              <span className="text-xs text-muted-foreground">Above ₹499</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/50">
              <Shield className="w-5 h-5 text-primary mb-2" />
              <span className="text-xs font-medium">Authentic</span>
              <span className="text-xs text-muted-foreground">100% Genuine</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/50">
              <RotateCcw className="w-5 h-5 text-primary mb-2" />
              <span className="text-xs font-medium">Easy Returns</span>
              <span className="text-xs text-muted-foreground">7 Days</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
