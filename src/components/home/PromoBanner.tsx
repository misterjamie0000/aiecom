import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Truck, Shield, RotateCcw, ArrowRight, Gift, Percent, Crown } from 'lucide-react';

export function FeatureStrip() {
  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹499', color: 'from-primary to-primary/70' },
    { icon: Shield, title: '100% Authentic', desc: 'Genuine products only', color: 'from-success to-success/70' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy', color: 'from-accent-foreground to-accent-foreground/70' },
    { icon: Gift, title: 'Gift Wrapping', desc: 'Free on all orders', color: 'from-warning to-warning/70' },
  ];

  return (
    <section className="py-10 lg:py-14 border-b bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="flex items-center gap-4 p-4 lg:p-5 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-sm lg:text-base">{feature.title}</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">{feature.desc}</p>
                </div>
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
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
          
          {/* Animated decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          
          {/* Floating icons */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-10 right-20 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <Percent className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-10 left-20 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hidden lg:flex"
          >
            <Gift className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          
          <div className="relative px-6 py-12 lg:px-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground text-sm font-medium mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Limited Time Offer
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl lg:text-5xl font-bold text-primary-foreground mb-4 leading-tight"
                >
                  Get 20% Off on Your First Order
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-primary-foreground/90 text-lg mb-2"
                >
                  Use code <span className="font-bold bg-white/20 px-3 py-1 rounded-lg">FIRST20</span> at checkout
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="text-primary-foreground/70 text-sm"
                >
                  *Minimum purchase of ₹999 required
                </motion.p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  size="lg" 
                  variant="secondary" 
                  asChild 
                  className="h-14 px-8 text-base font-bold group shadow-2xl"
                >
                  <Link to="/products">
                    Shop Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Crown icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/25"
          >
            <Crown className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
            Join Our <span className="text-gradient">Beauty Community</span>
          </h2>
          
          <p className="text-muted-foreground text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
            Create an account to unlock exclusive offers, early access to new products, earn rewards, and be part of our growing community.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-10 text-base font-bold group">
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-10 text-base font-semibold">
              <Link to="/products">
                Browse Products
              </Link>
            </Button>
          </div>
          
          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-12 text-muted-foreground text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <span>Easy Returns</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
