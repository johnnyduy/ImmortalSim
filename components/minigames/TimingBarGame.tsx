import React, { useState, useEffect, useRef } from 'react';

interface TimingBarGameProps {
  onComplete: (score: 'perfect' | 'good' | 'fail') => void;
  onCancel: () => void;
}

export default function TimingBarGame({ onComplete, onCancel }: TimingBarGameProps) {
  const [position, setPosition] = useState(0); // 0 to 100
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);
  
  const directionRef = useRef(1);
  const positionRef = useRef(0);
  const statusRef = useRef(status);

  // Define zones in percentage (0-100)
  const sweetSpotStart = 45;
  const sweetSpotEnd = 55;
  const goodSpotStart = 35;
  const goodSpotEnd = 65;

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status !== 'playing') return;

    const interval = setInterval(() => {
      setPosition(prev => {
        let next = prev + (directionRef.current * 1.5); // Speed multiplier
        if (next >= 100) {
          directionRef.current = -1;
          return 100;
        }
        if (next <= 0) {
          directionRef.current = 1;
          return 0;
        }
        return next;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [status]);

  const handleAction = () => {
    if (statusRef.current !== 'playing') return;
    setStatus('stopped');
    
    const p = positionRef.current;
    if (p >= sweetSpotStart && p <= sweetSpotEnd) {
      setResult('PERFECT! Hái Tuyết Liên thành công hoàn mỹ!');
      setTimeout(() => onComplete('perfect'), 1500);
    } else if (p >= goodSpotStart && p <= goodSpotEnd) {
      setResult('GOOD! Đã hái được rễ phụ Tuyết Liên.');
      setTimeout(() => onComplete('good'), 1500);
    } else {
      setResult('FAIL! Hoa Tuyết Liên đã khô héo!');
      setTimeout(() => onComplete('fail'), 1500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array, relies on refs

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101926] border-2 border-[#6496ff] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(100,150,255,0.3)]">
        <h2 className="text-2xl font-bold text-[#6496ff] mb-2">[ HÁI TUYẾT LIÊN ]</h2>
        <p className="mb-8 text-[#6496ff]/70 text-sm">
          Nhấn Không gian (Space) hoặc bấm nút khi kim chỉ vào vùng <span className="text-[#34d399] font-bold">Xanh</span>.
        </p>
        
        {/* Progress Bar Area */}
        <div className="relative h-12 bg-black rounded-full border border-[#6496ff]/30 mb-8 overflow-hidden shadow-inner cursor-pointer" onClick={handleAction}>
            {/* Good Zone (Yellow/Orange) */}
            <div 
                className="absolute h-full bg-[#d4af37]/40 top-0 transition-none"
                style={{ left: `${goodSpotStart}%`, width: `${goodSpotEnd - goodSpotStart}%` }}
            />
            {/* Sweet Spot Zone (Green) */}
            <div 
                className="absolute h-full bg-[#34d399]/80 top-0 transition-none shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                style={{ left: `${sweetSpotStart}%`, width: `${sweetSpotEnd - sweetSpotStart}%` }}
            />
            
            {/* The Moving Needle */}
            <div 
                className="absolute h-full w-[4px] bg-white top-0 -ml-[2px] transition-none shadow-[0_0_10px_rgba(255,255,255,1)] pointer-events-none"
                style={{ left: `${position}%` }}
            >
                {/* Needle indicators */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
            </div>
        </div>

        <div className="h-10 mb-4 flex items-center justify-center">
            {result && (
            <div className={`text-xl font-bold animate-pulse ${result.includes('PERFECT') ? 'text-[#34d399]' : result.includes('GOOD') ? 'text-[#d4af37]' : 'text-red-500'}`}>
                {result}
            </div>
            )}
        </div>

        <div className="flex gap-4 justify-center">
          <button 
            onClick={handleAction} 
            disabled={status !== 'playing'}
            className="flex-1 py-3 bg-[#6496ff]/20 text-[#6496ff] border border-[#6496ff] font-bold hover:bg-[#6496ff] hover:text-black transition-colors disabled:opacity-50 rounded"
          >
            [ HÁI ]
          </button>
        </div>
      </div>
    </div>
  );
}
