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
    <div className="flex flex-col gap-2 mt-4 w-full">
      {choices.map((choice, index) => {
        const rawText = getLocalizedText(choice.text, language);
        const icon = getChoiceIcon(choice.id, rawText);
        const cleanText = getCleanText(rawText);
        
        return (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice.id)}
            className={`w-full text-left p-3 border border-outline-variant/30 bg-surface-container/50 hover:bg-primary/10 hover:border-primary/50 transition-all group relative flex items-center gap-3 overflow-hidden ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {/* Left bracket / indicator */}
            <span className="text-primary/50 group-hover:text-primary font-mono-data transition-colors">»</span>
            
            {/* Icon */}
            {icon !== '✦' && (
              <span className="text-lg opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all">{icon}</span>
            )}
            
            {/* Text */}
            <span className="font-mono-data text-sm uppercase text-on-surface group-hover:text-primary tracking-wider truncate">
              {cleanText}
            </span>

            {/* Right decorative elements if resource */}
            {(icon === '💎' || choice.id.includes('kiem_tai_nguyen') || choice.id.includes('stones')) && (
              <span className="ml-auto text-[10px] text-primary/70 font-mono-data border border-primary/30 px-1 bg-primary/5">
                +RES
              </span>
            )}
            
            {/* Blinking cursor effect on hover */}
            <span className="w-2 h-4 bg-primary opacity-0 group-hover:animate-pulse ml-2" />
          </motion.button>
        );
      })}
    </div>
  );
}
