import React from 'react';

export default function AtmosphericBackground({ state = 'wandering' }) {
  // We can dynamically alter the background gradient based on the player's current state (e.g., 'death', 'sect', 'combat')
  const getBackgroundStyle = () => {
    switch (state) {
      case 'death':
        return 'from-black via-ink-950 to-black';
      case 'sect':
        return 'from-stone-900 via-ink-900 to-ink-950';
      default: // wandering/mortal
        return 'from-slate-950 via-ink-900 to-ink-950';
    }
  };

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-ink-950">
      {/* Base Gradient Layer */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getBackgroundStyle()} transition-colors duration-[3000ms] ease-in-out`} />
      
      {/* Drifting Fog/Mist Layer */}
      <div className="absolute inset-0 opacity-20 mix-blend-screen animate-fog-drift" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)', backgroundSize: '200% 200%' }} />
           
      {/* Subtle vignette to focus the center */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
}