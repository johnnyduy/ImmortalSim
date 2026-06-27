import React, { useState, useEffect, useCallback } from 'react';

interface SwipeDirectionGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const;
type Direction = typeof DIRECTIONS[number];

const ICONS: Record<Direction, string> = {
  UP: '⬆️',
  DOWN: '⬇️',
  LEFT: '⬅️',
  RIGHT: '➡️'
};

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  KeyW: 'UP',
  KeyS: 'DOWN',
  KeyA: 'LEFT',
  KeyD: 'RIGHT'
};

export default function SwipeDirectionGame({ onComplete, onCancel }: SwipeDirectionGameProps) {
  const [targetDir, setTargetDir] = useState<Direction | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2000); // 2s per swipe initially
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  const TARGET_SCORE = 5;

  const nextRound = useCallback(() => {
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    setTargetDir(dir);
    setTimeLeft(2000 - (score * 200)); // Gets faster each time
  }, [score]);

  useEffect(() => {
    if (status === 'playing') {
      nextRound();
    }
  }, [status, nextRound]);

  useEffect(() => {
    if (status !== 'playing') return;

    if (timeLeft <= 0) {
      setStatus('stopped');
      setResult('QUÁ CHẬM! Rìu gãy, Mộc Tinh tiêu tán!');
      setTimeout(() => onComplete('fail'), 1500);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 50); // 50ms tick
    }, 50);

    return () => clearInterval(timer);
  }, [timeLeft, status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing' || !targetDir) return;

      const inputDir = KEY_MAP[e.code];
      if (inputDir) {
        e.preventDefault();
        if (inputDir === targetDir) {
          // Correct
          const newScore = score + 1;
          setScore(newScore);
          if (newScore >= TARGET_SCORE) {
            setStatus('stopped');
            setResult('PERFECT! Đốn mộc như thần!');
            setTimeout(() => onComplete('perfect'), 1500);
          } else {
            nextRound(); // Immediately start next round
          }
        } else {
          // Wrong
          setStatus('stopped');
          setResult('SAI HƯỚNG! Vân gỗ đứt đoạn!');
          setTimeout(() => onComplete('fail'), 1500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, targetDir, score, nextRound]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1b261b] border-2 border-[#8b5a2b] p-8 rounded-xl max-w-sm w-full text-center shadow-[0_0_30px_rgba(139,90,43,0.3)]">
        <h2 className="text-2xl font-bold text-[#d2a679] mb-2">[ ĐỐN MỘC TINH ]</h2>
        <p className="mb-6 text-[#d2a679]/70 text-sm h-10">
          Chặt theo vân gỗ. Bấm phím mũi tên (hoặc W A S D) tương ứng nhanh nhất có thể!
        </p>
        
        <div className="flex justify-between items-center mb-4 px-4 text-[#d2a679]">
            <p className="font-bold">TIẾN ĐỘ: {score}/{TARGET_SCORE}</p>
        </div>

        <div className="bg-[#0f140f] p-8 rounded-full border-4 border-[#8b5a2b] mb-6 aspect-square max-w-[200px] mx-auto flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Timer circle background */}
            <div 
                className="absolute inset-0 bg-[#8b5a2b]/20" 
                style={{ 
                    clipPath: `polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, ${timeLeft > 1500 ? 50 : 0}% 0)` // Approximation for visual
                }}
            />
            {/* The Arrow */}
            <div className={`text-6xl ${status === 'playing' ? 'animate-bounce' : 'opacity-50'}`}>
                {targetDir ? ICONS[targetDir] : '⏳'}
            </div>

            {/* Timer bar at bottom */}
            <div className="absolute bottom-0 left-0 h-2 bg-red-500 transition-all duration-75" style={{ width: `${(timeLeft / (2000 - (score * 200))) * 100}%` }} />
        </div>

        {/* Mobile controls (optional, but good for accessibility) */}
        <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto mb-4 opacity-50 sm:hidden">
            <div />
            <button className="bg-white/10 p-2 rounded">W</button>
            <div />
            <button className="bg-white/10 p-2 rounded">A</button>
            <button className="bg-white/10 p-2 rounded">S</button>
            <button className="bg-white/10 p-2 rounded">D</button>
        </div>

        <div className="h-10 flex items-center justify-center">
            {result && (
            <div className={`text-xl font-bold ${result.includes('PERFECT') ? 'text-emerald-400' : 'text-red-500'}`}>
                {result}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
