import React, { useState, useEffect } from 'react';

interface WeedFindGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function WeedFindGame({ onComplete, onCancel }: WeedFindGameProps) {
  const [grid, setGrid] = useState<{ id: number, type: 'good' | 'weed', found: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(5);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Generate grid
    const newGrid = Array(30).fill(null).map((_, i) => ({
      id: i,
      type: 'good' as 'good' | 'weed',
      found: false
    }));
    
    // Add 1 or 2 weeds
    const weedCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < weedCount; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * 30);
      } while (newGrid[idx].type === 'weed');
      newGrid[idx].type = 'weed';
    }
    
    setGrid(newGrid);
  }, []);

  useEffect(() => {
    if (status !== 'playing') return;
    
    if (timeLeft <= 0) {
      setStatus('stopped');
      setResult('HẾT GIỜ! Linh tạp cắn nuốt rễ cây!');
      setTimeout(() => onComplete('fail'), 1500);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  const handleCellClick = (idx: number) => {
    if (status !== 'playing') return;

    const cell = grid[idx];
    if (cell.type === 'good') {
      setStatus('stopped');
      setResult('SAI LẦM! Ngươi vừa nhổ đứt ấu linh căn!');
      setTimeout(() => onComplete('fail'), 1500);
    } else {
      const newGrid = [...grid];
      newGrid[idx].found = true;
      setGrid(newGrid);

      const remainingWeeds = newGrid.filter(c => c.type === 'weed' && !c.found);
      if (remainingWeeds.length === 0) {
        setStatus('stopped');
        setResult('PERFECT! Linh điền sạch bóng!');
        setTimeout(() => onComplete('perfect'), 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-high border border-primary p-8 rounded-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">[ NHỔ LINH TẠP ]</h2>
        <p className="mb-2 text-on-surface-variant">Tìm và nhổ ký tự 🌿. Tránh nhổ nhầm 🌱.</p>
        <p className="mb-6 text-xl font-bold text-error animate-pulse">00:0{timeLeft}</p>
        
        <div className="bg-black p-4 rounded border border-outline-variant mb-8 grid grid-cols-6 gap-2 text-2xl cursor-crosshair">
          {grid.map((cell, idx) => (
            <div 
              key={cell.id} 
              onClick={() => handleCellClick(idx)}
              className={`hover:bg-primary/20 transition-colors rounded ${cell.found ? 'opacity-0' : 'opacity-100'}`}
            >
              {cell.type === 'good' ? '🌱' : '🌿'}
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
