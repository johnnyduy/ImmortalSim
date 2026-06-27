import React, { useState, useEffect, useRef } from 'react';

interface RedLightGreenLightGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

export default function RedLightGreenLightGame({ onComplete, onCancel }: RedLightGreenLightGameProps) {
  const [distance, setDistance] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  const statusRef = useRef(status);
  const scanRef = useRef(isScanning);
  const moveRef = useRef(isMoving);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { scanRef.current = isScanning; }, [isScanning]);
  useEffect(() => { moveRef.current = isMoving; }, [isMoving]);

  // AI Logic for Red/Green light
  useEffect(() => {
    if (status !== 'playing') return;

    let timeout: NodeJS.Timeout;

    const cycle = () => {
      if (statusRef.current !== 'playing') return;
      
      const scanning = !scanRef.current;
      setIsScanning(scanning);

      if (scanning) {
        // Red Light phase (1 to 2 seconds)
        timeout = setTimeout(cycle, 1000 + Math.random() * 1500);
      } else {
        // Green Light phase (2 to 4 seconds)
        timeout = setTimeout(cycle, 2000 + Math.random() * 2000);
      }
    };

    // Start with Green Light
    timeout = setTimeout(cycle, 2000);

    return () => clearTimeout(timeout);
  }, [status]);

  // Movement Logic & Detection
  useEffect(() => {
    if (status !== 'playing') return;

    const moveInterval = setInterval(() => {
      if (statusRef.current !== 'playing') return;

      if (moveRef.current) {
        if (scanRef.current) {
          // BUSTED
          setStatus('stopped');
          setResult('FAIL! Bị thần thức khóa chặt!');
          setTimeout(() => onComplete('fail'), 1500);
        } else {
          // MOVING SAFELY
          setDistance(prev => {
            const next = prev + 1;
            if (next >= 100) {
              setStatus('stopped');
              setResult('PERFECT! Lẻn qua thành công!');
              setTimeout(() => onComplete('perfect'), 1500);
            }
            return next;
          });
        }
      }
    }, 50);

    return () => clearInterval(moveInterval);
  }, [status, onComplete]);

  const handleStartMove = () => { if (status === 'playing') setIsMoving(true); };
  const handleStopMove = () => { setIsMoving(false); };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) handleStartMove();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') handleStopMove();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
      onMouseUp={handleStopMove}
      onTouchEnd={handleStopMove}
      onMouseLeave={handleStopMove}
    >
      <div className="bg-[#12141c] border-2 border-[#6366f1] p-6 rounded-xl max-w-md w-full text-center shadow-[0_0_40px_rgba(99,102,241,0.2)]">
        <h2 className="text-2xl font-bold text-[#818cf8] mb-2">[ LẨN TRỐN THẦN THỨC ]</h2>
        <p className="mb-6 text-[#818cf8]/70 text-sm">
          Nhấn giữ nút (hoặc Space) để đi. Buông ra NGAY LẬP TỨC khi Cảnh báo Đỏ!
        </p>
        
        {/* Status Indicator */}
        <div className={`mb-8 p-4 rounded-xl border-2 transition-all duration-300 ${
          isScanning 
            ? 'bg-red-900/40 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
            : 'bg-emerald-900/20 border-emerald-500/50'
        }`}>
          <div className="text-6xl mb-2 flex justify-center">
            {isScanning ? '👁️' : '😑'}
          </div>
          <p className={`text-xl font-bold tracking-widest ${isScanning ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
            {isScanning ? 'CẢNH BÁO QUÉT' : 'AN TOÀN'}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-6 bg-black rounded-full border border-[#818cf8]/30 mb-8 overflow-hidden flex items-center px-1">
            <div className="absolute right-2 text-xs text-white/50 z-10">MỤC TIÊU</div>
            <div 
                className="h-4 bg-gradient-to-r from-[#4f46e5] to-[#818cf8] rounded-full transition-none shadow-[0_0_10px_rgba(129,140,248,0.8)]"
                style={{ width: `${distance}%` }}
            />
        </div>

        <button 
          onMouseDown={handleStartMove}
          onTouchStart={handleStartMove}
          disabled={status !== 'playing'}
          className={`w-full py-4 border-2 font-bold transition-colors rounded-xl text-xl ${
            isMoving 
              ? 'bg-[#818cf8] text-white border-white scale-95' 
              : 'bg-[#818cf8]/20 text-[#818cf8] border-[#818cf8] hover:bg-[#818cf8]/40'
          } disabled:opacity-50`}
        >
          {isMoving ? '...ĐANG LẨN BƯỚC...' : '[ GIỮ ĐỂ ĐI ]'}
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
