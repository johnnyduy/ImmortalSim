import React, { useState, useEffect, useRef } from 'react';

interface FlappySwordGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

const GRAVITY = 800; // px/s^2
const JUMP_VELOCITY = -300; // px/s
const OBSTACLE_SPEED = 150; // px/s
const OBSTACLE_WIDTH = 40;
const GAP_SIZE = 120;
const SWORD_SIZE = 24;

export default function FlappySwordGame({ onComplete, onCancel }: FlappySwordGameProps) {
  const [phase, setPhase] = useState<'idle' | 'play' | 'stopped'>('idle');
  const [timeLeft, setTimeLeft] = useState(15);
  const [result, setResult] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  const stateRef = useRef({
    swordY: 150,
    velocity: 0,
    obstacles: [] as { x: number, gapTop: number }[],
    distance: 0,
    lastObstacleDist: 0
  });

  const handleJump = () => {
    if (phase === 'idle') {
      setPhase('play');
      stateRef.current.velocity = JUMP_VELOCITY;
    } else if (phase === 'play') {
      stateRef.current.velocity = JUMP_VELOCITY;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame('perfect');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const state = stateRef.current;

        // Draw Player
        ctx.fillStyle = '#facc15';
        ctx.fillRect(50, state.swordY, SWORD_SIZE, SWORD_SIZE);

        // Draw Obstacles
        ctx.fillStyle = '#64748b';
        state.obstacles.forEach(obs => {
            // Top pillar
            ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapTop);
            // Bottom pillar
            ctx.fillRect(obs.x, obs.gapTop + GAP_SIZE, OBSTACLE_WIDTH, canvas.height - (obs.gapTop + GAP_SIZE));
        });
    };

    const animate = (time: number) => {
      if (lastTimeRef.current != undefined && phase === 'play') {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        const state = stateRef.current;

        // Update Physics
        state.velocity += GRAVITY * deltaTime;
        state.swordY += state.velocity * deltaTime;
        state.distance += OBSTACLE_SPEED * deltaTime;

        // Generate Obstacles
        if (state.distance - state.lastObstacleDist > 200) {
            state.obstacles.push({
                x: canvas.width,
                gapTop: Math.random() * (canvas.height - GAP_SIZE - 40) + 20
            });
            state.lastObstacleDist = state.distance;
        }

        // Move Obstacles
        state.obstacles.forEach(obs => {
            obs.x -= OBSTACLE_SPEED * deltaTime;
        });

        // Remove old obstacles
        if (state.obstacles.length > 0 && state.obstacles[0].x < -OBSTACLE_WIDTH) {
            state.obstacles.shift();
        }

        // Collision Detection
        if (state.swordY < 0 || state.swordY + SWORD_SIZE > canvas.height) {
            endGame('fail');
        } else {
            for (const obs of state.obstacles) {
                if (50 < obs.x + OBSTACLE_WIDTH && 50 + SWORD_SIZE > obs.x) {
                    if (state.swordY < obs.gapTop || state.swordY + SWORD_SIZE > obs.gapTop + GAP_SIZE) {
                        endGame('fail');
                    }
                }
            }
        }
      }
      
      render();

      lastTimeRef.current = time;
      if (phase !== 'stopped') {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase]);

  const endGame = (outcome: 'perfect' | 'fail') => {
    setPhase('stopped');
    setResult(outcome === 'perfect' ? 'VƯỢT LƯỚI THÀNH CÔNG!' : 'TRÚNG SÉT!');
    setTimeout(() => {
      onComplete(outcome);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border-2 border-[#facc15] p-8 rounded-xl max-w-lg w-full text-center shadow-[0_0_30px_rgba(250,204,21,0.3)]">
        <h2 className="text-2xl font-bold text-[#facc15] mb-2">[ NGỰ KIẾM VƯỢT LÔI LƯỚI ]</h2>
        <p className="mb-4 text-[#facc15]/70 h-12 flex items-center justify-center">
          Nhấn Chuột hoặc Space để bay lên, tránh các cột thu lôi. Cố gắng sống sót 15 giây!
        </p>

        <div className="h-10 flex items-center justify-center mb-4">
            <p className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#facc15]'}`}>00:{timeLeft.toString().padStart(2, '0')}</p>
        </div>

        <div 
          className="relative mx-auto mb-6 bg-slate-900 border border-[#facc15]/30 rounded overflow-hidden cursor-pointer touch-none shadow-[inset_0_0_20px_rgba(0,0,0,1)]"
          style={{ width: 400, height: 300 }}
          onPointerDown={(e) => {
            e.preventDefault();
            handleJump();
          }}
        >
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={300} 
            className="block"
          />
          {phase === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[#facc15] font-bold text-xl animate-pulse">
                NHẤN ĐỂ BẮT ĐẦU
            </div>
          )}
        </div>

        <div className="h-8">
          {result && (
            <div className={`text-xl font-bold animate-pulse ${result === 'VƯỢT LƯỚI THÀNH CÔNG!' ? 'text-green-400' : 'text-red-500'}`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-[#facc15]/20 pt-4">
          <button 
            onClick={onCancel}
            disabled={phase !== 'play'}
            className="text-[#facc15]/50 hover:text-[#facc15] text-sm"
          >
            [ Bỏ Cuộc ]
          </button>
        </div>
      </div>
    </div>
  );
}
