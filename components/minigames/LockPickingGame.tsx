import React, { useState, useEffect, useRef } from 'react';

interface LockPickingGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function LockPickingGame({ onComplete, onCancel }: LockPickingGameProps) {
  const [rotation, setRotation] = useState(0);
  const [locksCleared, setLocksCleared] = useState(0);
  const [phase, setPhase] = useState<'play' | 'stopped'>('play');
  const [result, setResult] = useState<string | null>(null);
  
  // Each lock needs a safe zone defined by a start angle and a width (in degrees)
  const [safeZone, setSafeZone] = useState({ start: 0, width: 40 });

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const rotationRef = useRef(0);
  const speedRef = useRef(180); // degrees per second

  useEffect(() => {
    // Generate initial safe zone
    generateSafeZone();
  }, []);

  const generateSafeZone = () => {
    const newStart = Math.random() * 300 + 30; // Random between 30 and 330
    const newWidth = Math.max(30, 60 - locksCleared * 10); // Shrinks with each success
    setSafeZone({ start: newStart, width: newWidth });
  };

  useEffect(() => {
    if (phase !== 'play') return;

    const animate = (time: number) => {
      if (lastTimeRef.current != undefined) {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        rotationRef.current = (rotationRef.current + speedRef.current * deltaTime) % 360;
        setRotation(rotationRef.current);
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

  const handlePick = () => {
    if (phase !== 'play') return;

    // Check if pointer is in safe zone
    // Pointer is at `rotationRef.current` (0 to 360)
    // Safe zone is from `safeZone.start` to `safeZone.start + safeZone.width`
    const pointer = rotationRef.current;
    let inZone = false;
    
    // Handle wrap around if safe zone crosses 360
    const end = safeZone.start + safeZone.width;
    if (end > 360) {
      inZone = pointer >= safeZone.start || pointer <= (end - 360);
    } else {
      inZone = pointer >= safeZone.start && pointer <= end;
    }

    if (inZone) {
      const newLocksCleared = locksCleared + 1;
      setLocksCleared(newLocksCleared);
      
      if (newLocksCleared >= 3) {
        endGame('perfect');
      } else {
        // Increase speed and generate new zone
        speedRef.current += 50;
        generateSafeZone();
      }
    } else {
      endGame('fail');
    }
  };

  const endGame = (outcome: 'perfect' | 'fail') => {
    setPhase('stopped');
    setResult(outcome === 'perfect' ? 'PHÁ TRẬN THÀNH CÔNG!' : 'TRẬN PHÁP PHẢN PHỆ!');
    setTimeout(() => {
      onComplete(outcome);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#2a1b18] to-[#120a08] border-2 border-[#fb923c] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(251,146,60,0.3)]">
        <h2 className="text-2xl font-bold text-[#fb923c] mb-2">[ PHÁ GIẢI TRẬN KHÓA ]</h2>
        <p className="mb-6 text-[#fb923c]/70 h-12 flex items-center justify-center">
          Nhấn [XUYÊN THẤU] khi luồng sáng đi qua vùng sinh môn! Cần phá {3 - locksCleared} lớp.
        </p>

        <div className="relative w-48 h-48 mx-auto mb-8 bg-black/50 rounded-full border border-[#fb923c]/30 shadow-[inset_0_0_20px_rgba(0,0,0,1)] flex items-center justify-center">
          {/* Safe Zone Arc */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="#fb923c"
              strokeWidth="16"
              strokeOpacity="0.2"
            />
            {/* Draw the safe zone as a stroke dasharray */}
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="#fb923c"
              strokeWidth="16"
              strokeDasharray={`${(safeZone.width / 360) * (2 * Math.PI * 80)} ${(2 * Math.PI * 80)}`}
              strokeDashoffset={-(safeZone.start / 360) * (2 * Math.PI * 80)}
              className="drop-shadow-[0_0_8px_#fb923c] transition-all duration-500"
            />
          </svg>

          {/* Center core */}
          <div className="w-16 h-16 bg-[#fb923c]/20 rounded-full border border-[#fb923c]/50 flex items-center justify-center font-bold text-[#fb923c]">
            {locksCleared}/3
          </div>

          {/* Pointer */}
          <div 
            className="absolute inset-0 z-10"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="absolute top-0 left-1/2 -ml-1 w-2 h-10 bg-white rounded-full shadow-[0_0_10px_white]"></div>
          </div>
        </div>

        <button
          onClick={handlePick}
          disabled={phase !== 'play'}
          className="px-8 py-3 bg-[#fb923c]/20 border border-[#fb923c] text-[#fb923c] font-bold text-lg rounded shadow-[0_0_15px_rgba(251,146,60,0.3)] hover:bg-[#fb923c]/40 active:bg-[#fb923c] active:text-black transition-colors disabled:opacity-50 mb-4 w-full"
        >
          [ XUYÊN THẤU ]
        </button>

        <div className="h-8">
          {result && (
            <div className={`text-xl font-bold animate-pulse ${result === 'PHÁ TRẬN THÀNH CÔNG!' ? 'text-green-400' : 'text-red-500'}`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[#fb923c]/20 pt-4">
          <button 
            onClick={onCancel}
            disabled={phase !== 'play'}
            className="text-[#fb923c]/50 hover:text-[#fb923c] text-sm"
          >
            [ Bỏ Cuộc ]
          </button>
        </div>
      </div>
    </div>
  );
}
