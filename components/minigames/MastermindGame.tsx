import React, { useState, useEffect } from 'react';

interface MastermindGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const ELEMENTS = [
  { id: 'KIM', icon: '🟡', color: 'text-yellow-200', bg: 'bg-yellow-200/20', border: 'border-yellow-200' },
  { id: 'MOC', icon: '🟢', color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500' },
  { id: 'THUY', icon: '🔵', color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500' },
  { id: 'HOA', icon: '🔴', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500' },
  { id: 'THO', icon: '🟤', color: 'text-orange-700', bg: 'bg-orange-700/20', border: 'border-orange-700' },
];

const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 6;

type GuessResult = {
  guess: string[];
  exactMatches: number; // Right color, right place
  colorMatches: number; // Right color, wrong place
};

export default function MastermindGame({ onComplete, onCancel }: MastermindGameProps) {
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [history, setHistory] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // Generate secret code (no duplicates for slightly easier play)
    let code: string[] = [];
    let available = [...ELEMENTS];
    for (let i = 0; i < CODE_LENGTH; i++) {
      const idx = Math.floor(Math.random() * available.length);
      code.push(available[idx].id);
      available.splice(idx, 1);
    }
    setSecretCode(code);
  }, []);

  const handleElementClick = (elementId: string) => {
    if (status !== 'playing') return;
    if (currentGuess.length < CODE_LENGTH) {
      setCurrentGuess([...currentGuess, elementId]);
    }
  };

  const handleUndo = () => {
    if (status !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (status !== 'playing' || currentGuess.length !== CODE_LENGTH) return;

    let exact = 0;
    let color = 0;
    
    // Calculate matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (currentGuess[i] === secretCode[i]) {
        exact++;
      } else if (secretCode.includes(currentGuess[i])) {
        color++;
      }
    }

    const newHistory = [...history, { guess: currentGuess, exactMatches: exact, colorMatches: color }];
    setHistory(newHistory);
    setCurrentGuess([]);

    if (exact === CODE_LENGTH) {
      setStatus('stopped');
      setResult('PERFECT! Phá giải trận bàn thành công!');
      setTimeout(() => onComplete('perfect'), 2000);
    } else if (newHistory.length >= MAX_ATTEMPTS) {
      setStatus('stopped');
      setResult('FAIL! Trận pháp phản phệ!');
      setTimeout(() => onComplete('fail'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border-2 border-[#a1a1aa] p-6 rounded-xl max-w-sm w-full text-center shadow-[0_0_30px_rgba(161,161,170,0.2)]">
        <h2 className="text-xl font-bold text-[#e4e4e7] mb-2">[ PHÁ GIẢI NGŨ HÀNH TRẬN ]</h2>
        <p className="mb-4 text-[#a1a1aa] text-xs">
          Tìm đúng 4 viên ngọc. <span className="text-[#34d399]">Đen</span> = Đúng vị trí, <span className="text-white">Trắng</span> = Có nhưng sai vị trí.
        </p>

        {/* History Board */}
        <div className="bg-[#09090b] p-3 rounded-lg border border-[#3f3f46] mb-4 space-y-2 max-h-[40vh] overflow-y-auto">
          {Array(MAX_ATTEMPTS).fill(null).map((_, idx) => {
            const hist = history[idx];
            return (
              <div key={idx} className="flex items-center justify-between bg-[#18181b] p-2 rounded border border-[#27272a]">
                <div className="flex gap-2">
                  {hist ? (
                    hist.guess.map((g, i) => {
                      const el = ELEMENTS.find(e => e.id === g);
                      return <div key={i} className="text-xl">{el?.icon}</div>;
                    })
                  ) : (
                    Array(CODE_LENGTH).fill(null).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-[#27272a]" />
                    ))
                  )}
                </div>
                <div className="flex gap-1 flex-wrap w-10 justify-end">
                  {hist ? (
                    <>
                      {Array(hist.exactMatches).fill(null).map((_, i) => <div key={`e-${i}`} className="w-3 h-3 rounded-full bg-black border border-gray-600" />)}
                      {Array(hist.colorMatches).fill(null).map((_, i) => <div key={`c-${i}`} className="w-3 h-3 rounded-full bg-white border border-gray-400" />)}
                    </>
                  ) : (
                    Array(CODE_LENGTH).fill(null).map((_, i) => <div key={i} className="w-3 h-3 rounded-full border border-[#3f3f46]" />)
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Guess */}
        <div className="flex justify-center gap-2 mb-4 h-10">
            {Array(CODE_LENGTH).fill(null).map((_, i) => {
                const elId = currentGuess[i];
                const el = ELEMENTS.find(e => e.id === elId);
                return (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed border-[#52525b] flex items-center justify-center text-2xl">
                        {el ? el.icon : ''}
                    </div>
                );
            })}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2 mb-4">
          {ELEMENTS.map(el => (
            <button
              key={el.id}
              onClick={() => handleElementClick(el.id)}
              disabled={status !== 'playing' || currentGuess.length >= CODE_LENGTH}
              className={`w-12 h-12 rounded border ${el.border} ${el.bg} flex items-center justify-center text-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-transform`}
            >
              {el.icon}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleUndo}
            disabled={status !== 'playing' || currentGuess.length === 0}
            className="flex-1 py-2 border border-[#52525b] text-[#a1a1aa] rounded hover:bg-[#27272a] disabled:opacity-50"
          >
            XÓA
          </button>
          <button 
            onClick={handleSubmit}
            disabled={status !== 'playing' || currentGuess.length < CODE_LENGTH}
            className="flex-2 w-full py-2 bg-[#e4e4e7] text-black font-bold rounded hover:bg-white disabled:opacity-50"
          >
            TRUYỀN TRẬN
          </button>
        </div>

        <div className="h-8 mt-2 flex items-center justify-center">
            {result && (
            <div className={`text-lg font-bold ${result.includes('PERFECT') ? 'text-[#34d399]' : 'text-red-500'}`}>
                {result}
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
