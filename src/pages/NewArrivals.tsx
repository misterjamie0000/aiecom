import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function NewArrivals() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">New Arrivals</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Check out our latest products. Coming soon in Phase 3!
        </p>
      </motion.div>
    </div>
  );
}
