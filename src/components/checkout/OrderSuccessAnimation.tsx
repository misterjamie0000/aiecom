import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Package, Sparkles, Star } from 'lucide-react';
import { soundManager } from '@/lib/sounds';

interface OrderSuccessAnimationProps {
  onComplete: () => void;
  duration?: number;
}

// Confetti particle component
const Confetti = ({ delay, color, left }: { delay: number; color: string; left: string }) => (
  <motion.div
    className="absolute w-3 h-3 rounded-sm"
    style={{ 
      left, 
      top: '-20px',
      backgroundColor: color,
      transformStyle: 'preserve-3d',
    }}
    initial={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
    animate={{ 
      y: ['0vh', '100vh'],
      rotate: [0, 360, 720, 1080],
      opacity: [1, 1, 0.8, 0],
      rotateY: [0, 180, 360],
      scale: [1, 1.2, 0.8, 0.5],
    }}
    transition={{ 
      duration: 3,
      delay,
      ease: 'easeIn',
    }}
  />
);

// Floating sparkle component
const FloatingSparkle = ({ delay, size, left, top }: { delay: number; size: number; left: string; top: string }) => (
  <motion.div
    className="absolute text-yellow-400"
    style={{ left, top }}
    initial={{ scale: 0, rotate: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.5, 1, 1.5, 0],
      rotate: [0, 180, 360],
      opacity: [0, 1, 0.8, 1, 0],
    }}
    transition={{ 
      duration: 2,
      delay,
      repeat: 1,
    }}
  >
    <Sparkles size={size} />
  </motion.div>
);

// 3D rotating ring
const RotatingRing = ({ size, delay, color }: { size: number; delay: number; color: string }) => (
  <motion.div
    className="absolute rounded-full border-4"
    style={{ 
      width: size, 
      height: size,
      borderColor: color,
      transformStyle: 'preserve-3d',
    }}
    initial={{ rotateX: 70, rotateY: 0, opacity: 0, scale: 0.5 }}
    animate={{ 
      rotateX: 70,
      rotateY: [0, 360],
      opacity: [0, 0.6, 0.4, 0],
      scale: [0.5, 1.5, 2],
    }}
    transition={{ 
      duration: 2.5,
      delay,
      ease: 'easeOut',
    }}
  />
);

// Floating star
const FloatingStar = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
    animate={{
      x: [0, x],
      y: [0, y],
      scale: [0, 1, 1.2, 0],
      opacity: [0, 1, 1, 0],
      rotate: [0, 180],
    }}
    transition={{ duration: 1.5, delay }}
  >
    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
  </motion.div>
);

const confettiColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#FF4757', '#2ED573', '#1E90FF', '#FF6B81'
];

export default function OrderSuccessAnimation({ onComplete, duration = 4000 }: OrderSuccessAnimationProps) {
  const [stage, setStage] = useState<'burst' | 'celebrate' | 'complete'>('burst');

  useEffect(() => {
    // Play celebration sounds
    soundManager.playOrderSuccessSequence();
    
    const timer1 = setTimeout(() => setStage('celebrate'), 800);
    const timer2 = setTimeout(() => setStage('complete'), 2000);
    const timer3 = setTimeout(() => onComplete(), duration);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete, duration]);

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    color: confettiColors[i % confettiColors.length],
    left: `${Math.random() * 100}%`,
  }));

  // Generate sparkles
  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: 0.5 + Math.random() * 0.5,
    size: 16 + Math.random() * 16,
    left: `${10 + Math.random() * 80}%`,
    top: `${10 + Math.random() * 80}%`,
  }));

  // Generate stars
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: 0.8 + i * 0.1,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200,
  }));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          backgroundSize: '400% 400%',
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background: 'inherit',
            backgroundSize: 'inherit',
          }}
        />
      </motion.div>

      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Confetti */}
      <AnimatePresence>
        {stage !== 'complete' && confettiPieces.map((piece) => (
          <Confetti key={piece.id} {...piece} />
        ))}
      </AnimatePresence>

      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <FloatingSparkle key={sparkle.id} {...sparkle} />
      ))}

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center">
        {/* 3D Rotating rings */}
        <div className="absolute flex items-center justify-center">
          <RotatingRing size={180} delay={0} color="rgba(255,255,255,0.3)" />
          <RotatingRing size={220} delay={0.2} color="rgba(255,255,255,0.2)" />
          <RotatingRing size={260} delay={0.4} color="rgba(255,255,255,0.1)" />
        </div>

        {/* Main icon container with 3D effect */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ 
            scale: [0, 1.3, 1],
            rotateY: [-180, 0],
          }}
          transition={{ 
            duration: 0.8,
            ease: 'backOut',
          }}
          style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
            }}
          />

          {/* Check icon with 3D box */}
          <motion.div
            className="relative w-32 h-32 rounded-3xl bg-white shadow-2xl flex items-center justify-center"
            animate={{
              rotateY: [0, 10, -10, 0],
              rotateX: [0, -5, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 60px rgba(255,255,255,0.3)',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          {/* Floating stars around check */}
          <div className="absolute inset-0 flex items-center justify-center">
            {stars.map((star) => (
              <FloatingStar key={star.id} {...star} />
            ))}
          </div>
        </motion.div>

        {/* Success text */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            Order Placed! 🎉
          </motion.h1>
          <motion.p
            className="text-xl text-white/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            Thank you for shopping with us
          </motion.p>
        </motion.div>

        {/* Floating package icon */}
        <motion.div
          className="absolute -bottom-20"
          initial={{ y: 100, opacity: 0 }}
          animate={{ 
            y: [100, -10, 0],
            opacity: [0, 1, 1],
            rotate: [0, -10, 10, 0],
          }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Package className="w-12 h-12 text-white/80" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom wave decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M0,64 C480,128 960,0 1440,64 L1440,120 L0,120 Z"
            fill="rgba(255,255,255,0.1)"
            animate={{
              d: [
                "M0,64 C480,128 960,0 1440,64 L1440,120 L0,120 Z",
                "M0,64 C480,0 960,128 1440,64 L1440,120 L0,120 Z",
                "M0,64 C480,128 960,0 1440,64 L1440,120 L0,120 Z",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
