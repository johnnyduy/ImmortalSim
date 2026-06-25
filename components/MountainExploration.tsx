'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Lang } from '../types';

interface MountainExplorationProps {
  language: Lang;
  onReturn: () => void;
  onEventResult: (effect: any) => void;
  onCombat: (type: 'beast_herb' | 'npc_ta_tieu') => void;
  onTimePass: (days: number) => void;
  travelCostStones: number;
  travelCostHp: number;
}

type GameObjectType = 'herb' | 'ore' | 'corpse' | 'beast' | 'realm' | 'evil' | 'npc';

interface GameObject {
  id: string;
  type: GameObjectType;
  x: number; 
  y: number; 
  icon: string;
  nameVi: string;
  nameEn: string;
  image?: string;
  scale?: number;
}

const OBJECT_TYPES: Record<GameObjectType, { icon: string; nameVi: string; nameEn: string; image?: string; scale?: number }> = {
  herb: { icon: '🌿', nameVi: 'Linh thảo', nameEn: 'Spirit Herb' },
  ore: { icon: '🪨', nameVi: 'Khoáng thạch', nameEn: 'Spirit Ore' },
  corpse: { icon: '☠️', nameVi: 'Thi thể tu sĩ', nameEn: 'Cultivator Corpse' },
  beast: { icon: '🐺', nameVi: 'Yêu thú', nameEn: 'Demonic Beast', image: '/images/obj_wolf.png', scale: 1.0 },
  realm: { icon: '🌌', nameVi: 'Bí cảnh', nameEn: 'Secret Realm', image: '/images/obj_book.png', scale: 1.0 },
  evil: { icon: '😈', nameVi: 'Tà tu', nameEn: 'Evil Cultivator' },
  npc: { icon: '🧙', nameVi: 'NPC Đặc biệt', nameEn: 'Special NPC' },
};

export default function MountainExploration({
  language,
  onReturn,
  onEventResult,
  onCombat,
  onTimePass,
  travelCostStones,
  travelCostHp,
}: MountainExplorationProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [distance, setDistance] = useState(0);
  const [daysPassed, setDaysPassed] = useState(0);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [activeEvent, setActiveEvent] = useState<GameObject | null>(null);

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const spawnTimerRef = useRef(0);
  const stepTimerRef = useRef(0);

  const SPAWN_INTERVAL = 4000;
  const STEP_INTERVAL = 3000;

  const generateRandomObject = (): GameObject => {
    const keys = Object.keys(OBJECT_TYPES) as GameObjectType[];
    const type = keys[Math.floor(Math.random() * keys.length)];
    const def = OBJECT_TYPES[type];
    return {
      id: Math.random().toString(36).substring(7),
      type,
      x: 110,
      y: 75 + Math.random() * 5,
      icon: def.icon,
      nameVi: def.nameVi,
      nameEn: def.nameEn,
      image: def.image,
      scale: def.scale,
    };
  };

  const update = useCallback((time: number) => {
    if (lastTimeRef.current != null) {
      const deltaTime = time - lastTimeRef.current;

      if (!isPaused) {
        setDistance((prev) => prev + (deltaTime / 1000) * speedMultiplier);

        spawnTimerRef.current += deltaTime * speedMultiplier;
        stepTimerRef.current += deltaTime * speedMultiplier;

        if (stepTimerRef.current >= STEP_INTERVAL) {
          stepTimerRef.current -= STEP_INTERVAL;
          setDaysPassed(prev => prev + 5);
          onTimePass(5);
        }

        if (spawnTimerRef.current >= SPAWN_INTERVAL) {
          spawnTimerRef.current -= SPAWN_INTERVAL;
          setObjects((prev) => [...prev, generateRandomObject()]);
        }

        setObjects((prevObjects) => {
          let updated = prevObjects.map((obj) => ({
            ...obj,
            x: obj.x - 0.015 * deltaTime * speedMultiplier,
          }));

          const centerObjIndex = updated.findIndex((obj) => obj.x > 32 && obj.x < 36);
          if (centerObjIndex !== -1) {
            const centerObj = updated[centerObjIndex];
            setActiveEvent(centerObj);
            setIsPaused(true);
            updated = updated.filter((_, i) => i !== centerObjIndex);
          }

          return updated.filter((obj) => obj.x > -20);
        });
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, [isPaused, speedMultiplier, onTimePass]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  const handleAction = (actionType: 'positive' | 'negative' | 'ignore') => {
    if (!activeEvent) return;

    if (actionType !== 'ignore') {
      if (activeEvent.type === 'beast' || activeEvent.type === 'evil') {
        onCombat(activeEvent.type === 'evil' ? 'npc_ta_tieu' : 'beast_herb');
      } else {
        let reward: any = {};
        if (activeEvent.type === 'herb') reward = { spiritStones: 20 + Math.floor(distance), cultivation: 1.5 };
        if (activeEvent.type === 'ore') reward = { spiritStones: 40 + Math.floor(distance) };
        if (activeEvent.type === 'corpse') reward = { spiritStones: 50, luck: Math.random() > 0.5 ? 1 : -1 };
        if (activeEvent.type === 'realm') reward = { cultivation: 5, luck: 2, daoHeart: 5 };
        if (activeEvent.type === 'npc') reward = { comprehension: 3, daoHeart: 2 };

        onEventResult(reward);
      }
    }

    setActiveEvent(null);
    setIsPaused(false);
  };

  const getEventOptions = () => {
    if (!activeEvent) return null;

    switch (activeEvent.type) {
      case 'herb':
        return [
          { label: language === 'vi' ? 'Hái' : 'Harvest', type: 'positive' },
          { label: language === 'vi' ? 'Bỏ qua' : 'Ignore', type: 'ignore' },
        ];
      case 'ore':
        return [
          { label: language === 'vi' ? 'Đào' : 'Mine', type: 'positive' },
          { label: language === 'vi' ? 'Bỏ qua' : 'Ignore', type: 'ignore' },
        ];
      case 'corpse':
        return [
          { label: language === 'vi' ? 'Khám xét' : 'Examine', type: 'positive' },
          { label: language === 'vi' ? 'Rời đi' : 'Leave', type: 'ignore' },
        ];
      case 'beast':
      case 'evil':
        return [
          { label: language === 'vi' ? 'Chiến đấu' : 'Fight', type: 'positive' },
          { label: language === 'vi' ? 'Trốn chạy' : 'Flee', type: 'ignore' },
        ];
      case 'realm':
        return [
          { label: language === 'vi' ? 'Tiến vào' : 'Enter', type: 'positive' },
          { label: language === 'vi' ? 'Bỏ qua' : 'Ignore', type: 'ignore' },
        ];
      case 'npc':
        return [
          { label: language === 'vi' ? 'Trò chuyện' : 'Talk', type: 'positive' },
          { label: language === 'vi' ? 'Bỏ qua' : 'Ignore', type: 'ignore' },
        ];
      default:
        return [{ label: language === 'vi' ? 'Bỏ qua' : 'Ignore', type: 'ignore' }];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm font-sans p-2 sm:p-6 md:p-12">
      {/* Container maintains 16:10 or 16:9 aspect ratio based on the monolithic image */}
      <div 
        className="relative w-full max-w-[1400px] aspect-[16/10] sm:aspect-[16/9] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(100,150,255,0.2)]"
        style={{
          backgroundImage: 'url("/images/full_layout_bg.jpg")',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Fake Parallax moving stars/dust layer */}
        <div 
          className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen pointer-events-none"
          style={{ transform: `translateX(-${(distance * 5) % 100}px)` }}
        />

        {/* --- MOVING MIST LAYERS --- */}
        {/* Solid dark fog base to obscure the rocky ground with blur */}
        <div className="absolute top-[85%] left-0 right-0 h-[15%] -translate-y-1/2 bg-gradient-to-t from-transparent via-[#101926]/95 to-transparent pointer-events-none z-15 backdrop-blur-[3px] mask-image-gradient" 
             style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 30%, black 70%, transparent 100%)' }} />

        {/* Background Mist (slower, behind character) - Doubled for thickness */}
        <div 
          className="absolute top-[85%] left-0 right-0 h-[20%] -translate-y-1/2 opacity-100 pointer-events-none z-20 contrast-125 brightness-150"
          style={{ 
            backgroundImage: "url('https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/fog1.png'), url('https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/fog1.png')",
            backgroundSize: 'auto 100%, auto 100%',
            backgroundRepeat: 'repeat-x, repeat-x',
            backgroundPosition: `-${(distance * 60) % 2000}px center, -${(distance * 40) % 2000}px center`
          }}
        />
        {/* Foreground Mist (faster, in front of character) - Doubled for thickness */}
        <div 
          className="absolute top-[85%] left-0 right-0 h-[16%] -translate-y-1/2 opacity-100 pointer-events-none z-35 contrast-125 brightness-150 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          style={{ 
            backgroundImage: "url('https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/fog2.png'), url('https://raw.githubusercontent.com/danielstuart14/CSS_FOG_ANIMATION/master/fog2.png')",
            backgroundSize: 'auto 100%, auto 100%',
            backgroundRepeat: 'repeat-x, repeat-x',
            backgroundPosition: `-${(distance * 100) % 2000}px center, -${(distance * 120) % 2000}px center`
          }}
        />

        {/* --- DYNAMIC OVERLAYS FOR LEFT SCROLL --- */}
        {/* Time Overlay */}
        <div className="absolute top-[45%] left-[14.5%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 w-32">
          <span className="text-[#3b2b18] font-serif text-[0.7rem] sm:text-xs md:text-sm lg:text-base font-bold tracking-wide leading-tight text-center drop-shadow-sm">
             {Math.floor(daysPassed / 30)} tháng {daysPassed % 30} ngày
          </span>
        </div>

        {/* Speed Text Overlay */}
        <div className="absolute top-[61.5%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
          <span className="text-[#3b2b18] font-serif text-[0.7rem] sm:text-xs md:text-sm lg:text-base font-bold drop-shadow-sm">
            x{speedMultiplier}
          </span>
        </div>

        {/* Progress Bar Container Overlay */}
        <div className="absolute top-[52.52%] left-[7.13%] w-[14.55%] h-[1.7%] -translate-y-1/2 z-10">
          {/* Track background to cover the old one */}
          <div className="absolute inset-0 bg-[#1f2924] rounded-full shadow-inner overflow-hidden border-[1px] border-[#c2964a]/30">
             {/* Filled portion */}
             <div 
               className="h-full bg-gradient-to-r from-[#2ecc71] to-[#10b981] transition-all duration-300 shadow-[0_0_8px_rgba(46,204,113,0.6)]"
               style={{ width: `${(distance % 100)}%` }}
             />
          </div>
          {/* Moving Gem indicator */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-[#34d399] to-[#047857] border-[2px] border-[#e8d5a8] shadow-[0_0_12px_rgba(16,185,129,1)] transition-all duration-300 z-20"
            style={{ left: `${(distance % 100)}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* --- INVISIBLE BUTTONS OVERLAYS FOR RIGHT SIDE --- */}
        <button
          onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : 1)}
          title="Tốc độ x2"
          className="absolute right-[2.4%] top-[37.2%] -translate-y-1/2 w-[7%] aspect-square rounded-full hover:bg-white/20 active:bg-white/30 transition-colors z-40 outline-none"
        />
        <button
          onClick={() => setIsPaused(!isPaused)}
          disabled={!!activeEvent}
          title="Dừng lại / Tiếp tục"
          className="absolute right-[2.4%] top-[50.7%] -translate-y-1/2 w-[7%] aspect-square rounded-full hover:bg-white/20 active:bg-white/30 transition-colors z-40 outline-none disabled:opacity-50"
        />
        <button
          onClick={onReturn}
          title="Trở về"
          className="absolute right-[2.4%] top-[63.0%] -translate-y-1/2 w-[7%] aspect-square rounded-full hover:bg-white/20 active:bg-white/30 transition-colors z-40 outline-none"
        />


        {/* --- GAME WORLD AREA --- */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Player Icon: Scaled down */}
          <div 
            className="absolute left-[30%] z-30 transition-transform duration-300 ease-in-out pointer-events-auto"
            style={{ 
              top: '80%',
              transform: `translate(-50%, -50%) translateY(${Math.sin(distance * 5) * 6}px)`
            }}
          >
            <img 
              src="/images/char_mount.png" 
              alt="Character"
              className="w-12 sm:w-16 md:w-20 lg:w-24 h-auto drop-shadow-[0_5px_10px_rgba(255,255,255,0.2)] animate-pulse"
              style={{ animationDuration: '3s' }}
            />
          </div>

          {/* Interactive Event Objects */}
          {objects.map((obj) => (
            <div
              key={obj.id}
              className="absolute z-40 transition-transform duration-100 ease-linear pointer-events-auto"
              style={{ 
                left: `${obj.x}%`, 
                top: `${obj.y}%`,
                transform: `translate(-50%, -50%) scale(${obj.x > 28 && obj.x < 36 ? 1.2 : 1})`
              }}
            >
              <div className="relative group cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
                {obj.image ? (
                  <img 
                    src={obj.image} 
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                    style={{ transform: `scale(${obj.scale || 1}) translateY(${Math.sin(distance * 8 + obj.id.charCodeAt(0)) * 3}px)` }}
                  />
                ) : (
                  <>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/60 rounded-[100%] blur-[2px]" />
                    <div className="absolute inset-0 bg-[#34d399] rounded-full blur-xl opacity-40 group-hover:opacity-80 transition-opacity" />
                    <div 
                      className="text-2xl sm:text-3xl md:text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      style={{ transform: `translateY(${Math.sin(distance * 8 + obj.id.charCodeAt(0)) * 3}px)` }}
                    >
                      {obj.icon}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal Overlay */}
      {activeEvent && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-md p-4">
          <div className="bg-gradient-to-b from-[#1c1611] to-[#09090b] border-[4px] border-[#c2964a] p-6 sm:p-8 rounded-xl max-w-sm sm:max-w-md w-full text-center shadow-[0_0_50px_rgba(197,160,89,0.3)] animate-in fade-in zoom-in-95 duration-300">
            {/* Event Icon */}
            <div className="relative inline-block mb-4 sm:mb-6 mt-2">
              {activeEvent.image ? (
                <img src={activeEvent.image} className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-bounce" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[#34d399] rounded-full blur-3xl opacity-30" />
                  <div className="text-[4rem] sm:text-[5rem] relative z-10 animate-bounce">{activeEvent.icon}</div>
                </>
              )}
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-serif text-[#f5e6cd] mb-3 drop-shadow-md italic">
              {language === 'vi' ? activeEvent.nameVi : activeEvent.nameEn}
            </h3>
            
            <p className="text-[#d4af37] mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed px-2 sm:px-4">
              {language === 'vi' 
                ? `Giữa làn sương mù, bạn vô tình chạm trán một ${activeEvent.nameVi.toLowerCase()}! Hãy đưa ra quyết định cẩn thận.`
                : `Through the mist, you encountered a ${activeEvent.nameEn.toLowerCase()}! Make your decision carefully.`}
            </p>
            
            <div className="flex flex-col gap-3 sm:gap-4">
              {getEventOptions()?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(opt.type as any)}
                  className={`py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg tracking-wide transition-all duration-300 border-[3px] ${
                    opt.type === 'positive' 
                      ? 'bg-gradient-to-r from-[#10b981] to-[#047857] text-white border-[#34d399] shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] hover:scale-[1.03]' 
                      : 'bg-[#15110e] text-[#d4af37] border-[#c2964a]/50 hover:bg-[#c2964a]/20 hover:border-[#c2964a]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
