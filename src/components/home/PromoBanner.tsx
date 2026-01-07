import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Truck, Shield, RotateCcw } from 'lucide-react';

export function FeatureStrip() {
  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹499' },
    { icon: Shield, title: '100% Authentic', desc: 'Genuine products only' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
  ];

  return (
    <section className="py-8 border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PromoBanner() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-8 lg:p-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-primary-foreground text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Limited Time Offer
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-2">
                Get 20% Off on First Order
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Use code <span className="font-bold">FIRST20</span> at checkout
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/products">Shop Now</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create an account to unlock exclusive offers, track orders, and earn rewards.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
