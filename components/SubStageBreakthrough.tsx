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
  const [progress, setProgress] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const isVi = language === 'vi';

  // Charging progress
  useEffect(() => {
    if (phase === 'charging') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setPhase('success');
            return 100;
          }
          return p + Math.floor(Math.random() * 20) + 10;
        });
        
        // Random glitch effect during charging
        if (Math.random() > 0.7) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 150);
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className={`relative w-full h-full min-h-[500px] flex flex-col justify-center font-mono select-none text-emerald-400 p-4 transition-transform duration-75 ${glitch ? 'translate-x-1 -translate-y-1' : ''}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crt-flicker-medium {
          0% { opacity: 0.85; }
          5% { opacity: 0.95; }
          10% { opacity: 0.85; }
          15% { opacity: 1; }
          50% { opacity: 0.9; }
          100% { opacity: 1; }
        }
      `}} />
      
      {/* ── BACKGROUND SCANLINES ── */}
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

      {/* ── PHASE 1: CHARGING/BREAKING BOTTLE-NECK ── */}
      {phase === 'charging' && (
        <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto border border-dashed border-emerald-500 p-8 bg-black/60 backdrop-blur-sm animate-[crt-flicker-medium_0.1s_infinite] shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <h2 className="text-xl font-bold tracking-widest mb-6 animate-pulse uppercase">
            [ {isVi ? 'ĐANG PHÁ BÌNH CẢNH' : 'BREAKING BOTTLE-NECK'} ]
          </h2>
          
          <div className="text-xs opacity-70 mb-2 w-full flex justify-between">
            <span>TARGET: {newStageName}</span>
            <span>OVERRIDE: {progress}%</span>
          </div>
          
          <div className="w-full h-4 border border-emerald-500 p-[2px] bg-black">
            <div 
              className="h-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          <div className="mt-6 text-xs opacity-50 font-mono-data w-full text-left">
            {'>'} Injecting Qi into meridians...<br/>
            {'>'} Breaking bottleneck...
          </div>
        </div>
      )}

      {/* ── PHASE 2: SUCCESS DIALOGUE ── */}
      {phase === 'success' && (
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl mx-auto border border-emerald-500 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.2)] p-6 animate-fade-in relative">
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />

          {/* Left: Image Box */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
            <div className="w-full aspect-[3/4] relative border border-emerald-500/50 p-1 bg-black group">
              <div className="relative w-full h-full overflow-hidden grayscale contrast-125 sepia-[.3] hue-rotate-[130deg] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700">
                <Image
                  src="/images/substage_breakthrough.jpg"
                  alt="Breakthrough"
                  fill
                  className="object-cover opacity-80 mix-blend-screen"
                />
                <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />
              </div>
            </div>
            <div className="mt-2 text-[10px] tracking-widest text-center uppercase opacity-60">
              IMG_REF: BTL_NK_{Math.floor(Math.random()*1000)}
            </div>
          </div>

          {/* Right: Info Box */}
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] tracking-widest opacity-70 mb-1 uppercase">
                {isVi ? 'TIỂU CẢNH GIỚI TIẾN GIAI' : 'SUB-STAGE ADVANCEMENT'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest mb-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] text-emerald-300">
                {isVi ? 'ĐỘT PHÁ THÀNH CÔNG!' : 'BREAKTHROUGH SUCCESS!'}
              </h2>

              {/* Transition Row */}
              <div className="flex items-center justify-between border border-dashed border-emerald-500/50 bg-black/40 p-3 mb-6">
                <span className="text-sm opacity-60">{oldStageName}</span>
                <span className="text-emerald-400 font-bold animate-pulse px-4">{'>'}</span>
                <span className="text-sm font-bold text-emerald-300 drop-shadow-[0_0_5px_currentColor]">{newStageName}</span>
              </div>

              {/* Stat increases list */}
              <div className="w-full space-y-2 text-xs border border-emerald-500/30 p-4 bg-black/20 mb-6">
                <div className="flex justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="opacity-70">{isVi ? '🩸 Khí Huyết Tối Đa (HP)' : '🩸 Max Health (HP)'}</span>
                  <span className="font-bold">+{isVi ? 'Tăng mạnh' : 'Grows Stronger'}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="opacity-70">{isVi ? '⚔️ Lực Công Kích (Attack)' : '⚔️ Attack Power'}</span>
                  <span className="font-bold">+{isVi ? 'Gia tăng' : 'Enhanced'}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="opacity-70">{isVi ? '⚡ Tốc Độ Tuần Hoàn' : '⚡ Qi Circulation'}</span>
                  <span className="font-bold">+{isVi ? 'Củng cố' : 'Strengthened'}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-500/20 pb-1.5 border-b-transparent">
                  <span className="opacity-70">{isVi ? '🌀 Thần Lực Kinh Mạch' : '🌀 Meridian Qi'}</span>
                  <span className="font-bold">+{isVi ? 'Khai thông' : 'Activated'}</span>
                </div>
              </div>
            </div>

            {/* Action confirm button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500 font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              [ {isVi ? 'THU NHẬN TU VI' : 'CONSOLIDATE CULTIVATION'} ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
