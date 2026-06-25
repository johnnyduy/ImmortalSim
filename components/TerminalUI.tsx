import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { getRealmSubStage } from '../lib/cultivation-states';
import { getLocalizedText } from '../lib/i18n';
import ChoiceButtons from './ChoiceButtons';
import { applyChoiceToState } from '../lib/engine';

interface TerminalUIProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  language: 'vi' | 'en';
  onAscension: () => void;
}

export default function TerminalUI({ game, setGame, language, onAscension }: TerminalUIProps) {
  const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
  
  const [flickers, setFlickers] = useState<string[]>(Array(5).fill('0.9'));

  useEffect(() => {
    const interval = setInterval(() => {
      setFlickers(prev => prev.map(() => (Math.random() * 0.3 + 0.7).toString()));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const qiValue = game.stats.cultivation;
  const qiMax = 5000; // placeholder, or game.stats.maxCultivation
  const soulValue = game.stats.daoHeart || 0;
  const bodyValue = game.stats.health || 0;
  const luckValue = game.stats.luck || 0;

  return (
    <div className="font-body-md selection:bg-primary-container selection:text-on-primary-container pb-24 h-screen overflow-y-auto">
      <div className="scanlines"></div>

      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-gutter h-16 bg-background border-b border-outline-variant shadow-[0_0_15px_rgba(57,255,20,0.1)]">
        <div className="flex items-center gap-stack-md">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
          <h1 className="font-headline-sm text-headline-sm uppercase tracking-widest text-primary-container">
            {currentSubStage.subStageName[language]}
          </h1>
        </div>
        <div className="font-mono-data text-mono-data text-primary brightness-125">
          AGE: {game.age}/{game.stats.lifespan || 95}
        </div>
      </header>

      <main className="pt-20 px-gutter max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter relative z-10">
        
        {/* Status Column (Left) */}
        <aside className="md:col-span-3 space-y-stack-md">
          <div className="glass-panel p-panel-padding rounded-lg flex flex-col items-center">
            <div className="relative w-full aspect-square mb-stack-md group">
              <div className="absolute inset-0 border border-primary-container/20 animate-pulse"></div>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn3MeboE9NLvBpsxj9Yzs4eVIzGKCvw27Kv_Tn_VeV0igU06-6LrqKlnwg3-EK46_ZSUCgd4KCwp__D-4eLJFx6luvSChvVc_MM4WNBKyKb57t1ksYAxlk5JHaomO7d6TuFF7YpFUrL3p5Mm8Mo4Ym7C2iBRDF1nxW84I1-djc-B8ddczQbUxp4GCVkttkayYqCXDXDoBG462uxYvqiUkADpzG-vtWv7pVTcXXpNQ4imciNaggO1j-Z4VRyN7_z-GamRRsCXot5RuC" 
                className="w-full h-full object-cover filter grayscale brightness-50 group-hover:brightness-100 transition-all duration-700" 
                alt="Entity"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-background/80 px-2 py-1 border border-outline-variant">
                <p className="font-label-caps text-label-caps text-center text-primary">ENTITY: CULTIVATOR</p>
              </div>
            </div>
            
            <div className="w-full space-y-stack-sm">
              <div className="flex justify-between border-b border-border-subtle pb-1">
                <span className="text-on-surface-variant font-label-caps text-label-caps">SECT</span>
                <span className="text-secondary font-mono-data text-mono-data">{game.sect || 'Rogue'}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-1">
                <span className="text-on-surface-variant font-label-caps text-label-caps">KARMA</span>
                <span className="text-primary font-mono-data text-mono-data">+{game.sectContribution || 0}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-panel-padding rounded-lg space-y-stack-sm">
            <h3 className="font-label-caps text-label-caps text-primary mb-stack-sm">STATUS EFFECTS</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold tracking-tighter">[ENLIGHTENED]</span>
            </div>
          </div>
        </aside>

        {/* The Scroll (Center) - Detailed Stats & Progress */}
        <section className="md:col-span-6 space-y-stack-md">
          <div className="glass-panel p-panel-padding rounded-lg border-l-4 border-l-primary-container">
            <div className="flex items-center justify-between mb-stack-md">
              <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">analytics</span> CORE ESSENCE
              </h2>
              <span className="font-mono-data text-mono-data text-on-surface-variant">SYNC: {(qiValue / qiMax * 100).toFixed(1)}%</span>
            </div>
            
            <div className="space-y-stack-lg">
              {/* Qi Stat */}
              <div className="group">
                <div className="flex justify-between items-end mb-1">
                  <label className="font-headline-sm text-headline-sm tracking-widest text-primary">QI</label>
                  <span className="font-mono-data text-mono-data text-primary-fixed">{Math.floor(qiValue)}</span>
                </div>
                <div className="flex h-4 w-full overflow-hidden gap-[2px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={i < (qiValue/qiMax)*10 ? 'qi-segment' : 'qi-segment-empty flex-1'}></div>
                  ))}
                </div>
              </div>

              {/* Soul Stat */}
              <div className="group">
                <div className="flex justify-between items-end mb-1">
                  <label className="font-headline-sm text-headline-sm tracking-widest text-primary">SOUL</label>
                  <span className="font-mono-data text-mono-data text-primary-fixed">{soulValue} / 100</span>
                </div>
                <div className="flex h-4 w-full overflow-hidden gap-[2px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={i < (soulValue/100)*10 ? 'qi-segment' : 'qi-segment-empty flex-1'}></div>
                  ))}
                </div>
              </div>

              {/* Body Stat */}
              <div className="group">
                <div className="flex justify-between items-end mb-1">
                  <label className="font-headline-sm text-headline-sm tracking-widest text-primary">BODY</label>
                  <span className="font-mono-data text-mono-data text-primary-fixed">{bodyValue} / 100</span>
                </div>
                <div className="flex h-4 w-full overflow-hidden gap-[2px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={i < (bodyValue/100)*10 ? 'qi-segment' : 'qi-segment-empty flex-1'}></div>
                  ))}
                </div>
              </div>

              {/* Luck Stat */}
              <div className="group">
                <div className="flex justify-between items-end mb-1">
                  <label className="font-headline-sm text-headline-sm tracking-widest text-secondary">LUCK</label>
                  <span className="font-mono-data text-mono-data text-secondary-fixed">{luckValue} / 100</span>
                </div>
                <div className="flex h-4 w-full">
                  <div className="w-full bg-secondary-container/20 border border-secondary relative overflow-hidden">
                    <div className="absolute inset-0 bg-secondary-container/40 flicker-anim" style={{ width: `${Math.min(100, luckValue)}%`, opacity: flickers[0] }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Event */}
          <div className="glass-panel p-panel-padding rounded-lg stat-glow transition-all mt-4">
            <h4 className="font-headline-sm text-headline-sm text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">event</span> EVENT LOG
            </h4>
            <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-4">
               {game.currentEvent ? (
                 <div className="text-body-md text-on-surface">
                   <p className="mb-4">{getLocalizedText(game.currentEvent.description, language)}</p>
                   <ChoiceButtons 
                     eventId={game.currentEvent.id}
                     choices={game.currentEvent.choices} 
                     language={language}
                     onSelect={(choiceId) => setGame(applyChoiceToState(game, choiceId, language))}
                   />
                 </div>
               ) : (
                 <div className="text-body-md text-on-surface-variant italic">Waiting for event...</div>
               )}
            </div>
          </div>
        </section>

        {/* Command Column (Right) */}
        <aside className="md:col-span-3 space-y-stack-md">
          <div className="glass-panel p-panel-padding rounded-lg">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-md border-b border-outline-variant pb-2">STAT BALANCE HEX</h3>
            <div className="relative flex justify-center items-center py-4">
              <div className="w-40 h-40 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <polygon fill="none" points="50,10 85,30 85,70 50,90 15,70 15,30" stroke="#222222" strokeWidth="0.5"></polygon>
                  <polygon fill="none" points="50,20 75,35 75,65 50,80 25,65 25,35" stroke="#222222" strokeWidth="0.5"></polygon>
                  <polygon fill="none" points="50,30 65,40 65,60 50,70 35,60 35,40" stroke="#222222" strokeWidth="0.5"></polygon>
                  <polygon className="flicker-anim" fill="rgba(57, 255, 20, 0.2)" points="50,15 80,35 80,60 50,85 30,65 20,40" stroke="#39ff14" strokeWidth="1.5" style={{ opacity: flickers[1] }}></polygon>
                </svg>
                <span className="absolute top-0 text-[10px] font-mono-data text-primary">QI</span>
                <span className="absolute bottom-0 text-[10px] font-mono-data text-primary">BODY</span>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-[10px] font-mono-data text-primary">SOUL</span>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-[10px] font-mono-data text-secondary">LUCK</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-panel-padding rounded-lg">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm">NEXT BREAKTHROUGH</h3>
            <p className="font-mono-data text-mono-data text-primary-fixed mb-stack-md underline decoration-dotted underline-offset-4 uppercase">
              {currentSubStage.subStageName[language]}
            </p>
            <div className="space-y-stack-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-primary">check_circle</span>
                <span className="text-body-sm font-body-sm text-on-surface">Cultivation {Math.floor(qiValue)} / 500</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onAscension}
            className="w-full py-3 border border-primary-container font-label-caps text-label-caps text-primary hover:bg-primary-container/10 transition-all flex items-center justify-center gap-2 group">
            INITIATE ASCENSION
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">keyboard_double_arrow_right</span>
          </button>
        </aside>

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-low border-t border-outline-variant">
        <div className="flex flex-col items-center justify-center text-primary bg-terminal-green-dim/30 rounded-lg p-2 shadow-[0_0_10px_rgba(57,255,20,0.2)] cursor-pointer active:scale-90 duration-150">
          <span className="material-symbols-outlined">explore</span>
          <span className="font-label-caps text-label-caps">EXPLORE</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant p-2 opacity-70 hover:text-primary hover:opacity-100 transition-all cursor-pointer active:scale-90 duration-150">
          <span className="material-symbols-outlined">backpack</span>
          <span className="font-label-caps text-label-caps">INVENTORY</span>
        </div>
      </nav>
    </div>
  );
}
