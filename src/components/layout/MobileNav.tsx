import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Grid3X3, ShoppingBag, Package, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Grid3X3, label: 'Categories', href: '/categories' },
    { icon: ShoppingBag, label: 'Cart', href: '/cart', badge: 0 },
    { icon: Package, label: 'Orders', href: user ? '/account/orders' : '/auth' },
    { icon: User, label: 'Profile', href: user ? '/account' : '/auth' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center justify-center transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-4 h-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </motion.div>
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
