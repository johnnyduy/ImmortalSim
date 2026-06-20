import React, { useState, useEffect, useRef } from 'react';
import { TechniqueInstance } from '../types';

interface Props {
  technique: TechniqueInstance;
  onSuccess: (perfect: boolean) => void;
  onCancel: () => void;
  isFatal?: boolean;
  onFatalFail?: () => void;
}

interface Entity {
  id: string;
  isSpiritual: boolean;
  x: number;
  y: number;
  word: string;
}

export default function CultivationMinigame({ technique, onSuccess, onCancel, isFatal, onFatalFail }: Props) {
  const [phase, setPhase] = useState<'init' | 'playing' | 'success' | 'fail'>('init');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [entities, setEntities] = useState<Entity[]>([]);
  const targetScore = 10;
  
  const entitiesRef = useRef<Entity[]>([]);
  const frameRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  const spiritualWords = ['悟', '道', '法', '玄', '灵'];

  // Start game loop
  useEffect(() => {
    if (phase === 'playing') {
      startTimeRef.current = Date.now();
      
      const gameLoop = () => {
        const now = Date.now();
        
        // Update timer
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
           setPhase('fail');
           return;
        }

        // Spawn logic
        if (now - lastSpawnRef.current > 1200) {
          const isSpiritual = Math.random() > 0.3; // 70% chance for word, 30% for demon
          const side = Math.floor(Math.random() * 4);
          let startX, startY;
          if(side === 0) { startX = Math.random() * 100; startY = -10; } // Top
          else if(side === 1) { startX = 110; startY = Math.random() * 100; } // Right
          else if(side === 2) { startX = Math.random() * 100; startY = 110; } // Bottom
          else { startX = -10; startY = Math.random() * 100; } // Left

          const newEntity: Entity = {
            id: Math.random().toString(36).substr(2, 9),
            isSpiritual,
            x: startX,
            y: startY,
            word: spiritualWords[Math.floor(Math.random() * spiritualWords.length)]
          };
          
          entitiesRef.current = [...entitiesRef.current, newEntity];
          lastSpawnRef.current = now;
        }
        
        // Movement logic: move entities towards center (50, 50)
        entitiesRef.current = entitiesRef.current.map(ent => {
          const dx = 50 - ent.x;
          const dy = 50 - ent.y;
          // Speed
          const speed = 0.3;
          return {
            ...ent,
            x: ent.x + dx * 0.01 * speed,
            y: ent.y + dy * 0.01 * speed
          };
        }).filter(ent => {
          // If it reaches the center, it disappears.
          const dist = Math.sqrt(Math.pow(50 - ent.x, 2) + Math.pow(50 - ent.y, 2));
          return dist > 5;
        });

        setEntities([...entitiesRef.current]);
        frameRef.current = requestAnimationFrame(gameLoop);
      };

      frameRef.current = requestAnimationFrame(gameLoop);

      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }
  }, [phase]);

  // Handle score changes
  useEffect(() => {
    if (score >= targetScore && phase === 'playing') {
      setPhase('success');
    }
  }, [score, phase]);
  
  // Handle outcome
  useEffect(() => {
    if (phase === 'success') {
      const timer = setTimeout(() => onSuccess(true), 2000);
      return () => clearTimeout(timer);
    } else if (phase === 'fail') {
      const timer = setTimeout(() => {
        if (isFatal && onFatalFail) onFatalFail();
        else onCancel();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, isFatal, onFatalFail, onCancel, onSuccess]);

  const handleEntityClick = (e: React.MouseEvent | React.TouchEvent, id: string, isSpiritual: boolean) => {
    e.stopPropagation();
    if (phase !== 'playing') return;
    
    // Remove entity
    entitiesRef.current = entitiesRef.current.filter(ent => ent.id !== id);
    setEntities([...entitiesRef.current]);

    if (isSpiritual) {
      setScore(s => s + 1);
    } else {
      // Touched a demon!
      setPhase('fail');
    }
  };

  const startGame = () => {
    setPhase('playing');
    setScore(0);
    entitiesRef.current = [];
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f102f] text-[#e1e0ff] select-none font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes minigame-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes minigame-pulse-glow {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(0, 240, 255, 0.4)); }
            50% { filter: drop-shadow(0 0 35px rgba(0, 240, 255, 0.8)); }
        }
        @keyframes minigame-particle-drift {
            from { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            to { transform: translateY(-100vh) translateX(30px); opacity: 0; }
        }
        @keyframes minigame-combo-pulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 5px #ffdb3c); }
            50% { transform: scale(1.1); filter: drop-shadow(0 0 20px #ffdb3c); }
            100% { transform: scale(1); filter: drop-shadow(0 0 5px #ffdb3c); }
        }
        .minigame-floating-cultivator { animation: minigame-float 4s ease-in-out infinite; }
        .minigame-spirit-aura { animation: minigame-pulse-glow 3s ease-in-out infinite; }
        .minigame-combo-aura { animation: minigame-combo-pulse 0.8s ease-in-out infinite; }
        .minigame-glass-panel {
            background: rgba(15, 16, 47, 0.4);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 240, 255, 0.1);
        }
        .minigame-sea-of-consciousness {
            background: radial-gradient(circle at center, #1b1c3c 0%, #090a2a 100%);
        }
      `}} />

      {/* Sea of Consciousness Background */}
      <div className="minigame-sea-of-consciousness absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-[#00f0ff] rounded-full shadow-[0_0_5px_#00f0ff]"
              style={{
                left: `${Math.random() * 100}vw`,
                top: `${Math.random() * 100 + 100}vh`,
                animation: `minigame-particle-drift ${Math.random() * 10 + 5}s linear infinite`,
                opacity: Math.random()
              }}
            />
          ))}
        </div>
      </div>

      <main className="relative h-screen w-full max-w-[500px] mx-auto flex flex-col justify-between items-center py-4">
        
        {/* Top Header & Progress */}
        <section className="w-full px-4 flex flex-col gap-2 pt-4 z-50 pointer-events-none">
          <header className="flex justify-between items-center bg-[#0f102f]/40 backdrop-blur-xl border-b border-[#00f0ff]/10 p-3 rounded-lg pointer-events-auto">
            <div className="flex flex-col">
               <span className="font-serif text-xl font-bold text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                 Khảo Nghiệm Nhập Môn
               </span>
               <span className="text-[#00f0ff] text-sm">{technique.name}</span>
            </div>
            <button onClick={onCancel} className="text-[#00f0ff] hover:bg-[#00f0ff]/10 p-2 rounded-full transition-colors font-bold text-xl">
               ✕
            </button>
          </header>

          {(phase === 'playing' || phase === 'success' || phase === 'fail') && (
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className="text-xs text-[#00f0ff] tracking-widest font-bold">LINH LỰC ({timeLeft}s)</span>
                <span className="text-xs text-[#ffe16d]">{score}/{targetScore}</span>
              </div>
              <div className="h-3 w-full bg-[#1b1c3c] rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ffdb3c] rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-all duration-300" 
                  style={{ width: `${Math.min(100, (score / targetScore) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Central Area */}
        <section className="relative flex-1 w-full flex items-center justify-center overflow-visible">
          
          {phase === 'init' && (
            <div className="absolute z-30 minigame-glass-panel p-6 rounded-xl flex flex-col items-center gap-4 border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <h2 className="text-2xl font-bold text-[#00f0ff]">Chuẩn Bị</h2>
              <p className="text-center text-sm text-[#b9cacb]">
                Hãy chạm vào <span className="text-[#00f0ff] font-bold">Linh Tự</span> để hấp thụ linh khí.<br/>
                Tránh xa <span className="text-[#ffb4ab] font-bold">Tâm Ma</span> kẻo tẩu hoả nhập ma bạo thể!
              </p>
              <button 
                onClick={startGame}
                className="mt-2 bg-[#00f0ff]/20 border border-[#00f0ff] px-6 py-2 rounded-full text-[#00f0ff] font-bold hover:bg-[#00f0ff]/40 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 cursor-pointer"
              >
                BẮT ĐẦU VẬN CÔNG
              </button>
            </div>
          )}

          {phase === 'success' && (
            <div className="absolute z-30 flex flex-col items-center">
              <span className="text-4xl text-[#ffe16d] font-bold drop-shadow-[0_0_20px_#ffe16d] animate-bounce text-center">
                ĐỘT PHÁ<br/>THÀNH CÔNG!
              </span>
            </div>
          )}

          {phase === 'fail' && (
            <div className="absolute z-30 flex flex-col items-center">
              <span className="text-4xl text-[#ffb4ab] font-bold drop-shadow-[0_0_20px_#ffb4ab] animate-pulse text-center">
                TẨU HỎA<br/>NHẬP MA!
              </span>
            </div>
          )}

          {phase === 'playing' && score > 0 && (
            <div className="absolute top-10 flex flex-col items-center z-20 pointer-events-none">
              <div className="minigame-combo-aura text-2xl font-bold text-[#ffdb3c] drop-shadow-lg scale-125">
                 Combo x{score}
              </div>
            </div>
          )}

          {/* Chibi Cultivator */}
          <div className="relative w-64 h-64 minigame-floating-cultivator flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 rounded-full border border-[#00f0ff]/20 animate-[ping_3s_linear_infinite] opacity-30"></div>
            <div className="absolute inset-8 rounded-full border border-[#fff9ef]/10 animate-[pulse_2s_ease-in-out_infinite]"></div>
            <div className="minigame-spirit-aura rounded-full bg-[#1b1c3c]/50 flex items-center justify-center">
               <div className="w-48 h-48 rounded-full overflow-hidden flex items-center justify-center text-[100px]">
                 🧘‍♂️
               </div>
            </div>
          </div>

          {/* Entities layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-auto">
             {entities.map(ent => (
               <div 
                 key={ent.id}
                 onMouseDown={(e) => handleEntityClick(e, ent.id, ent.isSpiritual)}
                 onTouchStart={(e) => handleEntityClick(e, ent.id, ent.isSpiritual)}
                 className="absolute flex items-center justify-center transition-transform cursor-pointer hover:scale-110 active:scale-95"
                 style={{ 
                   left: `${ent.x}%`, 
                   top: `${ent.y}%`,
                   transform: 'translate(-50%, -50%)'
                 }}
               >
                 {ent.isSpiritual ? (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#ffdb3c]/20 blur-md rounded-full"></div>
                        <div className="w-12 h-12 minigame-glass-panel border-[#ffdb3c]/40 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,219,60,0.4)]">
                            <span className="text-[#ffdb3c] text-xl font-bold">{ent.word}</span>
                        </div>
                    </div>
                 ) : (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#ffb4ab]/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center border-[#ffb4ab]/30 bg-[#93000a]/30 border-2 shadow-[0_0_15px_rgba(255,180,171,0.5)]">
                            <span className="text-[#ffb4ab] text-3xl font-bold">☠️</span>
                        </div>
                    </div>
                 )}
               </div>
             ))}
          </div>

        </section>

        {/* Bottom controls */}
        <footer className="w-full px-4 pb-8 pt-4 flex flex-col items-center gap-4 z-40 pointer-events-none">
          <p className="text-[10px] text-[#b9cacb]/50 animate-pulse text-center tracking-widest uppercase font-bold">
            CHẠM ĐỂ THU THẬP LINH TỰ • TRÁNH TÂM MA
          </p>
        </footer>
      </main>
    </div>
  );
}
