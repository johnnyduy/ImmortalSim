import { useEffect, useRef, useState } from 'react';
import { determineAtmosphere, type AtmosphereMode } from '../lib/atmosphere/backgroundManager';
import { createAudioManager, type AudioManager } from '../lib/atmosphere/audioManager';
import type { GameState } from '../types';

interface UseAtmosphereOptions {
  enableAudio?: boolean;
  masterVolume?: number;
}

export const useAtmosphere = (gameState: GameState | null, options: UseAtmosphereOptions = {}) => {
  const { enableAudio = true, masterVolume = 0.3 } = options;

  const audioManagerRef = useRef<AudioManager | null>(null);
  const [currentMode, setCurrentMode] = useState<AtmosphereMode>('mortal_village');
  const previousGameStateRef = useRef<GameState | null>(null);

  // 1. Initialize & Cleanup AudioManager (Only runs when enableAudio status changes)
  useEffect(() => {
    if (!enableAudio) {
      if (audioManagerRef.current) {
        audioManagerRef.current.cleanup();
        audioManagerRef.current = null;
      }
      return;
    }

    if (!audioManagerRef.current) {
      const manager = createAudioManager({
        masterVolume,
        fadeTransitionTime: 2000,
        preloadAssets: true,
      });
      audioManagerRef.current = manager;

      manager.preloadAudio().catch((e) => console.warn('Audio preload failed:', e));
    }

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.cleanup();
        audioManagerRef.current = null;
      }
    };
  }, [enableAudio]);

  // 2. Sync volume when masterVolume changes (Does not recreate AudioManager!)
  useEffect(() => {
    if (enableAudio && audioManagerRef.current) {
      audioManagerRef.current.setMasterVolume(masterVolume);
    }
  }, [masterVolume, enableAudio]);

  // 3. Switch BGM mode based on game state
  useEffect(() => {
    if (!enableAudio || !audioManagerRef.current) return;

    const newMode = determineAtmosphere(gameState, previousGameStateRef.current);

    if (newMode !== currentMode) {
      setCurrentMode(newMode);
    }

    audioManagerRef.current.switchMode(newMode).catch((e) => console.warn('Audio switch failed:', e));

    previousGameStateRef.current = gameState;
  }, [gameState, currentMode, enableAudio, !!audioManagerRef.current]);

  // 4. Resume BGM on first user interaction to bypass browser autoplay blocks
  useEffect(() => {
    if (!enableAudio) return;

    const resumeAudio = () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.resumeCurrentTrack();
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };

    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, [enableAudio, currentMode]);

  const setMasterVolume = (volume: number) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMasterVolume(volume);
    }
  };

  const mute = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.mute();
    }
  };

  const unmute = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.unmute();
    }
  };

  const resumeBGM = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.resumeCurrentTrack();
    }
  };

  return {
    currentMode,
    setMasterVolume,
    mute,
    unmute,
    resumeBGM,
    audioManager: audioManagerRef.current,
  };
};
