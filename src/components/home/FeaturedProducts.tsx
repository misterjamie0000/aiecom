import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, ArrowRight, Star } from 'lucide-react';

type Product = Tables<'products'>;

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
}

export default function FeaturedProducts({ 
  products, 
  title = "Featured Products",
  subtitle = "Handpicked just for you",
  showViewAll = true 
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {showViewAll && (
            <Link 
              to="/products" 
              className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.slice(0, 8).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Link to={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                  <img
                    src={`https://images.unsplash.com/photo-${1596462502278 + index}-27bfdc403348?w=400&h=400&fit=crop`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {product.discount_percent && product.discount_percent > 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive">
                      -{product.discount_percent}%
                    </Badge>
                  )}

                  {product.is_trending && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      Trending
                    </Badge>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-background/90 to-transparent pt-8">
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-8">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span className="text-sm text-muted-foreground">4.5</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-lg">₹{product.price}</span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.mrp}
                      </span>
                    )}
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
