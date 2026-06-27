import React, { useState, useEffect, useRef } from 'react';

interface WhackAMoleGameProps {
  onComplete: (score: 'perfect' | 'good' | 'fail') => void;
  onCancel: () => void;
}

export default function WhackAMoleGame({ onComplete, onCancel }: WhackAMoleGameProps) {
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [activeFake, setActiveFake] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);
  
  const targetHits = 5;

  useEffect(() => {
    if (status !== 'playing') return;

    if (timeLeft <= 0) {
      setStatus('stopped');
      setResult('HẾT GIỜ! Đan sâm đã độn thổ đào tẩu!');
      setTimeout(() => onComplete('fail'), 1500);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  useEffect(() => {
    if (status !== 'playing') return;

    const popTimer = setInterval(() => {
      // Pick random hole for Mole
      const moleHole = Math.floor(Math.random() * 9);
      setActiveMole(moleHole);
      
      // Randomly spawn fake (Snake) 30% chance
      if (Math.random() > 0.7) {
        let fakeHole;
        do {
          fakeHole = Math.floor(Math.random() * 9);
        } while (fakeHole === moleHole);
        setActiveFake(fakeHole);
      } else {
        setActiveFake(null);
      }
      
      // Clear after short time (faster as time goes down)
      setTimeout(() => {
        setActiveMole(null);
        setActiveFake(null);
      }, 700 + (timeLeft * 20)); 

    }, 1000 + (timeLeft * 20));

    return () => clearInterval(popTimer);
  }, [status, timeLeft]);

  const handleHit = (idx: number) => {
    if (status !== 'playing') return;

    if (idx === activeMole) {
      setHits(h => {
        const newHits = h + 1;
        if (newHits >= targetHits) {
          setStatus('stopped');
          const isPerfect = timeLeft >= 5;
          setResult(isPerfect ? 'PERFECT! Bắt gọn Đan Sâm vạn năm!' : 'GOOD! Tóm được Đan Sâm!');
          setTimeout(() => onComplete(isPerfect ? 'perfect' : 'good'), 1500);
        }
        return newHits;
      });
      setActiveMole(null); // hide immediately
    } else if (idx === activeFake) {
      setTimeLeft(t => Math.max(0, t - 3)); // Penalty
      setActiveFake(null);
      // visual feedback can be added
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1f1610] border-2 border-[#d4af37] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        <h2 className="text-2xl font-bold text-[#d4af37] mb-2">[ BẮT ĐAN SÂM ]</h2>
        <p className="mb-4 text-[#d4af37]/70">
          Đập trúng Đan Sâm (🥕) {targetHits} lần! Tránh Độc Xà (🐍) (-3s).
        </p>
        
        <div className="flex justify-between items-center mb-6 px-4">
            <p className="text-xl font-bold text-red-500">
                TIME: <span className="animate-pulse">00:{timeLeft.toString().padStart(2, '0')}</span>
            </p>
            <p className="text-xl font-bold text-[#34d399]">
                BẮT: {hits}/{targetHits}
            </p>
        </div>
        
        <div className="bg-[#110c08] p-4 rounded-xl border border-[#d4af37]/30 mb-8 grid grid-cols-3 gap-4">
          {Array(9).fill(null).map((_, idx) => (
            <div 
              key={idx} 
              onClick={() => handleHit(idx)}
              className="aspect-square relative bg-[#2a1e16] rounded-full border-4 border-[#1a120c] overflow-hidden cursor-pointer shadow-inner"
            >
              {/* Hole shadow */}
              <div className="absolute inset-0 bg-black/50 rounded-full" />
              
              {/* Pop up entity */}
              <div className={`absolute bottom-0 w-full text-5xl flex justify-center transition-transform duration-100 ${
                  activeMole === idx || activeFake === idx ? 'translate-y-0' : 'translate-y-full'
              }`}>
                  {activeMole === idx && '🥕'}
                  {activeFake === idx && '🐍'}
              </div>
            </div>
          ))}
        </div>

        <div className="h-10 flex items-center justify-center">
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
