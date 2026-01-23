import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActiveFlashSales } from '@/hooks/useFlashSales';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDate: string): TimeLeft {
  const difference = new Date(endDate).getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-background/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px]">
        <span className="text-2xl md:text-3xl font-bold tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs mt-1 opacity-80">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="Days" />}
      <TimeBlock value={timeLeft.hours} label="Hrs" />
      <span className="text-2xl font-bold animate-pulse">:</span>
      <TimeBlock value={timeLeft.minutes} label="Min" />
      <span className="text-2xl font-bold animate-pulse">:</span>
      <TimeBlock value={timeLeft.seconds} label="Sec" />
    </div>
  );
}

export default function FlashSaleBanner() {
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeFlashSales = flashSales?.filter(sale => {
    const now = new Date();
    return new Date(sale.ends_at) > now;
  }) || [];

  useEffect(() => {
    if (activeFlashSales.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % activeFlashSales.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeFlashSales.length]);

  if (isLoading || activeFlashSales.length === 0) {
    return null;
  }

  const currentSale = activeFlashSales[currentIndex];
  const productCount = currentSale.products?.length || 0;

  const prev = () => setCurrentIndex(i => (i - 1 + activeFlashSales.length) % activeFlashSales.length);
  const next = () => setCurrentIndex(i => (i + 1) % activeFlashSales.length);

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-r from-destructive via-destructive/90 to-orange-500 text-destructive-foreground"
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Flash sale info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full animate-pulse">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-bold">{currentSale.name}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {currentSale.discount_type === 'percentage' 
                      ? `${currentSale.discount_value}% OFF` 
                      : `₹${currentSale.discount_value} OFF`}
                  </Badge>
                </div>
                {currentSale.description && (
                  <p className="text-sm opacity-90 hidden md:block">{currentSale.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Center: Countdown */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Ends in</span>
            </div>
            <CountdownTimer endDate={currentSale.ends_at} />
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-3">
            {productCount > 0 && (
              <span className="text-sm opacity-90 hidden md:inline">
                {productCount} products on sale
              </span>
            )}
            <Link to="/offers">
              <Button 
                variant="secondary" 
                className="bg-white text-destructive hover:bg-white/90 font-semibold gap-2"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation for multiple sales */}
        {activeFlashSales.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={prev}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {activeFlashSales.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={next}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// Compact version for product pages
export function FlashSaleCompactBanner() {
  const { data: flashSales, isLoading } = useActiveFlashSales();

  const activeFlashSale = flashSales?.find(sale => {
    const now = new Date();
    return new Date(sale.ends_at) > now;
  });

  if (isLoading || !activeFlashSale) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-destructive to-orange-500 text-destructive-foreground rounded-xl p-4 mb-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full animate-pulse">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{activeFlashSale.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                {activeFlashSale.discount_type === 'percentage' 
                  ? `${activeFlashSale.discount_value}% OFF` 
                  : `₹${activeFlashSale.discount_value} OFF`}
              </Badge>
            </div>
            <p className="text-xs opacity-90">Limited time offer!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs opacity-80 mb-1">Ends in</div>
            <CountdownTimer endDate={activeFlashSale.ends_at} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
