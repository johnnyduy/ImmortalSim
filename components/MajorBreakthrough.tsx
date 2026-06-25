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
  const [showFlash, setShowFlash] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; scale: number }>>([]);
  const isVi = language === 'vi';

  // Theme configuration based on the major realm
  const themeMap: Record<string, any> = {
    'Qi Refinement': {
      colorClass: 'text-cyan-400',
      borderColor: 'border-cyan-500',
      glowShadow: 'shadow-[0_0_40px_rgba(34,211,238,0.4)]',
      gradient: 'from-cyan-900/40 via-[#0a192f]/80 to-black',
      image: '/images/events/mountain_meditation.png',
      quoteVi: '"Khí nạp bách xuyên, rũ bỏ phàm trần. Tiên đạo miễu mang, từ đây cất bước!"',
      quoteEn: '"Drawing Qi from all rivers, shedding the mortal coil. The immortal path is vast, from here I step forth!"',
      statHP: '+80%',
      statAtk: '+100%',
      statQi: '+150%',
      lifeSpan: '+20 Năm',
    },
    'Foundation Establishment': {
      colorClass: 'text-emerald-400',
      borderColor: 'border-emerald-500',
      glowShadow: 'shadow-[0_0_50px_rgba(197,160,89,0.45)]',
      gradient: 'from-[#2e2311]/60 via-[#1a140b]/90 to-black',
      image: '/images/events/waking_dawn.png',
      quoteVi: '"Linh khí ngưng tụ thành Tuyền, đúc thành Trúc Cơ Tiên Đài. Thọ nguyên tăng mạnh, đứng đầu chúng sinh!"',
      quoteEn: '"Spiritual Qi condenses into a Spring, forging the Foundation Dao Terrace. Lifespan surges, standing above all beings!"',
      statHP: '+150%',
      statAtk: '+180%',
      statQi: '+200%',
      lifeSpan: '+50 Năm',
    },
    'Golden Core': {
      colorClass: 'text-yellow-400',
      borderColor: 'border-yellow-500',
      glowShadow: 'shadow-[0_0_60px_rgba(250,204,21,0.5)]',
      gradient: 'from-[#422c00]/70 via-[#1c1200]/90 to-black',
      image: '/images/events/golden_core_trial.png',
      quoteVi: '"Nhất lạp Kim Đan nuốt vào bụng, từ nay mạng ta do ta không do trời!"',
      quoteEn: '"A single Golden Core swallowed into the belly, from now on my fate is mine, not Heaven\'s!"',
      statHP: '+300%',
      statAtk: '+350%',
      statQi: '+400%',
      lifeSpan: '+200 Năm',
    },
    'Nascent Soul': {
      colorClass: 'text-purple-400',
      borderColor: 'border-purple-500',
      glowShadow: 'shadow-[0_0_60px_rgba(168,85,247,0.5)]',
      gradient: 'from-[#2c1442]/70 via-[#12051f]/90 to-black',
      image: '/images/events/ancestral_memory.png',
      quoteVi: '"Phá Đan hóa Anh, ngưng tụ pháp thân. Nhục thể suy biến, Nguyên Anh bất diệt!"',
      quoteEn: '"Shattering the Core to form the Soul, condensing the dharma body. Even if the flesh decays, the Nascent Soul is eternal!"',
      statHP: '+500%',
      statAtk: '+600%',
      statQi: '+800%',
      lifeSpan: '+500 Năm',
    },
  };

  const currentTheme = themeMap[majorRealm] || themeMap['Golden Core'];

  // Generate particles
  useEffect(() => {
    if (phase === 'charging') {
      const p = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        scale: Math.random() * 1.5 + 0.5,
      }));
      setParticles(p);
    }
  }, [phase]);

  // Charging -> Success
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFlash(true);
      setPhase('success');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Turn off flash overlay after it plays
  useEffect(() => {
    if (showFlash) {
      const flashTimer = setTimeout(() => {
        setShowFlash(false);
      }, 800);
      return () => clearTimeout(flashTimer);
    }
  }, [showFlash]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black select-none overflow-hidden font-serif">
      {/* ── AMBIENT BACKGROUND ── */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.gradient} opacity-80 pointer-events-none`} />

      {/* ── PHASE 1: HEAVENLY TRIBULATION / CONDENSING ── */}
      {phase === 'charging' && (
        <div className="relative flex flex-col items-center justify-center w-full h-full text-center px-4">
          {/* Intense Shockwaves */}
          <div className={`absolute w-[300px] h-[300px] rounded-full border ${currentTheme.borderColor} opacity-30 animate-shockwave`} />
          <div className={`absolute w-[300px] h-[300px] rounded-full border ${currentTheme.borderColor} opacity-20 animate-shockwave [animation-delay:0.4s]`} />
          <div className={`absolute w-[300px] h-[300px] rounded-full border ${currentTheme.borderColor} opacity-10 animate-shockwave [animation-delay:0.8s]`} />
          
          {/* Screen Shake container for the center element */}
          <div className="animate-breakthrough-shake">
            <div className={`w-40 h-40 rounded-full border-4 border-dashed ${currentTheme.borderColor} animate-runic-spin-reverse`} />
            <div className={`absolute top-0 left-0 w-40 h-40 rounded-full border-2 border-dotted ${currentTheme.borderColor} animate-runic-spin`} />
          </div>

          {/* Epic particles rushing up */}
          <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <div
                key={p.id}
                className={`absolute bottom-[-10%] w-2 h-8 rounded-full ${currentTheme.borderColor} border-l-[1px] opacity-60 animate-blue-ember`}
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  transform: `scale(${p.scale})`,
                  background: 'linear-gradient(to top, transparent, currentColor)',
                }}
              />
            ))}
          </div>

          {/* Texts */}
          <div className="absolute bottom-1/4 space-y-6">
            <h2 className={`text-4xl md:text-6xl font-extrabold tracking-widest ${currentTheme.colorClass} drop-shadow-[0_0_20px_currentColor] animate-pulse`}>
              {isVi ? 'ĐANG ĐỘT PHÁ ĐẠI CẢNH GIỚI...' : 'ASCENDING TO MAJOR REALM...'}
            </h2>
            <p className="text-lg md:text-2xl text-white font-medium tracking-widest">
              {isVi 
                ? `Ngưng tụ tu vi tiến lên: ${newStageName.toUpperCase()}` 
                : `Condensing cultivation towards: ${newStageName.toUpperCase()}`}
            </p>
            {/* Energy Bar */}
            <div className={`w-64 h-2 mx-auto bg-black/50 border ${currentTheme.borderColor} rounded-full overflow-hidden relative shadow-[0_0_15px_currentColor]`}>
              <div className={`absolute top-0 bottom-0 left-0 bg-white w-full origin-left transition-transform duration-2000 ease-out`} style={{ animation: 'shimmer 2.5s infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: EPIC SUCCESS DIALOGUE ── */}
      {phase === 'success' && (
        <div className={`relative max-w-4xl w-full mx-4 bg-[#0a0806]/95 border-2 ${currentTheme.borderColor} rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_60px_rgba(0,0,0,0.8)] ${currentTheme.glowShadow} animate-scale-bounce overflow-hidden`}>
          
          {/* Decorative Corners */}
          <div className={`absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 ${currentTheme.borderColor} opacity-80`} />
          <div className={`absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 ${currentTheme.borderColor} opacity-80`} />
          <div className={`absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 ${currentTheme.borderColor} opacity-80`} />
          <div className={`absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 ${currentTheme.borderColor} opacity-80`} />

          {/* Left Column: Artwork & Cultivator Persona */}
          <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center p-4">
            <div className={`relative w-56 h-80 md:w-72 md:h-96 rounded-sm overflow-hidden border-2 ${currentTheme.borderColor} bg-black shadow-2xl animate-float-character`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />
              <Image
                src={currentTheme.image}
                alt="Breakthrough Cultivator"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
            
            {/* Vertical text banner (like Chinese calligraphy couplets) - Requires writing-mode support in CSS */}
            <div 
              className={`absolute -left-4 top-1/2 -translate-y-1/2 text-3xl font-black tracking-[0.5em] ${currentTheme.colorClass} drop-shadow-[0_0_10px_currentColor] hidden md:block uppercase`}
              style={{ writingMode: 'vertical-rl' }}
            >
              {majorRealm}
            </div>
          </div>

          {/* Right Column: Information & Stats */}
          <div className="relative w-full md:w-1/2 flex flex-col items-center md:items-start p-4 text-center md:text-left space-y-6">
            
            {/* Header */}
            <div>
              <p className={`text-sm font-medium font-bold ${currentTheme.colorClass} mb-1`}>
                {isVi ? 'TIẾN GIAI ĐẠI CẢNH GIỚI' : 'MAJOR REALM ASCENSION'}
              </p>
              <h2 className={`text-4xl md:text-5xl font-black tracking-wider ${currentTheme.colorClass} drop-shadow-[0_0_15px_currentColor]`}>
                {isVi ? 'ĐỘT PHÁ THÀNH CÔNG!' : 'BREAKTHROUGH SUCCESS!'}
              </h2>
            </div>

            {/* Stages Transition */}
            <div className={`flex items-center gap-4 bg-black/40 px-6 py-3 rounded-md border border-white/10 w-full justify-center md:justify-start`}>
              <span className="text-lg font-semibold text-gray-400">{oldStageName}</span>
              <span className={`text-2xl ${currentTheme.colorClass}`}>➔</span>
              <span className={`text-xl font-bold ${currentTheme.colorClass} drop-shadow-[0_0_10px_currentColor]`}>{newStageName}</span>
            </div>

            {/* Poetic Lore Quote */}
            <div className="w-full border-l-4 border-white/20 pl-4 py-1 italic text-gray-300 text-sm md:text-base opacity-90">
              {isVi ? currentTheme.quoteVi : currentTheme.quoteEn}
            </div>

            {/* Huge Stat Gains Panel */}
            <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:text-base mt-2 bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex flex-col border-b border-white/10 pb-2">
                <span className="text-gray-400">{isVi ? '🩸 Khí Huyết (HP)' : '🩸 Vitality (HP)'}</span>
                <span className="text-emerald-400 font-black text-lg">{currentTheme.statHP}</span>
              </div>
              <div className="flex flex-col border-b border-white/10 pb-2">
                <span className="text-gray-400">{isVi ? '⚔️ Công Kích (ATK)' : '⚔️ Attack Power'}</span>
                <span className="text-emerald-400 font-black text-lg">{currentTheme.statAtk}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">{isVi ? '⚡ Linh Lực (Max Qi)' : '⚡ Spiritual Qi'}</span>
                <span className="text-emerald-400 font-black text-lg">{currentTheme.statQi}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400">{isVi ? '❤️ Thọ Nguyên' : '❤️ Lifespan'}</span>
                <span className="text-emerald-400 font-black text-lg">{currentTheme.lifeSpan}</span>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={onClose}
              className={`mt-4 w-full py-4 bg-black/50 hover:bg-black/80 text-white font-black text-lg tracking-widest rounded-lg border-2 ${currentTheme.borderColor} shadow-[0_0_20px_currentColor] transition-all duration-300 relative group overflow-hidden cursor-pointer`}
            >
              {/* Shimmer sweep animation */}
              <span className="absolute inset-y-0 -left-[100%] w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
              {isVi ? 'CỦNG CỐ CẢNH GIỚI' : 'CONSOLIDATE REALM'}
            </button>

          </div>
        </div>
      )}

      {/* ── WHITE SCREEN FLASH OVERLAY ── */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-[400] pointer-events-none animate-flash" />
      )}
    </div>
  );
}
