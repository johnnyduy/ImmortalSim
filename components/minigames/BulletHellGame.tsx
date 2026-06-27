import React, { useState, useEffect, useRef } from 'react';

interface BulletHellGameProps {
  onComplete: (score: 'perfect' | 'fail') => void;
  onCancel: () => void;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function BulletHellGame({ onComplete, onCancel }: BulletHellGameProps) {
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 80 }); // Percentage
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [status, setStatus] = useState<'playing' | 'stopped'>('playing');
  const [result, setResult] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef(playerPos);
  const statusRef = useRef(status);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const bulletIdRef = useRef(0);

  useEffect(() => { playerRef.current = playerPos; }, [playerPos]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Movement loop
  useEffect(() => {
    if (status !== 'playing') return;

    const moveInterval = setInterval(() => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 1.5;

        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) newY -= speed;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) newY += speed;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) newX -= speed;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) newX += speed;

        // Boundary
        newX = Math.max(2, Math.min(98, newX));
        newY = Math.max(2, Math.min(98, newY));

        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(moveInterval);
  }, [status]);

  // Bullet spawn and physics
  useEffect(() => {
    if (status !== 'playing') return;

    const spawnInterval = setInterval(() => {
      setBullets(prev => {
        const newBullets = [...prev];
        // Spawn 1-2 bullets
        for(let i=0; i< (Math.random() > 0.5 ? 2 : 1); i++) {
          newBullets.push({
            id: bulletIdRef.current++,
            x: Math.random() * 100,
            y: -5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 + Math.random() * 1.5,
            radius: 1.5
          });
        }
        return newBullets;
      });
    }, 400);

    const physicsInterval = setInterval(() => {
      setBullets(prev => {
        let activeBullets = prev.map(b => ({
          ...b,
          x: b.x + b.vx,
          y: b.y + b.vy
        })).filter(b => b.y < 110 && b.x > -10 && b.x < 110);

        // Check collision
        const px = playerRef.current.x;
        const py = playerRef.current.y;
        
        for (let b of activeBullets) {
          // simple distance check
          const dist = Math.sqrt(Math.pow(b.x - px, 2) + Math.pow(b.y - py, 2));
          if (dist < b.radius + 1.5) { // Player radius approx 1.5%
            setStatus('stopped');
            setResult('FAIL! Trúng độc châm của Tà Tu!');
            setTimeout(() => onComplete('fail'), 1500);
            return activeBullets; // Stop updating
          }
        }

        return activeBullets;
      });
    }, 16);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(physicsInterval);
    };
  }, [status, onComplete]);

  // Timer
  useEffect(() => {
    if (status !== 'playing') return;
    if (timeLeft <= 0) {
      setStatus('stopped');
      setResult('PERFECT! Thân pháp quỷ mị, áp sát thành công!');
      setTimeout(() => onComplete('perfect'), 1500);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#1a0f14] border-2 border-red-500/50 p-6 rounded-xl max-w-lg w-full text-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
        <h2 className="text-2xl font-bold text-red-500 mb-2">[ NÉ MƯA ÁM KHÍ ]</h2>
        <p className="mb-2 text-red-400/70 text-sm h-10">
          Dùng phím mũi tên hoặc WASD lách qua khe hở của làn mưa độc châm để áp sát!
        </p>
        
        <div className="flex justify-center mb-4">
          <p className="text-xl font-bold text-red-500 animate-pulse">00:{timeLeft.toString().padStart(2, '0')}</p>
        </div>
        
        <div 
          ref={containerRef}
          className="bg-black/80 rounded-xl border border-red-500/30 mb-6 relative w-full h-[350px] overflow-hidden"
          style={{ cursor: 'none' }}
        >
            {/* The Bullets */}
            {bullets.map(b => (
                <div 
                    key={b.id} 
                    className="absolute bg-gradient-to-b from-purple-500 to-red-600 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    style={{ 
                      left: `${b.x}%`, 
                      top: `${b.y}%`,
                      width: `${b.radius * 2}%`,
                      height: `${b.radius * 2}%`,
                      transform: 'translate(-50%, -50%) rotate(180deg)',
                      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' // make them look like needles
                    }}
                />
            ))}

            {/* The Player */}
            <div 
                className="absolute text-[#34d399] -translate-x-1/2 -translate-y-1/2 transition-none drop-shadow-[0_0_10px_rgba(52,211,153,1)]"
                style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
            >
                <div className="w-4 h-4 bg-[#34d399] rounded-full border-2 border-white" />
            </div>
        </div>

        <div className="h-8 flex items-center justify-center">
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
