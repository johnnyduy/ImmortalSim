import React, { useState, useEffect } from 'react';

interface SimonSaysGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const ELEMENTS = [
  { id: 0, name: 'KIM', color: 'bg-yellow-400', glow: 'shadow-[0_0_20px_#facc15]' },
  { id: 1, name: 'MỘC', color: 'bg-green-500', glow: 'shadow-[0_0_20px_#22c55e]' },
  { id: 2, name: 'THỦY', color: 'bg-blue-400', glow: 'shadow-[0_0_20px_#60a5fa]' },
  { id: 3, name: 'HỎA', color: 'bg-red-500', glow: 'shadow-[0_0_20px_#ef4444]' }
];

export default function SimonSaysGame({ onComplete, onCancel }: SimonSaysGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [phase, setPhase] = useState<'showing' | 'playing' | 'stopped'>('showing');
  const [activeOrb, setActiveOrb] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Generate a sequence of 5 elements
    const seq = Array(5).fill(0).map(() => Math.floor(Math.random() * 4));
    setSequence(seq);

    // Play sequence
    let step = 0;
    const playInterval = setInterval(() => {
      if (step >= seq.length) {
        clearInterval(playInterval);
        setActiveOrb(null);
        setPhase('playing');
        return;
      }
      
      // Turn on
      setActiveOrb(seq[step]);
      
      // Turn off after 500ms
      setTimeout(() => {
        setActiveOrb(null);
      }, 500);

      step++;
    }, 1000);

    return () => {
      clearInterval(playInterval);
    };
  }, []);

  const handleOrbClick = (id: number) => {
    if (phase !== 'playing') return;

    // Flash orb briefly
    setActiveOrb(id);
    setTimeout(() => setActiveOrb(null), 200);

    if (id === sequence[playerStep]) {
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);
      
      if (nextStep >= sequence.length) {
        endGame('perfect');
      }
    } else {
      endGame('fail');
    }
  };

  const endGame = (outcome: 'perfect' | 'fail') => {
    setPhase('stopped');
    setResult(outcome === 'perfect' ? 'KHAI MỞ THÀNH CÔNG!' : 'SAI TRÌNH TỰ!');
    setTimeout(() => {
      onComplete(outcome);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#1c1917] to-[#0c0a09] border-2 border-[#d6d3d1] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(214,211,209,0.2)]">
        <h2 className="text-2xl font-bold text-[#d6d3d1] mb-2">[ KHAI MỞ NGŨ HÀNH ]</h2>
        <p className="mb-6 text-[#d6d3d1]/70 h-12 flex items-center justify-center">
          {phase === 'showing' ? 'Hãy ghi nhớ trình tự phát sáng!' : 'Lặp lại trình tự để mở khóa!'}
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8 w-48 mx-auto">
          {ELEMENTS.map((el) => (
            <button
              key={el.id}
              onClick={() => handleOrbClick(el.id)}
              disabled={phase !== 'playing'}
              className={`aspect-square rounded-full transition-all duration-200 border-2 border-white/20 flex items-center justify-center font-bold text-white text-xl
                ${activeOrb === el.id ? `${el.color} ${el.glow} scale-110` : 'bg-zinc-800 hover:bg-zinc-700 opacity-50'}
              `}
            >
              {el.name}
            </button>
          ))}
        </div>

        <div className="h-8 mb-4 flex justify-center items-center space-x-2">
            {Array(5).fill(0).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < playerStep ? 'bg-[#d6d3d1]' : 'bg-zinc-800'}`}></div>
            ))}
        </div>

        <div className="h-8">
          {result && (
            <div className={`text-xl font-bold animate-pulse ${result === 'KHAI MỞ THÀNH CÔNG!' ? 'text-green-400' : 'text-red-500'}`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[#d6d3d1]/20 pt-4">
          <button 
            onClick={onCancel}
            disabled={phase !== 'playing'}
            className="text-[#d6d3d1]/50 hover:text-[#d6d3d1] text-sm"
          >
            [ Bỏ Cuộc ]
          </button>
        </div>
      </div>
    </div>
  );
}
