import { motion } from 'framer-motion';
import { Grid3X3 } from 'lucide-react';

export default function Categories() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Grid3X3 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Categories</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Browse our product categories. Coming soon in Phase 2!
        </p>
      </motion.div>
    </div>
  );
}
