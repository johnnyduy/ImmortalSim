import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface MajorBreakthroughProps {
  oldStageName: string;
  newStageName: string;
  majorRealm: string;
  language: 'vi' | 'en';
  onClose: () => void;
}

export default function MajorBreakthrough({
  oldStageName,
  newStageName,
  majorRealm,
  language,
  onClose,
}: MajorBreakthroughProps) {
  const [phase, setPhase] = useState<'charging' | 'success'>('charging');
  const [progress, setProgress] = useState(0);
  const isVi = language === 'vi';

  // Terminal Theme configuration based on the major realm
  const themeMap: Record<string, any> = {
    'Qi Refinement': {
      colorClass: 'text-cyan-400',
      borderColor: 'border-cyan-500',
      bgColor: 'bg-cyan-500/10',
      glowShadow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      image: '/images/events/mountain_meditation.png',
      quoteVi: 'Khí nạp bách xuyên, rũ bỏ phàm trần. Tiên đạo miễu mang, từ đây cất bước!',
      quoteEn: 'Drawing Qi from all rivers, shedding the mortal coil. The immortal path is vast, from here I step forth!',
      statHP: '+80%',
      statAtk: '+100%',
      statQi: '+150%',
      lifeSpan: '+20 Năm',
    },
    'Foundation Establishment': {
      colorClass: 'text-emerald-400',
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-500/10',
      glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      image: '/images/events/waking_dawn.png',
      quoteVi: 'Linh khí ngưng tụ thành Tuyền, đúc thành Trúc Cơ Tiên Đài. Thọ nguyên tăng mạnh, đứng đầu chúng sinh!',
      quoteEn: 'Spiritual Qi condenses into a Spring, forging the Foundation Dao Terrace. Lifespan surges, standing above all beings!',
      statHP: '+150%',
      statAtk: '+180%',
      statQi: '+200%',
      lifeSpan: '+50 Năm',
    },
    'Golden Core': {
      colorClass: 'text-yellow-400',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-500/10',
      glowShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
      image: '/images/events/golden_core_trial.png',
      quoteVi: 'Nhất lạp Kim Đan nuốt vào bụng, từ nay mạng ta do ta không do trời!',
      quoteEn: 'A single Golden Core swallowed into the belly, from now on my fate is mine, not Heaven\'s!',
      statHP: '+300%',
      statAtk: '+350%',
      statQi: '+400%',
      lifeSpan: '+200 Năm',
    },
    'Nascent Soul': {
      colorClass: 'text-purple-400',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-500/10',
      glowShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      image: '/images/events/ancestral_memory.png',
      quoteVi: 'Phá Đan hóa Anh, ngưng tụ pháp thân. Nhục thể suy biến, Nguyên Anh bất diệt!',
      quoteEn: 'Shattering the Core to form the Soul, condensing the dharma body. Even if the flesh decays, the Nascent Soul is eternal!',
      statHP: '+500%',
      statAtk: '+600%',
      statQi: '+800%',
      lifeSpan: '+500 Năm',
    },
  };

  const currentTheme = themeMap[majorRealm] || themeMap['Golden Core'];

  useEffect(() => {
    if (phase === 'charging') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setPhase('success');
            return 100;
          }
          return p + Math.floor(Math.random() * 15) + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className={`relative w-full h-full min-h-[500px] flex flex-col justify-center font-mono select-none ${currentTheme.colorClass} p-4`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crt-flicker-heavy {
          0% { opacity: 0.8; }
          5% { opacity: 0.95; }
          10% { opacity: 0.8; }
          15% { opacity: 1; }
          50% { opacity: 0.9; }
          100% { opacity: 1; }
        }
      `}} />
      
      {/* PHASE 1: CHARGING */}
      {phase === 'charging' && (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto border border-dashed border-current p-8 bg-black/50 backdrop-blur-sm animate-[crt-flicker-heavy_0.1s_infinite]">
          <h2 className="text-2xl font-bold tracking-widest mb-6 animate-pulse">
            [ {isVi ? 'ĐANG TIẾN GIAI' : 'ASCENSION IN PROGRESS'} ]
          </h2>
          <div className="text-xs opacity-70 mb-2 w-full flex justify-between">
            <span>TARGET: {newStageName}</span>
            <span>OVERRIDE: {progress}%</span>
          </div>
          <div className="w-full h-6 border border-current p-1 bg-black">
            <div 
              className="h-full bg-current transition-all duration-200"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="mt-6 text-xs opacity-50 font-mono-data">
            {'>'} Recompiling spiritual root...<br/>
            {'>'} Expanding dantian capacity...<br/>
            {'>'} Merging mortal coil with dao laws...
          </div>
        </div>
      )}

      {/* PHASE 2: SUCCESS */}
      {phase === 'success' && (
        <div className={`flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto border border-current ${currentTheme.bgColor} ${currentTheme.glowShadow} p-6 animate-fade-in`}>
          
          {/* Left: ASCII / Image Frame */}
          <div className="w-full md:w-1/3 flex flex-col">
            <div className="border border-current p-1 relative group">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-current" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-current" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-current" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-current" />
              
              <div className="relative aspect-[3/4] w-full overflow-hidden grayscale contrast-125 sepia-[.3] hue-rotate-[180deg] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-1000">
                <Image
                  src={currentTheme.image}
                  alt={majorRealm}
                  fill
                  className="object-cover opacity-80 mix-blend-screen"
                />
                <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />
              </div>
            </div>
            
            <div className="mt-4 text-[10px] tracking-widest text-center uppercase opacity-60 border-y border-dashed border-current py-1">
              [ ASCENSION_IMG_REF_0x{Math.floor(Math.random()*10000)} ]
            </div>
            {/* The vertical text from original UI, adapted to terminal */}
            <div className="hidden md:flex flex-col text-xl font-bold tracking-[0.5em] mt-4 opacity-30 text-center uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '150px', alignSelf: 'center' }}>
              REFINEMENT
            </div>
          </div>

          {/* Right: Data Report */}
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="text-xs tracking-widest opacity-70 mb-1 uppercase">
                {isVi ? 'Tiến giai đại cảnh giới' : 'Major Realm Ascension'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest mb-6 drop-shadow-[0_0_10px_currentColor]">
                {isVi ? 'Đột Phá Thành Công!' : 'Ascension Successful!'}
              </h2>

              {/* Status Change Box */}
              <div className="border border-current p-4 flex items-center justify-between mb-6 bg-black/40">
                <span className="opacity-60">{oldStageName}</span>
                <span className="font-bold text-xl animate-pulse"> {'>'} </span>
                <span className="font-bold text-lg drop-shadow-[0_0_5px_currentColor]">{newStageName}</span>
              </div>

              {/* Quote */}
              <div className="border-l-4 border-current pl-4 mb-6 italic opacity-80 text-sm">
                "{isVi ? currentTheme.quoteVi : currentTheme.quoteEn}"
              </div>

              {/* Stats Table */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-8 border border-dashed border-current p-4 bg-black/20">
                <div>
                  <div className="opacity-60 mb-1">🩸 {isVi ? 'Khí Huyết (HP)' : 'Health (HP)'}</div>
                  <div className="font-bold text-lg">{currentTheme.statHP}</div>
                </div>
                <div>
                  <div className="opacity-60 mb-1">⚔️ {isVi ? 'Công Kích (ATK)' : 'Attack (ATK)'}</div>
                  <div className="font-bold text-lg">{currentTheme.statAtk}</div>
                </div>
                <div className="col-span-2 border-t border-dashed border-current/30 my-1" />
                <div>
                  <div className="opacity-60 mb-1">⚡ {isVi ? 'Linh Lực (Max Qi)' : 'Max Qi'}</div>
                  <div className="font-bold text-lg">{currentTheme.statQi}</div>
                </div>
                <div>
                  <div className="opacity-60 mb-1">❤️ {isVi ? 'Thọ Nguyên' : 'Lifespan'}</div>
                  <div className="font-bold text-lg">{currentTheme.lifeSpan}</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className={`w-full py-4 text-center font-bold tracking-widest uppercase border border-current hover:bg-current hover:text-black transition-colors shadow-[0_0_15px_currentColor]`}
            >
              [ {isVi ? 'Củng cố cảnh giới' : 'Consolidate Realm'} ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
