import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { getRealmSubStage } from '../lib/cultivation-states';
import { getLocalizedText, uiText } from '../lib/i18n';
import ChoiceButtons from './ChoiceButtons';
import SectMenuUI from './SectMenuUI';
import { applyChoiceToState } from '../lib/engine';
import { LevelRewardAnimationPayload } from './LevelRewardAnimation';

interface TerminalUIProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  language: 'vi' | 'en';
  onAscension: () => void;
  onChoice: (choiceId: string) => void;
  levelRewardAnimation?: LevelRewardAnimationPayload | null;
  onRewardDone?: () => void;
  activeOverlayNode?: React.ReactNode;
}

export default function TerminalUI({ game, setGame, language, onAscension, onChoice, levelRewardAnimation, onRewardDone, activeOverlayNode }: TerminalUIProps) {
  const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
  
  const [flickers, setFlickers] = useState<string[]>(Array(5).fill('0.9'));
  const [systemClock, setSystemClock] = useState('INIT_CLOCK...');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSystemClock(`SYS_TIME: ${dateStr} // ${timeStr}`);
    };
    const clockInterval = setInterval(updateClock, 1000);
    updateClock();
    
    const flickerInterval = setInterval(() => {
      setFlickers(prev => prev.map(() => (Math.random() * 0.3 + 0.7).toString()));
    }, 150);
    
    return () => {
      clearInterval(clockInterval);
      clearInterval(flickerInterval);
    };
  }, []);

  const qiValue = game.stats.cultivation;
  const qiMax = 5000; // placeholder
  const soulValue = game.stats.daoHeart || 0;
  const bodyValue = game.stats.health || 0;
  const luckValue = game.stats.luck || 0;

  const parseReward = (raw: string) => {
    const l = raw.toLowerCase();
    if (l.includes('thiên trà') || l.includes('tea')) return { icon: '🍵', title: raw };
    if (l.includes('thạch') || l.includes('stone') || l.includes('stones')) {
      if (l.includes('nhân vân') || l.includes('nhàn vân') || l.includes('vân')) return { icon: '🟢', title: raw };
      return { icon: '💎', title: raw };
    }
    if (l.includes('quyết') || l.includes('tuyệt kỹ') || l.includes('du bộ')) return { icon: '📜', title: raw };
    if (l.includes('tu vi') || l.includes('cultivation')) return { icon: '✨', title: raw };
    if (l.includes('cống hiến') || l.includes('contribution')) return { icon: '🛡️', title: raw };
    if (l.includes('uy vọng') || l.includes('prestige')) return { icon: '🏵️', title: raw };
    if (l.includes('thọ nguyên') || l.includes('lifespan') || l.includes('tuổi thọ')) return { icon: '🐢', title: raw };
    if (l.includes('đạo tâm') || l.includes('dao heart') || l.includes('daoheart')) return { icon: '☯', title: raw };
    if (l.includes('ngộ tính') || l.includes('comprehension')) return { icon: '💡', title: raw };
    if (l.includes('vận may') || l.includes('luck')) return { icon: '🍀', title: raw };
    if (l.includes('sinh mệnh') || l.includes('máu') || l.includes('health') || l.includes('hp')) return { icon: '❤️', title: raw };
    return { icon: '🎁', title: raw };
  };

  return (
    <div className="flex flex-col crt-flicker h-screen overflow-hidden text-[#00ff41] bg-[#0a0a0a] font-['JetBrains_Mono',monospace]">
      <div className="scanline"></div>
      <SectMenuUI game={game} onChoice={onChoice} language={language} />

      {/* Top AppBar */}
      <header className="flex justify-between items-center w-full px-margin py-unit bg-surface border-b border-outline-variant z-10 shrink-0 h-16">
        <div className="flex items-center gap-gutter">
          <span className="font-headline-lg text-headline-lg text-primary-container tracking-tighter">CULTIVATION_OS_V1.0</span>
          <div className="flex gap-4 ml-8 hidden md:flex">
            <span className="text-primary font-bold border-b-2 border-primary font-label-md text-label-md cursor-pointer">SYSTEM_LOG</span>
            <span className="text-on-surface-variant font-body-md font-label-md text-label-md hover:bg-primary hover:text-on-primary px-2 transition-all cursor-pointer">VITAL_SIGNS</span>
            <span className="text-on-surface-variant font-body-md font-label-md text-label-md hover:bg-primary hover:text-on-primary px-2 transition-all cursor-pointer">MATRIX_MAP</span>
          </div>
        </div>
        <div className="flex items-center gap-gutter">
          <span className="font-code-sm text-code-sm text-primary-container mr-4 hidden sm:block">{systemClock}</span>
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80">settings</span>
            <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80">terminal</span>
            <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80">power_settings_new</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden pb-16">
        {/* Left Sidebar: Character Profile */}
        <aside className="w-72 bg-surface-container-lowest border-r border-outline-variant flex flex-col p-gutter shrink-0 hidden md:flex">
          <div className="mb-gutter text-center">
            <div className="relative w-48 h-48 mx-auto border-2 border-outline p-1 mb-4 group overflow-hidden">
              <div className="absolute inset-0 bg-primary opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <img alt="Cultivator Silhouette" className="w-full h-full object-cover grayscale brightness-50 contrast-150" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRz-Dq5q7Gd7QAyDbsOLdTZVbH91avJmvA7wnat7Y38Q65LD4Es4tMhCcvMfb04QQyLesUlxGgbFPxsV9vdWAnEgXS3MEPqsgj-Nf2RyU0PVgyk5_8Ci2oW7F1QdkcGFaIyi_6bS3g4rW0agDgsXXyt_xCT3_Rh8EtKszDycOvvXK_nqSU4lgtjMF4N3CCRczRrGExM2EsVk1J1jQUTKSn9Ny2s6dH3OtETuJAwTQ2OY-QjH9RjyOMR0iHqqG6-kjME5sZzYaYKoZ2"/>
              <div className="absolute bottom-0 left-0 right-0 bg-primary-container text-on-primary py-1 font-label-md text-label-md uppercase tracking-widest">
                SOUL_BONDED
              </div>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary">[ {game.name || 'USER_001'} ]</h2>
            <div className="flex flex-col gap-1 mt-2 text-left bg-surface-container-high p-unit border border-outline-variant">
              <div className="flex justify-between px-2">
                <span className="text-on-surface-variant text-label-md">SECT:</span>
                <span className="text-primary-container text-label-md">{game.sect || 'Rogue'}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-on-surface-variant text-label-md">REALM:</span>
                <span className="text-primary-container text-label-md text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-3 p-3 bg-surface-container-high border-l-4 border-secondary text-secondary font-bold translate-x-1 transition-transform cursor-pointer">
              <span className="material-symbols-outlined">analytics</span>
              <span className="font-label-md text-label-md">STATS</span>
            </div>
            <div className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant hover:text-secondary cursor-pointer transition-colors">
              <span className="material-symbols-outlined">diamond</span>
              <span className="font-label-md text-label-md">REALM</span>
            </div>
            <div className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant hover:text-secondary cursor-pointer transition-colors">
              <span className="material-symbols-outlined">castle</span>
              <span className="font-label-md text-label-md">SECT</span>
            </div>
          </nav>
          
          <div className="mt-auto pt-gutter border-t border-outline-variant">
            <div className="flex justify-between px-2 mb-2 text-code-sm">
                <span className="text-on-surface-variant">KARMA:</span>
                <span className="text-primary">+{game.sectContribution || 0}</span>
            </div>
            <div className="flex justify-between px-2 mb-4 text-code-sm">
                <span className="text-on-surface-variant">AGE:</span>
                <span className="text-primary">{game.age} / {game.stats.lifespan || 95}</span>
            </div>
            <button className="w-full py-3 border border-primary-container text-primary-container font-bold hover:bg-primary-container hover:text-on-primary transition-all mb-4">
                [ MEDITATE_CTRL ]
            </button>
            <div className="flex justify-around text-on-surface-variant">
              <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                <span className="material-symbols-outlined">restart_alt</span>
                <span className="text-code-sm">REBOOT</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                <span className="material-symbols-outlined">logout</span>
                <span className="text-code-sm">LOGOUT</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main: EVENT LOG */}
        <main className="flex-1 bg-background p-margin flex flex-col overflow-hidden relative">
          <div className="flex justify-between items-baseline mb-4 border-b border-outline pb-2">
            <h1 className="font-headline-md text-headline-md text-primary-container flex items-center">
              <span className="mr-3">{">>>"}</span> {uiText[language]?.eventLogCaps || "EVENT LOG"} <span className="ml-3 animate-[pulse_0.5s_infinite]">_</span>
            </h1>
            <span className="text-on-surface-variant text-code-sm hidden sm:block">STATUS: CONNECTED // SOURCE: [QI_NET]</span>
          </div>
          
          <div className="flex-1 terminal-border bg-surface-container-lowest p-6 overflow-y-auto scrolling-log space-y-6">
            
            <div className="flex flex-col gap-2">
              <div className="text-outline text-label-md flex items-center">
                <span className="mr-4">[ SYSTEM ]</span>
                <span>[ BROADCAST_SYSTEM ] Event loaded...</span>
              </div>
            </div>

            {activeOverlayNode ? (
              <div className="w-full flex-1 flex flex-col items-center justify-center animate-fade-in min-h-[400px]">
                {activeOverlayNode}
              </div>
            ) : levelRewardAnimation ? (
              <div className="pt-2 space-y-4 crt-flicker animate-fade-in">
                <p className="text-secondary font-headline-md font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="animate-[pulse_1s_infinite]">▶</span> {levelRewardAnimation.title}
                </p>
                <div className="text-primary border-y border-dashed border-secondary/40 py-4 my-2 text-code-sm leading-relaxed bg-secondary/5 px-4 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]">
                  {">"} {levelRewardAnimation.subtitle}
                  <div className="mt-4 space-y-2">
                    {levelRewardAnimation.rewards.map((reward, idx) => {
                      const parsed = parseReward(reward.replace(/^\+/, '').trim());
                      return (
                        <div key={idx} className="flex items-center gap-3 font-mono-data opacity-0" style={{animation: `lra-reward-line 0.4s ease-out ${idx * 0.1}s forwards`}}>
                          <span className="text-xl bg-black/40 border border-secondary/30 rounded p-1 w-8 h-8 flex items-center justify-center">{parsed.icon}</span>
                          <span className="text-primary hover:text-white transition-colors">[+] {parsed.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 pt-4 flex justify-end">
                  <button 
                    onClick={onRewardDone}
                    className="px-6 py-2 border border-secondary text-secondary font-bold font-code-sm hover:bg-secondary hover:text-black transition-all group flex items-center gap-2"
                  >
                    <span>[ {(uiText[language]?.['confirm'] || 'CONFIRM')} ]</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">_</span>
                  </button>
                </div>
              </div>
            ) : game.currentEvent ? (
              <div className="pt-2 space-y-4">
                <p className="text-primary-container font-headline-md">{getLocalizedText(game.currentEvent.title, language)}</p>
                <div className="text-primary border-y border-dashed border-outline-variant py-4 my-2 text-body-md whitespace-pre-wrap leading-relaxed">
                  {">"} {getLocalizedText(game.currentEvent.description, language)}
                </div>
                
                <div className="mt-6 pt-4">
                  <ChoiceButtons 
                    eventId={game.currentEvent.id}
                    choices={game.currentEvent.choices} 
                    language={language}
                    onSelect={onChoice}
                  />
                </div>
              </div>
            ) : (
              <div className="text-body-md text-on-surface-variant italic">{uiText[language]?.waitingForEvent || "Waiting for event..."}</div>
            )}

            {/* Loading/Cursor line */}
            <div className="pt-8 flex items-center gap-2">
              <span className="text-primary-container font-bold">$</span>
              <span className="w-3 h-6 bg-primary-container animate-[pulse_0.8s_infinite]"></span>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Stats and Core */}
        <aside className="w-80 bg-surface-container border-l border-outline-variant flex flex-col p-gutter shrink-0 overflow-y-auto scrolling-log hidden lg:flex">
          {/* Radar Chart Section */}
          <div className="mb-8">
            <h3 className="font-label-md text-label-md text-primary mb-4 flex justify-between border-b border-outline-variant pb-1">
              <span>{uiText[language]?.statBalanceHex || "STAT BALANCE"}</span>
              <span className="material-symbols-outlined text-sm">settings_input_antenna</span>
            </h3>
            <div className="relative w-full aspect-square border border-outline-variant radar-grid flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 stroke-primary-container fill-primary-container/20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></circle>
                <circle cx="50" cy="50" r="30" fill="none" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></circle>
                <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></line>
                <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></line>
                
                {/* Dynamically calculate radar polygon based on stats */}
                {(() => {
                   const vBody = Math.min(100, bodyValue);
                   const vSoul = Math.min(100, soulValue);
                   const vLuck = Math.min(100, luckValue);
                   const vComprehension = Math.min(100, game.stats.comprehension || 0);
                   
                   // Map values to radius 0-45 (100% = 45px)
                   const rBody = (vBody / 100) * 45;
                   const rSoul = (vSoul / 100) * 45;
                   const rLuck = (vLuck / 100) * 45;
                   const rComp = (vComprehension / 100) * 45;
                   
                   // Points: Top (Comp), Right (Soul), Bottom (Body), Left (Luck)
                   const pt1 = `50,${50 - rComp}`;
                   const pt2 = `${50 + rSoul},50`;
                   const pt3 = `50,${50 + rBody}`;
                   const pt4 = `${50 - rLuck},50`;
                   
                   return (
                     <>
                       <polygon className="opacity-50" points={`${pt1} ${pt2} ${pt3} ${pt4}`} style={{ opacity: flickers[1] }}></polygon>
                       <polygon fill="none" points={`${pt1} ${pt2} ${pt3} ${pt4}`} strokeWidth="1.5"></polygon>
                     </>
                   );
                })()}
              </svg>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-primary">COMP</div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-primary">BODY</div>
              <div className="absolute top-1/2 right-1 -translate-y-1/2 text-[10px] text-primary">SOUL</div>
              <div className="absolute top-1/2 left-1 -translate-y-1/2 text-[10px] text-secondary">LUCK</div>
            </div>
          </div>

          {/* Core Stats Section */}
          <div className="mb-8">
            <h3 className="font-label-md text-label-md text-primary mb-4 border-b border-outline-variant pb-1">
              {uiText[language]?.coreEssence || "BẢN NGUYÊN (CORE)"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-code-sm uppercase">
                  <span>{uiText[language]?.qiCaps || "Khí (Spiritual)"}</span>
                  <span>{Math.floor(qiValue)}</span>
                </div>
                <div className="font-code-sm tracking-tight text-primary-container">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((qiValue/5000)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((qiValue/5000)*30))) + ']'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-code-sm uppercase">
                  <span>{uiText[language]?.soulCaps || "Hồn (Soul)"}</span>
                  <span>{soulValue}%</span>
                </div>
                <div className="font-code-sm tracking-tight text-primary-container">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((soulValue/100)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((soulValue/100)*30))) + ']'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-code-sm uppercase">
                  <span>{uiText[language]?.bodyCaps || "Thể (Body)"}</span>
                  <span>{bodyValue}%</span>
                </div>
                <div className="font-code-sm tracking-tight text-primary-container">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((bodyValue/100)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((bodyValue/100)*30))) + ']'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-code-sm uppercase">
                  <span className="text-secondary">{uiText[language]?.luckCaps || "Vận (Luck)"}</span>
                  <span className="text-secondary">{luckValue}%</span>
                </div>
                <div className="font-code-sm tracking-tight text-secondary">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((luckValue/100)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((luckValue/100)*30))) + ']'}
                </div>
              </div>
            </div>
          </div>

          {/* Next Breakthrough */}
          <div className="mt-auto bg-surface-container-highest p-3 terminal-border">
            <h4 className="font-label-md text-label-md text-secondary mb-2">{uiText[language]?.nextBreakthrough || "NEXT BREAKTHROUGH"}</h4>
            <div className="text-code-sm space-y-1">
              <p className="flex justify-between"><span>TARGET:</span> <span className="uppercase text-right">[{currentSubStage.subStageName[language]}]</span></p>
              <p className="flex justify-between"><span>REQ_QI:</span> <span>{Math.floor(qiValue)} / 500</span></p>
            </div>
            <div className="mt-4 border-t border-outline-variant pt-2">
              <button 
                onClick={onAscension}
                className="w-full text-code-sm text-center py-1 hover:bg-secondary hover:text-on-secondary transition-colors text-secondary border border-secondary/30">
                [ {uiText[language]?.initiateAscension || "INITIATE ASCENSION"} ]
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Navigation Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch h-16 bg-surface-container border-t border-primary-container">
        <button className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all">
          <span className="material-symbols-outlined">explore</span>
          <span className="font-code-sm text-code-sm">[F1] {uiText[language]?.exploreCaps || "EXPLORE"}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all" onClick={onAscension}>
          <span className="material-symbols-outlined">upgrade</span>
          <span className="font-code-sm text-code-sm">[F2] {uiText[language]?.initiateAscension || "ASCENSION"}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="font-code-sm text-code-sm">[F3] {uiText[language]?.inventoryCaps || "INVENTORY"}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-code-sm text-code-sm">[F4] {uiText[language]?.sectCaps || "SECT"}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className="font-code-sm text-code-sm">[F5] LOGOUT</span>
        </button>
      </footer>
    </div>
  );
}
