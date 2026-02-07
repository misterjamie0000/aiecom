import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, useCartSummary } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  Settings,
  Shield,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: cartItems } = useCart();
  const { itemCount: cartItemCount } = useCartSummary(cartItems || []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/categories', label: 'Categories' },
    { href: '/new-arrivals', label: 'New Arrivals' },
    { href: '/bestsellers', label: 'Bestsellers' },
    { href: '/offers', label: 'Offers', highlight: true },
  ];

  const isActiveLink = (href: string) => location.pathname === href;

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-background/98 backdrop-blur-xl shadow-sm border-b border-border/50" 
          : "bg-background border-b border-transparent"
      )}
    >
      {/* Top announcement bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 text-center font-medium tracking-wide hidden sm:block">
        <span className="inline-flex items-center gap-2">
          🎉 Free Shipping on orders above ₹499 | Use code <span className="font-bold">GLOW20</span> for 20% off
        </span>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 lg:h-[72px] items-center justify-between gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2 h-10 w-10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
            >
              <span className="text-xl font-bold">G</span>
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">GlowMart</span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Beauty & Wellness</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  isActiveLink(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  link.highlight && !isActiveLink(link.href) && "text-destructive hover:text-destructive"
                )}
              >
                {link.label}
                {link.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6">
            <form onSubmit={handleSearch} className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="search"
                placeholder="Search for products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 h-11 w-full bg-muted/40 border-transparent rounded-full focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Wishlist */}
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="hidden sm:flex h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Link to="/wishlist">
                <Heart className="w-5 h-5" />
              </Link>
            </Button>

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors" 
              asChild
            >
              <Link to="/cart">
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5"
                    >
                      <Badge 
                        className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground border-2 border-background"
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-10 gap-2 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-2">
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Welcome back!</span>
                      <span className="text-xs text-muted-foreground truncate font-normal">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer rounded-lg">
                    <Link to="/account/orders">
                      <Package className="w-4 h-4 mr-3 text-muted-foreground" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer rounded-lg">
                    <Link to="/account/addresses">
                      <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer rounded-lg">
                    <Link to="/wishlist">
                      <Heart className="w-4 h-4 mr-3 text-muted-foreground" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer rounded-lg">
                    <Link to="/account/settings">
                      <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer rounded-lg bg-primary/5 text-primary hover:bg-primary/10">
                        <Link to="/admin">
                          <Shield className="w-4 h-4 mr-3" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="px-3 py-2.5 cursor-pointer rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="hidden sm:flex h-10 px-5 rounded-full font-medium shadow-sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <form onSubmit={handleSearch} className="py-3 pb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 rounded-full bg-muted/50"
                    autoFocus
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t"
            >
              <nav className="py-4 space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                        isActiveLink(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted",
                        link.highlight && !isActiveLink(link.href) && "text-destructive"
                      )}
                    >
                      {link.label}
                      {link.highlight && (
                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                          Sale
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="pt-3 border-t mt-3">
                  {!user && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: navLinks.length * 0.05 }}
                    >
                      <Link
                        to="/auth"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center px-4 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-xl"
                      >
                        Sign In / Sign Up
                      </Link>
                    </motion.div>
                  )}
                  {user && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: navLinks.length * 0.05 }}
                    >
                      <Link
                        to="/wishlist"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl"
                      >
                        <Heart className="w-4 h-4" />
                        Wishlist
                      </Link>
                    </motion.div>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
