import React, { useState } from 'react';
import { uiText, t } from '../lib/i18n';
import type { Lang, GameState, ActiveHerb, ActiveBuff } from '../types';
import TimingBarGame from './minigames/TimingBarGame';
import WeedFindGame from './minigames/WeedFindGame';
import PipePuzzleGame from './minigames/PipePuzzleGame';
import ArrayPuzzleGame from './minigames/ArrayPuzzleGame';
import CatchDropsGame from './minigames/CatchDropsGame';
import BugCatchGame from './minigames/BugCatchGame';

interface SectHerbGardenUIProps {
  language: Lang;
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

const AVAILABLE_HERBS = [
  { id: 'thanh_tam_lien', name: 'Thanh Tâm Liên', desc: 'Dược hương giúp tâm thần thanh tịnh. Sinh trưởng 12 tháng.', maxAge: 12, buff: { effectType: 'comprehension', effectValue: 5, isDaoRhyme: false, desc: '+5% Ngộ tính', name: 'Thanh Tâm Liên' } },
  { id: 'thien_dao_truc', name: 'Thiên Đạo Trúc', desc: 'Nghe tiếng gió qua lá mà lĩnh ngộ đại đạo. Sinh trưởng 24 tháng.', maxAge: 24, buff: { effectType: 'cultivation_speed', effectValue: 10, isDaoRhyme: false, desc: '+10% Tốc độ lĩnh ngộ', name: 'Thiên Đạo Trúc' } },
  { id: 'cuu_diep_linh_chi', name: 'Cửu Diệp Linh Chi', desc: 'Hút tinh hoa nhật nguyệt. Sinh trưởng 36 tháng.', maxAge: 36, buff: { effectType: 'luck', effectValue: 10, isDaoRhyme: false, desc: '+10% Kỳ ngộ', name: 'Cửu Diệp Linh Chi' } },
];

export default function SectHerbGardenUI({ language, game, setGame, onClose }: SectHerbGardenUIProps) {
  const herb = game.activeHerb;
  const [activeMiniGame, setActiveMiniGame] = useState<'qi' | 'weed' | 'water' | 'array' | 'moon' | 'bug' | null>(null);
  
  const handleAssignHerb = (herbData: typeof AVAILABLE_HERBS[0]) => {
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeHerb: {
          id: herbData.id,
          name: herbData.name,
          description: herbData.desc,
          ageMonths: 0,
          careQuality: 50, // Khởi điểm 50
          bondLevel: 0,
          activeEvent: null,
          currentNeed: null,
          personality: 'thích_tĩnh_lặng'
        }
      };
    });
  };

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleAction = (actionType: string) => {
    if (!herb) return;
    
    setPendingAction(actionType);
    if (actionType === 'qi') setActiveMiniGame('qi');
    else if (actionType === 'weed') setActiveMiniGame('weed');
    else if (actionType === 'water') setActiveMiniGame('water');
    else if (actionType === 'array') setActiveMiniGame('array');
    else if (actionType === 'moon') setActiveMiniGame('moon');
    else {
      if (actionType === herb.currentNeed) {
        applyMiniGameResult('perfect', actionType);
      } else {
        applyMiniGameResult('fail', actionType); // Penalty for wrong action
      }
    }
  };

  const applyMiniGameResult = (score: 'perfect' | 'good' | 'fail', data?: any) => {
    setActiveMiniGame(null);
    if (!herb) return;
    
    // Determine actionType from data if it's a string, or caughtBug if it's an object
    let actionType = typeof data === 'string' ? data : undefined;
    let caughtBug = typeof data === 'object' ? data : undefined;

    const action = actionType || pendingAction;
    
    setGame(prev => {
      if (!prev || !prev.activeHerb) return prev;
      
      const isCorrectNeed = action === prev.activeHerb.currentNeed;
      let boost = 0;
      
      if (isCorrectNeed) {
        if (score === 'perfect') boost = 15;
        if (score === 'good') boost = 5;
        if (score === 'fail') boost = -10;
      } else {
        // Wrong action type but played minigame anyway
        if (score === 'perfect') boost = 2; // small reward
        if (score === 'good') boost = 0;
        if (score === 'fail') boost = -5; // small penalty
      }
      
      // Add caught bug if any
      let nextBugs = prev.bugs || [];
      let nextCollection = prev.bugCollection || {};
      if (caughtBug) {
        nextBugs = [...nextBugs, caughtBug];
        nextCollection = { ...nextCollection, [caughtBug.speciesId]: true };
      }
      
      return {
        ...prev,
        bugs: nextBugs,
        bugCollection: nextCollection,
        activeHerb: {
          ...prev.activeHerb,
          currentNeed: isCorrectNeed && score !== 'fail' ? null : prev.activeHerb.currentNeed, // Only clear need if they did the right action
          careQuality: Math.min(100, Math.max(0, prev.activeHerb.careQuality + boost))
        }
      };
    });
    setPendingAction(null);
  };

  const handleHarvest = () => {
    if (!herb) return;
    
    const template = AVAILABLE_HERBS.find(h => h.id === herb.id);
    if (!template) return;
    
    let duration = 0;
    if (herb.careQuality >= 90) duration = 3; // 90 days = 3 months
    else if (herb.careQuality >= 60) duration = 2; // 60 days
    else if (herb.careQuality >= 30) duration = 1; // 30 days
    
    if (duration === 0) {
      // Héo úa -> Không có phúc lợi
      setGame(prev => prev ? { ...prev, activeHerb: null } : prev);
      return;
    }

    const newBuff: ActiveBuff = {
      id: `buff_${herb.id}_${Date.now()}`,
      name: template.buff.name,
      description: template.buff.desc,
      durationMonths: duration,
      effectType: template.buff.effectType as any,
      effectValue: template.buff.effectValue,
      isDaoRhyme: template.buff.isDaoRhyme
    };

    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeHerb: null,
        activeBuffs: [...(prev.activeBuffs || []), newBuff]
      };
    });
  };

  if (!herb) {
    return (
      <div className="flex flex-col h-full animate-fade-in p-4 relative">
        <h2 className="text-xl font-bold text-primary mb-4">[ DƯỢC VIÊN TÔNG MÔN ]</h2>
        <p className="mb-4 text-on-surface-variant">Bạn chưa nhận chăm sóc linh dược nào. Hãy chọn một loại để bắt đầu:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_HERBS.map(h => (
            <div key={h.id} className="border border-outline-variant p-4 hover:border-primary transition-colors cursor-pointer group bg-surface-container-low" onClick={() => handleAssignHerb(h)}>
              <h3 className="text-primary font-bold group-hover:text-primary-container">{h.name}</h3>
              <p className="text-sm opacity-80 mt-2 text-on-surface-variant">{h.desc}</p>
              <p className="text-xs text-secondary mt-2 border-t border-outline-variant pt-2">Phúc duyên: {h.buff.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const template = AVAILABLE_HERBS.find(h => h.id === herb.id);
  const maxAge = template?.maxAge || 12;
  const isReady = herb.ageMonths >= maxAge;

  const renderPlantAscii = () => {
    if (herb.ageMonths < maxAge * 0.3) return `
      \\|/
       |
      -+-
    `;
    if (herb.ageMonths < maxAge * 0.7) return `
     \\_|_/
     / | \\
       |
      -+-
    `;
    return `
     .***.
    .*\\|/*.
     / | \\
       |
     --+--
    `;
  };

  return (
    <div className="flex flex-col h-full animate-fade-in p-4 relative">
      {activeMiniGame === 'qi' && <TimingBarGame onComplete={applyMiniGameResult} onCancel={() => setActiveMiniGame(null)} />}
      {activeMiniGame === 'weed' && <WeedFindGame onComplete={applyMiniGameResult} onCancel={() => setActiveMiniGame(null)} />}
      {activeMiniGame === 'water' && <PipePuzzleGame onComplete={applyMiniGameResult} onCancel={() => setActiveMiniGame(null)} />}
      {activeMiniGame === 'array' && <ArrayPuzzleGame onComplete={applyMiniGameResult} onCancel={() => setActiveMiniGame(null)} />}
      {activeMiniGame === 'moon' && <CatchDropsGame onComplete={applyMiniGameResult} onCancel={() => setActiveMiniGame(null)} />}
      {activeMiniGame === 'bug' && <BugCatchGame onComplete={applyMiniGameResult} onCancel={() => setActiveMiniGame(null)} />}
      <h2 className="text-xl font-bold text-primary mb-4">[ DƯỢC VIÊN TÔNG MÔN ]</h2>
      
      <div className="flex-1 flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center border border-outline-variant p-4 bg-black relative">
          <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
          <pre className="text-emerald-400 font-mono text-xl animate-pulse">
            {renderPlantAscii()}
          </pre>
          <div className="mt-8 text-center">
            <h3 className="font-bold text-lg text-primary-container">{herb.name}</h3>
            <p className="text-sm">Tuổi: {herb.ageMonths} / {maxAge} tháng</p>
            {herb.currentNeed && (
              <div className="mt-4 p-2 bg-error/20 border border-error text-error text-sm font-bold animate-pulse">
                KHẨN CẤP: {herb.currentNeed === 'water' ? '💧 Cần Tưới Linh Tuyền' : herb.currentNeed === 'weed' ? '🌿 Cần Nhổ Linh Tạp' : herb.currentNeed === 'array' ? '☀️ Cần Chỉnh Tụ Linh Trận' : herb.currentNeed === 'bug' ? '🪲 Cần Bắt Linh Trùng' : herb.currentNeed === 'moon' ? '🌙 Cần Hấp Thu Nguyệt Hoa' : '✨ Cần Truyền Linh Lực'}
              </div>
            )}
            <div className="w-full bg-outline-variant h-2 mt-4">
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(herb.careQuality / 100) * 100}%` }} />
            </div>
            <p className="text-xs mt-1">Chất lượng: {herb.careQuality}%</p>
          </div>
        </div>

        <div className="w-full md:w-64 flex flex-col gap-2">
          <h3 className="font-bold border-b border-outline-variant pb-2 mb-2 text-on-surface-variant">HÀNH ĐỘNG HẰNG NGÀY</h3>
          <button onClick={() => handleAction('water')} disabled={isReady} className="p-3 border border-outline-variant text-left hover:bg-primary/20 hover:border-primary disabled:opacity-50 text-sm">💧 Tưới Linh Tuyền</button>
          <button onClick={() => handleAction('weed')} disabled={isReady} className="p-3 border border-outline-variant text-left hover:bg-primary/20 hover:border-primary disabled:opacity-50 text-sm">🌿 Nhổ Linh Tạp</button>
          <button onClick={() => handleAction('array')} disabled={isReady} className="p-3 border border-outline-variant text-left hover:bg-primary/20 hover:border-primary disabled:opacity-50 text-sm">☀️ Chỉnh Tụ Linh Trận</button>
          <button onClick={() => handleAction('bug')} disabled={isReady} className="p-3 border border-outline-variant text-left hover:bg-primary/20 hover:border-primary disabled:opacity-50 text-sm">🪲 Bắt Linh Trùng</button>
          <button onClick={() => handleAction('moon')} disabled={isReady} className="p-3 border border-outline-variant text-left hover:bg-primary/20 hover:border-primary disabled:opacity-50 text-sm">🌙 Hấp thu Nguyệt Hoa</button>
          <button onClick={() => handleAction('qi')} disabled={isReady} className="p-3 border border-outline-variant text-left hover:bg-primary/20 hover:border-primary disabled:opacity-50 text-sm">✨ Truyền một tia linh lực</button>

          {isReady && (
            <button onClick={handleHarvest} className="mt-auto p-4 border border-secondary bg-secondary/10 text-secondary font-bold hover:bg-secondary hover:text-black transition-colors animate-pulse text-center">
              [ BÀN GIAO & NHẬN PHÚC DUYÊN ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
