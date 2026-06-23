'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TransitionType = 
  | 'ink_fade' 
  | 'karma_good' 
  | 'karma_bad' 
  | 'destiny_win' 
  | 'destiny_lose' 
  | 'combat_win' 
  | 'combat_lose' 
  | 'combat_start';

type Props = {
  type: TransitionType;
  onComplete: () => void;
  language: 'vi' | 'en';
};

export default function OutcomeTransition({ type, onComplete, language }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const audioPlayedRef = useRef(false);

  // Play audio based on transition type
  useEffect(() => {
    if (audioPlayedRef.current) return;
    audioPlayedRef.current = true;

    try {
      let soundPath = '';
      let volume = 0.5;

      switch (type) {
        case 'karma_good':
          soundPath = '/audio/crystal-bowl.mp3';
          volume = 0.7;
          break;
        case 'karma_bad':
          soundPath = '/audio/forbidden.mp3';
          volume = 0.8;
          break;
        case 'destiny_win':
          soundPath = '/audio/reincarnation.mp3';
          volume = 0.6;
          break;
        case 'destiny_lose':
          soundPath = '/audio/death.mp3';
          volume = 0.6;
          break;
        case 'combat_win':
        case 'combat_start':
          soundPath = '/audio/meditation.mp3';
          volume = 0.5;
          break;
        case 'combat_lose':
          soundPath = '/audio/death.mp3';
          volume = 0.7;
          break;
        default:
          soundPath = '/audio/mystery.mp3';
          volume = 0.4;
      }

      if (soundPath) {
        const audio = new Audio(soundPath);
        audio.volume = volume;
        audio.play().catch((e) => console.warn('Transition audio failed to play:', e));
      }
    } catch (e) {
      console.warn('Error setting up transition audio:', e);
    }
  }, [type]);

  // Duration configuration based on effect
  const getDuration = () => {
    if (type === 'ink_fade') return 1200;
    if (type.startsWith('karma_')) return 1300;
    if (type.startsWith('destiny_')) return 1400;
    if (type.startsWith('combat_')) return 1200;
    return 1000;
  };

  useEffect(() => {
    const duration = getDuration();
    
    // Trigger onComplete callback after duration
    const timer = setTimeout(() => {
      setShowOverlay(false);
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  // Ink bleed canvas animation helper
  useEffect(() => {
    if (type !== 'ink_fade' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Ink drip definition
    interface InkBlot {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      angle: number;
      opacity: number;
    }

    const blots: InkBlot[] = [];
    const blotCount = 25;

    for (let i = 0; i < blotCount; i++) {
      blots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0,
        maxRadius: Math.random() * (canvas.width / 4) + canvas.width / 8,
        speed: Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.3 + 0.7,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let allDone = true;

      blots.forEach((blot) => {
        if (blot.radius < blot.maxRadius) {
          blot.radius += blot.speed;
          allDone = false;
        }

        // Draw organic ink wash blot using radial-gradients
        const grad = ctx.createRadialGradient(
          blot.x, blot.y, blot.radius * 0.1,
          blot.x, blot.y, blot.radius
        );
        grad.addColorStop(0, `rgba(10, 8, 6, ${blot.opacity})`);
        grad.addColorStop(0.5, `rgba(18, 14, 11, ${blot.opacity * 0.85})`);
        grad.addColorStop(0.8, `rgba(30, 24, 19, ${blot.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blot.x, blot.y, blot.radius, 0, Math.PI * 2);
        ctx.fill();

        // Extra organic drips
        ctx.fillStyle = `rgba(10, 8, 6, ${blot.opacity})`;
        for (let j = 0; j < 3; j++) {
          const dripDistance = blot.radius * 0.6;
          const dx = blot.x + Math.cos(blot.angle + j) * dripDistance;
          const dy = blot.y + Math.sin(blot.angle + j) * dripDistance + (blot.radius * 0.15);
          ctx.beginPath();
          ctx.arc(dx, dy, blot.radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (!allDone) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type]);

  if (!showOverlay) return null;

  return (
    <AnimatePresence>
      <div 
        className={`fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto bg-black/10 select-none overflow-hidden ${
          type === 'karma_bad' ? 'animate-shake' : ''
        }`}
      >
        {/* Effect 1: Mực Tàu Hóa Kiếp */}
        {type === 'ink_fade' && (
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full mix-blend-multiply pointer-events-none"
          />
        )}

        {/* Effect 2: Sợi Chỉ Nhân Quả - Thiện Quả */}
        {type === 'karma_good' && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center">
            {/* Elegant glowing gold vectors forming lines of karma */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <g stroke="#e5c17b" strokeWidth="1.5" fill="none" opacity="0.75">
                {/* Dynamic intersecting threads of fate */}
                <path d="M-100,200 Q 200,450 600,200 T 1300,500" className="karmic-line" style={{ animationDelay: '0s' }} />
                <path d="M1200,100 Q 800,400 400,100 T -100,400" className="karmic-line" style={{ animationDelay: '0.1s' }} />
                <path d="M100,-100 Q 300,300 700,600 T 1200,1100" className="karmic-line" style={{ animationDelay: '0.2s' }} />
                <path d="M900,-50 Q 500,250 200,600 T -200,1000" className="karmic-line" style={{ animationDelay: '0.3s' }} />
              </g>
            </svg>

            {/* Glowing Center Ring */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-48 h-48 rounded-full border-2 border-[#e5c17b] flex items-center justify-center shadow-[0_0_35px_rgba(229,193,123,0.3)] bg-gradient-to-b from-[#1c1813]/90 to-[#0e0c0a]/95 backdrop-blur-md"
            >
              <div className="absolute inset-2 rounded-full border border-[#e5c17b]/30 border-dashed animate-spin" style={{ animationDuration: '20s' }} />
              <div className="text-center space-y-1 z-10 px-4">
                <span className="text-3xl text-[#e5c17b] filter drop-shadow-[0_0_8px_rgba(229,193,123,0.6)]">☯</span>
                <h3 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest font-bold">
                  {language === 'vi' ? 'Thiện Nghiệp' : 'Good Karma'}
                </h3>
                <p className="text-[9px] text-[#b5a995] font-sans tracking-wide">
                  {language === 'vi' ? 'Linh quang gia trì' : 'Ethereal Blessing'}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Effect 2: Sợi Chỉ Nhân Quả - Ác Nghiệp */}
        {type === 'karma_bad' && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center">
            {/* Criss-crossing blood-red and black threads */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <g stroke="#a93c3c" strokeWidth="2" fill="none" opacity="0.9">
                <path d="M-50,150 L1150,550" className="karmic-line" style={{ animationDelay: '0s' }} />
                <path d="M1150,100 L-50,600" className="karmic-line" style={{ animationDelay: '0.15s' }} />
                <path d="M300,-50 L600,750" className="karmic-line" style={{ animationDelay: '0.05s' }} />
              </g>
              <g stroke="#1a0000" strokeWidth="4" fill="none" opacity="0.8">
                <path d="M-50,300 Q 500,100 1150,300" className="karmic-line" style={{ animationDelay: '0.2s' }} />
                <path d="M-50,450 Q 500,600 1150,450" className="karmic-line" style={{ animationDelay: '0.25s' }} />
              </g>
            </svg>

            {/* Dark Red Center Ring */}
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-48 h-48 rounded-full border-2 border-[#a93c3c] flex items-center justify-center shadow-[0_0_45px_rgba(169,60,60,0.5)] bg-gradient-to-b from-[#1a0808]/95 to-[#050000]/98 backdrop-blur-md"
            >
              <div className="absolute inset-2 rounded-full border border-[#a93c3c]/30 border-dashed animate-spin" style={{ animationDuration: '8s' }} />
              <div className="text-center space-y-1 z-10 px-4">
                <span className="text-3xl text-[#a93c3c] filter drop-shadow-[0_0_8px_rgba(169,60,60,0.7)]">💀</span>
                <h3 className="font-serif text-[#a93c3c] text-base uppercase tracking-widest font-bold">
                  {language === 'vi' ? 'Ma Vực Nghiệp' : 'Demonic Karma'}
                </h3>
                <p className="text-[9px] text-[#847764] font-sans tracking-wide">
                  {language === 'vi' ? 'Nhân quả báo ứng' : 'Karmic Retribution'}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Effect 3: Mệnh Bàn Chuyển Quẻ (Kỳ Ngộ Thành Công) */}
        {type === 'destiny_win' && (
          <div className="absolute inset-0 bg-[#070605]/75 backdrop-blur-[1px] flex flex-col items-center justify-center">
            {/* Spinning Golden Bagua Plate */}
            <motion.div 
              initial={{ rotate: -180, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 180, scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="relative w-64 h-64 flex items-center justify-center"
            >
              {/* Outer Golden Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#e5c17b]/20 to-[#a87f37]/20 blur-xl animate-pulse" />
              
              {/* Circular Trigrams Ring */}
              <svg width="256" height="256" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(229,193,123,0.5)]">
                <circle cx="128" cy="128" r="110" fill="none" stroke="#e5c17b" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="128" cy="128" r="95" fill="none" stroke="#e5c17b" strokeWidth="2" />
                <circle cx="128" cy="128" r="70" fill="rgba(15,12,10,0.9)" stroke="#e5c17b" strokeWidth="1" />
                
                {/* Trigram Characters arranging in circle */}
                {['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'].map((tg, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  const x = 128 + 82 * Math.cos(angle);
                  const y = 128 + 82 * Math.sin(angle);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      dy="0.35em"
                      textAnchor="middle"
                      fill="#e5c17b"
                      fontSize="22"
                      fontWeight="bold"
                      className="font-serif"
                    >
                      {tg}
                    </text>
                  );
                })}

                {/* Glowing Destiny Lines connecting stars */}
                <path d="M78,78 L178,78 L128,178 Z" fill="none" stroke="#fff" strokeWidth="1.5" className="karmic-line" />
                <path d="M128,58 L178,168 L78,168 Z" fill="none" stroke="#e5c17b" strokeWidth="1" strokeDasharray="3 3" />
              </svg>

              {/* Glowing Center Core */}
              <div className="absolute w-20 h-20 rounded-full bg-[#e5c17b]/15 border border-[#e5c17b] flex items-center justify-center">
                <span className="text-2xl text-white font-serif font-bold animate-pulse">吉</span> {/* Cát - Lucky */}
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 font-serif text-[#e5c17b] text-base uppercase tracking-[0.25em]"
            >
              {language === 'vi' ? 'Thiên Cơ Hiện Thế • Đại Cát' : 'Celestial Opportunity • Auspicious'}
            </motion.p>
          </div>
        )}

        {/* Effect 3: Mệnh Bàn Chuyển Quẻ (Kỳ Ngộ Thất Bại) */}
        {type === 'destiny_lose' && (
          <div className="absolute inset-0 bg-[#090303]/80 backdrop-blur-[2px] flex flex-col items-center justify-center">
            {/* Spinning Crack Red Bagua Plate */}
            <motion.div 
              initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 90, scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="relative w-64 h-64 flex items-center justify-center"
            >
              {/* Outer Crimson Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600/20 to-black blur-xl animate-pulse" />
              
              {/* Circular Trigrams Ring */}
              <svg width="256" height="256" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <circle cx="128" cy="128" r="110" fill="none" stroke="#a93c3c" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="128" cy="128" r="95" fill="none" stroke="#a93c3c" strokeWidth="2" />
                <circle cx="128" cy="128" r="70" fill="rgba(10,5,5,0.95)" stroke="#a93c3c" strokeWidth="1.5" />
                
                {/* Trigram Characters arranging in circle */}
                {['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'].map((tg, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  const x = 128 + 82 * Math.cos(angle);
                  const y = 128 + 82 * Math.sin(angle);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      dy="0.35em"
                      textAnchor="middle"
                      fill="#a93c3c"
                      fontSize="20"
                      fontWeight="bold"
                    >
                      {tg}
                    </text>
                  );
                })}

                {/* Broken lines showing crack */}
                <path d="M60,128 L198,128" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
                <path d="M128,60 L128,198" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
                <path d="M80,80 L176,176" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
              </svg>

              {/* Glowing Center Core */}
              <div className="absolute w-20 h-20 rounded-full bg-red-950/40 border border-[#ef4444] flex items-center justify-center">
                <span className="text-2xl text-[#ef4444] font-serif font-bold animate-pulse">凶</span> {/* Hung - Unlucky */}
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 font-serif text-[#ef4444] text-base uppercase tracking-[0.25em]"
            >
              {language === 'vi' ? 'Thiên Đạo Trở Ngại • Hung Tượng' : 'Heavenly Obstacle • Ominous'}
            </motion.p>
          </div>
        )}

        {/* Effect 4: Nhịp Đập Mạch Máu - Thành Công / Đột Phá Lớn */}
        {type === 'combat_win' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            {/* Pure Qi Wave sweep */}
            <div className="absolute w-72 h-72 rounded-full border-4 border-cyan-400/50 bg-cyan-500/10 qi-wave-animation" />
            <div className="absolute w-96 h-96 rounded-full border-2 border-emerald-400/30 bg-emerald-500/5 qi-wave-animation" style={{ animationDelay: '0.2s' }} />

            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="z-10 text-center space-y-2"
            >
              <h2 className="font-serif text-3xl text-gradient bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent font-bold tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {language === 'vi' ? 'ĐỘT PHÁ THÀNH CÔNG' : 'BREAKTHROUGH SUCCESS'}
              </h2>
              <p className="text-xs text-text-secondary uppercase tracking-[0.2em]">
                {language === 'vi' ? 'Kinh mạch khuếch trương • Linh khí dồi dào' : 'Meridians Expanded • Qi Surges'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Effect 4: Nhịp Đập Mạch Máu - Thất Bại / Bị Thương */}
        {type === 'combat_lose' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            {/* Blood vessels border pulsating */}
            <div className="blood-vessels-overlay" />
            
            {/* Ink/Blood Splatter svg */}
            <div className="absolute w-80 h-80 flex items-center justify-center blood-splatter-animation">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="#a93c3c">
                {/* Splat blobs */}
                <path d="M100,100 C70,90 60,60 80,40 C100,20 120,40 130,60 C140,80 130,110 100,100 Z" opacity="0.9"/>
                <path d="M100,100 C120,120 150,130 160,110 C170,90 150,70 130,80 C110,90 80,80 100,100 Z" opacity="0.85"/>
                <circle cx="50" cy="70" r="10" opacity="0.8"/>
                <circle cx="150" cy="150" r="14" opacity="0.9"/>
                <circle cx="60" cy="140" r="8" opacity="0.75"/>
                <circle cx="160" cy="50" r="12" opacity="0.8"/>
              </svg>
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="z-10 text-center space-y-2"
            >
              <h2 className="font-serif text-3xl text-red-600 font-bold tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {language === 'vi' ? 'ĐỘT PHÁ THẤT BẠI' : 'BREAKTHROUGH FAILED'}
              </h2>
              <p className="text-xs text-red-400 uppercase tracking-[0.2em] drop-shadow-sm">
                {language === 'vi' ? 'Tẩu hỏa nhập ma • Khí huyết hao tổn' : 'Cultivation Deviated • Vitality Injured'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Effect 4: Nhịp Đập Mạch Máu - Giao Chiến */}
        {type === 'combat_start' && (
          <div className="absolute inset-0 bg-[#0f0a0a]/85 backdrop-blur-[2px] flex items-center justify-center">
            {/* Blood vessels border pulsating */}
            <div className="blood-vessels-overlay" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-3 px-6"
            >
              <span className="text-5xl text-red-600 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse">⚔️</span>
              <h2 className="font-serif text-3xl text-[#e6dfd5] font-bold tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {language === 'vi' ? 'BẮT ĐẦU GIAO CHIẾN' : 'ENGAGING IN COMBAT'}
              </h2>
              <p className="text-xs text-[#a87f37] uppercase tracking-[0.3em]">
                {language === 'vi' ? 'Nhịp tim dồn dập • Sát khí ngập trời' : 'Heart Racing • Demonic Qi Rises'}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
