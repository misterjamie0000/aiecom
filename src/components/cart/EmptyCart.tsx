import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
      </p>
      <Button size="lg" asChild>
        <Link to="/products">Start Shopping</Link>
      </Button>
    </motion.div>
  );
}
