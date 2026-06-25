import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SubStageBreakthroughProps {
  oldStageName: string;
  newStageName: string;
  majorRealm: string;
  language: 'vi' | 'en';
  onClose: () => void;
}

export default function SubStageBreakthrough({
  oldStageName,
  newStageName,
  majorRealm,
  language,
  onClose,
}: SubStageBreakthroughProps) {
  const [phase, setPhase] = useState<'charging' | 'success'>('charging');
  const [showFlash, setShowFlash] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; scale: number }>>([]);

  const isVi = language === 'vi';

  // Generate random particles for the charging phase
  useEffect(() => {
    if (phase === 'charging') {
      const p = Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: Math.random() * 80 + 10, // 10% to 90%
        delay: Math.random() * 2, // 0s to 2s
        scale: Math.random() * 0.8 + 0.4,
      }));
      setParticles(p);
    }
  }, [phase]);

  // Transition from charging to success at 2000ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFlash(true);
      setPhase('success');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Turn off flash overlay after it plays
  useEffect(() => {
    if (showFlash) {
      const flashTimer = setTimeout(() => {
        setShowFlash(false);
      }, 500);
      return () => clearTimeout(flashTimer);
    }
  }, [showFlash]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black select-none overflow-hidden">
      {/* ── BACKGROUND MUSIC/AMBIENT GLOW ── */}
      <div className="absolute inset-0 bg-radial-gradient(circle at center, rgba(10, 25, 47, 0.6) 0%, rgba(0, 0, 0, 0.98) 100%) pointer-events-none" />

      {/* ── PHASE 1: CHARGING/BREAKING BOTTLE-NECK ── */}
      {phase === 'charging' && (
        <div className="relative flex flex-col items-center justify-center w-full h-full text-center px-4">
          {/* Shockwaves */}
          <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-500/20 animate-shockwave" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-500/10 animate-shockwave [animation-delay:0.5s]" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-500/5 animate-shockwave [animation-delay:1.0s]" />

          {/* Rotating Bagua disk overlay in center */}
          <div className="relative w-72 h-72 flex items-center justify-center opacity-30 animate-runic-spin">
            <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400 fill-none stroke-current stroke-[0.5]">
              <circle cx="50" cy="50" r="40" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="30" />
              {/* Draw 8 lines for Bagua segments */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                const x2 = 50 + 40 * Math.cos(angle);
                const y2 = 50 + 40 * Math.sin(angle);
                return <line key={i} x1="50" y1="50" x2={x2} y2={y2} strokeOpacity="0.4" />;
              })}
            </svg>
          </div>

          {/* Rising blue embers */}
          <div className="absolute inset-x-0 bottom-0 top-1/3 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute bottom-0 w-3 h-3 rounded-full bg-cyan-400/60 shadow-[0_0_10px_#22d3ee] animate-blue-ember"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  transform: `scale(${p.scale})`,
                }}
              />
            ))}
          </div>

          {/* Texts */}
          <div className="absolute mt-8 space-y-4">
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-widest text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)] animate-breakthrough-shake">
              {isVi ? 'ĐANG PHÁ BÌNH CẢNH...' : 'BREAKING BOTTLE-NECK...'}
            </h2>
            <p className="text-sm md:text-base text-text-secondary font-medium tracking-wide">
              {isVi 
                ? `Đột phá tiến giai lên: ${newStageName}` 
                : `Attempting breakthrough to: ${newStageName}`}
            </p>
            <div className="w-48 h-1.5 mx-auto bg-slate-900 border border-cyan-950/40 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <div className="absolute top-0 bottom-0 left-0 bg-cyan-500 rounded-full w-full origin-left transition-transform duration-2000 ease-out" style={{ animation: 'shimmer 2s infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: SUCCESS DIALOGUE ── */}
      {phase === 'success' && (
        <div className="relative max-w-md w-full mx-4 bg-zinc-950/95 border-2 border-emerald-500 rounded-lg p-6 md:p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(197,160,89,0.35)] animate-scale-bounce overflow-hidden">
          {/* Ancient Frame Corners */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500/60" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500/60" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500/60" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500/60" />

          {/* Runic Rotating Background Ring */}
          <div className="absolute w-[260px] h-[260px] top-6 opacity-10 border-2 border-dashed border-emerald-500 rounded-full animate-runic-spin pointer-events-none" />
          <div className="absolute w-[240px] h-[240px] top-8 opacity-5 border border-dashed border-emerald-500 rounded-full animate-runic-spin-reverse pointer-events-none" />

          {/* Breakthrough Character Avatar (Centerpiece) */}
          <div className="relative w-44 h-64 md:w-48 md:h-72 rounded-sm overflow-hidden border border-emerald-500/40 bg-[#0f0c0a] shadow-lg shadow-black/80 animate-float-character">
            {/* Blue Flames Glow overlay */}
            <div className="absolute inset-0 bg-radial-gradient(circle at bottom, rgba(34, 211, 238, 0.25) 0%, transparent 80%) z-10 pointer-events-none" />
            <Image
              src="/images/substage_breakthrough.jpg"
              alt="Breakthrough Cultivator"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Absolute positioning framing border */}
            <div className="absolute inset-1.5 border border-emerald-500/20 pointer-events-none" />
          </div>

          {/* Success Header */}
          <div className="mt-5 space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl font-extrabold tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(229,193,123,0.6)]">
              {isVi ? 'ĐỘT PHÁ THÀNH CÔNG!' : 'BREAKTHROUGH SUCCESS!'}
            </h2>
            <p className="text-[10px] md:text-xs font-medium text-cyan-400 font-bold">
              {isVi ? 'TIỂU CẢNH GIỚI TIẾN GIAI' : 'SUB-STAGE ADVANCEMENT'}
            </p>
          </div>

          {/* Transition Row (Old Stage -> New Stage) */}
          <div className="mt-4 flex items-center justify-center gap-4 bg-zinc-900/60 px-5 py-2.5 rounded-sm border border-zinc-800/50 min-w-[240px]">
            <span className="text-xs md:text-sm font-semibold text-text-secondary">{oldStageName}</span>
            <span className="text-cyan-400 text-lg">➔</span>
            <span className="text-xs md:text-sm font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{newStageName}</span>
          </div>

          {/* Stat increases list */}
          <div className="mt-5 w-full space-y-1.5 text-xs text-text-secondary">
            <div className="flex justify-between border-b border-[#362e24] pb-1">
              <span>{isVi ? '🩸 Khí Huyết Tối Đa (HP)' : '🩸 Max Health (HP)'}</span>
              <span className="text-emerald-400 font-semibold">+{isVi ? 'Tăng mạnh' : 'Grows Stronger'}</span>
            </div>
            <div className="flex justify-between border-b border-[#362e24] pb-1">
              <span>{isVi ? '⚔️ Lực Công Kích (Attack)' : '⚔️ Attack Power'}</span>
              <span className="text-emerald-400 font-semibold">+{isVi ? 'Gia tăng' : 'Enhanced'}</span>
            </div>
            <div className="flex justify-between border-b border-[#362e24] pb-1">
              <span>{isVi ? '⚡ Tốc Độ Tuần Hoàn (Speed)' : '⚡ Qi Circulation Speed'}</span>
              <span className="text-emerald-400 font-semibold">+{isVi ? 'Củng cố' : 'Strengthened'}</span>
            </div>
            <div className="flex justify-between border-b border-[#362e24] pb-1">
              <span>{isVi ? '🌀 Thần Lực Kinh Mạch' : '🌀 Meridian Qi Control'}</span>
              <span className="text-emerald-400 font-semibold">+{isVi ? 'Khai thông' : 'Activated'}</span>
            </div>
          </div>

          {/* Action confirm button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full py-3 bg-[#10b981] hover:bg-[#34d399] active:bg-[#a07f43] text-black font-bold font-serif text-sm tracking-widest rounded-sm shadow-md shadow-black/40 transition-all duration-300 relative group overflow-hidden cursor-pointer"
          >
            {/* Shimmer sweep animation */}
            <span className="absolute inset-y-0 -left-[100%] w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
            {isVi ? 'THU NHẬN TU VI' : 'CONSOLIDATE CULTIVATION'}
          </button>
        </div>
      )}

      {/* ── WHITE SCREEN FLASH OVERLAY ── */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-[260] pointer-events-none animate-flash" />
      )}
    </div>
  );
}
