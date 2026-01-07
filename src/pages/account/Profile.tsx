import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          {user?.email}
        </p>
        <p className="text-muted-foreground max-w-md mx-auto">
          Profile management coming soon!
        </p>
      </motion.div>
    </div>
  );
}
