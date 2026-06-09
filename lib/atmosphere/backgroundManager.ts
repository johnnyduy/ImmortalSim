import type { GameState, Realm } from '../../types';

export type AtmosphereMode = 
  | 'start_menu'
  | 'mortal_village' 
  | 'mountain_wandering' 
  | 'sect_hall' 
  | 'meditation' 
  | 'mystery' 
  | 'death' 
  | 'reincarnation' 
  | 'forbidden'
  | 'story_1'
  | 'story_2'
  | 'story_3'
  | 'story_4'
  | 'story_5';

export interface BackgroundConfig {
  mode: AtmosphereMode;
  realm: Realm;
  isDying: boolean;
  isReincarnating: boolean;
  age: number;
}

export const determineAtmosphere = (state: GameState | null, previousState?: GameState | null): AtmosphereMode => {
  if (!state) return 'start_menu';

  if (previousState?.alive === true && !state.alive) {
    return 'death';
  }

  if (state.life > (previousState?.life ?? 1)) {
    return 'reincarnation';
  }

  // If we are at the initial event
  if (state.currentEvent?.id === 'birth_and_recruitment' && state.startingStoryId) {
    return `story_${state.startingStoryId}` as AtmosphereMode;
  }

  if (state.realm === 'Golden Core') {
    return 'forbidden';
  }

  if (state.realm === 'Foundation Establishment' || state.realm === 'Qi Refinement') {
    return 'mountain_wandering';
  }

  if (state.age > 50) {
    return 'meditation';
  }

  if (state.age > 30) {
    return 'sect_hall';
  }

  if (state.stats.karma < -5) {
    return 'mystery';
  }

  return 'mortal_village';
};

export const getBackgroundClass = (mode: AtmosphereMode): string => {
  const baseClass = 'fixed inset-0 -z-10 overflow-hidden transition-all duration-4000';

  const modeClasses: Record<AtmosphereMode, string> = {
    start_menu: `${baseClass} bg-gradient-to-b from-[#1a1815] via-[#0f0e0b] to-[#1a1815] atmosphere-village`,
    mortal_village: `${baseClass} bg-gradient-to-b from-[#1a1815] via-[#0f0e0b] to-[#1a1815] atmosphere-village`,
    mountain_wandering: `${baseClass} bg-gradient-to-b from-[#0f0e0b] via-[#1a1e1a] to-[#0f0e0b] atmosphere-mountain`,
    sect_hall: `${baseClass} bg-gradient-to-b from-[#1a1815] via-[#16150f] to-[#0f0e0b] atmosphere-sect`,
    meditation: `${baseClass} bg-gradient-to-b from-[#1a1815] via-[#16150f] to-[#0f0e0b] atmosphere-meditation`,
    mystery: `${baseClass} bg-gradient-to-b from-[#1e1815] via-[#16150f] to-[#0a0905] atmosphere-mystery`,
    death: `${baseClass} bg-gradient-to-b from-[#16150f] via-[#0f0e0b] to-[#0a0905] atmosphere-death`,
    reincarnation: `${baseClass} bg-gradient-to-b from-[#1a1e1a] via-[#0f0e0b] to-[#0f0e0b] atmosphere-reincarnation`,
    forbidden: `${baseClass} bg-gradient-to-b from-[#1e1a15] via-[#1a1815] to-[#0f0e0b] atmosphere-forbidden`,
    
    // Custom starting village stories
    story_1: `${baseClass} bg-gradient-to-b from-[#1a1c1d] via-[#101213] to-[#1e1c18] atmosphere-village`,
    story_2: `${baseClass} bg-gradient-to-b from-[#0f0a0d] via-[#090508] to-[#150a0a] atmosphere-mystery`,
    story_3: `${baseClass} bg-gradient-to-b from-[#1c0d0d] via-[#0a0505] to-[#1a0808] atmosphere-forbidden`,
    story_4: `${baseClass} bg-gradient-to-b from-[#0f1912] via-[#080d0a] to-[#141d13] atmosphere-meditation`,
    story_5: `${baseClass} bg-gradient-to-b from-[#0e1625] via-[#080c16] to-[#141b2b] atmosphere-mountain`,
  };

  return modeClasses[mode];
};

export const getBackgroundStyles = (): Record<AtmosphereMode, React.CSSProperties> => ({
  start_menu: {
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(109, 105, 84, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(168, 159, 125, 0.08) 0%, transparent 50%)
    `,
  },
  mortal_village: {
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(109, 105, 84, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(168, 159, 125, 0.08) 0%, transparent 50%)
    `,
  },
  mountain_wandering: {
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(106, 120, 107, 0.12) 0%, transparent 60%),
      radial-gradient(circle at 0% 50%, rgba(122, 139, 111, 0.08) 0%, transparent 50%)
    `,
  },
  sect_hall: {
    backgroundImage: `
      radial-gradient(circle at 50% 20%, rgba(109, 105, 84, 0.12) 0%, transparent 60%),
      radial-gradient(circle at 50% 100%, rgba(168, 159, 125, 0.06) 0%, transparent 60%)
    `,
  },
  meditation: {
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(168, 159, 125, 0.1) 0%, transparent 70%),
      radial-gradient(circle at 50% 0%, rgba(109, 105, 84, 0.08) 0%, transparent 60%)
    `,
  },
  mystery: {
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(139, 111, 71, 0.12) 0%, transparent 70%),
      radial-gradient(circle at 30% 70%, rgba(109, 105, 84, 0.08) 0%, transparent 50%)
    `,
  },
  death: {
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(90, 85, 70, 0.1) 0%, transparent 70%),
      radial-gradient(circle at 50% 100%, rgba(60, 55, 45, 0.08) 0%, transparent 60%)
    `,
  },
  reincarnation: {
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(122, 139, 111, 0.1) 0%, transparent 70%),
      radial-gradient(circle at 50% 0%, rgba(109, 105, 84, 0.08) 0%, transparent 60%)
    `,
  },
  forbidden: {
    backgroundImage: `
      radial-gradient(circle at 50% 40%, rgba(139, 111, 71, 0.12) 0%, transparent 70%),
      radial-gradient(circle at 50% 100%, rgba(109, 105, 84, 0.1) 0%, transparent 60%)
    `,
  },
  
  // Custom starting villages
  story_1: {
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(197, 160, 89, 0.12) 0%, transparent 60%),
      radial-gradient(circle at 80% 70%, rgba(160, 160, 160, 0.12) 0%, transparent 60%)
    `,
  },
  story_2: {
    backgroundImage: `
      radial-gradient(circle at 30% 20%, rgba(169, 60, 60, 0.15) 0%, transparent 60%),
      radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)
    `,
  },
  story_3: {
    backgroundImage: `
      radial-gradient(circle at 50% 30%, rgba(220, 38, 38, 0.18) 0%, transparent 75%),
      radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)
    `,
  },
  story_4: {
    backgroundImage: `
      radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 70%),
      radial-gradient(circle at 20% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)
    `,
  },
  story_5: {
    backgroundImage: `
      radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.18) 0%, transparent 70%),
      radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)
    `,
  },
});
