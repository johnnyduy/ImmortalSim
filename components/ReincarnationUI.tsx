import React, { useState } from 'react';
import { GameState, Inheritance } from '../types';
import { getRealmSubStage } from '../lib/cultivation-states';
import { getLocalizedText } from '../lib/i18n';
import { uiText } from '../lib/i18n';

interface ReincarnationUIProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  inheritance: Inheritance;
  setInheritance: React.Dispatch<React.SetStateAction<Inheritance>>;
  language: 'vi' | 'en';
  onReincarnate: () => void;
}

export default function ReincarnationUI({ game, setGame, inheritance, setInheritance, language, onReincarnate }: ReincarnationUIProps) {
  const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
  
  const [availableKarma, setAvailableKarma] = useState(game.sectContribution || 1250);

  const perks = [
    {
      id: 'retain_qi',
      icon: 'psychology_alt',
      nameVi: 'GIỮ LẠI 10% TU VI',
      nameEn: 'RETAIN 10% QI',
      descVi: 'Bắt đầu kiếp sau với nền tảng vững chắc hơn. Tích lũy dựa trên Tu Vi kiếp trước.',
      descEn: 'Start the next life with a stronger foundation. Accumulates based on previous Qi.',
      cost: 500
    },
    {
      id: 'blessing',
      icon: 'stars',
      nameVi: 'TIÊN THIÊN PHÚC TRẠCH',
      nameEn: 'HEAVENLY BLESSING',
      descVi: 'Tăng cường may mắn (Luck) cơ bản thêm 15 điểm. Dễ gặp cơ duyên hơn.',
      descEn: 'Increases base Luck by 15 points. Encounter fortuitous events more easily.',
      cost: 800
    },
    {
      id: 'body_refining',
      icon: 'fitness_center',
      nameVi: 'Luyện Thể Thuật',
      nameEn: 'Body Refining',
      descVi: 'Khí huyết dồi dào, thọ mệnh cơ bản tăng thêm 10 năm.',
      descEn: 'Abundant vitality, base lifespan increased by 10 years.',
      cost: 300
    }
  ];

  const buyPerk = (cost: number, id: string) => {
    if (availableKarma >= cost) {
      setAvailableKarma(prev => prev - cost);
      if (id === 'retain_qi') {
        setInheritance(prev => ({ ...prev, extraQi: ((prev as any).extraQi || 0) + Math.floor(game.stats.cultivation * 0.1) }));
      } else if (id === 'blessing') {
        setInheritance(prev => ({ ...prev, blessing: (prev.blessing || 0) + 15 }));
      }
    }
  };

  return (
    <div className="font-body-md select-none h-screen overflow-y-auto">
      <div className="scanline-overlay"></div>
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 bg-background overflow-hidden pointer-events-none">
        <div className="ambient-glow absolute -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full"></div>
        <div className="ambient-glow absolute -bottom-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-[600px] h-[600px] border border-secondary/20 rounded-full portal-pulse flex items-center justify-center">
            <div className="w-[450px] h-[450px] border-2 border-secondary/10 rounded-full animate-[spin_60s_linear_infinite]"></div>
          </div>
          <div className="absolute inset-0 flex justify-center data-stream">
            <div className="h-full w-px bg-secondary-fixed/10 mx-8"></div>
            <div className="h-full w-px bg-secondary-fixed/5 mx-16"></div>
            <div className="h-full w-px bg-secondary-fixed/10 mx-8"></div>
            <div className="h-full w-px bg-secondary-fixed/20 mx-12"></div>
          </div>
        </div>
      </div>

      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-gutter h-16 bg-background/80 backdrop-blur-md border-b border-outline-variant shadow-[0_0_15px_rgba(255,176,0,0.1)]">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
          <h1 className="font-headline-sm text-headline-sm uppercase tracking-widest text-primary-container text-red-500">
            {(uiText[language]?.['deceased'] || 'DECEASED')}
          </h1>
        </div>
        <div className="font-mono-data text-mono-data text-secondary flex items-center gap-4">
          <span className="opacity-60">[ SYSTEM_HALT ]</span>
          <span className="px-3 py-1 border border-secondary/30 bg-secondary/5 rounded">AGE: {game.age}/{game.stats.lifespan || 95}</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 pt-24 pb-32 px-gutter min-h-screen max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-stack-lg">
        
        {/* Left: Life Summary */}
        <section className="md:col-span-5 flex flex-col gap-stack-md">
          <div className="p-panel-padding border border-secondary/30 bg-surface-container-lowest/80 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary-fixed"></div>
            <div className="mb-stack-lg">
              <span className="font-label-caps text-label-caps text-secondary-fixed opacity-60">ARCHIVE_LOG // LIFE_ID_{Math.floor(Math.random() * 9999)}</span>
              <h2 className="font-headline-lg text-headline-lg text-secondary mt-1">THE DEPARTURE</h2>
            </div>
            
            <div className="space-y-stack-md font-mono-data">
              <div className="flex justify-between items-end border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">TOTAL AGE</span>
                <span className="text-headline-md font-headline-md text-secondary">{game.age} <span className="text-body-sm opacity-50 uppercase">Cycles</span></span>
              </div>
              <div className="flex justify-between items-end border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">PEAK REALM</span>
                <div className="text-right">
                  <span className="text-headline-sm font-headline-sm text-primary">{currentSubStage.subStageName[language]}</span>
                  <div className="text-body-sm text-primary-fixed-dim opacity-70">Grade {game.subStageIndex || 0}</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">KARMA ACCRUED</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  <span className="text-headline-md font-headline-md text-secondary-fixed-dim">{game.sectContribution || 1250}</span>
                </div>
              </div>
            </div>

            <div className="mt-stack-lg grid grid-cols-2 gap-stack-sm">
              <div className="p-3 bg-surface-container-low border border-outline-variant/30">
                <span className="text-[10px] block text-on-surface-variant uppercase mb-1">Items Collected</span>
                <div className="text-mono-data text-on-surface">{game.inventory?.length || 0} Artifacts</div>
              </div>
              <div className="p-3 bg-surface-container-low border border-outline-variant/30">
                <span className="text-[10px] block text-on-surface-variant uppercase mb-1">Techniques</span>
                <div className="text-mono-data text-on-surface">{game.techniques?.length || 0} Learned</div>
              </div>
            </div>
          </div>
          
          <div className="p-panel-padding bg-surface-container-lowest/40 border border-outline-variant/20 italic text-on-surface-variant font-body-sm leading-relaxed">
              "The wheel of reincarnation turns for no one, yet your soul carries the faint shimmer of golden karma. What will you take with you into the void? What will you leave for the worms?"
          </div>
        </section>

        {/* Right: Inheritance Shop */}
        <section className="md:col-span-7 flex flex-col gap-stack-md">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed">auto_awesome</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">KARMA INHERITANCE</span>
            </div>
            <div className="px-4 py-1.5 bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps rounded-full shadow-[0_0_10px_rgba(255,176,0,0.3)]">
                AVAILABLE: {availableKarma}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-stack-sm overflow-y-auto max-h-[530px] pr-2 custom-scrollbar">
            {perks.map(perk => (
              <button 
                key={perk.id}
                onClick={() => buyPerk(perk.cost, perk.id)}
                disabled={availableKarma < perk.cost}
                className={`flex items-center gap-stack-md p-panel-padding bg-surface-container-low/60 border border-outline-variant transition-all text-left group active:scale-[0.98] ${availableKarma >= perk.cost ? 'hover:border-secondary-fixed/50 hover:bg-secondary/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                <div className={`w-12 h-12 flex items-center justify-center bg-background border border-outline-variant ${availableKarma >= perk.cost ? 'group-hover:border-secondary group-hover:shadow-[0_0_8px_rgba(255,176,0,0.2)]' : ''}`}>
                  <span className="material-symbols-outlined text-secondary-fixed text-3xl">{perk.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-mono-data text-mono-data text-on-surface uppercase">{language === 'vi' ? perk.nameVi : perk.nameEn}</h4>
                  <p className="text-body-sm text-on-surface-variant">{language === 'vi' ? perk.descVi : perk.descEn}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-secondary-fixed font-mono-data text-mono-data">{perk.cost} K</span>
                  <span className="text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">PURCHASE</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 flex justify-end">
            <button 
              onClick={onReincarnate}
              className="px-8 py-3 bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps shadow-[0_0_15px_rgba(255,176,0,0.4)] hover:shadow-[0_0_25px_rgba(255,176,0,0.6)] hover:bg-white transition-all active:scale-95 uppercase">
              {(uiText[language]?.['enterReincarnationCy'] || 'Enter Reincarnation Cycle')}
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
