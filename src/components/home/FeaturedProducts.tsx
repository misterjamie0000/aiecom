import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, ArrowRight, Star, Eye } from 'lucide-react';

type Product = Tables<'products'>;

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function FeaturedProducts({ 
  products, 
  title = "Featured Products",
  subtitle = "Handpicked just for you",
  showViewAll = true 
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          </div>
          {showViewAll && (
            <Link 
              to="/products" 
              className="group flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              View All <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </motion.div>

        {/* Products grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {products.slice(0, 8).map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="group"
            >
              <div className="relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <Link to={`/products/${product.slug}`}>
                  {/* Image container */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={(product as any).image_url || `https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop`}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.discount_percent && product.discount_percent > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground font-bold shadow-lg">
                          -{product.discount_percent}%
                        </Badge>
                      )}
                      {product.is_trending && (
                        <Badge className="bg-primary text-primary-foreground font-semibold shadow-lg">
                          Trending
                        </Badge>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Add to cart button */}
                    <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <Button className="w-full h-10 font-semibold shadow-lg gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Link>

                {/* Product info */}
                <div className="p-4">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < 4 ? 'fill-warning text-warning' : 'text-muted'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">(4.5)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">₹{product.price}</span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.mrp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
