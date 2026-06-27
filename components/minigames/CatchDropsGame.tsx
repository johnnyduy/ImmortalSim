import React, { useState, useEffect, useRef } from 'react';

interface CatchDropsGameProps {
  onComplete: (score: 'perfect' | 'good' | 'fail') => void;
  onCancel: () => void;
}

interface Drop {
  id: number;
  col: number;
  row: number; // 0 to 100 percentage down
  type: 'good' | 'bad';
}

export default function CatchDropsGame({ onComplete, onCancel }: CatchDropsGameProps) {
  const [playerCol, setPlayerCol] = useState(50); // 0 to 100 percentage width
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);
  
  const [drops, setDrops] = useState<Drop[]>([]);
  const dropsRef = useRef(drops);
  const playerRef = useRef(playerCol);
  const statusRef = useRef(status);
  const scoreRef = useRef(score);

  const dropIdCounter = useRef(0);

  useEffect(() => { dropsRef.current = drops; }, [drops]);
  useEffect(() => { playerRef.current = playerCol; }, [playerCol]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    if (status !== 'playing') return;

    const gameLoop = setInterval(() => {
      setDrops(prev => {
        let newDrops = [...prev];
        // Move drops down
        newDrops = newDrops.map(d => ({ ...d, row: d.row + 5 }));

        // Check collisions
        const pCol = playerRef.current;
        // Basket width is around 15%. So if drop is within pCol - 7.5 to pCol + 7.5
        const caught = newDrops.filter(d => d.row >= 90 && Math.abs(d.col - pCol) <= 10);
        
        let pointDelta = 0;
        caught.forEach(d => {
          if (d.type === 'good') pointDelta += 1;
          else pointDelta -= 2;
        });

        if (pointDelta !== 0) {
          setScore(s => s + pointDelta);
        }

        // Remove caught and out of bounds
        newDrops = newDrops.filter(d => d.row < 100 && !caught.includes(d));

        // Spawn new drop (higher chance)
        if (Math.random() < 0.4) {
          newDrops.push({
            id: dropIdCounter.current++,
            col: 10 + Math.random() * 80, // Random col between 10 and 90
            row: 0,
            type: Math.random() > 0.3 ? 'good' : 'bad' // 70% good, 30% bad
          });
        }

        return newDrops;
      });
    }, 50); // 50ms tick

    return () => clearInterval(gameLoop);
  }, [status]);

  useEffect(() => {
    if (status !== 'playing') return;
    if (timeLeft <= 0) {
      setStatus('stopped');
      const finalScore = scoreRef.current;
      if (finalScore >= 12) {
        setResult('PERFECT! Tinh luyện Linh Tuyền hoàn mỹ!');
        setTimeout(() => onComplete('perfect'), 1500);
      } else if (finalScore >= 5) {
        setResult('GOOD! Tích tụ được một bình Linh Tuyền.');
        setTimeout(() => onComplete('good'), 1500);
      } else {
        setResult('FAIL! Bùn độc làm hỏng linh tuyền!');
        setTimeout(() => onComplete('fail'), 1500);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') return;
      
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        setPlayerCol(prev => Math.max(5, prev - 10));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        setPlayerCol(prev => Math.min(95, prev + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const moveLeft = () => setPlayerCol(prev => Math.max(5, prev - 15));
  const moveRight = () => setPlayerCol(prev => Math.min(95, prev + 15));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101926] border-2 border-[#34d399] p-6 sm:p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(52,211,153,0.3)]">
        <h2 className="text-2xl font-bold text-[#34d399] mb-2">[ LỌC LINH TUYỀN ]</h2>
        <p className="mb-2 text-[#34d399]/70 text-sm h-10">
          Dùng mũi tên Trái/Phải (hoặc nút bấm) để hứng Linh Tuyền (💧) và né Bùn Độc (🟣).
        </p>
        
        <div className="flex justify-between items-center mb-4 px-4">
          <p className="text-xl font-bold text-[#6496ff]">THU: {score} Giọt</p>
          <p className="text-xl font-bold text-red-500 animate-pulse">00:{timeLeft.toString().padStart(2, '0')}</p>
        </div>
        
        <div className="bg-black/50 p-2 rounded-xl border border-[#34d399]/30 mb-6 relative w-full h-[250px] overflow-hidden">
            {/* The Drops */}
            {drops.map(d => (
                <div 
                    key={d.id} 
                    className="absolute text-2xl -translate-x-1/2 transition-all duration-75"
                    style={{ left: `${d.col}%`, top: `${d.row}%` }}
                >
                    {d.type === 'good' ? '💧' : '🟣'}
                </div>
            ))}

            {/* The Basket */}
            <div 
                className="absolute bottom-2 text-4xl -translate-x-1/2 transition-all duration-75"
                style={{ left: `${playerCol}%` }}
            >
                🪣
            </div>
        </div>

        <div className="flex gap-4 justify-center mb-6">
          <button onClick={moveLeft} className="flex-1 py-3 bg-[#34d399]/20 border border-[#34d399] text-[#34d399] font-bold hover:bg-[#34d399] hover:text-black transition-colors rounded text-xl">
             ⬅️
          </button>
          <button onClick={moveRight} className="flex-1 py-3 bg-[#34d399]/20 border border-[#34d399] text-[#34d399] font-bold hover:bg-[#34d399] hover:text-black transition-colors rounded text-xl">
             ➡️
          </button>
        </div>

        <div className="h-8 flex items-center justify-center">
            {result && (
            <div className={`text-xl font-bold ${result.includes('PERFECT') || result.includes('GOOD') ? 'text-[#34d399]' : 'text-red-500'}`}>
                {result}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
