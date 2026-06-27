import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PipePuzzleGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

type Direction = 'Top' | 'Right' | 'Bottom' | 'Left';

interface Pipe {
  id: number;
  type: 'line' | 'corner';
  rotation: number; // 0,1,2,3
  correctRotation?: number;
}

export default function PipePuzzleGame({ onComplete, onCancel }: PipePuzzleGameProps) {
  const [grid, setGrid] = useState<Pipe[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  const [winningPath, setWinningPath] = useState<Set<number> | null>(null);

  const size = 4;

  const generateGrid = useCallback(() => {
    const newGrid: Pipe[] = [];
    for (let i = 0; i < size * size; i++) {
      newGrid.push({
        id: i,
        type: Math.random() > 0.5 ? 'line' : 'corner',
        rotation: Math.floor(Math.random() * 4),
      });
    }

    // Generate a guaranteed path
    let r = 0;
    let c = 0;
    let path = [[0, 0]];
    let fromDir: Direction = 'Left'; // Entry from left

    while (r !== size - 1 || c !== size - 1) {
      const canGoRight = c < size - 1;
      const canGoDown = r < size - 1;
      let nextDir: Direction = 'Right';
      
      if (canGoRight && canGoDown) {
        nextDir = Math.random() > 0.5 ? 'Right' : 'Bottom';
      } else if (canGoRight) {
        nextDir = 'Right';
      } else {
        nextDir = 'Bottom';
      }

      // Determine pipe type for current cell
      const idx = r * size + c;
      let neededType: 'line' | 'corner' = 'line';
      let neededRotation = 0;

      if ((fromDir as Direction === 'Left' && nextDir as Direction === 'Right') || (fromDir as Direction === 'Right' && nextDir as Direction === 'Left')) {
        neededType = 'line'; neededRotation = 0;
      } else if ((fromDir as Direction === 'Top' && nextDir as Direction === 'Bottom') || (fromDir as Direction === 'Bottom' && nextDir as Direction === 'Top')) {
        neededType = 'line'; neededRotation = 1;
      } else if ((fromDir as Direction === 'Left' && nextDir as Direction === 'Bottom') || (fromDir as Direction === 'Bottom' && nextDir as Direction === 'Left')) {
        neededType = 'corner'; neededRotation = 1; // ┓
      } else if ((fromDir as Direction === 'Top' && nextDir as Direction === 'Right') || (fromDir as Direction === 'Right' && nextDir as Direction === 'Top')) {
        neededType = 'corner'; neededRotation = 3; // ┗
      } else if ((fromDir as Direction === 'Left' && nextDir as Direction === 'Top') || (fromDir as Direction === 'Top' && nextDir as Direction === 'Left')) {
        neededType = 'corner'; neededRotation = 2; // ┛
      } else if ((fromDir as Direction === 'Right' && nextDir as Direction === 'Bottom') || (fromDir as Direction === 'Bottom' && nextDir as Direction === 'Right')) {
        neededType = 'corner'; neededRotation = 0; // ┏
      }

      newGrid[idx] = { id: idx, type: neededType, rotation: Math.floor(Math.random() * 4), correctRotation: neededRotation }; // Scramble rotation

      if (nextDir === 'Right') {
        c++;
        fromDir = 'Left';
      } else {
        r++;
        fromDir = 'Top';
      }
    }

    // Last cell [3,3] exiting to Right
    const lastIdx = size * size - 1;
    let lastNeededRotation = 0;
    let lastNeededType: 'line' | 'corner' = 'line';
    if (fromDir === 'Left') {
      lastNeededType = 'line'; lastNeededRotation = 0;
    } else { // from Top
      lastNeededType = 'corner'; lastNeededRotation = 3; // ┗
    }
    newGrid[lastIdx] = { id: lastIdx, type: lastNeededType, rotation: Math.floor(Math.random() * 4), correctRotation: lastNeededRotation };

    setGrid(newGrid);
  }, []);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  useEffect(() => {
    if (status !== 'playing') return;
    if (timeLeft <= 0) {
      setStatus('stopped');
      setResult('HẾT GIỜ! Linh tuyền tắc nghẽn!');
      
      // Show solution
      setGrid(prev => prev.map(pipe => {
        if (pipe.correctRotation !== undefined) {
          return { ...pipe, rotation: pipe.correctRotation };
        }
        return pipe;
      }));

      // No automatic close on fail so they can study the answer
      // They must click [ RỜI KHỎI ]
      return;
    }
    const t = setTimeout(() => setTimeLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, status]);

  const getExits = (pipe: Pipe): Direction[] => {
    if (pipe.type === 'line') {
      return pipe.rotation % 2 === 0 ? ['Left', 'Right'] : ['Top', 'Bottom'];
    } else {
      if (pipe.rotation % 4 === 0) return ['Bottom', 'Right']; // ┏
      if (pipe.rotation % 4 === 1) return ['Bottom', 'Left']; // ┓
      if (pipe.rotation % 4 === 2) return ['Top', 'Left']; // ┛
      if (pipe.rotation % 4 === 3) return ['Top', 'Right']; // ┗
    }
    return [];
  };

  const checkWinCondition = (currentGrid: Pipe[]): Set<number> | null => {
    let queue: { idx: number, from: Direction, path: number[] }[] = [{ idx: 0, from: 'Left', path: [0] }];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr.idx)) continue;

      const pipe = currentGrid[curr.idx];
      const exits = getExits(pipe);

      if (!exits.includes(curr.from)) continue;

      visited.add(curr.idx);
      const outgoing = exits.filter(e => e !== curr.from);
      
      const r = Math.floor(curr.idx / size);
      const c = curr.idx % size;

      for (const outDir of outgoing) {
        if (curr.idx === size * size - 1 && outDir === 'Right') {
          return new Set(curr.path);
        }
        
        let nextR = r;
        let nextC = c;
        let nextFrom: Direction = 'Top';

        if (outDir === 'Top') { nextR = r - 1; nextFrom = 'Bottom'; }
        if (outDir === 'Bottom') { nextR = r + 1; nextFrom = 'Top'; }
        if (outDir === 'Left') { nextC = c - 1; nextFrom = 'Right'; }
        if (outDir === 'Right') { nextC = c + 1; nextFrom = 'Left'; }

        if (nextR >= 0 && nextR < size && nextC >= 0 && nextC < size) {
          queue.push({ idx: nextR * size + nextC, from: nextFrom, path: [...curr.path, nextR * size + nextC] });
        }
      }
    }
    return null;
  };

  const handlePipeClick = (idx: number) => {
    if (status !== 'playing') return;
    const newGrid = [...grid];
    newGrid[idx].rotation = (newGrid[idx].rotation + 1) % 4;
    setGrid(newGrid);

    const winPath = checkWinCondition(newGrid);
    if (winPath) {
      setStatus('stopped');
      setWinningPath(winPath);
      setResult('PERFECT! Linh tuyền đả thông!');
      setTimeout(() => onCompleteRef.current('perfect'), 2500); // Wait a bit longer to show the path
    }
  };

  const renderPipe = (pipe: Pipe) => {
    if (pipe.type === 'line') return pipe.rotation % 2 === 0 ? '━' : '┃';
    if (pipe.rotation % 4 === 0) return '┏';
    if (pipe.rotation % 4 === 1) return '┓';
    if (pipe.rotation % 4 === 2) return '┛';
    if (pipe.rotation % 4 === 3) return '┗';
    return '?';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-high border border-primary p-8 rounded-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">[ TƯỚI LINH TUYỀN ]</h2>
        <p className="mb-2 text-on-surface-variant">Xoay ống nối thông nguồn nước đến cuối cùng.</p>
        <p className="mb-6 text-xl font-bold text-error animate-pulse">00:{timeLeft < 10 ? '0' : ''}{timeLeft}</p>
        
        <div className="relative flex justify-center mb-8 w-fit mx-auto">
          <div className="absolute -left-12 top-4 text-primary font-bold animate-pulse text-2xl">~💧</div>
          
          <div className="bg-black p-2 rounded border border-outline-variant grid grid-cols-4 grid-rows-4 text-3xl font-mono leading-none">
            {grid.map((pipe, idx) => {
              const isWinCell = winningPath ? winningPath.has(pipe.id) : false;
              const isSolutionCell = status === 'stopped' && !winningPath && pipe.correctRotation !== undefined;
              const isHighlighted = isWinCell || isSolutionCell;
              
              return (
                <div 
                  key={pipe.id} 
                  onClick={() => handlePipeClick(idx)}
                  className={`w-12 h-12 flex items-center justify-center transition-colors select-none ${status === 'playing' ? 'hover:bg-primary/20 cursor-pointer text-primary-container hover:text-primary' : isHighlighted ? 'bg-secondary text-black font-bold' : 'text-outline-variant opacity-30'}`}
                >
                  {renderPipe(pipe)}
                </div>
              );
            })}
          </div>

          <div className="absolute -right-10 bottom-4 text-secondary font-bold text-2xl">🌱</div>
        </div>

        {result && (
          <div className={`text-xl font-bold mb-4 ${result.includes('PERFECT') ? 'text-secondary' : 'text-error'}`}>
            {result}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          {status === 'playing' ? (
            <button 
              onClick={onCancel}
              className="px-6 py-2 border border-outline-variant hover:text-error"
            >
              [ BỎ CUỘC ]
            </button>
          ) : (
            <button 
              onClick={() => onCompleteRef.current('fail')}
              className="px-6 py-2 border border-error bg-error/10 text-error hover:bg-error hover:text-black font-bold animate-pulse"
            >
              [ RỜI KHỎI ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
