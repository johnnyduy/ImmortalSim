import React, { useState, useEffect, useRef } from 'react';

interface QuickReactionGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function QuickReactionGame({ onComplete, onCancel }: QuickReactionGameProps) {
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'stopped'>('waiting');
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });
  const [result, setResult] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactWindowRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    // Start the game by waiting a random amount of time (1.5s to 4s)
    const waitTime = 1500 + Math.random() * 2500;
    
    timeoutRef.current = setTimeout(() => {
      // Pick random position
      const top = 20 + Math.random() * 60;
      const left = 20 + Math.random() * 60;
      setTargetPos({ top: `${top}%`, left: `${left}%` });
      
      setPhase('ready');

      // Reaction window: 600ms
      reactWindowRef.current = setTimeout(() => {
        if (phaseRef.current === 'ready') {
          setPhase('stopped');
          setResult('FAIL! Phản ứng quá chậm, trúng đòn chí mạng!');
          setTimeout(() => onComplete('fail'), 1500);
        }
      }, 600);

    }, waitTime);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (reactWindowRef.current) clearTimeout(reactWindowRef.current);
    };
  }, [onComplete]);

  const handleScreenClick = () => {
    if (phase === 'waiting') {
      // Early click penalty
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('stopped');
      setResult('FAIL! Lộ sơ hở vì tấn công quá sớm!');
      setTimeout(() => onComplete('fail'), 1500);
    }
  };

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phase === 'ready') {
      if (reactWindowRef.current) clearTimeout(reactWindowRef.current);
      setPhase('stopped');
      setResult('PERFECT! Nhất kích tất sát!');
      setTimeout(() => onComplete('perfect'), 1500);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-colors duration-75 ${phase === 'ready' ? 'bg-red-900/90' : 'bg-black/95'}`}
      onClick={handleScreenClick}
    >
      {/* Decorative vignette */}
      <div className="absolute inset-0 pointer-events-none radial-gradient-vignette opacity-50" />
      
      {phase === 'waiting' && (
        <div className="text-white/50 text-xl font-serif italic animate-pulse">
          Cẩn thận... có sát khí...
        </div>
      )}

      {phase === 'ready' && (
        <button
          onClick={handleTargetClick}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 text-5xl sm:text-7xl font-bold text-white tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,1)] hover:scale-110 active:scale-95 transition-transform"
          style={targetPos}
        >
          ⚔️ CHÉM!
        </button>
      )}

      {phase === 'stopped' && result && (
        <div className="bg-black/80 border-2 border-white/20 p-8 rounded-xl z-10 backdrop-blur-md">
          <div className={`text-2xl sm:text-3xl font-bold ${result.includes('PERFECT') ? 'text-red-500' : 'text-gray-400'}`}>
              {result}
          </div>
        </div>
      )}
    </div>
  );
}
