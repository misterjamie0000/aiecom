import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid3X3, ShoppingBag, Package, User, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
export default function MobileNav() {
  const location = useLocation();
  const {
    user
  } = useAuth();
  const navItems = [{
    icon: Home,
    label: 'Home',
    href: '/',
    gradient: 'from-rose-500 to-pink-500'
  }, {
    icon: Grid3X3,
    label: 'Categories',
    href: '/categories',
    gradient: 'from-violet-500 to-purple-500'
  }, {
    icon: ShoppingBag,
    label: 'Cart',
    href: '/cart',
    badge: 0,
    gradient: 'from-amber-500 to-orange-500'
  }, {
    icon: Package,
    label: 'Orders',
    href: user ? '/orders' : '/auth',
    gradient: 'from-emerald-500 to-teal-500'
  }, {
    icon: User,
    label: 'Profile',
    href: user ? '/account' : '/auth',
    gradient: 'from-blue-500 to-indigo-500'
  }];
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };
  return <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-3 pb-3 safe-area-pb">
      {/* Floating glass container */}
      <motion.div initial={{
      y: 100,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      type: 'spring',
      stiffness: 300,
      damping: 30
    }} className="relative bg-background/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-50" />
        
        <div className="relative flex items-center justify-around h-[68px] px-1">
          {navItems.map((item, index) => {
          const active = isActive(item.href);
          return <Link key={item.href} to={item.href} className="flex flex-col items-center justify-center flex-1 h-full relative group">
                <motion.div whileTap={{
              scale: 0.85
            }} whileHover={{
              scale: 1.05
            }} className="flex flex-col items-center justify-center">
                  {/* Active background glow */}
                  <AnimatePresence>
                    {active && <motion.div initial={{
                  scale: 0,
                  opacity: 0
                }} animate={{
                  scale: 1,
                  opacity: 1
                }} exit={{
                  scale: 0,
                  opacity: 0
                }} className="" />}
                  </AnimatePresence>
                  
                  {/* Icon container */}
                  <motion.div className="relative z-10" animate={{
                y: active ? -2 : 0
              }} transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20
              }}>
                    <div className={`relative p-2 rounded-xl transition-all duration-300 ${active ? `bg-gradient-to-br ${item.gradient} shadow-lg` : 'text-muted-foreground group-hover:text-foreground'}`}>
                      <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : ''}`} strokeWidth={active ? 2.5 : 2} />
                      
                      {/* Badge */}
                      {item.badge !== undefined && item.badge > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px] font-bold animate-pulse">
                          {item.badge}
                        </Badge>}
                      
                      {/* Active sparkle effect */}
                      {active && <motion.div initial={{
                    scale: 0,
                    rotate: -45
                  }} animate={{
                    scale: 1,
                    rotate: 0
                  }} className="absolute -top-1 -right-1">
                          <Sparkles className="w-3 h-3 text-white" />
                        </motion.div>}
                    </div>
                  </motion.div>
                  
                  {/* Label */}
                  <motion.span className={`text-[10px] mt-1 font-semibold tracking-wide transition-colors ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} animate={{
                opacity: active ? 1 : 0.8
              }}>
                    {item.label}
                  </motion.span>
                </motion.div>
                
                {/* Active dot indicator */}
                <AnimatePresence>
                  {active && <motion.div initial={{
                scale: 0,
                opacity: 0
              }} animate={{
                scale: 1,
                opacity: 1
              }} exit={{
                scale: 0,
                opacity: 0
              }} className={`absolute -bottom-0.5 w-1 h-1 bg-gradient-to-r ${item.gradient} rounded-full`} />}
                </AnimatePresence>
              </Link>;
        })}
        </div>
        
        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </motion.div>
    </nav>;
}