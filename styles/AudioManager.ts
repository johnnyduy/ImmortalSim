import { Howl, Howler } from 'howler';

export type AtmosphereState = 
  | 'mortal_village'
  | 'wandering'
  | 'cultivation'
  | 'sect'
  | 'mystery'
  | 'danger'
  | 'death'
  | 'reincarnation'
  | 'anomaly';

class AudioManager {
  private sounds: Map<AtmosphereState, Howl> = new Map();
  private clickSound: Howl | null = null;
  private currentState: AtmosphereState | null = null;
  private volume: number = 0.4;
  private isMuted: boolean = false;
  private initialized: boolean = false;
  private lastPlayTime: number = 0;
  private lastSfxTimes: Map<string, number> = new Map();

  // Placeholders: Add your own subtle guqin, wind, and rain mp3s to public/audio/
  private trackPaths: Record<AtmosphereState, string> = {
    mortal_village: '/audio/mortal_village.mp3', // distant wind, faint bells
    wandering: '/audio/wandering.mp3',           // cold night wind, footsteps
    cultivation: '/audio/cultivation.mp3',       // slow, rhythmic breathing, soft guqin
    sect: '/audio/sect.mp3',                     // distant temple chants
    mystery: '/audio/mystery.mp3',               // low ethereal drone
    danger: '/audio/danger.mp3',                 // tense, low rumble
    death: '/audio/death.mp3',                   // near silence, cold howling wind
    reincarnation: '/audio/reincarnation.mp3',   // reverse reverb, mysterious bloom
    anomaly: '/audio/anomaly.mp3',               // subtle distortion
  };

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    const savedVolume = localStorage.getItem('cultivation_volume');
    const savedMute = localStorage.getItem('cultivation_muted');
    
    if (savedVolume !== null) this.volume = parseFloat(savedVolume);
    if (savedMute !== null) this.isMuted = savedMute === 'true';

    Howler.volume(this.volume);
    Howler.mute(this.isMuted);

    this.clickSound = new Howl({
      src: ['/audio/crystal-bowl.mp3'],
      volume: 0.6,
    });

    this.initialized = true;
  }

  setVolume(val: number) {
    this.volume = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cultivation_volume', val.toString());
    }
    Howler.volume(val);
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cultivation_muted', this.isMuted.toString());
    }
    Howler.mute(this.isMuted);
    return this.isMuted;
  }

  getVolume() { return this.volume; }
  getIsMuted() { return this.isMuted; }

  playClick() {
    if (typeof window === 'undefined') return;
    if (!this.initialized) this.init();
    const now = Date.now();
    if (now - this.lastPlayTime < 150) return;
    this.lastPlayTime = now;
    if (this.clickSound) {
      this.clickSound.stop();
      this.clickSound.play();
    }
  }

  playSFX(path: string, volume: number = 0.7) {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const lastTime = this.lastSfxTimes.get(path) || 0;
    if (now - lastTime < 150) return;
    this.lastSfxTimes.set(path, now);

    const sfx = new Howl({
      src: [path],
      volume: volume,
    });
    sfx.play();
  }

  play(state: AtmosphereState) {
    if (typeof window === 'undefined') return;
    if (!this.initialized) this.init();
    if (this.currentState === state) return;

    const prevState = this.currentState;
    this.currentState = state;

    // Smooth crossfade out the previous track over 3 seconds (philosophical pacing)
    if (prevState && this.sounds.has(prevState)) {
      const prevSound = this.sounds.get(prevState)!;
      prevSound.fade(prevSound.volume(), 0, 3000);
      setTimeout(() => {
        if (this.currentState !== prevState) {
          prevSound.pause();
        }
      }, 3000);
    }

    // Lazy load the new track to save bandwidth
    if (!this.sounds.has(state)) {
      const howl = new Howl({
        src: [this.trackPaths[state]],
        loop: true,
        volume: 0,
        html5: true, // Optimizes large audio files & helps mobile playback
      });
      this.sounds.set(state, howl);
    }

    const newSound = this.sounds.get(state)!;
    
    // Special handling for death to feel instantly jarring and empty
    if (state === 'death') {
      newSound.play();
      newSound.fade(0, 1, 500); 
    } else {
      newSound.play();
      // Long, slow dreamlike fade-in for normal transitions
      newSound.fade(0, 1, 4000);
    }
  }
}

export const audioManager = new AudioManager();