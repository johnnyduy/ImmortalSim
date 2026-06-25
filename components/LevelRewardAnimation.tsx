'use client';

import { useEffect, useRef, useState } from 'react';

export type LevelRewardAnimationPayload = {
  id: number;
  kind: 'level' | 'reward';
  title: string;
  subtitle: string;
  rewards: string[];
};

type Props = {
  payload: LevelRewardAnimationPayload | null;
  language?: string;
  onDone: () => void;
};

// Number of particles per burst
const SPARK_COUNT = 24;
const ORBIT_COUNT = 8;

export default function LevelRewardAnimation({ payload, language = 'vi', onDone }: Props) {
  const isLevel = payload?.kind === 'level';
  const [isExiting, setIsExiting] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  if (!payload) return null;

  const handleConfirm = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDoneRef.current();
      setIsExiting(false);
    }, 400);
  };

  // Colour palette by kind
  const colours = isLevel
    ? { primary: '#ffe2a0', secondary: '#34d399', glow: 'rgba(229,193,123,', accent: '#ffd166', ring: 'rgba(255,226,160,', dark: '#1a1208' }
    : { primary: '#a8e0ff', secondary: '#6bb8e8', glow: 'rgba(107,184,232,', accent: '#7ecfff', ring: 'rgba(168,224,255,', dark: '#080d14' };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[120] flex items-center justify-center overflow-hidden cursor-default"
      aria-live="assertive"
    >
      <style>{`
        .lra-backdrop-enter {
          animation: lra-bg-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .lra-backdrop-exit {
          animation: lra-bg-out 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .lra-card-enter {
          animation: lra-card-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .lra-card-exit {
          animation: lra-card-out 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes lra-bg-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes lra-bg-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes lra-card-in {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.85);
            filter: blur(8px) brightness(1.5);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1);
          }
        }
        @keyframes lra-card-out {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
            filter: blur(8px) brightness(0.7);
          }
        }
      `}</style>
      {/* ── Opaque backdrop ── */}
      <div
        className={`absolute inset-0 ${isExiting ? 'lra-backdrop-exit' : 'lra-backdrop-enter'}`}
        style={{
          background: isLevel
            ? 'radial-gradient(circle at center, #1a1208 0%, #060402 100%)'
            : 'radial-gradient(circle at center, #0b151c 0%, #020406 100%)',
        }}
      />
      {/* Mystical landscape texture overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-[0.14]'}`}
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── Horizontal light slash ── */}
      {isLevel && (
        <div
          className="absolute inset-x-0"
          style={{
            top: '50%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #ffe2a0 30%, #fff 50%, #ffe2a0 70%, transparent 100%)',
            animation: 'lra-slash 0.45s cubic-bezier(0.22,1,0.36,1) 0.15s both',
            boxShadow: '0 0 32px 8px rgba(255,226,160,0.55)',
          }}
        />
      )}

      {/* ── Expanding rings (level only) ── */}
      {isLevel && [0, 1, 2].map((i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full border"
          style={{
            left: '50%', top: '50%',
            width: '80px', height: '80px',
            borderColor: `${colours.ring}0.6)`,
            transform: 'translate(-50%,-50%)',
            animation: `lra-ring 1.4s cubic-bezier(0.1,0.8,0.3,1) ${i * 0.18}s both`,
          }}
        />
      ))}

      {/* ── Orbiting rune dots ── */}
      {Array.from({ length: ORBIT_COUNT }).map((_, i) => {
        const angle = (i / ORBIT_COUNT) * 360;
        return (
          <div
            key={`orbit-${i}`}
            className="absolute rounded-full"
            style={{
              left: '50%', top: '50%',
              width: '6px', height: '6px',
              background: colours.primary,
              boxShadow: `0 0 10px 3px ${colours.glow}0.8)`,
              '--orbit-angle': `${angle}deg`,
              animation: `lra-orbit 2.2s ease-in-out ${i * 0.05}s both`,
            } as React.CSSProperties}
          />
        );
      })}

      {/* ── Particle sparks ── */}
      {Array.from({ length: SPARK_COUNT }).map((_, i) => {
        const a = (i / SPARK_COUNT) * 360;
        const dist = 80 + Math.random() * 120;
        const size = 3 + Math.random() * 5;
        return (
          <div
            key={`spark-${i}`}
            className="absolute rounded-full"
            style={{
              left: '50%', top: '50%',
              width: `${size}px`, height: `${size}px`,
              background: i % 3 === 0 ? colours.primary : i % 3 === 1 ? colours.secondary : '#ffffff',
              boxShadow: `0 0 8px 2px ${colours.glow}0.7)`,
              '--spark-angle': `${a}deg`,
              '--spark-dist': `${dist}px`,
              animation: `lra-spark 1.2s cubic-bezier(0,0.8,0.4,1) ${0.05 + i * 0.018}s both`,
            } as React.CSSProperties}
          />
        );
      })}

      {/* ── Main card ── */}
      <div
        className={`relative w-full max-w-[440px] mx-4 z-30 ${isExiting ? 'lra-card-exit' : 'lra-card-enter'}`}
      >
        {/* Floating Moon at the top center */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-[#fffae8] to-[#f5e2b3] shadow-[0_0_35px_rgba(255,250,232,0.85),0_0_15px_rgba(255,255,255,0.45)] flex items-center justify-center overflow-hidden border border-white/20 z-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.06)_0%,transparent_70%)]" />
          <div className="w-16 h-16 rounded-full bg-transparent border-l-4 border-t-2 border-black/5 opacity-5 absolute top-1 left-2" />
        </div>

        {/* Decorative Sprig of Cherry Blossoms on the Left */}
        <div className="absolute left-[-26px] top-[50%] z-40 select-none pointer-events-none transform -translate-y-1/2 scale-125 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          🌸
        </div>
        <div className="absolute left-[-16px] top-[45%] z-40 select-none pointer-events-none transform -translate-y-1/2 scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          🌸
        </div>

        {/* Decorative Floating Teacup on the Right */}
        <div className="absolute right-[-22px] top-[42%] z-40 select-none pointer-events-none transform scale-125 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] animate-pulse">
          🍵
        </div>

        {/* Floating petals and leaves around card */}
        <div className="absolute -left-12 top-1/4 z-10 text-xl opacity-90 transform rotate-12">🌸</div>
        <div className="absolute -right-10 top-1/5 z-10 text-lg opacity-85 transform -rotate-45">🌸</div>
        <div className="absolute -left-10 bottom-1/4 z-10 text-base opacity-75 transform rotate-45">🍃</div>
        <div className="absolute -right-8 bottom-1/3 z-10 text-xl opacity-90 transform rotate-90">🍃</div>

        {/* Card border glow */}
        <div
          className="absolute -inset-px rounded-2xl"
          style={{
            background: isLevel
              ? `linear-gradient(135deg, ${colours.primary}, transparent 50%, ${colours.secondary})`
              : `linear-gradient(135deg, #78c8dc, transparent 50%, #b3e0f5)`,
            opacity: 0.8,
            animation: 'lra-border-pulse 1.6s ease-in-out 0.3s infinite alternate',
          }}
        />

        {/* Main Card Body (Glassmorphism design) */}
        <div
          className="relative rounded-2xl overflow-hidden px-6 py-8 backdrop-blur-md"
          style={{
            background: isLevel
              ? 'linear-gradient(135deg, rgba(35, 28, 18, 0.75) 0%, rgba(15, 12, 8, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(16, 30, 38, 0.7) 0%, rgba(8, 15, 20, 0.92) 100%)',
            border: isLevel
              ? '2px solid rgba(229, 193, 123, 0.65)'
              : '2px solid rgba(120, 200, 220, 0.65)',
            boxShadow: isLevel
              ? '0 20px 45px rgba(0,0,0,0.85), 0 0 25px rgba(229,193,123,0.2)'
              : '0 20px 45px rgba(0,0,0,0.85), 0 0 25px rgba(120,200,220,0.2)',
          }}
        >
          {/* Top shimmer line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${colours.primary}, transparent)`,
              animation: 'lra-shimmer 2s ease-out 0.4s both',
            }}
          />

          <div className="relative text-center space-y-6 pt-2">
            {/* Metadata Text */}
            <p
              className="text-[10px] sm:text-[11px] font-medium font-bold font-serif"
              style={{ color: isLevel ? colours.secondary : '#b3e0f5' }}
            >
              {isLevel ? '✦ ĐỘT PHÁ CẢNH GIỚI • BREAKTHROUGH ✦' : '✦ Cơ Duyên Nhàn Nhã • Chill Rewards ✦'}
            </p>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <h2
                className="font-serif text-3xl font-extrabold tracking-wide drop-shadow-md"
                style={{
                  color: isLevel ? colours.primary : '#ffffff',
                  textShadow: isLevel
                    ? `0 0 20px ${colours.glow}0.6)`
                    : '0 0 20px rgba(179,224,245,0.45)',
                }}
              >
                {isLevel ? payload.title : 'Nhận Thưởng'}
              </h2>
              <p
                className="text-xs sm:text-sm font-serif italic"
                style={{ color: isLevel ? colours.secondary : '#96b8c7' }}
              >
                {isLevel ? payload.subtitle : 'Cơ duyên thư thái vừa nhập túi'}
              </p>
            </div>

            {/* Reward List */}
            {payload.rewards.length > 0 && (
              <div className="space-y-3">
                {payload.rewards.slice(0, 5).map((reward, idx) => {
                  // Custom reward parser for styled lists
                  const cleanReward = reward.replace(/^\+/, '').trim();
                  
                  const parseReward = (raw: string) => {
                    const l = raw.toLowerCase();
                    if (l.includes('thiên trà') || l.includes('tea')) {
                      return { icon: '🍵', title: raw, desc: 'Linh trà đặc biệt, giúp bình ổn tâm mạch, tăng ngộ tính nhẹ.' };
                    }
                    if (l.includes('thạch') || l.includes('stone') || l.includes('stones')) {
                      if (l.includes('nhân vân') || l.includes('nhàn vân') || l.includes('vân')) {
                        return { icon: '🟢', title: raw, desc: 'Tinh thạch nhàn tịnh, dùng để đổi lấy trang trí gia viên nhàn nhã.' };
                      }
                      return { icon: '💎', title: raw, desc: 'Đá chứa linh khí thiên địa tinh thuần, dùng làm tiền tệ giao dịch.' };
                    }
                    if (l.includes('quyết') || l.includes('tuyệt kỹ') || l.includes('du bộ')) {
                      return { icon: '📜', title: raw, desc: 'Tăng tốc độ di chuyển nhẹ, tiêu tốn linh lực rất ít khi không chiến đấu.' };
                    }
                    if (l.includes('tu vi') || l.includes('cultivation')) {
                      return { icon: '✨', title: raw, desc: 'Tinh túy linh dịch hội tụ vào đan điền, củng cố nền tảng tu vi.' };
                    }
                    if (l.includes('cống hiến') || l.includes('contribution')) {
                      return { icon: '🛡️', title: raw, desc: 'Điểm cống hiến ghi nhận công trạng giúp gia tăng quyền hạn đệ tử.' };
                    }
                    if (l.includes('uy vọng') || l.includes('prestige')) {
                      return { icon: '🏵️', title: raw, desc: 'Danh tiếng vang xa trong tông môn, gia tăng địa vị tôn quý.' };
                    }
                    if (l.includes('thọ nguyên') || l.includes('lifespan') || l.includes('tuổi thọ')) {
                      return { icon: '🐢', title: raw, desc: 'Kéo dài thọ nguyên tối đa, tăng thêm thời gian tu hành nghịch thiên.' };
                    }
                    if (l.includes('đạo tâm') || l.includes('dao heart') || l.includes('daoheart')) {
                      return { icon: '☯', title: raw, desc: 'Đạo tâm vững vàng bất động, tăng tỷ lệ đột phá và chống tâm ma.' };
                    }
                    if (l.includes('ngộ tính') || l.includes('comprehension')) {
                      return { icon: '💡', title: raw, desc: 'Đầu óc thông tuệ linh hoạt, giúp tham ngộ công pháp tu hành nhanh chóng.' };
                    }
                    if (l.includes('vận may') || l.includes('luck')) {
                      return { icon: '🍀', title: raw, desc: 'Khí vận thiên phú hanh thông, thu hút cơ duyên và kỳ ngộ hiếm.' };
                    }
                    if (l.includes('sinh mệnh') || l.includes('máu') || l.includes('health') || l.includes('hp')) {
                      return { icon: '❤️', title: raw, desc: 'Huyết khí bản thể dồi dào, tăng khả năng chịu đòn và giới hạn sinh lực.' };
                    }
                    return { icon: '🎁', title: raw, desc: 'Cơ duyên đặc biệt trời ban, đã cất giữ cẩn thận vào trong túi đồ.' };
                  };

                  const parsed = parseReward(cleanReward);

                  return (
                    <div
                      key={`${reward}-${idx}`}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: isLevel
                          ? 'linear-gradient(135deg, rgba(45, 35, 23, 0.95) 0%, rgba(25, 20, 14, 0.98) 100%)'
                          : 'linear-gradient(135deg, rgba(20, 36, 46, 0.95) 0%, rgba(12, 20, 26, 0.98) 100%)',
                        borderColor: isLevel ? 'rgba(229, 193, 123, 0.6)' : 'rgba(120, 200, 220, 0.6)',
                        boxShadow: isLevel
                          ? '0 0 15px rgba(229, 193, 123, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                          : '0 0 15px rgba(120, 200, 220, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: `lra-reward-line 0.55s cubic-bezier(0.22,1,0.36,1) ${0.55 + idx * 0.12}s forwards`,
                      }}
                    >
                      {/* Circle Icon Badge */}
                      <div 
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md relative overflow-hidden border"
                        style={{
                          background: isLevel
                            ? 'linear-gradient(to bottom right, #2b1f13, #15100a)'
                            : 'linear-gradient(to bottom right, #1c3845, #0a141a)',
                          borderColor: isLevel ? 'rgba(229,193,123,0.45)' : 'rgba(120,200,220,0.45)',
                        }}
                      >
                        <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent" />
                        <span className="text-xl select-none">{parsed.icon}</span>
                      </div>

                      {/* Reward Info Column */}
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-serif text-[#ffffff] text-[14px] sm:text-[15px] font-bold flex items-center gap-1.5 leading-snug">
                          <span 
                            className="text-xs" 
                            style={{ color: isLevel ? colours.secondary : '#78c8dc' }}
                          >
                            ▲
                          </span>
                          <span className="truncate">{parsed.title}</span>
                        </h4>
                        <p className="text-[#d8e5ec] text-[11px] sm:text-xs leading-normal mt-0.5 font-sans font-medium line-clamp-2">
                          {parsed.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirmation Button */}
            <div
              className="pt-6 border-t border-zinc-800/35 mt-6 flex justify-center"
              style={{
                opacity: 0,
                transform: 'translateY(10px)',
                animation: `lra-reward-line 0.55s cubic-bezier(0.22,1,0.36,1) ${0.55 + Math.min(5, payload.rewards.length) * 0.12 + 0.15}s forwards`,
              }}
            >
              <button
                type="button"
                onClick={handleConfirm}
                className="relative px-8 py-2.5 font-serif text-sm font-bold font-medium rounded-lg transition-all duration-300 focus:outline-none overflow-hidden group border cursor-pointer"
                style={{
                  background: isLevel
                    ? 'linear-gradient(135deg, #10b981 0%, #a8823b 100%)'
                    : 'linear-gradient(135deg, #6bb8e8 0%, #4696c7 100%)',
                  borderColor: isLevel ? '#ffe2a0' : '#a8e0ff',
                  color: '#ffffff',
                  boxShadow: isLevel
                    ? '0 4px 15px rgba(229,193,123,0.35), 0 0 0 1px rgba(229,193,123,0.1)'
                    : '0 4px 15px rgba(107,184,232,0.35), 0 0 0 1px rgba(107,184,232,0.1)',
                }}
              >
                {/* Glowing hover overlay */}
                <span className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <span className="relative z-10">
                  {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom shimmer line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${colours.primary}, transparent)`,
              animation: 'lra-shimmer-rev 2s ease-out 0.6s both',
            }}
          />
        </div>
      </div>
    </div>
  );
}
