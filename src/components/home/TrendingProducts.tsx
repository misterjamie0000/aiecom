import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, ArrowRight, Star, Flame } from 'lucide-react';

type Product = Tables<'products'>;

interface TrendingProductsProps {
  products: Product[];
}

export default function TrendingProducts({ products }: TrendingProductsProps) {
  const trendingProducts = products.filter(p => p.is_trending).slice(0, 4);

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">Trending Now</h2>
              <p className="text-muted-foreground mt-0.5">What everyone's buying</p>
            </div>
          </div>
          <Link 
            to="/bestsellers" 
            className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/products/${product.slug}`} className="block">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={`https://images.unsplash.com/photo-${1571781926291 + index * 1000}-c477ebfd024b?w=400&h=500&fit=crop`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-destructive">
                      <Flame className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                    {product.discount_percent && product.discount_percent > 0 && (
                      <Badge variant="secondary">
                        -{product.discount_percent}%
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>

                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < 4 ? 'fill-primary text-primary' : 'text-muted'}`} 
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">(128)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xl">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>
                      <Button size="sm">
                        <ShoppingCart className="w-4 h-4" />
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
