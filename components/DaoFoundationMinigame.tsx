import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { getCultivationGainMultiplier } from '../lib/engine';

interface DaoFoundationMinigameProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  months: number;
  onClose: () => void;
  onComplete: (choiceId: string) => void;
}

const GRID_WIDTH = 10;
const GRID_HEIGHT = 15;
const SECONDS_PER_MONTH = 20;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]] },
  J: { shape: [[1, 0, 0], [1, 1, 1]] },
  L: { shape: [[0, 0, 1], [1, 1, 1]] },
  O: { shape: [[1, 1], [1, 1]] },
  S: { shape: [[0, 1, 1], [1, 1, 0]] },
  T: { shape: [[0, 1, 0], [1, 1, 1]] },
  Z: { shape: [[1, 1, 0], [0, 1, 1]] }
};

const ELEMENTS = [
  { name: 'Kim', color: 'bg-yellow-400' },
  { name: 'Mộc', color: 'bg-green-500' },
  { name: 'Thủy', color: 'bg-blue-500' },
  { name: 'Hỏa', color: 'bg-red-500' },
  { name: 'Thổ', color: 'bg-amber-700' }
];

type GridCell = { element: any; color: string } | null;

export default function DaoFoundationMinigame({ game, setGame, months, onClose, onComplete }: DaoFoundationMinigameProps) {
  const [grid, setGrid] = useState<GridCell[][]>(Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null)));
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [linesCleared, setLinesCleared] = useState(0);
  const [timeLeft, setTimeLeft] = useState(months * SECONDS_PER_MONTH);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  const baseGain = (0.3 + (game.stats.comprehension * 0.05)) * getCultivationGainMultiplier(game);
  
  // Use Refs to store latest props/state to avoid re-triggering effects
  const onCompleteRef = useRef(onComplete);
  const gridRef = useRef(grid);
  const linesClearedRef = useRef(linesCleared);
  const currentPieceRef = useRef(currentPiece);
  const positionRef = useRef(position);
  const lastArrowDownTimeRef = useRef(0);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { linesClearedRef.current = linesCleared; }, [linesCleared]);
  useEffect(() => { currentPieceRef.current = currentPiece; }, [currentPiece]);
  useEffect(() => { positionRef.current = position; }, [position]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fallRef = useRef<NodeJS.Timeout | null>(null);

  const checkCollision = useCallback((piece: any, pos: { x: number, y: number }, currentGrid: GridCell[][]) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = pos.y + y;
          const newX = pos.x + x;
          if (newY >= GRID_HEIGHT || newX < 0 || newX >= GRID_WIDTH || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const handleGameOver = useCallback((earnedLines: number) => {
    setGameOver(true);
    setIsStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (fallRef.current) clearInterval(fallRef.current);
    
    const earnedCultivation = earnedLines * baseGain;
    onCompleteRef.current(`action_be_quan_complete_${months}_${earnedCultivation}`);
  }, [baseGain, months]);

  const spawnPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)] as keyof typeof TETROMINOES;
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const piece = {
      shape: TETROMINOES[randomKey].shape,
      color: element.color,
      element
    };
    const startX = Math.floor(GRID_WIDTH / 2) - Math.floor(piece.shape[0].length / 2);
    
    setCurrentPiece(piece);
    setPosition({ x: startX, y: 0 });
    
    // Check game over immediately on spawn using the latest grid
    if (checkCollision(piece, { x: startX, y: 0 }, gridRef.current)) {
      handleGameOver(linesClearedRef.current);
    }
  }, [checkCollision, handleGameOver]);

  const lockPiece = useCallback((overridePos?: {x: number, y: number}) => {
    const piece = currentPieceRef.current;
    const pos = overridePos || positionRef.current;
    if (!piece) return;
    
    const newGrid = gridRef.current.map(row => [...row]);
    let gameOverCheck = false;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const gridY = pos.y + y;
          const gridX = pos.x + x;
          if (gridY < 0) {
            gameOverCheck = true;
          } else {
            newGrid[gridY][gridX] = { element: piece.element, color: piece.color };
          }
        }
      }
    }
    
    if (gameOverCheck) {
      handleGameOver(linesClearedRef.current);
      return;
    }
    
    // Check lines
    const filteredGrid = newGrid.filter(row => !row.every(cell => cell !== null));
    const cleared = GRID_HEIGHT - filteredGrid.length;
    
    if (cleared > 0) {
      setLinesCleared(prev => prev + cleared);
      const emptyRows = Array.from({ length: cleared }, () => Array(GRID_WIDTH).fill(null));
      setGrid([...emptyRows, ...filteredGrid]);
    } else {
      setGrid(newGrid);
    }
    
    spawnPiece();
  }, [spawnPiece, handleGameOver]);

  // Handle Ctrl+R shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handleGameOver(months); // Auto complete gives exactly 'months' lines
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGameOver, months]);

  // Handle keyboard inputs for Tetris
  useEffect(() => {
    if (!isStarted || gameOver) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const piece = currentPieceRef.current;
      const pos = positionRef.current;
      if (!piece) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (!checkCollision(piece, { x: pos.x - 1, y: pos.y }, gridRef.current)) {
            setPosition({ x: pos.x - 1, y: pos.y });
          }
          break;
        case 'ArrowRight':
          if (!checkCollision(piece, { x: pos.x + 1, y: pos.y }, gridRef.current)) {
            setPosition({ x: pos.x + 1, y: pos.y });
          }
          break;
        case 'ArrowDown': {
          const now = Date.now();
          if (now - lastArrowDownTimeRef.current < 300) {
            // Hard drop
            let newY = pos.y;
            while (!checkCollision(piece, { x: pos.x, y: newY + 1 }, gridRef.current)) {
              newY++;
            }
            setPosition({ x: pos.x, y: newY });
            lockPiece({ x: pos.x, y: newY });
          } else {
            // Normal drop
            if (!checkCollision(piece, { x: pos.x, y: pos.y + 1 }, gridRef.current)) {
              setPosition({ x: pos.x, y: pos.y + 1 });
            } else {
              lockPiece();
            }
          }
          lastArrowDownTimeRef.current = now;
          break;
        }
        case 'ArrowUp':
          // Rotate
          const rotated = piece.shape[0].map((_: any, index: number) => piece.shape.map((row: any) => row[index]).reverse());
          const rotatedPiece = { ...piece, shape: rotated };
          if (!checkCollision(rotatedPiece, pos, gridRef.current)) {
            setCurrentPiece(rotatedPiece);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, gameOver, checkCollision, lockPiece]);

  // Start game timer and initial piece
  useEffect(() => {
    if (isStarted && !gameOver) {
      spawnPiece();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameOver(linesClearedRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, gameOver, spawnPiece, handleGameOver]);

  // Fall loop
  useEffect(() => {
    if (!isStarted || gameOver) return;
    
    fallRef.current = setInterval(() => {
      const piece = currentPieceRef.current;
      const pos = positionRef.current;
      if (!piece) return;

      if (!checkCollision(piece, { x: pos.x, y: pos.y + 1 }, gridRef.current)) {
        setPosition({ x: pos.x, y: pos.y + 1 });
      } else {
        lockPiece();
      }
    }, 500); // Speed of falling
    
    return () => {
      if (fallRef.current) clearInterval(fallRef.current);
    };
  }, [isStarted, gameOver, checkCollision, lockPiece]);

  // Create render grid combining static grid and moving piece
  const renderGrid = grid.map(row => [...row]);
  if (currentPiece && !gameOver && isStarted) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const gridY = position.y + y;
          const gridX = position.x + x;
          if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
            renderGrid[gridY][gridX] = { element: currentPiece.element, color: currentPiece.color };
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-emerald-500 font-code p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-400">TỤ ĐẠO CƠ (TETRIS NGŨ HÀNH)</h2>
        <button onClick={onClose} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-600">Thoát</button>
      </div>
      
      {!isStarted && !gameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-zinc-800 rounded bg-zinc-900/50">
          <p className="mb-4 text-zinc-400">Ngưng tụ ngũ hành, lấp đầy Đạo Cơ.</p>
          <ul className="list-disc list-inside mb-6 text-sm text-zinc-500">
            <li>Sử dụng mũi tên <b>Trái/Phải</b> để di chuyển</li>
            <li>Sử dụng mũi tên <b>Lên</b> để xoay</li>
            <li>Sử dụng mũi tên <b>Xuống</b> để rớt nhanh</li>
            <li>Thời gian: {months * SECONDS_PER_MONTH} giây</li>
          </ul>
          <button 
            onClick={() => setIsStarted(true)}
            className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded"
          >
            Bắt đầu Bế Quan
          </button>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 justify-center">
          {/* Left panel */}
          <div className="flex flex-col w-48 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded">
              <div className="text-xs text-zinc-500">Thời gian</div>
              <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded">
              <div className="text-xs text-zinc-500">Đạo Cơ (Dòng)</div>
              <div className="text-2xl font-bold text-amber-400">{linesCleared}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded mt-auto">
              <div className="text-xs text-zinc-500">Dự kiến Tu Vi</div>
              <div className="text-lg font-bold text-cyan-400">+{(linesCleared * baseGain).toFixed(2)}</div>
            </div>
          </div>
          
          {/* Game Grid */}
          <div 
            className="bg-black border-2 border-zinc-700 rounded p-1"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_HEIGHT}, minmax(0, 1fr))`,
              width: '300px',
              height: '450px',
              gap: '1px'
            }}
          >
            {renderGrid.flat().map((cell, idx) => (
              <div 
                key={idx} 
                className={`${cell ? cell.color : 'bg-zinc-900'} w-full h-full flex items-center justify-center text-[10px] font-bold opacity-90`}
              >
                {cell && cell.element.name}
              </div>
            ))}
          </div>
          
          {/* Right Panel */}
          <div className="w-48"></div>
        </div>
      )}
    </div>
  );
}
