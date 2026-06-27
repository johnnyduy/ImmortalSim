import React, { useState, useEffect } from 'react';

interface WordScrambleGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const WORDS = [
  "DAOTAM", "LINHKHI", "TRUCCO", "KIMDAN", "HOATHAN", "DOTKIEP", "TUCHAN"
];

export default function WordScrambleGame({ onComplete, onCancel }: WordScrambleGameProps) {
  const [targetWord, setTargetWord] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState<{char: string, id: number, used: boolean}[]>([]);
  const [currentGuess, setCurrentGuess] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [phase, setPhase] = useState<'play' | 'stopped'>('play');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Pick a random word
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTargetWord(word);
    
    // Scramble letters
    const letters = word.split('').map((char, index) => ({ char, id: index, used: false }));
    // Shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setScrambledLetters(letters);
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

  const handleLetterClick = (id: number) => {
    if (phase !== 'play') return;
    
    const letterObj = scrambledLetters.find(l => l.id === id);
    if (!letterObj || letterObj.used) return;

    // Check if correct
    const expectedChar = targetWord[currentGuess.length];
    if (letterObj.char === expectedChar) {
        // Correct guess
        setScrambledLetters(prev => prev.map(l => l.id === id ? { ...l, used: true } : l));
        const newGuess = [...currentGuess, id];
        setCurrentGuess(newGuess);

        if (newGuess.length === targetWord.length) {
            endGame('perfect');
        }
    } else {
        // Wrong guess => penalty time or fail
        setTimeLeft(prev => Math.max(0, prev - 3));
    }
  };

  const endGame = (outcome: 'perfect' | 'fail') => {
    setPhase('stopped');
    setResult(outcome === 'perfect' ? 'GIẢI MÃ THÀNH CÔNG!' : 'TRÍ ÓC HỖN LOẠN!');
    setTimeout(() => {
      onComplete(outcome);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#18181b] to-[#09090b] border-2 border-[#a78bfa] p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_30px_rgba(167,139,250,0.3)]">
        <h2 className="text-2xl font-bold text-[#a78bfa] mb-2">[ GIẢI MÃ CỔ TỊCH ]</h2>
        <p className="mb-6 text-[#a78bfa]/70 h-12 flex items-center justify-center">
          Sắp xếp lại các chữ cái để tạo thành từ khóa đúng. Chọn sai bị trừ 3 giây!
        </p>

        <div className="h-10 flex items-center justify-center mb-6">
            <p className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-[#a78bfa]'}`}>00:{timeLeft.toString().padStart(2, '0')}</p>
        </div>

        {/* Current Guess Display */}
        <div className="flex justify-center gap-2 mb-8 h-12">
            {targetWord.split('').map((char, idx) => {
                const guessedId = currentGuess[idx];
                const guessedLetter = guessedId !== undefined ? scrambledLetters.find(l => l.id === guessedId)?.char : '';
                return (
                    <div key={idx} className="w-10 h-12 border-b-2 border-[#a78bfa] flex items-center justify-center text-3xl font-mono text-white">
                        {guessedLetter}
                    </div>
                )
            })}
        </div>

        {/* Scrambled Letters Pool */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
            {scrambledLetters.map((letter) => (
                <button
                    key={letter.id}
                    onClick={() => handleLetterClick(letter.id)}
                    disabled={letter.used || phase !== 'play'}
                    className={`w-14 h-14 rounded-lg border-2 text-2xl font-bold transition-all duration-200
                        ${letter.used ? 'bg-transparent border-zinc-800 text-zinc-800' : 'bg-zinc-800 border-[#a78bfa]/50 text-[#a78bfa] hover:bg-[#a78bfa]/20 shadow-[0_0_10px_rgba(167,139,250,0.2)]'}
                    `}
                >
                    {letter.char}
                </button>
            ))}
        </div>

        <div className="h-8">
          {result && (
            <div className={`text-xl font-bold animate-pulse ${result === 'GIẢI MÃ THÀNH CÔNG!' ? 'text-green-400' : 'text-red-500'}`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[#a78bfa]/20 pt-4">
          <button 
            onClick={onCancel}
            disabled={phase !== 'play'}
            className="text-[#a78bfa]/50 hover:text-[#a78bfa] text-sm"
          >
            [ Bỏ Cuộc ]
          </button>
        </div>
      </div>
    </div>
  );
}
