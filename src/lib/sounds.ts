// Web Audio API based sound effects for the app

class SoundManager {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a success chime sound
  playSuccessChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Create a pleasant 3-note success chime
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now + i * 0.15);
        
        gainNode.gain.setValueAtTime(0, now + i * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.5);
        
        oscillator.start(now + i * 0.15);
        oscillator.stop(now + i * 0.15 + 0.5);
      });
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Play a celebratory pop sound
  playCelebrationPop() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Create multiple pops for confetti effect
      for (let i = 0; i < 5; i++) {
        const delay = i * 0.1;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Random frequency for variety
        const baseFreq = 800 + Math.random() * 400;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFreq, now + delay);
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + delay + 0.1);
        
        gainNode.gain.setValueAtTime(0.15, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);
        
        oscillator.start(now + delay);
        oscillator.stop(now + delay + 0.15);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Play a magical sparkle sound
  playSparkle() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Create a shimmering sparkle effect
      for (let i = 0; i < 8; i++) {
        const delay = i * 0.08;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // High frequency shimmer
        const freq = 2000 + Math.random() * 2000;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now + delay);
        
        gainNode.gain.setValueAtTime(0.08, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        
        oscillator.start(now + delay);
        oscillator.stop(now + delay + 0.2);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Play complete order success sequence
  playOrderSuccessSequence() {
    this.playCelebrationPop();
    setTimeout(() => this.playSuccessChime(), 300);
    setTimeout(() => this.playSparkle(), 800);
    setTimeout(() => this.playSparkle(), 1500);
  }

  // Play a soft notification sound
  playNotification() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1108.73, now + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  }
}

export const soundManager = new SoundManager();
