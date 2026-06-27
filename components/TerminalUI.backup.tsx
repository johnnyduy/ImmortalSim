import React, { useState, useEffect, useRef } from 'react';
import BeastMountainMinigame from './BeastMountainMinigame';
import { GameState } from '../types';
import { getRealmSubStage } from '../lib/cultivation-states';
import { getLocalizedText, uiText, t } from '../lib/i18n';
import type { Lang } from '../types';
import ChoiceButtons from './ChoiceButtons';
import SectMenuUI from './SectMenuUI';
import SectHerbGardenUI from './SectHerbGardenUI';
import SectBugRoomUI from './SectBugRoomUI';
import { applyChoiceToState } from '../lib/engine';
import { LevelRewardAnimationPayload } from './LevelRewardAnimation';
import BeastBagView from './BeastBagView';
import CityAuctionUI from './CityAuctionUI';
import DaoFoundationMinigame from './DaoFoundationMinigame';

interface TerminalUIProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  language: 'vi' | 'en';
  onAscension: () => void;
  onChoice: (choiceId: string) => void;
  levelRewardAnimation?: LevelRewardAnimationPayload | null;
  onRewardDone?: () => void;
  activeOverlayNode?: React.ReactNode;
  centerPanelOverride?: React.ReactNode;
  onUseItem?: (index: number) => void;
  onEquipItem?: (index: number) => void;
}

export default function TerminalUI({ game, setGame, language, onAscension, onChoice, levelRewardAnimation, onRewardDone, activeOverlayNode, centerPanelOverride, onUseItem, onEquipItem }: TerminalUIProps) {
  const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
  
  const [flickers, setFlickers] = useState<string[]>(Array(5).fill('0.9'));
  const [systemClock, setSystemClock] = useState('INIT_CLOCK...');
  
  const [activeTab, setActiveTab] = useState<'SYSTEM_LOG' | 'INVENTORY' | 'VITAL_SIGNS' | 'MATRIX_MAP' | 'BULLETIN' | 'EXPLORE' | 'SECT_HERB_GARDEN' | 'SECT_BUG_ROOM' | 'BEAST_BAG' | 'CITY_AUCTION' | 'DAO_FOUNDATION_MINIGAME'>('SYSTEM_LOG');
  const [meditationDuration, setMeditationDuration] = useState(1);
  const [inventorySubTab, setInventorySubTab] = useState<'ALL' | 'TRANG BỊ' | 'ĐAN DƯỢC' | 'LINH DƯỢC'>('ALL');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [unreadBulletin, setUnreadBulletin] = useState(true);
  
  const mockBulletins = [
    {
      id: 1,
      title: (uiText[language]?.bulletin1Title || '[THÔNG BÁO TỪ HỆ THỐNG] CHUẨN BỊ MỞ CỬA THÁI CỔ THẦN VỰC'),
      date: '2026-06-25 // 00:00',
      content: (uiText[language]?.bulletin1Content || 'Thái...'),
      isNew: true
    },
    {
      id: 2,
      title: (uiText[language]?.bulletin2Title || '[TIN ĐỒN] YÊU THÚ BẠO ĐỘNG TẠI THẬP VẠN ĐẠI SƠN'),
      date: '2026-06-20 // 14:30',
      content: (uiText[language]?.bulletin2Content || 'Gần đây...'),
      isNew: false
    }
  ];

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
    <div className="flex flex-col crt-flicker fixed inset-0 z-40 overflow-hidden text-[#00ff41] bg-black font-['JetBrains_Mono',monospace]">
      <div className="scanline"></div>
      <SectMenuUI game={game} onChoice={onChoice} language={language} />

      {/* Top AppBar */}
      <header className="flex justify-between items-center w-full px-margin py-unit bg-surface border-b border-outline-variant z-10 shrink-0 h-16">
        <div className="flex items-center gap-gutter">
          <span className="font-headline-lg text-headline-lg text-primary-container tracking-tighter">CULTIVATION_OS_V1.0</span>
          <div className="flex gap-4 ml-8 hidden md:flex">
            <span 
              onClick={() => { setActiveTab('SYSTEM_LOG'); setSelectedItem(null); }}
              className={`font-bold font-label-md text-label-md cursor-pointer transition-all ${activeTab === 'SYSTEM_LOG' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary hover:text-on-primary px-2'}`}
            >{t(language, 'systemLogSys', 'SYSTEM_LOG')}</span>
            <span 
              onClick={() => setActiveTab('INVENTORY')}
              className={`font-bold font-label-md text-label-md cursor-pointer transition-all ${activeTab === 'INVENTORY' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary hover:text-on-primary px-2'}`}
            >{t(language, 'inventoryCaps', 'HÀNH_TRANG')}</span>
            <span 
              onClick={() => { setActiveTab('VITAL_SIGNS'); setSelectedItem(null); }}
              className={`font-bold font-label-md text-label-md cursor-pointer transition-all ${activeTab === 'VITAL_SIGNS' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary hover:text-on-primary px-2'}`}
            >{t(language, 'vitalSignsSys', 'VITAL_SIGNS')}</span>
            <span 
              onClick={() => { setActiveTab('MATRIX_MAP'); setSelectedItem(null); }}
              className={`font-bold font-label-md text-label-md cursor-pointer transition-all ${activeTab === 'MATRIX_MAP' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary hover:text-on-primary px-2'}`}
            >{t(language, 'matrixMapSys', 'MATRIX_MAP')}</span>
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
              <div className="absolute bottom-0 left-0 right-0 bg-primary-container text-on-primary py-1 font-label-md text-label-md uppercase tracking-widest">{t(language, 'soulBonded', 'SOUL_BONDED')}</div>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary">[ {(game as any).name || 'USER_001'} ]</h2>
            <div className="flex flex-col gap-1 mt-2 text-left bg-surface-container-high p-unit border border-outline-variant">
              <div className="flex justify-between px-2">
                <span className="text-on-surface-variant text-label-md">{t(language, 'sectLabel', 'SECT:')}</span>
                <span className="text-primary-container text-label-md">{game.sect || 'Rogue'}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-on-surface-variant text-label-md">{t(language, 'realmLabel', 'REALM:')}</span>
                <span className="text-primary-container text-label-md text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-3 p-3 bg-surface-container-high border-l-4 border-secondary text-secondary font-bold translate-x-1 transition-transform cursor-pointer">
              <span className="material-symbols-outlined">analytics</span>
              <span className="font-label-md text-label-md">{t(language, 'statsLabel', 'STATS')}</span>
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
                <span className="text-on-surface-variant">{uiText[language]?.sectContributionLabel || 'KARMA:'}</span>
                <span className="text-primary">+{game.sectContribution || 0}</span>
            </div>
            <div className="flex justify-between px-2 mb-4 text-code-sm">
                <span className="text-on-surface-variant">{uiText[language]?.ageCurrentLabel || 'AGE:'}</span>
                <span className="text-primary">{game.age} / {game.stats.lifespan || 95}</span>
            </div>
            
            {/* Protection Relic Display */}
            {game.protectedByRelicId && (
              <div className="px-2 mb-4 border border-secondary/50 bg-secondary/10 p-2 text-code-sm">
                <div className="text-secondary font-bold mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">shield_moon</span> 
                  ẤN KÝ BẢO HỘ
                </div>
                <div className="text-on-surface">
                  {(game.inventory || []).find(i => i.id === game.protectedByRelicId)?.name || 'Unknown'}
                </div>
              </div>
            )}
            <button className="w-full py-3 border border-primary-container text-primary-container font-bold hover:bg-primary-container hover:text-on-primary transition-all mb-4">
                {uiText[language]?.meditateCtrlBtn || '[ MEDITATE_CTRL ]'}
            </button>
            <div className="flex justify-around text-on-surface-variant">
              <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                <span className="material-symbols-outlined">restart_alt</span>
                <span className="text-code-sm">{uiText[language]?.rebootBtn || 'REBOOT'}</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                <span className="material-symbols-outlined">logout</span>
                <span className="text-code-sm">{uiText[language]?.logoutBtn || 'LOGOUT'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main */}
        <main className="flex-1 bg-background p-margin flex flex-col overflow-hidden relative">
          <div className="flex justify-between items-baseline mb-4 border-b border-outline pb-2">
            <h1 className="font-code-lg text-code-lg text-primary tracking-widest flex items-center">
              <span className="mr-3">{">>>"}</span> 
              {activeTab === 'EXPLORE' ? (uiText[language]?.exploreTitleSys || 'THÁM HIỂM [ BEAST_MOUNTAIN_SYS ]') : activeTab === 'INVENTORY' ? (uiText[language]?.inventoryTitleSys || 'HÀNH TRANG [ INVENTORY_SYS ]') : activeTab === 'BULLETIN' ? (uiText[language]?.bulletinTitle || 'BẢNG TIN [ HEAVENLY_DAO_BULLETIN ]') : activeTab === 'SECT_HERB_GARDEN' ? '[ DƯỢC VIÊN TÔNG MÔN ]' : activeTab === 'SECT_BUG_ROOM' ? '[ TRÙNG THẤT ]' : activeTab === 'BEAST_BAG' ? '[ LINH THÚ ]' : activeTab === 'CITY_AUCTION' ? '[ ĐẤU GIÁ HỘI ]' : activeTab === 'DAO_FOUNDATION_MINIGAME' ? '[ TỤ ĐẠO CƠ ]' : (uiText[language]?.eventLogCaps || "EVENT LOG")} 
              <span className="ml-3 animate-[pulse_0.5s_infinite]">_</span>
            </h1>
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">filter_list</span>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">more_vert</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-low border-t border-outline-variant relative">
            {centerPanelOverride ? (
              centerPanelOverride
            ) : activeTab === 'SECT_HERB_GARDEN' ? (
              <SectHerbGardenUI game={game} setGame={setGame} language={language} onClose={() => setActiveTab('SYSTEM_LOG')} />
            ) : activeTab === 'SECT_BUG_ROOM' ? (
              <SectBugRoomUI game={game} setGame={setGame} onClose={() => setActiveTab('SYSTEM_LOG')} />
            ) : activeTab === 'BEAST_BAG' ? (
              <BeastBagView state={game} onUpdateState={setGame} language={language} />
            ) : activeTab === 'CITY_AUCTION' ? (
              <CityAuctionUI game={game} setGame={setGame} onClose={() => setActiveTab('SYSTEM_LOG')} />
            ) : activeTab === 'DAO_FOUNDATION_MINIGAME' ? (
              <DaoFoundationMinigame 
                game={game} 
                setGame={setGame} 
                months={meditationDuration} 
                onClose={() => setActiveTab('SYSTEM_LOG')} 
                onComplete={(choiceId) => {
                  setActiveTab('SYSTEM_LOG');
                  onChoice(choiceId);
                }}
              />
            ) : activeTab === 'EXPLORE' ? (
              <div className="flex flex-col h-full animate-fade-in">
                <BeastMountainMinigame 
                  language={language}
                  inventory={game.inventory || []}
                  onSuccess={(rewardItem) => {
                    setGame(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        inventory: [...(prev.inventory || []), rewardItem]
                      };
                    });
                  }}
                  onFail={(damage) => {
                    setGame(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        stats: {
                          ...prev.stats,
                          health: Math.max(0, prev.stats.health - damage)
                        }
                      };
                    });
                  }}
                  onCancel={() => { setActiveTab('SYSTEM_LOG'); }}
                  onConsumeItem={(itemToConsume) => {
                    setGame(prev => {
                      if (!prev) return prev;
                      const idx = (prev.inventory || []).findIndex(i => i.id === itemToConsume.id);
                      if (idx !== -1) {
                        const newInv = [...(prev.inventory || [])];
                        newInv.splice(idx, 1);
                        return { ...prev, inventory: newInv };
                      }
                      return prev;
                    });
                  }}
                />
              </div>
            ) : activeTab === 'INVENTORY' ? (
              <div className="flex flex-col h-full animate-fade-in">
                {/* Sub-tabs */}
                <div className="flex gap-4 border-b border-outline-variant pb-2 mb-4 text-code-sm">
                  {['ALL', 'TRANG BỊ', 'ĐAN DƯỢC', 'LINH DƯỢC'].map(tab => {
                    const label = tab === 'TRANG BỊ' ? (uiText[language]?.trangBi || 'TRANG BỊ') :
                                  tab === 'ĐAN DƯỢC' ? (uiText[language]?.danDuoc || 'ĐAN DƯỢC') :
                                  tab === 'LINH DƯỢC' ? (uiText[language]?.linhDuoc || 'LINH DƯỢC') : tab;
                    return (
                      <button 
                        key={tab}
                        onClick={() => setInventorySubTab(tab as any)}
                        className={`hover:text-primary transition-colors ${inventorySubTab === tab ? 'text-primary font-bold border-b border-primary' : 'text-on-surface-variant'}`}
                      >
                        [ {label} ]
                      </button>
                    );
                  })}
                </div>

                {/* Inventory Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-16">
                  {(!game.inventory || game.inventory.length === 0) ? (
                    <div className="text-on-surface-variant italic col-span-full">{uiText[language]?.noItemsFound || 'Không tìm thấy vật phẩm...'}</div>
                  ) : (
                    game.inventory.filter(item => {
                      if (inventorySubTab === 'ALL') return true;
                      if (inventorySubTab === (uiText[language]?.trangBi || 'TRANG BỊ')) return item.category === 'equipment';
                      if (inventorySubTab === (uiText[language]?.danDuoc || 'ĐAN DƯỢC')) return item.type === 'elixir';
                      if (inventorySubTab === (uiText[language]?.linhDuoc || 'LINH DƯỢC')) return item.type === 'secret_medicine' || item.category === 'relic';
                      return true;
                    }).map((item, idx) => {
                      let itemIcon = '📦';
                      if (item.type === 'elixir') itemIcon = '🧪';
                      else if (item.type === 'secret_medicine') itemIcon = '☠️';
                      else if (item.type === 'weapon') itemIcon = '⚔️';
                      else if (item.type === 'armor') itemIcon = '🛡️';
                      else if (item.type === 'relic') itemIcon = '🔮';
                      
                      const isSelected = selectedItem === item;
                      
                      return (
                        <div 
                          key={item.id + idx}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer border p-3 flex flex-col items-center gap-2 transition-all group ${isSelected ? 'border-primary bg-primary/10' : 'border-outline-variant bg-surface hover:border-primary/50'}`}
                        >
                          <div className="text-2xl group-hover:scale-110 transition-transform">{itemIcon}</div>
                          <div className="text-center w-full">
                            <div className={`text-[10px] truncate w-full ${isSelected ? 'text-primary font-bold' : 'text-primary-container'}`}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant">x{item.quantity}</div>
                          </div>
                          {item.category === 'equipment' && item.equipped && (
                            <div className="absolute top-1 right-1 text-[8px] text-primary border border-primary px-1">EQP</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : activeTab === 'BULLETIN' ? (
              <div className="flex flex-col h-full animate-fade-in space-y-4">
                {mockBulletins.map(bulletin => (
                  <div key={bulletin.id} className="border border-outline-variant bg-surface p-4 flex flex-col gap-2 relative group hover:border-primary/50 transition-colors">
                    {bulletin.isNew && (
                      <span className="absolute top-0 right-0 bg-red-500 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest">NEW</span>
                    )}
                    <div className="text-code-sm text-on-surface-variant flex justify-between">
                      <span>[ {uiText[language]?.messageId || 'MESSAGE_ID:'} {bulletin.id.toString().padStart(4, '0')} ]</span>
                      <span>{bulletin.date}</span>
                    </div>
                    <h3 className={`font-headline-sm text-headline-sm uppercase ${bulletin.isNew ? 'text-primary' : 'text-primary-container'}`}>
                      {bulletin.title}
                    </h3>
                    <div className="text-body-md text-on-surface-variant border-t border-outline-variant/30 pt-2 mt-2 leading-relaxed text-justify">
                      {bulletin.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="text-outline text-label-md flex items-center">
                    <span className="mr-4">[ SYSTEM ]</span>
                    <span>{uiText[language]?.systemBroadcast || '[ BROADCAST_SYSTEM ] Event loaded...'}</span>
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
                        onSelect={(id) => {
                          if (id === 'action_town_auction') setActiveTab('CITY_AUCTION');
                          else if (id.startsWith('action_dao_foundation_')) {
                            const months = parseInt(id.split('_').pop() || '1', 10);
                            setMeditationDuration(months);
                            setActiveTab('DAO_FOUNDATION_MINIGAME');
                          }
                          else onChoice(id);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-body-md text-on-surface-variant italic">{uiText[language]?.waitingForEvent || "Waiting for event..."}</div>
                )}
              </>
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
          
          {activeTab === 'INVENTORY' && selectedItem ? (
            <div className="animate-fade-in flex flex-col h-full">
              <h3 className="font-label-md text-label-md text-primary mb-4 flex justify-between border-b border-outline-variant pb-1">
                <span>{uiText[language]?.itemDetailsTitle || '[ THÔNG SỐ VẬT PHẨM ]'}</span>
                <span className="material-symbols-outlined text-sm">info</span>
              </h3>
              
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 border border-primary/30 bg-surface flex items-center justify-center text-5xl shadow-[0_0_15px_rgba(0,255,65,0.1)]">
                  {selectedItem.type === 'elixir' ? '🧪' : selectedItem.type === 'secret_medicine' ? '☠️' : selectedItem.type === 'weapon' ? '⚔️' : selectedItem.type === 'armor' ? '🛡️' : selectedItem.type === 'relic' ? '🔮' : '📦'}
                </div>
                <h4 className="mt-4 font-headline-sm text-headline-sm text-primary-container text-center">{selectedItem.name}</h4>
                <div className="text-code-sm text-primary uppercase border border-primary px-2 mt-1">[ {t(language, 'tierLabel', 'TIER')}: {selectedItem.tier || 'NONE'} ]</div>
              </div>

              <div className="bg-surface-container-highest p-3 terminal-border text-code-sm text-on-surface-variant mb-6 text-justify">
                {">"} {selectedItem.description || "NO DATA AVAILABLE."}
              </div>

              {selectedItem.combatStats && (
                <div className="mb-6 space-y-2 text-code-sm border-t border-outline-variant pt-4">
                  <div className="text-primary font-bold mb-2">++ COMBAT_STATS ++</div>
                  {selectedItem.combatStats.attack && <div className="flex justify-between"><span>ATTACK_PWR:</span><span className="text-primary-container">+{selectedItem.combatStats.attack}</span></div>}
                  {selectedItem.combatStats.defense && <div className="flex justify-between"><span>DEFENSE_PWR:</span><span className="text-primary-container">+{selectedItem.combatStats.defense}</span></div>}
                  {selectedItem.combatStats.speed && <div className="flex justify-between"><span>SPEED_MUL:</span><span className="text-primary-container">+{selectedItem.combatStats.speed}</span></div>}
                  {selectedItem.combatStats.maxHp && <div className="flex justify-between"><span>VIT_CAP:</span><span className="text-primary-container">+{selectedItem.combatStats.maxHp}</span></div>}
                  {selectedItem.combatStats.maxQi && <div className="flex justify-between"><span>QI_CAP:</span><span className="text-primary-container">+{selectedItem.combatStats.maxQi}</span></div>}
                </div>
              )}

              <div className="mt-auto space-y-2">
                {(selectedItem.category === 'consumable') && onUseItem && (
                  <button 
                    onClick={() => onUseItem((game.inventory || []).findIndex(i => i.id === selectedItem.id))}
                    className="w-full text-code-sm py-2 hover:bg-primary hover:text-on-primary transition-colors text-primary border border-primary/50 flex justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">science</span> {t(language, 'execUseBtn', '[ EXEC: USE ]')}
                  </button>
                )}
                {(selectedItem.category === 'equipment' || selectedItem.category === 'relic') && onEquipItem && (
                  <button 
                    onClick={() => {
                      onEquipItem((game.inventory || []).findIndex(i => i.id === selectedItem.id));
                      setSelectedItem({...selectedItem, equipped: !selectedItem.equipped});
                    }}
                    className={`w-full text-code-sm py-2 hover:bg-primary hover:text-on-primary transition-colors flex justify-center gap-2 ${selectedItem.equipped ? 'bg-primary/20 text-primary border-primary' : 'text-primary border-primary/50'}`}
                  >
                    <span className="material-symbols-outlined text-sm">shield</span> [ EXEC: {selectedItem.equipped ? 'UNEQUIP' : 'EQUIP'} ]
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col h-full">
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
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Navigation Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch h-16 bg-surface-container border-t border-primary-container">
        <button 
          className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all"
          onClick={() => { setActiveTab('EXPLORE'); setSelectedItem(null); }}
        >
          <span className="material-symbols-outlined">explore</span>
          <span className="font-code-sm text-code-sm">{uiText[language]?.exploreTabBtn || '[F3] THÁM HIỂM'}</span>
        </button>
        <button 
          className="relative flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all" 
          onClick={() => { setActiveTab('BULLETIN'); setUnreadBulletin(false); setSelectedItem(null); }}
        >
          <span className="material-symbols-outlined">mail</span>
          <span className="font-code-sm text-code-sm">{uiText[language]?.heavenlyDaoBulletinBtn || '[F2] BẢNG TIN THIÊN ĐẠO'}</span>
          {unreadBulletin && (
            <span className="absolute top-2 right-[20%] lg:right-[35%] w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          )}
          {unreadBulletin && (
            <span className="absolute top-2 right-[20%] lg:right-[35%] w-3 h-3 bg-red-500 rounded-full border border-black"></span>
          )}
        </button>
        <button className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="font-code-sm text-code-sm">[F3] {uiText[language]?.inventoryCaps || "INVENTORY"}</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all"
          onClick={() => { setActiveTab('SECT_HERB_GARDEN'); setSelectedItem(null); }}
        >
          <span className="material-symbols-outlined">groups</span>
          <span className="font-code-sm text-code-sm">[F4] {t(language, 'sectCaps', 'SECT')}</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all"
          onClick={() => { setActiveTab('SECT_BUG_ROOM'); setSelectedItem(null); }}
        >
          <span className="material-symbols-outlined">bug_report</span>
          <span className="font-code-sm text-code-sm">[F5] BUG ROOM</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all"
          onClick={() => { setGame(g => g ? { ...g, currentLocation: 'mountain' } : g); }}
        >
          <span className="material-symbols-outlined mb-1">landscape</span>
          <span className="font-code-sm text-code-sm">[F6] Vạn Thú Sơn Mạch</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center p-unit flex-1 transition-all ${activeTab === 'BEAST_BAG' ? 'bg-primary-container text-on-primary-container' : 'text-primary-container hover:bg-primary-container hover:text-on-primary-container'}`}
          onClick={() => { setActiveTab('BEAST_BAG'); setSelectedItem(null); }}
        >
          <span className="material-symbols-outlined mb-1">pets</span>
          <span className="font-code-sm text-code-sm">[F7] LINH THÚ</span>
        </button>
      </footer>
    </div>
  );
}
