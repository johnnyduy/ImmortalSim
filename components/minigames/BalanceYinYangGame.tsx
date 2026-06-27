import React, { useState, useEffect, useRef } from 'react';

interface BalanceYinYangGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function BalanceYinYangGame({ onComplete, onCancel }: BalanceYinYangGameProps) {
  const [position, setPosition] = useState(50);
  const [timeLeft, setTimeLeft] = useState(10);
  const [phase, setPhase] = useState<'play' | 'stopped'>('play');
  const [result, setResult] = useState<string | null>(null);

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const driftSpeed = useRef<number>(15); // % per second
  const posRef = useRef(50);

  useEffect(() => {
    if (phase !== 'play') return;

    const driftInterval = setInterval(() => {
      // Randomly change drift direction every 1-2s
      if (Math.random() > 0.5) {
        driftSpeed.current = (Math.random() * 20 + 10) * (Math.random() > 0.5 ? 1 : -1);
      }
    }, 1500);

    return () => clearInterval(driftInterval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;

    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame('perfect');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;

    const animate = (time: number) => {
      if (lastTimeRef.current != undefined) {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        let newPos = posRef.current + driftSpeed.current * deltaTime;
        
        if (newPos <= 0 || newPos >= 100) {
          endGame('fail');
          newPos = newPos <= 0 ? 0 : 100;
        }
        
        posRef.current = newPos;
        setPosition(newPos);
      }
      lastTimeRef.current = time;
      if (phase === 'play') {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase]);

  const endGame = (outcome: 'perfect' | 'fail') => {
    setPhase('stopped');
    setResult(outcome === 'perfect' ? 'THÀNH CÔNG!' : 'THẤT BẠI!');
    setTimeout(() => {
      onComplete(outcome);
    }, 1500);
  };

  const handlePush = (direction: 'left' | 'right') => {
    if (phase !== 'play') return;
    const amount = 8;
    posRef.current = Math.max(0, Math.min(100, posRef.current + (direction === 'left' ? -amount : amount)));
    setPosition(posRef.current);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePush('left');
      if (e.key === 'ArrowRight') handlePush('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border-2 border-[#4fc3f7] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(79,195,247,0.3)]">
        <h2 className="text-2xl font-bold text-[#4fc3f7] mb-2">[ CÂN BẰNG ÂM DƯƠNG ]</h2>
        <p className="mb-4 text-[#4fc3f7]/70 h-12 flex items-center justify-center">
          Giữ linh khí ở giữa tâm (dùng phím mũi tên hoặc nút bấm). Trụ vững 10 giây!
        </p>
        
        <div className="h-10 flex items-center justify-center mb-6">
            <p className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-[#4fc3f7]'}`}>00:{timeLeft.toString().padStart(2, '0')}</p>
        </div>

        <div className="relative h-12 bg-black/50 border border-[#4fc3f7]/30 rounded-full mb-8 overflow-hidden">
          {/* Safe Zone indicator visually */}
          <div className="absolute top-0 bottom-0 left-[20%] right-[20%] bg-[#4fc3f7]/10 border-x border-[#4fc3f7]/30"></div>
          
          {/* The Pointer */}
          <div 
            className="absolute top-0 bottom-0 w-8 -ml-4 bg-[#4fc3f7] shadow-[0_0_15px_#4fc3f7] rounded-full flex items-center justify-center transition-none"
            style={{ left: `${position}%` }}
          >
            <div className="w-2 h-8 bg-white rounded-full opacity-50"></div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-4">
            <button 
                onClick={() => handlePush('left')}
                disabled={phase !== 'play'}
                className="w-20 h-20 bg-[#1a1a2e] border-2 border-[#4fc3f7]/50 rounded-full flex items-center justify-center text-4xl text-[#4fc3f7] active:bg-[#4fc3f7]/30 disabled:opacity-50"
            >
                ←
            </button>
            <button 
                onClick={() => handlePush('right')}
                disabled={phase !== 'play'}
                className="w-20 h-20 bg-[#1a1a2e] border-2 border-[#4fc3f7]/50 rounded-full flex items-center justify-center text-4xl text-[#4fc3f7] active:bg-[#4fc3f7]/30 disabled:opacity-50"
            >
                →
            </button>
        </div>

        <div className="h-8">
          {result && (
            <div className={`text-xl font-bold animate-pulse ${result === 'THÀNH CÔNG!' ? 'text-green-400' : 'text-red-500'}`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[#4fc3f7]/20 pt-4">
          <button 
            onClick={onCancel}
            disabled={phase !== 'play'}
            className="text-[#4fc3f7]/50 hover:text-[#4fc3f7] text-sm"
          >
            [ Bỏ Cuộc ]
          </button>
        </div>
      </div>
    </div>
  );
}
