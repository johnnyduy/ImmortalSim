import React, { useState, useEffect } from 'react';

interface MinesweeperLiteGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

type Cell = {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  neighborMines: number;
};

export default function MinesweeperLiteGame({ onComplete, onCancel }: MinesweeperLiteGameProps) {
  const [grid, setGrid] = useState<Cell[]>([]);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  const SIZE = 4;
  const MINES = 3;

  useEffect(() => {
    // Initialize grid
    let newGrid: Cell[] = Array(SIZE * SIZE).fill(null).map((_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
      neighborMines: 0
    }));

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const idx = Math.floor(Math.random() * newGrid.length);
      if (!newGrid[idx].isMine) {
        newGrid[idx].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbors
    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i].isMine) continue;
      
      let count = 0;
      const row = Math.floor(i / SIZE);
      const col = i % SIZE;

      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          const nr = row + r;
          const nc = col + c;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
            const nIdx = nr * SIZE + nc;
            if (newGrid[nIdx].isMine) count++;
          }
        }
      }
      newGrid[i].neighborMines = count;
    }

    setGrid(newGrid);
  }, []);

  const handleCellClick = (idx: number) => {
    if (status !== 'playing' || grid[idx].isRevealed) return;

    const newGrid = [...grid];
    
    if (newGrid[idx].isMine) {
      // Hit a mine
      newGrid[idx].isRevealed = true;
      setGrid(newGrid);
      setStatus('stopped');
      setResult('FAIL! Chạm phải linh mạch bạo loạn!');
      
      // Reveal all mines
      setTimeout(() => {
        setGrid(g => g.map(c => c.isMine ? { ...c, isRevealed: true } : c));
      }, 500);

      setTimeout(() => onComplete('fail'), 2000);
      return;
    }

    // Safe reveal
    // Recursive reveal for 0s
    const reveal = (i: number) => {
      if (newGrid[i].isRevealed) return;
      newGrid[i].isRevealed = true;

      if (newGrid[i].neighborMines === 0) {
        const row = Math.floor(i / SIZE);
        const col = i % SIZE;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            const nr = row + r;
            const nc = col + c;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
              reveal(nr * SIZE + nc);
            }
          }
        }
      }
    };

    reveal(idx);
    setGrid(newGrid);

    // Check win
    const safeCells = newGrid.filter(c => !c.isMine);
    const allSafeRevealed = safeCells.every(c => c.isRevealed);
    
    if (allSafeRevealed) {
      setStatus('stopped');
      setResult('PERFECT! Khai thác trọn vẹn mạch khoáng!');
      setTimeout(() => onComplete('perfect'), 2000);
    }
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-blue-400';
      case 2: return 'text-emerald-400';
      case 3: return 'text-red-400';
      case 4: return 'text-purple-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1c23] border-2 border-[#a8b1c2] p-8 rounded-xl max-w-sm w-full text-center shadow-[0_0_30px_rgba(168,177,194,0.2)]">
        <h2 className="text-2xl font-bold text-[#a8b1c2] mb-2">[ ĐÀO KHOÁNG THẠCH ]</h2>
        <p className="mb-6 text-[#a8b1c2]/70 text-sm">
          Nhấp để đào. Số hiện ra là số mìn (bạo loạn) xung quanh ô đó.
        </p>
        
        <div className="bg-[#0f1115] p-3 rounded-lg border border-[#a8b1c2]/30 mb-6 grid grid-cols-4 gap-2 mx-auto w-fit">
          {grid.map((cell, idx) => (
            <button 
              key={cell.id} 
              onClick={() => handleCellClick(idx)}
              className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl font-bold rounded shadow-sm transition-colors ${
                cell.isRevealed 
                  ? cell.isMine 
                    ? 'bg-red-900/80 border border-red-500 text-white' 
                    : 'bg-[#2a2d36] border border-[#a8b1c2]/20'
                  : 'bg-[#434856] hover:bg-[#565c6e] border border-[#a8b1c2]/40 shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)]'
              }`}
            >
              {cell.isRevealed ? (
                cell.isMine ? '💥' : (cell.neighborMines > 0 ? <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span> : '')
              ) : (
                ''
              )}
            </button>
          ))}
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
