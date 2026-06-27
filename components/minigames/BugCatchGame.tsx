import React, { useState, useEffect, useRef } from 'react';
import { BUG_SPECIES, BUG_RARITIES, BUG_STAGES, BUG_PERSONALITIES } from '../../lib/bugs';
import type { SpiritBugInstance, BugRarity, BugStage, BugElement, BugPersonality } from '../../types';

interface BugCatchGameProps {
  onComplete: (score: 'perfect' | 'good' | 'fail', caughtBug?: SpiritBugInstance) => void;
  onCancel: () => void;
}

export default function BugCatchGame({ onComplete, onCancel }: BugCatchGameProps) {
  const [bugPos, setBugPos] = useState({ x: 50, y: 50 }); // % of screen
  const [baitPos, setBaitPos] = useState<{ x: number, y: number } | null>(null);
  const [bugState, setBugState] = useState<'roaming' | 'moving_to_bait' | 'eating' | 'fleeing'>('roaming');
  const [showNetTiming, setShowNetTiming] = useState(false);
  const [netTimingValue, setNetTimingValue] = useState(0); // 0-100%
  const [netTimingDir, setNetTimingDir] = useState(1);
  const [result, setResult] = useState<string | null>(null);
  
  const bugPosRef = useRef(bugPos);
  const baitPosRef = useRef(baitPos);
  const bugStateRef = useRef(bugState);
  
  useEffect(() => { bugPosRef.current = bugPos; }, [bugPos]);
  useEffect(() => { baitPosRef.current = baitPos; }, [baitPos]);
  useEffect(() => { bugStateRef.current = bugState; }, [bugState]);

  // Bug movement logic
  useEffect(() => {
    let target = { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
    
    const interval = setInterval(() => {
      if (bugStateRef.current === 'fleeing' || bugStateRef.current === 'eating') return;

      const current = bugPosRef.current;
      const bait = baitPosRef.current;
      
      let dest = target;
      let speed = 2;

      if (bait && bugStateRef.current === 'moving_to_bait') {
        dest = bait;
        speed = 4; // faster when attracted
      }

      // Move towards dest
      const dx = dest.x - current.x;
      const dy = dest.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        if (bugStateRef.current === 'moving_to_bait') {
          setBugState('eating');
          setTimeout(() => {
            if (bugStateRef.current === 'eating') {
              setBaitPos(null);
              setBugState('roaming'); // finished eating
              setResult('Linh trùng ăn xong và bỏ đi!');
              setTimeout(() => onComplete('fail'), 1500);
            }
          }, 4000); // 4 seconds to eat
        } else {
          // pick new random target
          target = { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 };
        }
      } else {
        const moveX = (dx / dist) * Math.min(speed, dist);
        const moveY = (dy / dist) * Math.min(speed, dist);
        setBugPos({ x: current.x + moveX, y: current.y + moveY });
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Timing bar logic
  useEffect(() => {
    if (!showNetTiming) return;
    const interval = setInterval(() => {
      setNetTimingValue(v => {
        let next = v + netTimingDir * 5;
        if (next > 100) { next = 100; setNetTimingDir(-1); }
        if (next < 0) { next = 0; setNetTimingDir(1); }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [showNetTiming, netTimingDir]);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (bugState === 'fleeing' || showNetTiming || result) return;
    
    // Drop bait
    if (!baitPos) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setBaitPos({ x, y });
      setBugState('moving_to_bait');
    }
  };

  const handleThrowNet = () => {
    if (bugState !== 'eating') {
      setResult('Linh trùng đang bay loạn, quăng võng trượt!');
      setBugState('fleeing');
      setTimeout(() => onComplete('fail'), 1500);
      return;
    }
    setShowNetTiming(true);
  };

  const generateRandomBug = (): SpiritBugInstance => {
    const species = BUG_SPECIES[Math.floor(Math.random() * BUG_SPECIES.length)];
    
    // Rarity weights
    const roll = Math.random();
    let rarity: BugRarity = 'Phàm';
    if (roll > 0.95) rarity = 'Huyền';
    else if (roll > 0.8) rarity = 'Linh';

    return {
      id: `bug_${Date.now()}`,
      speciesId: species.id,
      name: `${rarity} ${species.name}`,
      rarity,
      stage: 'Ấu Trùng',
      age: 0,
      lifespan: species.baseLifespan + Math.floor(Math.random() * 12),
      comprehension: species.baseComprehension + Math.floor(Math.random() * 5),
      loyalty: 50 + Math.floor(Math.random() * 20),
      breedSpeed: 50 + Math.floor(Math.random() * 30),
      mutationRate: 5 + Math.floor(Math.random() * 10),
      element: species.element,
      personality: BUG_PERSONALITIES[Math.floor(Math.random() * BUG_PERSONALITIES.length)] as BugPersonality,
      job: 'none',
      exp: 0,
      produceProgress: 0,
      exploreProgress: 0
    };
  };

  const executeThrow = () => {
    setShowNetTiming(false);
    // Green zone is between 40 and 60
    if (netTimingValue >= 40 && netTimingValue <= 60) {
      setResult('PERFECT! Bắt trọn linh trùng!');
      const newBug = generateRandomBug();
      setTimeout(() => onComplete('perfect', newBug), 2000);
    } else if (netTimingValue < 40) {
      setResult('Quá nhẹ! Nó chui qua khe lưới mất!');
      setBugState('fleeing');
      setTimeout(() => onComplete('fail'), 2000);
    } else {
      setResult('Quá mạnh tay! Linh trùng nát bét!');
      setBugState('fleeing');
      setTimeout(() => onComplete('fail'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-high border border-primary p-8 rounded-lg max-w-2xl w-full text-center select-none relative">
        <h2 className="text-2xl font-bold text-primary mb-2">[ SĂN BẮT LINH TRÙNG ]</h2>
        <p className="mb-4 text-on-surface-variant text-sm">1. Click vào thảm cỏ để rắc Linh Hoa (Mồi nhử)<br/>2. Chờ nó ăn, rồi bấm QUĂNG VÕNG<br/>3. Căn thanh lực vào vùng màu xanh lục để bắt!</p>
        
        {/* Play Area */}
        <div 
          className="w-full h-64 bg-[#0a150f] border border-outline-variant relative overflow-hidden cursor-crosshair rounded"
          onClick={handleAreaClick}
        >
          {/* Bug */}
          {bugState !== 'fleeing' && (
            <div 
              className="absolute text-2xl transition-transform"
              style={{ left: `${bugPos.x}%`, top: `${bugPos.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              🪲
            </div>
          )}

          {/* Bait */}
          {baitPos && (
            <div 
              className="absolute text-xl animate-pulse"
              style={{ left: `${baitPos.x}%`, top: `${baitPos.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              🌸
            </div>
          )}
        </div>

        {/* Action / Timing area */}
        <div className="mt-6 h-20 flex flex-col items-center justify-center">
          {showNetTiming ? (
            <div className="w-full max-w-md">
              <div className="h-6 w-full border border-outline-variant bg-black relative rounded overflow-hidden">
                <div className="absolute top-0 bottom-0 bg-secondary/50" style={{ left: '40%', right: '40%' }} />
                <div className="absolute top-0 bottom-0 w-2 bg-primary transition-all duration-75" style={{ left: `${netTimingValue}%`, transform: 'translateX(-50%)' }} />
              </div>
              <button 
                onClick={executeThrow}
                className="mt-4 px-8 py-2 bg-primary text-black font-bold animate-pulse hover:bg-primary-container hover:text-black"
              >
                THU LƯỚI!
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={handleThrowNet}
                disabled={!baitPos || !!result}
                className="px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary transition-colors"
              >
                QUĂNG LƯỚI
              </button>
              <button 
                onClick={onCancel}
                disabled={!!result}
                className="px-6 py-2 border border-outline-variant hover:text-error disabled:opacity-30"
              >
                [ BỎ CUỘC ]
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className={`mt-4 text-xl font-bold ${result.includes('PERFECT') ? 'text-secondary' : 'text-error'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
