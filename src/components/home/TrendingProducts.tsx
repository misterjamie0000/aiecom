import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, ArrowRight, Star, Flame, Zap } from 'lucide-react';

type Product = Tables<'products'>;

interface TrendingProductsProps {
  products: Product[];
}

export default function TrendingProducts({ products }: TrendingProductsProps) {
  const trendingProducts = products.filter(p => p.is_trending).slice(0, 4);

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Vibrant background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-lg shadow-destructive/25">
              <Flame className="w-7 h-7 text-destructive-foreground" />
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold flex items-center gap-2">
                Trending <span className="text-gradient">Now</span>
                <Zap className="w-6 h-6 text-warning fill-warning" />
              </h2>
              <p className="text-muted-foreground text-lg">Most loved by our customers</p>
            </div>
          </div>
          <Link 
            to="/bestsellers" 
            className="group flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            View All <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Products grid - larger cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group"
            >
              <Link to={`/products/${product.slug}`} className="block">
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted shadow-xl shadow-foreground/5">
                  {/* Image */}
                  <img
                    src={(product as any).image_url || `https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                  
                  {/* Top badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-bold shadow-lg gap-1">
                      <Flame className="w-3 h-3" />
                      Hot
                    </Badge>
                    {product.discount_percent && product.discount_percent > 0 && (
                      <Badge variant="secondary" className="font-bold shadow-lg">
                        -{product.discount_percent}%
                      </Badge>
                    )}
                  </div>

                  {/* Wishlist button */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground shadow-lg"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>

                  {/* Bottom content */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-bold text-xl text-primary-foreground mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < 4 ? 'fill-warning text-warning' : 'text-primary-foreground/30'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-primary-foreground/70">(128)</span>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-2xl text-primary-foreground">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-sm text-primary-foreground/50 line-through ml-2">
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>
                      <Button 
                        size="icon" 
                        className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
