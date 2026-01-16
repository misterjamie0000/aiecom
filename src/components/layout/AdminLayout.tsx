import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Tag,
  Gift,
  Truck,
  MessageSquare,
  FileText,
  Settings,
  ImageIcon,
  BarChart3,
  CreditCard,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Warehouse,
  FileDown,
  Building2,
  ClipboardList,
  Megaphone,
  UserCog,
  Zap,
  PackageOpen,
  Percent,
  Brain,
} from 'lucide-react';

const allSidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', feature: null },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders', feature: null },
  { icon: Package, label: 'Products', href: '/admin/products', feature: null },
  { icon: Warehouse, label: 'Inventory', href: '/admin/inventory', feature: null },
  { icon: FolderTree, label: 'Categories', href: '/admin/categories', feature: null },
  { icon: Building2, label: 'Suppliers', href: '/admin/suppliers', feature: 'suppliers_enabled' },
  { icon: ClipboardList, label: 'Purchase Orders', href: '/admin/purchase-orders', feature: 'purchase_orders_enabled' },
  { icon: Users, label: 'Customers', href: '/admin/customers', feature: null },
  { icon: UserCog, label: 'Segments', href: '/admin/segments', feature: null },
  { icon: RotateCcw, label: 'Returns', href: '/admin/returns', feature: null },
  { icon: Megaphone, label: 'Marketing', href: '/admin/marketing', feature: null },
  { icon: Zap, label: 'Flash Sales', href: '/admin/flash-sales', feature: null },
  { icon: PackageOpen, label: 'Bundles', href: '/admin/bundles', feature: null },
  { icon: Percent, label: 'BXGY Offers', href: '/admin/bxgy-offers', feature: null },
  { icon: Brain, label: 'Recommendations', href: '/admin/recommendations', feature: null },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons', feature: null },
  { icon: Gift, label: 'Loyalty', href: '/admin/loyalty', feature: null },
  { icon: MessageSquare, label: 'Reviews', href: '/admin/reviews', feature: null },
  { icon: ImageIcon, label: 'Banners', href: '/admin/banners', feature: null },
  { icon: FileText, label: 'Pages', href: '/admin/pages', feature: null },
  { icon: BarChart3, label: 'Reports', href: '/admin/reports', feature: null },
  { icon: FileDown, label: 'Tally Export', href: '/admin/export', feature: null },
  { icon: CreditCard, label: 'Payments', href: '/admin/payments', feature: null },
  { icon: Truck, label: 'Shipping', href: '/admin/shipping', feature: null },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications', feature: null },
  { icon: Settings, label: 'Settings', href: '/admin/settings', feature: null },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const { data: settings } = useSiteSettings();

  // Get feature settings
  const featureSettings = useMemo(() => {
    const featureSetting = settings?.find(s => s.key === 'feature_settings');
    return {
      suppliers_enabled: true,
      purchase_orders_enabled: true,
      ...(featureSetting?.value as any || {}),
    };
  }, [settings]);

  // Filter sidebar items based on feature settings
  const sidebarItems = useMemo(() => {
    return allSidebarItems.filter(item => {
      if (!item.feature) return true;
      return featureSettings[item.feature as keyof typeof featureSettings] !== false;
    });
  }, [featureSettings]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="w-5 h-5" />
          </div>
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg"
            >
              GlowMart
            </motion.span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {active && isSidebarOpen && (
                  <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Package className="w-5 h-5" />
          {isSidebarOpen && <span>View Store</span>}
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {isSidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-background border-r z-40"
      >
        <SidebarContent />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border bg-background shadow-md"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </Button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-background z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 bg-background/95 backdrop-blur border-b lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:block">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
