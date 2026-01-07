import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Cart() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Your cart is empty. Start shopping to add items!
        </p>
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </motion.div>
    </div>
  );
}
