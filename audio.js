// Retro Sound Synthesizer using Web Audio API
class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Lazy initialize AudioContext on user interaction to satisfy browser policies
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setMute(state) {
    this.muted = state;
  }

  createSynth(type = 'sine') {
    if (this.muted) return null;
    this.init();
    if (!this.ctx) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    return { osc, gain, ctx: this.ctx };
  }

  playBrickHit(brickType) {
    const synth = this.createSynth('triangle');
    if (!synth) return;

    const { osc, gain, ctx } = synth;
    const now = ctx.currentTime;

    // Pitch and duration depends on brick type
    let frequency = 440; // Default A4
    let duration = 0.08;

    if (brickType === 1) {
      frequency = 600; // Normal high pitch beep
      duration = 0.06;
    } else if (brickType === 2) {
      frequency = 400; // Deeper double hit beep
      duration = 0.1;
    } else if (brickType === 3) {
      frequency = 880; // High golden bell chime
      duration = 0.15;
    }

    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playPaddleHit() {
    const synth = this.createSynth('sine');
    if (!synth) return;

    const { osc, gain, ctx } = synth;
    const now = ctx.currentTime;
    const duration = 0.12;

    // Thumping pop sound
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playWallHit() {
    const synth = this.createSynth('triangle');
    if (!synth) return;

    const { osc, gain, ctx } = synth;
    const now = ctx.currentTime;
    const duration = 0.04;

    // Small sharp wood-click tick
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(600, now + duration);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playLaser() {
    const synth = this.createSynth('sawtooth');
    if (!synth) return;

    const { osc, gain, ctx } = synth;
    const now = ctx.currentTime;
    const duration = 0.15;

    // Laser PEW sound
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + duration);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playPowerUp() {
    const synth = this.createSynth('sine');
    if (!synth) return;

    const { osc, gain, ctx } = synth;
    const now = ctx.currentTime;
    const duration = 0.3;

    // Ascending arpeggio sweep
    osc.frequency.setValueAtTime(330, now); // E4
    osc.frequency.setValueAtTime(440, now + 0.08); // A4
    osc.frequency.setValueAtTime(554, now + 0.16); // C#5
    osc.frequency.setValueAtTime(660, now + 0.24); // E5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.setValueAtTime(0.15, now + 0.08);
    gain.gain.setValueAtTime(0.15, now + 0.16);
    gain.gain.setValueAtTime(0.15, now + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playLifeLost() {
    const synth = this.createSynth('sawtooth');
    if (!synth) return;

    const { osc, gain, ctx } = synth;
    const now = ctx.currentTime;
    const duration = 0.5;

    // Downward sliding drone
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(60, now + duration);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Play a series of chords: C major (261, 329, 392) then G major (392, 493, 587) then C major (523, 659, 784)
    const playTone = (freq, startTime, duration, volume) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Triumphant chord progression
    const vol = 0.08;
    playTone(261.63, now, 0.2, vol); // C4
    playTone(329.63, now, 0.2, vol); // E4
    playTone(392.00, now, 0.2, vol); // G4

    playTone(329.63, now + 0.15, 0.2, vol); // E4
    playTone(392.00, now + 0.15, 0.2, vol); // G4
    playTone(523.25, now + 0.15, 0.2, vol); // C5

    playTone(523.25, now + 0.35, 0.4, vol); // C5
    playTone(659.25, now + 0.35, 0.4, vol); // E5
    playTone(783.99, now + 0.35, 0.4, vol); // G5
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const playTone = (freq, startTime, duration, volume) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const vol = 0.1;
    // Sad minor descending tone progression
    playTone(220.00, now, 0.25, vol); // A3
    playTone(207.65, now + 0.25, 0.25, vol); // G#3
    playTone(196.00, now + 0.5, 0.25, vol); // G3
    playTone(174.61, now + 0.75, 0.5, vol); // F3
  }
}

// Global audio manager instance
const audioManager = new GameAudio();
window.audioManager = audioManager; // Make it accessible globally
