import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';

type Banner = Tables<'banners'>;

interface HeroBannerProps {
  banners: Banner[];
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const activeBanners = banners.filter(b => b.is_active);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return (
      <section className="relative min-h-[500px] lg:min-h-[600px] overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/50 rounded-full blur-3xl" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative h-full min-h-[500px] lg:min-h-[600px] container mx-auto px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Premium Beauty Collection
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Discover Your
              <span className="block text-gradient">Natural Glow</span>
            </h1>
            
            <p className="text-muted-foreground text-lg lg:text-xl mb-8 max-w-xl mx-auto">
              Explore our curated collection of premium beauty products designed to enhance your natural radiance
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-14 px-8 text-base font-semibold group">
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-semibold">
                <Link to="/categories">
                  Browse Categories
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const banner = activeBanners[current];

  const prev = () => setCurrent(c => (c - 1 + activeBanners.length) % activeBanners.length);
  const next = () => setCurrent(c => (c + 1) % activeBanners.length);

  return (
    <section className="relative min-h-[500px] lg:min-h-[600px] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.image_url})` }}
          />
          
          {/* Gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
          
          {/* Animated accent shapes */}
          <div className="absolute top-10 right-20 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-20 right-40 w-48 h-48 bg-accent/15 rounded-full blur-3xl animate-pulse delay-700" />
          
          <div className="relative h-full min-h-[500px] lg:min-h-[600px] container mx-auto px-4 flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                New Collection
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 leading-[1.1]">
                {banner.title}
              </h1>
              
              {banner.subtitle && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-lg"
                >
                  {banner.subtitle}
                </motion.p>
              )}
              
              {banner.link_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button asChild size="lg" className="h-14 px-8 text-base font-semibold group">
                    <Link to={banner.link_url}>
                      {banner.button_text || 'Shop Now'}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Progress indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="relative h-1.5 rounded-full transition-all overflow-hidden"
                style={{ width: i === current ? 40 : 12 }}
              >
                <div className="absolute inset-0 bg-primary/30 rounded-full" />
                {i === current && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute inset-0 bg-primary rounded-full origin-left"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
