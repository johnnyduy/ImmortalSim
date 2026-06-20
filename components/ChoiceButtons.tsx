import type { EventChoice, Lang } from '../types';
import { getLocalizedText } from '../lib/i18n';
import { motion } from 'framer-motion';

type Props = {
  eventId?: string;
  choices: EventChoice[];
  onSelect: (value: string) => void;
  language: Lang;
  disabled?: boolean;
};

// Helper function to extract or determine the icon for each choice
const getChoiceIcon = (choiceId: string, text: string): string => {
  // Try to extract from text first using Unicode Property Escapes for emojis
  try {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u;
    const match = text.match(emojiRegex);
    if (match) {
      const emoji = match[1];
      if (emoji === '🧘') return '🪷';
      if (emoji === '🤝') return '🟢';
      if (emoji === '🗺️') return '📖';
      return emoji;
    }
  } catch (e) {
    // Fallback if regex fails on older JS environments
  }
  
  // Fallback based on choice ID
  if (choiceId === 'action_back') return '↩️';
  if (choiceId.includes('be_quan')) return '🚪';
  if (choiceId.includes('tinh_tu')) return '🪷';
  if (choiceId.includes('dot_tai_nguyen')) return '🔥';
  if (choiceId.includes('cong_phap') || choiceId.includes('manual')) return '📖';
  if (choiceId.includes('quest') || choiceId.includes('mission')) return '📜';
  if (choiceId.includes('resource') || choiceId.includes('stones') || choiceId.includes('gold')) return '💎';
  if (choiceId.includes('social') || choiceId.includes('relation') || choiceId.includes('social')) return '🟢';
  if (choiceId.includes('fight') || choiceId.includes('combat') || choiceId.includes('sect_event')) return '⚔️';
  
  return '✦'; // Default star icon
};

// Helper to clean the text of starting emojis
const getCleanText = (text: string): string => {
  try {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u;
    const match = text.match(emojiRegex);
    if (match) {
      text = text.slice(match[1].length).trim();
    }
  } catch (e) {
    // Fallback
  }
  // Remove numbers in square brackets and prefix text like "??? [1] " or "[1] "
  text = text.replace(/^(?:\?\?\?\s*)?\[\d+\]\s*/, '');
  return text;
};

// Helper to determine custom glow color for each badge based on its icon
const getBadgeGlowColor = (icon: string): string => {
  if (icon === '🪷') return 'rgba(244, 114, 182, 0.7)'; // Pink flower
  if (icon === '📜') return 'rgba(251, 191, 36, 0.7)';  // Gold scroll
  if (icon === '📖') return 'rgba(147, 51, 234, 0.7)';  // Purple book
  if (icon === '💎') return 'rgba(34, 211, 238, 0.7)';  // Cyan gem
  if (icon === '🟢') return 'rgba(52, 211, 153, 0.7)';  // Green orb
  if (icon === '⚔️') return 'rgba(148, 163, 184, 0.7)';  // Slate swords
  return 'rgba(197, 160, 89, 0.6)'; // Default gold
};

export default function ChoiceButtons({ eventId, choices, onSelect, disabled = false, language }: Props) {
  const isSectMenu = eventId === 'menu_monthly_plan';

  return (
    <div className="flex flex-col gap-4 mt-4 w-full max-w-xl mx-auto px-2">
      {choices.map((choice, index) => {
        const rawText = getLocalizedText(choice.text, language);
        const icon = getChoiceIcon(choice.id, rawText);
        const cleanText = getCleanText(rawText);
        const glowColor = getBadgeGlowColor(icon);
        
        if (isSectMenu) {
          return (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(choice.id)}
              className="relative w-full py-[18px] px-6 overflow-visible rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.6)] active:scale-[0.98] transition-all group flex items-center justify-center border-x border-[#846b3f]/30"
              style={{
                background: 'linear-gradient(90deg, #182a29 0%, #1f3230 20%, #292630 50%, #1f3230 80%, #182a29 100%)',
                boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.08), inset 0 -4px 10px rgba(0,0,0,0.8), 0 8px 15px rgba(0,0,0,0.5)',
                borderTop: '2px solid #c5a059',
                borderBottom: '2px solid #c5a059',
              }}
            >
              {/* Marble Noise Overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay rounded-lg" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }} />

              {/* Decorative Corner Curls */}
              <div className="absolute -left-[3px] -top-[3px] w-5 h-5 border-t-[3px] border-l-[3px] border-[#e5c17b] rounded-tl-[12px] opacity-90 shadow-sm" />
              <div className="absolute -left-[3px] -bottom-[3px] w-5 h-5 border-b-[3px] border-l-[3px] border-[#e5c17b] rounded-bl-[12px] opacity-90 shadow-sm" />
              <div className="absolute -right-[3px] -top-[3px] w-5 h-5 border-t-[3px] border-r-[3px] border-[#e5c17b] rounded-tr-[12px] opacity-90 shadow-sm" />
              <div className="absolute -right-[3px] -bottom-[3px] w-5 h-5 border-b-[3px] border-r-[3px] border-[#e5c17b] rounded-br-[12px] opacity-90 shadow-sm" />

              {/* Inner ambient glow on edges */}
              <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/5" />

              {/* Icon Container with Glow */}
              <div 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-black/40 border border-[#b89f65]/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 z-10"
                style={{ 
                  boxShadow: `0 0 15px ${glowColor}, inset 0 0 10px ${glowColor}`,
                  background: 'radial-gradient(circle, rgba(20,30,30,0.8) 0%, rgba(0,0,0,0.9) 100%)'
                }}
              >
                <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{icon}</span>
              </div>

              {/* Text */}
              <span className="font-serif text-[#fbe3b5] font-bold text-[17px] sm:text-xl tracking-wide drop-shadow-[0_2px_5px_rgba(0,0,0,1)] group-hover:text-white transition-colors duration-200 z-10 pl-14 sm:pl-16 pr-8 text-center flex-1">
                {cleanText}
              </span>

              {/* Chevron */}
              <span className="absolute right-5 text-[#c5a059] font-black text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] z-10 group-hover:translate-x-1 group-hover:text-[#fbe3b5] transition-all">
                ❯
              </span>
              
              {/* Optional Shimmer Effect on hover */}
              <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none rounded-lg z-0" style={{ transform: 'skewX(-20deg)' }} />
            </motion.button>
          );
        }

        return (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 + 0.15, ease: "easeOut" }}
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice.id)}
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
                radial-gradient(circle at 75% 40%, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px),
                radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
                radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
                linear-gradient(to right, #0d2b21 0%, #1c503f 50%, #0d2b21 100%)
              `
            }}
            className={`jade-button-capsule w-full py-3.5 px-6 font-serif text-lg font-bold text-[#fbe3b5] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative ${
              choice.id === 'claim_welfare_and_continue' || choice.id.startsWith('action_be_quan')
                ? 'animate-pulse border-[#e5c17b] shadow-[0_0_15px_rgba(229,193,123,0.3)]'
                : ''
            }`}
          >
            {/* Lớp bóng ngọc bích 3D */}
            <div className="jade-button-gloss" />
            
            <div className="flex items-center justify-center relative z-10 w-full font-serif">
              {/* Mũi tên trang trí bên trái */}
              <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[10px] text-[#b89f65]/50 select-none pointer-events-none font-sans">
                ❮
              </span>

              {/* Huy hiệu icon ngọc bích bên trái */}
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  fontSize: '20px', 
                  left: '14px',
                  borderColor: glowColor,
                  boxShadow: `0 0 10px ${glowColor}, inset 0 0 5px ${glowColor}`,
                  background: 'radial-gradient(circle, rgba(18, 51, 39, 0.95) 0%, rgba(8, 24, 18, 0.98) 100%)'
                }}
                className="absolute top-1/2 transform -translate-y-1/2 jade-icon-badge group-hover:scale-110 transition-transform duration-300"
              >
                <span className="drop-shadow-sm">{icon}</span>
              </div>
              
              {/* Nội dung text lựa chọn */}
              <p className="leading-relaxed text-center font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pl-16 pr-14 select-none text-[#fbe3b5] group-hover:text-white transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                {cleanText}
              </p>

              {/* Mũi tên trang trí bên phải */}
              <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[10px] text-[#b89f65]/50 select-none pointer-events-none font-sans">
                ❯
              </span>

              {/* Đồng xu cổ bằng vàng thật ở bên phải cho các sự kiện kiếm tài nguyên linh thạch */}
              {(icon === '💎' || choice.id.includes('kiem_tai_nguyen') || choice.id.includes('stones')) && (
                <div 
                  style={{ 
                    boxShadow: '0 0 8px rgba(229, 193, 89, 0.6)', 
                    right: '15px',
                    background: 'linear-gradient(135deg, #ffd700 0%, #e5c17b 50%, #b8860b 100%)' 
                  }}
                  className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border border-[#8b7355] flex items-center justify-center shadow-lg animate-pulse"
                >
                  {/* Center square hole */}
                  <div className="w-1.5 h-1.5 border border-[#8b7355]/60 bg-[#0c2e22]" />
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
