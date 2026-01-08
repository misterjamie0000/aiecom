import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAddToCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export default function Wishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: wishlistItems, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Your Wishlist</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Please sign in to view your wishlist
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const handleAddToCart = (productId: string) => {
    addToCart.mutate({ productId });
  };

  const handleRemove = (productId: string) => {
    removeFromWishlist.mutate(productId);
  };

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Save your favorite items here to buy them later
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">{wishlistItems.length} item(s) saved</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item, index) => {
          const product = item.products as any;
          if (!product) return null;

          const savings = product.mrp ? Number(product.mrp) - Number(product.price) : 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  <Link to={`/products/${product.slug}`}>
                    <img
                      src={product.image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  {product.discount_percent > 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive">
                      -{product.discount_percent}%
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={() => handleRemove(product.id)}
                    disabled={removeFromWishlist.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {product.categories?.name || 'Uncategorized'}
                  </p>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-semibold line-clamp-2 mb-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-primary">
                      ₹{Number(product.price).toLocaleString()}
                    </span>
                    {product.mrp && Number(product.mrp) > Number(product.price) && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{Number(product.mrp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={addToCart.isPending || product.stock_quantity === 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
