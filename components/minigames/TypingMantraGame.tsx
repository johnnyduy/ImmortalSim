import React, { useState, useEffect } from 'react';

interface TypingMantraGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const WORDS = [
  "LINH KHI", "TU TIEN", "DAO TAM", "TRUC CO", "KIM DAN", 
  "NGUYEN ANH", "HOA THAN", "THIEN DAO", "PHI THANG", "CHAN KHUYET"
];

export default function TypingMantraGame({ onComplete, onCancel }: TypingMantraGameProps) {
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [phase, setPhase] = useState<'play' | 'stopped'>('play');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Pick 3 random words
    const picked = [];
    const pool = [...WORDS];
    for (let i = 0; i < 3; i++) {
      const r = Math.floor(Math.random() * pool.length);
      picked.push(pool[r]);
      pool.splice(r, 1);
    }
    setTargetWords(picked);
  }, []);

  useEffect(() => {
    if (phase !== 'play') return;
    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame('fail');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'play' || targetWords.length === 0) return;
      
      const currentWord = targetWords[currentWordIdx];
      const expectedChar = currentWord[typedChars];

      // Handle space
      if (e.key === ' ' && expectedChar === ' ') {
        e.preventDefault();
        advanceChar();
      } 
      // Handle letter (case insensitive)
      else if (e.key.length === 1 && e.key.toUpperCase() === expectedChar.toUpperCase()) {
        advanceChar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, targetWords, currentWordIdx, typedChars]);

  const advanceChar = () => {
    const currentWord = targetWords[currentWordIdx];
    const newTypedChars = typedChars + 1;
    
    if (newTypedChars >= currentWord.length) {
      // Finished word
      if (currentWordIdx + 1 >= targetWords.length) {
        // Finished all words
        setTypedChars(newTypedChars);
        endGame('perfect');
      } else {
        // Next word
        setCurrentWordIdx(currentWordIdx + 1);
        setTypedChars(0);
      }
    } else {
      setTypedChars(newTypedChars);
    }
  };

  const endGame = (outcome: 'perfect' | 'fail') => {
    setPhase('stopped');
    setResult(outcome === 'perfect' ? 'TỤNG NIỆM THÀNH CÔNG!' : 'SAI KHẨU QUYẾT!');
    setTimeout(() => {
      onComplete(outcome);
    }, 1500);
  };

  const currentWord = targetWords[currentWordIdx] || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] border-2 border-[#818cf8] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(129,140,248,0.3)]">
        <h2 className="text-2xl font-bold text-[#818cf8] mb-2">[ TỤNG NIỆM KHẨU QUYẾT ]</h2>
        <p className="mb-6 text-[#818cf8]/70 h-12 flex items-center justify-center">
          Gõ nhanh các khẩu quyết xuất hiện trên màn hình!
        </p>

        <div className="h-10 flex items-center justify-center mb-6">
            <p className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-[#818cf8]'}`}>00:{timeLeft.toString().padStart(2, '0')}</p>
        </div>

        <div className="bg-black/40 border border-[#818cf8]/30 rounded-lg p-6 mb-6">
          <p className="text-[#818cf8]/50 text-sm mb-2">Khẩu quyết {currentWordIdx + 1}/3</p>
          <div className="text-4xl font-mono tracking-widest flex justify-center">
            {currentWord.split('').map((char, idx) => (
              <span key={idx} className={`${idx < typedChars ? 'text-green-400' : idx === typedChars ? 'text-white border-b-2 border-[#818cf8] animate-pulse' : 'text-gray-600'} ${char === ' ' ? 'w-4' : ''}`}>
                {char}
              </span>
            ))}
          </div>
        </div>

        <div className="h-8">
          {result && (
            <div className={`text-xl font-bold animate-pulse ${result === 'TỤNG NIỆM THÀNH CÔNG!' ? 'text-green-400' : 'text-red-500'}`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[#818cf8]/20 pt-4">
          <button 
            onClick={onCancel}
            disabled={phase !== 'play'}
            className="text-[#818cf8]/50 hover:text-[#818cf8] text-sm"
          >
            [ Bỏ Cuộc ]
          </button>
        </div>
      </div>
    </div>
  );
}
