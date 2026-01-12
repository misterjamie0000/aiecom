import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

type Category = Tables<'categories'>;

interface CategoryShowcaseProps {
  categories: Category[];
}

const placeholderImages = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&h=400&fit=crop',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
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

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const activeCategories = categories.filter(c => c.is_active).slice(0, 6);

  if (activeCategories.length === 0) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">
              Shop by <span className="text-gradient">Category</span>
            </h2>
            <p className="text-muted-foreground text-lg">Find exactly what you're looking for</p>
          </div>
          <Link 
            to="/categories" 
            className="group flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            View All Categories
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Categories grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6"
        >
          {activeCategories.map((category, index) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className={`${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
            >
              <Link
                to={`/products?category=${category.id}`}
                className="group block relative h-full"
              >
                <div className={`relative overflow-hidden rounded-2xl bg-muted ${
                  index === 0 ? 'aspect-square md:aspect-auto md:h-full min-h-[280px]' : 'aspect-square'
                }`}>
                  {/* Image */}
                  <img
                    src={category.image_url || placeholderImages[index % placeholderImages.length]}
                    alt={category.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-bold text-primary-foreground mb-1 ${
                          index === 0 ? 'text-xl lg:text-2xl' : 'text-base lg:text-lg'
                        }`}>
                          {category.name}
                        </h3>
                        {category.description && index === 0 && (
                          <p className="text-primary-foreground/80 text-sm line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Arrow icon */}
                      <div className="w-8 h-8 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all">
                        <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
