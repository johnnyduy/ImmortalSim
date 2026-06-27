import React, { useState, useEffect } from 'react';

interface ArrayPuzzleGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function ArrayPuzzleGame({ onComplete, onCancel }: ArrayPuzzleGameProps) {
  const [grid, setGrid] = useState<number[]>([]);
  const [movesLeft, setMovesLeft] = useState(15);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  // Targets for each of the 9 cells (center is 4, doesn't matter)
  const targets = [
    3, // 0: ↘
    4, // 1: ↓
    5, // 2: ↙
    2, // 3: →
    -1, // 4: Center ○
    6, // 5: ←
    1, // 6: ↗
    0, // 7: ↑
    7, // 8: ↖
  ];

  const getArrow = (dir: number) => {
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    return arrows[dir % 8];
  };

  useEffect(() => {
    // Generate initial grid (scrambled)
    const newGrid: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (i === 4) newGrid.push(-1);
      else {
        // Ensure it's not already correct
        let r;
        do {
          r = Math.floor(Math.random() * 8);
        } while (r === targets[i]);
        newGrid.push(r);
      }
    }
    setGrid(newGrid);
  }, []);

  const checkWinCondition = (currentGrid: number[]) => {
    for (let i = 0; i < 9; i++) {
      if (i === 4) continue;
      if (currentGrid[i] % 8 !== targets[i]) return false;
    }
    return true;
  };

  const handleCellClick = (idx: number) => {
    if (status !== 'playing' || idx === 4) return;

    const newGrid = [...grid];
    newGrid[idx] = (newGrid[idx] + 1) % 8;
    setGrid(newGrid);
    setMovesLeft(m => m - 1);

    if (checkWinCondition(newGrid)) {
      setStatus('stopped');
      setResult('PERFECT! Tụ Linh Trận đại thành!');
      setTimeout(() => onComplete('perfect'), 1500);
    } else if (movesLeft - 1 <= 0) {
      setStatus('stopped');
      setResult('FAIL! Hết lượt, linh khí tiêu tán!');
      setTimeout(() => onComplete('fail'), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-high border border-primary p-8 rounded-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">[ CHỈNH TỤ LINH TRẬN ]</h2>
        <p className="mb-2 text-on-surface-variant">Xoay các mũi tên hướng linh khí vào tâm.</p>
        <p className="mb-6 text-xl font-bold text-primary">Lượt còn: {movesLeft}</p>
        
        <div className="bg-black p-4 rounded border border-outline-variant mb-8 grid grid-cols-3 grid-rows-3 text-4xl font-mono leading-none gap-2 w-48 mx-auto">
          {grid.map((dir, idx) => (
            <div 
              key={idx} 
              onClick={() => handleCellClick(idx)}
              className={`w-12 h-12 flex items-center justify-center transition-colors select-none ${idx === 4 ? 'text-secondary animate-pulse' : 'hover:bg-primary/20 cursor-pointer text-primary-container hover:text-primary'}`}
            >
              {idx === 4 ? '○' : getArrow(dir)}
            </div>
          ))}
        </div>

        {result && (
          <div className={`text-xl font-bold mb-4 ${result.includes('PERFECT') ? 'text-secondary' : 'text-error'}`}>
            {result}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button 
            onClick={onCancel}
            disabled={status !== 'playing'}
            className="px-6 py-2 border border-outline-variant hover:text-error"
          >
            [ BỎ CUỘC ]
          </button>
        </div>
      </div>
    </div>
  );
}
