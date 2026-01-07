import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tables } from '@/integrations/supabase/types';
import { ArrowRight } from 'lucide-react';

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

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const activeCategories = categories.filter(c => c.is_active).slice(0, 5);

  if (activeCategories.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Find what you're looking for</p>
          </div>
          <Link 
            to="/categories" 
            className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {activeCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/products?category=${category.id}`}
                className="group block"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={category.image_url || placeholderImages[index % placeholderImages.length]}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {category.description}
                      </p>
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
