import React, { useEffect, useState } from 'react';
import { determineAtmosphere, getBackgroundClass, getBackgroundStyles, type AtmosphereMode } from '../lib/atmosphere/backgroundManager';
import type { GameState } from '../types';

interface Props {
  gameState: GameState | null;
  previousGameState?: GameState | null;
}

export default function AtmosphereBackground({ gameState, previousGameState }: Props) {
  const [mode, setMode] = useState<AtmosphereMode>('mortal_village');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const newMode = determineAtmosphere(gameState, previousGameState);

    if (newMode !== mode) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setMode(newMode);
        setIsTransitioning(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gameState, previousGameState, mode]);

  const styles = getBackgroundStyles();
  const backgroundClass = getBackgroundClass(mode);

  return (
    <>
      {/* Main background image visible throughout the game */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/start.png')" }}
      />

      {/* Main gradient background blended with the image */}
      <div
        className={`${backgroundClass} ${isTransitioning ? 'opacity-20' : 'opacity-30'}`}
        style={styles[mode]}
      />

      {/* Animated fog layer */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="atmosphere-fog absolute inset-0 opacity-30" />
      </div>

      {/* Cloud layers for parallax effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="atmosphere-clouds-far absolute inset-0 opacity-10" />
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="atmosphere-clouds-mid absolute inset-0 opacity-15" />
      </div>

      {/* Subtle rain effect for specific modes */}
      {(mode === 'mountain_wandering' || mode === 'meditation' || mode === 'story_5') && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="atmosphere-rain absolute inset-0 opacity-5" />
        </div>
      )}

      {/* Light shimmer for death/reincarnation/blood moon */}
      {(mode === 'death' || mode === 'reincarnation' || mode === 'story_3') && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="atmosphere-shimmer absolute inset-0 opacity-20" />
        </div>
      )}

      {/* Mystical glow for mystery/forbidden/starting stories */}
      {(mode === 'mystery' || mode === 'forbidden' || mode === 'story_1' || mode === 'story_2' || mode === 'story_4') && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="atmosphere-glow absolute inset-0 opacity-15" />
        </div>
      )}

      {/* Subtle vignette */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/20" />
    </>
  );
}
