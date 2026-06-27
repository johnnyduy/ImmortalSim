import React, { useState, useEffect, useRef } from 'react';

interface TrackingGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const COLORS = [
  { id: 'RED', color: 'bg-red-500', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.8)]' },
  { id: 'GREEN', color: 'bg-green-500', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.8)]' },
  { id: 'BLUE', color: 'bg-blue-500', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.8)]' },
  { id: 'PURPLE', color: 'bg-purple-500', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.8)]' },
];

export default function TrackingGame({ onComplete, onCancel }: TrackingGameProps) {
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [round, setRound] = useState(0);
  const [doorColors, setDoorColors] = useState<typeof COLORS | null>(null);
  const [phase, setPhase] = useState<'memorize' | 'flash' | 'pick' | 'stopped'>('memorize');
  const [result, setResult] = useState<string | null>(null);

  const MAX_ROUNDS = 3;

  const startRound = () => {
    // Generate 3 random colors for doors, one must be target
    const others = COLORS.filter(c => c.id !== targetColor.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    
    const roundColors = [targetColor, shuffledOthers[0], shuffledOthers[1]];
    // Shuffle the 3 doors
    roundColors.sort(() => Math.random() - 0.5);
    
    setDoorColors(roundColors);
    setPhase('flash');

    // Flash for 0.5s then hide
    setTimeout(() => {
      setPhase('pick');
    }, 500);
  };

  useEffect(() => {
    // Init game
    const tColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTargetColor(tColor);
    setPhase('memorize');

    setTimeout(() => {
      startRound();
    }, 2000);
  }, []);

  const handlePick = (idx: number) => {
    if (phase !== 'pick' || !doorColors) return;

    if (doorColors[idx].id === targetColor.id) {
      // Correct
      const nextRound = round + 1;
      setRound(nextRound);
      
      if (nextRound >= MAX_ROUNDS) {
        setPhase('stopped');
        setResult('PERFECT! Truy tung thành công!');
        setTimeout(() => onComplete('perfect'), 1500);
      } else {
        setPhase('flash');
        setTimeout(() => startRound(), 500);
      }
    } else {
      // Wrong
      setPhase('stopped');
      setResult('FAIL! Mất dấu Tà tu!');
      setTimeout(() => onComplete('fail'), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border-2 border-[#52525b] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(82,82,91,0.3)]">
        <h2 className="text-2xl font-bold text-[#d4d4d8] mb-2">[ TRUY CÙNG DIỆT TẬN ]</h2>
        
        {phase === 'memorize' ? (
            <div className="py-8">
                <p className="mb-4 text-xl">Tàn dư linh khí của kẻ địch màu:</p>
                <div className={`w-20 h-20 mx-auto rounded-full ${targetColor.color} ${targetColor.glow} animate-pulse`} />
            </div>
        ) : (
            <>
                <p className="mb-6 text-[#a1a1aa] text-sm">
                    Chọn đúng cánh cửa có tàn dư khói màu của địch! ({round}/{MAX_ROUNDS})
                </p>

                <div className="flex justify-center gap-4 mb-8">
                    {Array(3).fill(null).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => handlePick(idx)}
                            disabled={phase !== 'pick'}
                            className={`w-20 h-32 rounded-t-full border-2 transition-all duration-300 relative overflow-hidden ${
                                phase === 'pick' 
                                    ? 'border-[#52525b] bg-[#18181b] hover:bg-[#27272a] hover:border-[#a1a1aa] cursor-pointer' 
                                    : 'border-transparent'
                            }`}
                        >
                            {/* Smoke effect */}
                            <div className={`absolute inset-0 transition-opacity duration-300 ${phase === 'flash' ? 'opacity-100' : 'opacity-0'}`}>
                                {doorColors && (
                                    <div className={`w-full h-full ${doorColors[idx].color} ${doorColors[idx].glow} blur-md opacity-80`} />
                                )}
                            </div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        </button>
                    ))}
                </div>
            </>
        )}

        <div className="h-8 mt-4 flex items-center justify-center">
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
