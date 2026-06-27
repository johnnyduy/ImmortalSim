import React, { useState, useEffect, useRef } from 'react';

interface SpamClickGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function SpamClickGame({ onComplete, onCancel }: SpamClickGameProps) {
  const [power, setPower] = useState(50); // 0 to 100
  const [timeLeft, setTimeLeft] = useState(10);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  const powerRef = useRef(power);
  useEffect(() => { powerRef.current = power; }, [power]);

  // Enemy pushes back constantly
  useEffect(() => {
    if (status !== 'playing') return;

    const pushInterval = setInterval(() => {
      setPower(prev => {
        // Enemy gets stronger as time goes down
        const enemyForce = 0.5 + ((10 - timeLeft) * 0.1); 
        const next = Math.max(0, prev - enemyForce);
        if (next <= 0) {
          setStatus('stopped');
          setResult('FAIL! Hắc khí thôn phệ!');
          setTimeout(() => onComplete('fail'), 1500);
        }
        return next;
      });
    }, 50);

    return () => clearInterval(pushInterval);
  }, [status, timeLeft, onComplete]);

  // Timer
  useEffect(() => {
    if (status !== 'playing') return;
    if (timeLeft <= 0) {
      setStatus('stopped');
      if (powerRef.current >= 50) {
        setResult('PERFECT! Áp đảo Tà tu!');
        setTimeout(() => onComplete('perfect'), 1500);
      } else {
        setResult('FAIL! Chân khí cạn kiệt, bại trận!');
        setTimeout(() => onComplete('fail'), 1500);
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status, onComplete]);

  const handlePlayerClick = () => {
    if (status !== 'playing') return;
    setPower(prev => {
      const next = Math.min(100, prev + 4);
      if (next >= 100) {
        setStatus('stopped');
        setResult('PERFECT! Phá vỡ phòng ngự Tà tu!');
        setTimeout(() => onComplete('perfect'), 1500);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayerClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handlePlayerClick}>
      <div className="bg-[#120a10] border-2 border-purple-500/50 p-6 rounded-xl max-w-md w-full text-center shadow-[0_0_40px_rgba(168,85,247,0.2)]" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-purple-400 mb-2">[ ĐẤU PHÁP GIẰNG CO ]</h2>
        <p className="mb-4 text-purple-300/70 text-sm">
          Nhấp chuột (hoặc Space) liên tục để đẩy lùi hắc khí của Tà tu!
        </p>
        
        <div className="flex justify-between items-center mb-6 px-4">
          <span className="text-red-500 font-bold">ĐỊCH</span>
          <p className="text-xl font-bold text-white animate-pulse">00:{timeLeft.toString().padStart(2, '0')}</p>
          <span className="text-[#34d399] font-bold">BẠN</span>
        </div>
        
        <div className="relative h-12 bg-black rounded-full border border-purple-500/30 mb-8 overflow-hidden shadow-inner flex">
            {/* Enemy Side (Red/Black) */}
            <div 
                className="h-full bg-gradient-to-r from-black to-red-900 transition-all duration-75"
                style={{ width: `${100 - power}%` }}
            />
            {/* Player Side (Green/Cyan) */}
            <div 
                className="h-full bg-gradient-to-l from-[#047857] to-[#34d399] transition-all duration-75 relative"
                style={{ width: `${power}%` }}
            >
                {/* Energy Clash Effect */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-16 bg-white blur-md rounded-full" />
            </div>
        </div>

        <button 
          onClick={handlePlayerClick}
          className="w-full py-4 bg-purple-900/30 border-2 border-purple-500 text-purple-300 font-bold hover:bg-purple-600 hover:text-white transition-colors rounded-xl text-xl active:scale-95"
        >
          [ PHÁP BẢO CÔNG KÍCH ]
        </button>

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
