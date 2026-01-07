import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      <section className="relative h-[400px] lg:h-[500px] bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">Welcome to Our Store</h1>
          <p className="text-muted-foreground text-lg mb-6">Discover amazing products</p>
          <Button asChild size="lg">
            <Link to="/products">Shop Now</Link>
          </Button>
        </div>
      </section>
    );
  }

  const banner = activeBanners[current];

  const prev = () => setCurrent(c => (c - 1 + activeBanners.length) % activeBanners.length);
  const next = () => setCurrent(c => (c + 1) % activeBanners.length);

  return (
    <section className="relative h-[400px] lg:h-[500px] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          
          <div className="relative h-full container mx-auto px-4 flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-xl"
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                {banner.title}
              </h1>
              {banner.subtitle && (
                <p className="text-lg lg:text-xl text-muted-foreground mb-6">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_url && (
                <Button asChild size="lg">
                  <Link to={banner.link_url}>
                    {banner.button_text || 'Shop Now'}
                  </Link>
                </Button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-primary w-6' : 'bg-primary/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
