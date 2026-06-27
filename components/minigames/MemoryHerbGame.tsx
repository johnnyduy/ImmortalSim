import React, { useState, useEffect } from 'react';

interface MemoryHerbGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function MemoryHerbGame({ onComplete, onCancel }: MemoryHerbGameProps) {
  const [grid, setGrid] = useState<{ id: number, type: 'good' | 'weed' }[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'play' | 'stopped'>('memorize');
  const [timeLeft, setTimeLeft] = useState(5);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Generate 3x4 grid = 12 cells
    const newGrid = Array(12).fill(null).map((_, i) => ({
      id: i,
      type: 'weed' as 'good' | 'weed'
    }));
    
    // Add exactly 1 good herb
    const goodIdx = Math.floor(Math.random() * 12);
    newGrid[goodIdx].type = 'good';
    
    setGrid(newGrid);

    // Memorize phase lasts 2 seconds
    const memorizeTimer = setTimeout(() => {
      setPhase('play');
    }, 2000);

    return () => clearTimeout(memorizeTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'play') return;
    
    if (timeLeft <= 0) {
      setPhase('stopped');
      setResult('HẾT GIỜ! Linh thảo đã lặn mất!');
      setTimeout(() => onComplete('fail'), 1500);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phase]);

  const handleCellClick = (idx: number) => {
    if (phase !== 'play') return;

    const cell = grid[idx];
    setPhase('stopped');
    
    if (cell.type === 'good') {
      setResult('PERFECT! Nhãn lực phi phàm!');
      setTimeout(() => onComplete('perfect'), 1500);
    } else {
      setResult('FAIL! Ngươi trúng độc của Độc Thảo!');
      setTimeout(() => onComplete('fail'), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#112211] to-black border-2 border-[#34d399] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(52,211,153,0.3)]">
        <h2 className="text-2xl font-bold text-[#34d399] mb-2">[ LINH THẢO ẨN HIỆN ]</h2>
        <p className="mb-2 text-[#34d399]/70 h-12 flex items-center justify-center">
          {phase === 'memorize' ? 'Ghi nhớ vị trí của Linh Thảo (🌿)!' : 'Hãy chọn đúng Linh Thảo! Cẩn thận Độc Thảo (🥀)!'}
        </p>
        
        <div className="h-10 flex items-center justify-center mb-4">
            {phase === 'play' && (
            <p className="text-2xl font-bold text-red-500 animate-pulse">00:0{timeLeft}</p>
            )}
            {phase === 'memorize' && (
            <p className="text-2xl font-bold text-[#34d399] animate-pulse">NHÌN KỸ!</p>
            )}
        </div>
        
        <div className="bg-black/50 p-4 rounded-xl border border-[#34d399]/30 mb-8 grid grid-cols-4 gap-3 text-4xl">
          {grid.map((cell, idx) => (
            <div 
              key={cell.id} 
              onClick={() => handleCellClick(idx)}
              className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                phase === 'memorize' || phase === 'stopped'
                  ? 'border-[#34d399]/20 bg-[#34d399]/10'
                  : 'border-[#34d399]/50 hover:bg-[#34d399]/20 cursor-pointer bg-black'
              }`}
            >
              {phase === 'memorize' || phase === 'stopped' ? (
                <span className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{cell.type === 'good' ? '🌿' : '🥀'}</span>
              ) : (
                <span className="text-[#34d399]/30 text-2xl">?</span>
              )}
            </div>
          ))}
        </div>

        <div className="h-10 flex items-center justify-center">
            {result && (
            <div className={`text-xl font-bold ${result.includes('PERFECT') ? 'text-[#34d399]' : 'text-red-500'}`}>
                {result}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
