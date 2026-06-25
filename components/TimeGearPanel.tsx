'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import type { WorldState } from '../types';

type Props = {
  month: number;
  timeLeft: number;
  totalTime: number;
  monthlyLog: string[];
  language: 'vi' | 'en';
  worldState?: WorldState;
};

export default function TimeGearPanel({ 
  month, 
  timeLeft, 
  totalTime, 
  monthlyLog = [], 
  language = 'vi',
  worldState 
}: Props) {
  const monthsVi = useMemo(() => ["🐀 Tý", "🐂 Sửu", "🐅 Dần", "🐈 Mão", "🐉 Thìn", "🐍 Tỵ", "🐎 Ngọ", "🐐 Mùi", "🐒 Thân", "🐓 Dậu", "🐕 Tuất", "🐖 Hợi"], []);
  const monthsEn = useMemo(() => ["🐀 Rat", "🐂 Ox", "🐅 Tiger", "🐈 Rabbit", "🐉 Dragon", "🐍 Snake", "🐎 Horse", "🐐 Goat", "🐒 Monkey", "🐓 Rooster", "🐕 Dog", "🐖 Pig"], []);

  const months = language === 'vi' ? monthsVi : monthsEn;
  const currentMonthName = months[month - 1];

  // Smooth rotation for the pointer / center plate
  const [angle, setAngle] = useState(() => {
    return (month - 1) * 30 + ((totalTime - timeLeft) / totalTime) * 30;
  });
  const [transitionStyle, setTransitionStyle] = useState('transform 0.15s linear');
  const lastAngleRef = useRef(angle);

  // Meditation chibi animation
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const animInterval = setInterval(() => {
      setFrame((f) => (f + 1) % 8);
    }, 200);
    return () => clearInterval(animInterval);
  }, []);

  const col = frame % 4;
  const row = Math.floor(frame / 4);

  useEffect(() => {
    const rawAngle = (month - 1) * 30 + ((totalTime - timeLeft) / totalTime) * 30;
    let diff = rawAngle - (lastAngleRef.current % 360);
    
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    if (Math.abs(diff) > 60) {
      lastAngleRef.current = rawAngle;
      setAngle(rawAngle);
      setTransitionStyle('none');
    } else {
      const newAngle = lastAngleRef.current + diff;
      lastAngleRef.current = newAngle;
      setAngle(newAngle);
      setTransitionStyle('transform 0.15s linear');
    }
  }, [month, timeLeft, totalTime]);

  // Percentage of month completed (0 to 100)
  const percentage = Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));

  // Determine dominant Heavenly Dao variables
  const daoFluctuation = worldState?.global?.daoFluctuation ?? 0;
  const demonicEnergy = worldState?.global?.demonicEnergy ?? 0;
  const spiritualQi = worldState?.global?.spiritualQi ?? 50;
  const security = worldState?.city?.security ?? 50;

  const { auraClass, auraColor, particleColor, statusTitle, statusDesc } = useMemo(() => {
    let auraClass = '';
    let auraColor = '#34d399'; // default gold
    let particleColor = 'rgba(229,193,123,0.6)';
    let statusTitle = language === 'vi' ? 'Mệnh Bàn Thiên Tuần' : 'Destiny Cycle';
    let statusDesc = language === 'vi' 
      ? 'Thiên Đạo tuần hoàn, nhân quả tự định, vạn pháp quy nhất.' 
      : 'The Dao cycles, karma flows, and all techniques align as one.';

    // Demonic is highest priority
    if (demonicEnergy > 50) {
      auraClass = 'glow-demonic';
      auraColor = '#a78bfa'; // light purple
      particleColor = 'rgba(167,139,250,0.7)'; // dark smoke purple
      statusTitle = language === 'vi' ? '👹 Ma Khí Ngập Trời' : '👹 Demonic Qi Flood';
      statusDesc = language === 'vi'
        ? 'Ma đạo hưng thịnh hoành hành thế giới, yêu thú cuồng bạo, thiên cơ hỗn độn.'
        : 'Demonic path surges, beasts grow violent, heavenly secrets are obscured.';
    } 
    // Dao Fluctuation
    else if (daoFluctuation > 60) {
      auraClass = 'glow-dao';
      auraColor = '#fbbf24'; // bright gold
      particleColor = 'rgba(251,191,36,0.8)';
      statusTitle = language === 'vi' ? '✨ Thiên Đạo Dị Động' : '✨ Celestial Fluctuation';
      statusDesc = language === 'vi'
        ? 'Càn khôn hỗn loạn, linh vận tụ hội, có cơ hội ngộ cổ đại bí cảnh kỳ ngộ.'
        : 'Cosmos in flux, spiritual fortunes converge, ancient secret realms emerge.';
    } 
    // Security Warning
    else if (security < 40) {
      auraClass = 'glow-chaos';
      auraColor = '#f87171'; // red warning
      particleColor = 'rgba(248,113,113,0.8)';
      statusTitle = language === 'vi' ? '🚨 Phàm Trần Hỗn Loạn' : '🚨 Mortal Chaos';
      statusDesc = language === 'vi'
        ? 'An ninh thành thị suy sụp, đạo tặc hoành hành phàm gian, nghiệp chướng tăng cao.'
        : 'City security collapses, mortal bandits roam, dark karma gathers.';
    } 
    // High Spiritual Qi
    else if (spiritualQi > 70) {
      auraClass = 'glow-spiritual';
      auraColor = '#22d3ee'; // cyan
      particleColor = 'rgba(34,211,238,0.8)';
      statusTitle = language === 'vi' ? '🌊 Linh Khí Triều Tịch' : '🌊 Spiritual Tide';
      statusDesc = language === 'vi'
        ? 'Linh khí tràn ngập tiên sơn, linh dược tăng trưởng nhanh chóng, bế quan đắc lợi.'
        : 'Spiritual energy floods mountains, medicinal herbs grow fast, meditation blooms.';
    }

    return { auraClass, auraColor, particleColor, statusTitle, statusDesc };
  }, [daoFluctuation, demonicEnergy, spiritualQi, security, language]);

  // Generate floating particle coordinates
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const angleRad = Math.random() * Math.PI * 2;
      const r = Math.random() * 85 + 30; // within the compass area
      return {
        id: i,
        x: 150 + r * Math.cos(angleRad),
        y: 150 + r * Math.sin(angleRad),
        size: Math.random() * 3 + 1.5,
        delay: Math.random() * 2.5
      };
    });
  }, [month]);

  // Calculate position coordinates for 12 months in a circular path
  const monthLabels = useMemo(() => {
    return months.map((name, i) => {
      const angleDeg = i * 30 - 90; // Start at 12 o'clock
      const angleRad = (angleDeg * Math.PI) / 180;
      const r = 112; // radius of labels
      const cx = 150;
      const cy = 150;
      return {
        name,
        index: i + 1,
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
        angle: i * 30
      };
    });
  }, [months]);

  // Constellation lines coordinates
  const constellationLines = useMemo(() => {
    const lines = [];
    const len = monthLabels.length;
    for (let i = 0; i < len; i++) {
      const p1 = monthLabels[i];
      const p2 = monthLabels[(i + 1) % len];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Star cross pattern (i to i + 5)
      const pCross = monthLabels[(i + 5) % len];
      const dxCross = pCross.x - p1.x;
      const dyCross = pCross.y - p1.y;
      const lengthCross = Math.sqrt(dxCross * dxCross + dyCross * dyCross);

      lines.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        length,
        x2Cross: pCross.x,
        y2Cross: pCross.y,
        lengthCross
      });
    }
    return lines;
  }, [monthLabels]);

  // Bagua Trigrams (☰ ☱ ☲ ...) coordinates
  const trigramElements = useMemo(() => {
    const trigrams = ['☰ Càn', '☱ Đoài', '☲ Ly', '☳ Chấn', '☴ Tốn', '☵ Khảm', '☶ Cấn', '☷ Khôn'];
    return trigrams.map((symbol, i) => {
      const angleDeg = i * 45 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const r = 74;
      const cx = 150;
      const cy = 150;
      return {
        symbol,
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
        angle: i * 45
      };
    });
  }, []);

  return (
    <div className="adventure-card p-6 flex flex-col items-center gap-5 animate-fade-in relative overflow-hidden border border-emerald-500/30 bg-[#070605]/95 shadow-2xl">
      
      {/* Background Subtle Qi Aura (Changes color dynamically based on dominant state) */}
      <div 
        className="absolute inset-0 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${auraColor}12 0%, transparent 75%)`
        }}
      />

      {/* Floating Sparkles/Smoke particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="floating-particle rounded-full"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: particleColor,
              boxShadow: `0 0 8px ${auraColor}`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Tournament countdown badge */}
      {(() => {
        const monthsLeft = month < 12 ? 12 - month : 0;
        const isThisMonth = month === 12;
        const urgentGlow = monthsLeft <= 2;
        return (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold font-serif tracking-wider relative z-10 transition-all duration-500"
            style={{
              borderColor: isThisMonth ? '#fbbf24' : urgentGlow ? '#f87171' : '#10b981',
              color: isThisMonth ? '#fbbf24' : urgentGlow ? '#f87171' : '#10b981bb',
              background: isThisMonth ? 'rgba(251,191,36,0.08)' : urgentGlow ? 'rgba(248,113,113,0.06)' : 'rgba(197,160,89,0.05)',
              boxShadow: isThisMonth ? '0 0 12px rgba(251,191,36,0.35)' : urgentGlow ? '0 0 8px rgba(248,113,113,0.25)' : 'none',
              animation: isThisMonth ? 'pulse 1.5s ease-in-out infinite' : undefined
            }}
          >
            <span style={{ fontSize: '12px' }}>⚔️</span>
            <span>
              {language === 'vi'
                ? isThisMonth
                  ? 'ĐẠI BỈ ĐANG DIỄN RA!'
                  : `ĐẠI BỈ: ${monthsLeft} tháng`
                : isThisMonth
                  ? 'TOURNAMENT NOW!'
                  : `TOURNAMENT: ${monthsLeft}mo`}
            </span>
          </div>
        );
      })()}

      {/* Destiny Plate Title */}
      <div className="text-center space-y-1 relative z-10">
        <span className="text-[10px] font-medium text-zinc-400 font-serif font-semibold">
          {language === 'vi' ? 'MỆNH BÀN THIÊN ĐẠO' : 'HEAVENLY DESTINY COMPASS'}
        </span>
        <h3 
          className="font-serif text-lg font-medium font-bold transition-colors duration-1000"
          style={{ color: auraColor, textShadow: `0 0 10px ${auraColor}40` }}
        >
          {statusTitle}
        </h3>
      </div>

      {/* Destiny Sundial SVG */}
      <div className={`relative w-[300px] h-[300px] flex items-center justify-center select-none my-2 z-10 ${auraClass}`}>
        <svg width="300" height="300" className="overflow-visible">
          {/* Static Concentric Circles */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="#261e16" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="150" cy="150" r="132" fill="none" stroke="#27272a" strokeWidth="0.5" />
          <circle cx="150" cy="150" r="95" fill="none" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.25" />
          <circle cx="150" cy="150" r="58" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />

          {/* Rotating Bagua Trigrams wheel */}
          <g 
            className="animate-spin" 
            style={{ 
              animationDuration: '90s', 
              transformOrigin: '150px 150px' 
            }}
          >
            {trigramElements.map((tg, i) => (
              <text
                key={i}
                x={tg.x}
                y={tg.y}
                dy="0.35em"
                textAnchor="middle"
                fill={auraColor}
                transform={`rotate(${tg.angle + 90} ${tg.x} ${tg.y})`}
                className="text-[9px] font-serif font-semibold opacity-40 select-none pointer-events-none transition-colors duration-1000"
              >
                {tg.symbol}
              </text>
            ))}
          </g>

          {/* Dynamic Constellation lines connecting Month nodes */}
          <g>
            {constellationLines.map((line, i) => (
              <g key={i}>
                {/* Outer Ring Connection */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={auraColor}
                  strokeWidth="1"
                  strokeOpacity="0.45"
                  strokeDasharray={line.length}
                  strokeDashoffset={line.length * (1 - percentage / 100)}
                  className="transition-all duration-300"
                />
                {/* Inner Cross Constellation connections */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2Cross}
                  y2={line.y2Cross}
                  stroke="#ffffff"
                  strokeWidth="0.75"
                  strokeOpacity="0.25"
                  strokeDasharray={line.lengthCross}
                  strokeDashoffset={line.lengthCross * (1 - percentage / 100)}
                  className="transition-all duration-300"
                />
              </g>
            ))}
          </g>

          {/* Month Labels (Stars on the Destiny Ring) */}
          <g>
            {monthLabels.map((lbl) => {
              const isActive = lbl.index === month;
              return (
                <g key={lbl.index}>
                  {/* Star point behind label */}
                  <circle
                    cx={lbl.x}
                    cy={lbl.y}
                    r={isActive ? 6 : 2}
                    fill={isActive ? '#ffffff' : auraColor}
                    className="transition-all duration-500"
                    style={{
                      filter: isActive ? `drop-shadow(0 0 6px ${auraColor})` : 'none',
                    }}
                  />
                  {/* Label Text */}
                  <text
                    x={lbl.x}
                    y={lbl.y}
                    dy="-0.85em"
                    textAnchor="middle"
                    className={`font-serif transition-all duration-500 font-bold select-none pointer-events-none ${
                      isActive 
                        ? 'text-[11px] fill-white opacity-100 font-semibold' 
                        : 'text-[9px] fill-[#71717a] opacity-55'
                    }`}
                  >
                    {lbl.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Divination Hexagram outline glowing at completion (percentage > 92%) */}
          {percentage > 92 && (
            <g transform="translate(150, 150) scale(0.6)" stroke={auraColor} strokeWidth="3" opacity={(percentage - 92) / 8}>
              {/* Auspicious or ominous hexagram lines depending on the aura */}
              {auraClass === 'glow-demonic' || auraClass === 'glow-chaos' ? (
                // Ominous Broken Hexagram (Yin)
                <g>
                  <line x1="-30" y1="-25" x2="-8" y2="-25" /> <line x1="8" y1="-25" x2="30" y2="-25" />
                  <line x1="-30" y1="-15" x2="-8" y2="-15" /> <line x1="8" y1="-15" x2="30" y2="-15" />
                  <line x1="-30" y1="-5" x2="-8" y2="-5" /> <line x1="8" y1="-5" x2="30" y2="-5" />
                  <line x1="-30" y1="5" x2="-8" y2="5" /> <line x1="8" y1="5" x2="30" y2="5" />
                  <line x1="-30" y1="15" x2="-8" y2="15" /> <line x1="8" y1="15" x2="30" y2="15" />
                  <line x1="-30" y1="25" x2="-8" y2="25" /> <line x1="8" y1="25" x2="30" y2="25" />
                </g>
              ) : (
                // Auspicious Solid Hexagram (Yang)
                <g>
                  <line x1="-30" y1="-25" x2="30" y2="-25" />
                  <line x1="-30" y1="-15" x2="30" y2="-15" strokeDasharray="24 12 24" />
                  <line x1="-30" y1="-5" x2="30" y2="-5" />
                  <line x1="-30" y1="5" x2="30" y2="5" strokeDasharray="24 12 24" />
                  <line x1="-30" y1="15" x2="30" y2="15" />
                  <line x1="-30" y1="25" x2="30" y2="25" />
                </g>
              )}
            </g>
          )}

          {/* Center concentric plate containing character */}
          <circle 
            cx="150" 
            cy="150" 
            r="60" 
            fill="rgba(10,8,6,0.92)" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeOpacity="0.4" 
          />
        </svg>

        {/* Meditating chibi character at the center */}
        <div
          style={{
            backgroundImage: "url('/images/meditation_spritesheet.png')",
            backgroundSize: '400% 200%',
            backgroundPosition: `${(col * 100) / 3}% ${(row * 100) / 1}%`,
            backgroundRepeat: 'no-repeat',
          }}
          className="w-[110px] h-[110px] rounded-full overflow-hidden absolute z-20 top-[150px] left-[150px] transform -translate-x-1/2 -translate-y-1/2 border border-emerald-500/40 shadow-[0_0_12px_rgba(197,160,89,0.3)] bg-zinc-950"
        />
      </div>

      {/* World state description (Heavenly Dao state) */}
      <div className="w-full text-center px-4 relative z-10 -mt-2">
        <p className="text-xs text-[#b5a995] font-serif italic leading-relaxed">
          {statusDesc}
        </p>
      </div>

      {/* Heavenly Dao Modifiers Indicators HUD */}
      <div className="w-full grid grid-cols-4 gap-2 pt-3 border-t border-zinc-800/40 relative z-10 text-center">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
            {language === 'vi' ? 'Linh Khí' : 'Spirit Qi'}
          </span>
          <span className="text-xs font-bold font-serif text-cyan-400 mt-0.5">
            {Math.round(spiritualQi)}%
          </span>
          <div className="w-full h-1 bg-[#1a1512] rounded-sm mt-1 overflow-hidden border border-zinc-800/35">
            <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${spiritualQi}%` }} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
            {language === 'vi' ? 'Dị Động' : 'Dao Flux'}
          </span>
          <span className="text-xs font-bold font-serif text-amber-400 mt-0.5">
            {Math.round(daoFluctuation)}%
          </span>
          <div className="w-full h-1 bg-[#1a1512] rounded-sm mt-1 overflow-hidden border border-zinc-800/35">
            <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${daoFluctuation}%` }} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
            {language === 'vi' ? 'Ma Khí' : 'Demonic Qi'}
          </span>
          <span className="text-xs font-bold font-serif text-purple-400 mt-0.5">
            {Math.round(demonicEnergy)}%
          </span>
          <div className="w-full h-1 bg-[#1a1512] rounded-sm mt-1 overflow-hidden border border-zinc-800/35">
            <div className="h-full bg-purple-400 transition-all duration-1000" style={{ width: `${demonicEnergy}%` }} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
            {language === 'vi' ? 'An Ninh' : 'Security'}
          </span>
          <span className={`text-xs font-bold font-serif mt-0.5 ${security < 40 ? 'text-red-400' : 'text-blue-400'}`}>
            {Math.round(security)}%
          </span>
          <div className="w-full h-1 bg-[#1a1512] rounded-sm mt-1 overflow-hidden border border-zinc-800/35">
            <div className={`h-full transition-all duration-1000 ${security < 40 ? 'bg-red-500' : 'bg-blue-400'}`} style={{ width: `${security}%` }} />
          </div>
        </div>
      </div>

      {/* Month Log / Diary */}
      <div className="w-full space-y-2 relative z-10 border-t border-zinc-800/45 pt-3">
        <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400 font-semibold font-serif">
          <span>{language === 'vi' ? 'Nhật ký Tĩnh Tu (Meditation Log)' : 'Meditation Log'}</span>
          <span className="text-blue-400 font-sans">+0.02 {language === 'vi' ? 'Tu Vi/tháng' : 'Cultivation/m'}</span>
        </div>
        <div className="min-h-36 bg-zinc-950/60 border border-zinc-800/40 rounded-sm p-3.5 space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#27272a]">
          {monthlyLog.length === 0 ? (
            <p className="text-2xl text-text-tertiary italic text-center py-4">
              {language === 'vi' 
                ? 'Bắt đầu khép mi tập trung hơi thở, thời quang bắt đầu xoay...'
                : 'Closing eyes to focus on breath, time destiny begins to spin...'}
            </p>
          ) : (
            monthlyLog.map((logLine, idx) => (
              <p key={idx} className="text-2xl text-[#e8dcc0] font-serif leading-relaxed text-left border-l border-emerald-500/40 pl-2 animate-fade-in">
                {logLine}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
