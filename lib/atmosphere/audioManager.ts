import { Howl, Howler } from 'howler';
import type { AtmosphereMode } from './backgroundManager';

export interface AudioTrack {
  id: string;
  howl: Howl | null;
  volume: number;
  isPlaying: boolean;
  fadeTime: number;
}

export interface AudioManagerConfig {
  masterVolume: number;
  fadeTransitionTime: number;
  preloadAssets: boolean;
}

const DEFAULT_CONFIG: AudioManagerConfig = {
  masterVolume: 0.3,
  fadeTransitionTime: 2000,
  preloadAssets: true,
};

// Audio asset paths - can be replaced with actual audio files
const AUDIO_ASSETS: Record<AtmosphereMode, string> = {
  start_menu: '/audio/start_game.mp3',
  mortal_village: '/audio/background_music.mp3',
  mountain_wandering: '/audio/mountain.mp3',
  sect_hall: '/audio/sect.mp3',
  meditation: '/audio/meditation.mp3',
  mystery: '/audio/mystery.mp3',
  death: '/audio/death.mp3',
  reincarnation: '/audio/reincarnation.mp3',
  forbidden: '/audio/forbidden.mp3',
  story_1: '/audio/background_music.mp3',
  story_2: '/audio/mystery.mp3',
  story_3: '/audio/forbidden.mp3',
  story_4: '/audio/meditation.mp3',
  story_5: '/audio/mountain.mp3',
};

export class AudioManager {
  private tracks: Map<string, AudioTrack> = new Map();
  private currentMode: AtmosphereMode | null = null;
  private config: AudioManagerConfig;
  private transitionTimeouts: NodeJS.Timeout[] = [];
  private preloadedAssets: Set<string> = new Set();

  constructor(config: Partial<AudioManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    Howler.mute(false);
    Howler.volume(this.config.masterVolume);
  }

  async preloadAudio(): Promise<void> {
    if (!this.config.preloadAssets) return;

    const assets = Object.values(AUDIO_ASSETS);
    for (const asset of assets) {
      if (!this.preloadedAssets.has(asset)) {
        try {
          const howl = new Howl({
            src: [asset],
            html5: true,
            preload: true,
            volume: 0,
          });
          this.preloadedAssets.add(asset);
        } catch (e) {
          console.warn(`Failed to preload audio: ${asset}`);
        }
      }
    }
  }

  async switchMode(mode: AtmosphereMode): Promise<void> {
    if (this.currentMode === mode) return;

    const previousMode = this.currentMode;
    this.currentMode = mode;

    // Fade out previous track
    if (previousMode) {
      await this.fadeOut(previousMode);
      this.stopTrack(previousMode);
    }

    // Fade in new track
    await this.fadeIn(mode);
  }

  private createTrack(mode: AtmosphereMode): AudioTrack {
    const audioPath = AUDIO_ASSETS[mode];
    // Don't use HTML5 audio for start_menu to allow Web Audio API autoplay if browser MEI allows it
    const useHtml5 = mode !== 'start_menu' && !!audioPath;

    const howl = new Howl({
      src: [audioPath],
      autoplay: false,
      loop: true,
      volume: 0,
      html5: useHtml5,
      preload: this.config.preloadAssets ? true : 'metadata',
      onloaderror: () => {
        console.warn(`Failed to load audio: ${audioPath}`);
      },
    });

    return {
      id: mode,
      howl,
      volume: this.config.masterVolume,
      isPlaying: false,
      fadeTime: this.config.fadeTransitionTime,
    };
  }

  private getOrCreateTrack(mode: AtmosphereMode): AudioTrack {
    if (!this.tracks.has(mode)) {
      this.tracks.set(mode, this.createTrack(mode));
    }
    return this.tracks.get(mode)!;
  }

  private async fadeIn(mode: AtmosphereMode, duration: number = this.config.fadeTransitionTime): Promise<void> {
    return new Promise((resolve) => {
      const track = this.getOrCreateTrack(mode);

      if (track.howl && !track.isPlaying) {
        track.isPlaying = true;
        track.howl.volume(0);
        track.howl.play();

        const startTime = Date.now();
        const targetVolume = this.config.masterVolume;

        const fadeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentVolume = targetVolume * progress;

          if (track.howl) {
            track.howl.volume(currentVolume);
          }

          if (progress === 1) {
            clearInterval(fadeInterval);
            resolve();
          }
        }, 50);

        this.transitionTimeouts.push(fadeInterval as unknown as NodeJS.Timeout);
      } else {
        resolve();
      }
    });
  }

  private async fadeOut(mode: AtmosphereMode, duration: number = this.config.fadeTransitionTime): Promise<void> {
    return new Promise((resolve) => {
      const track = this.tracks.get(mode);

      if (track && track.howl && track.isPlaying) {
        const startVolume = track.howl.volume();
        const startTime = Date.now();

        const fadeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentVolume = startVolume * (1 - progress);

          if (track.howl) {
            track.howl.volume(currentVolume);
          }

          if (progress === 1) {
            clearInterval(fadeInterval);
            resolve();
          }
        }, 50);

        this.transitionTimeouts.push(fadeInterval as unknown as NodeJS.Timeout);
      } else {
        resolve();
      }
    });
  }

  private stopTrack(mode: AtmosphereMode): void {
    const track = this.tracks.get(mode);
    if (track && track.howl) {
      track.howl.stop();
      track.isPlaying = false;
    }
  }

  resumeCurrentTrack(): void {
    if (typeof window !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().catch((e) => console.warn('Failed to resume Howler context:', e));
    }

    if (this.currentMode) {
      const track = this.tracks.get(this.currentMode);
      if (track && track.howl) {
        track.isPlaying = true;
        track.howl.play();
        track.howl.volume(this.config.masterVolume);
      }
    }
  }

  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.config.masterVolume = clampedVolume;
    Howler.volume(clampedVolume);
  }

  mute(): void {
    Howler.mute(true);
  }

  unmute(): void {
    Howler.mute(false);
  }

  cleanup(): void {
    this.transitionTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.transitionTimeouts = [];

    this.tracks.forEach((track) => {
      if (track.howl) {
        track.howl.stop();
        track.howl.unload();
      }
    });
    this.tracks.clear();
    this.currentMode = null;
  }
}

export const createAudioManager = (config?: Partial<AudioManagerConfig>): AudioManager => {
  return new AudioManager(config);
};
