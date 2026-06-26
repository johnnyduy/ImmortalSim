import React from 'react';
import { GameState } from '../types';
import { uiText, getLocalizedText } from '../lib/i18n';

interface SectMenuUIProps {
  game: GameState;
  onChoice: (choiceId: string) => void;
  language: 'vi' | 'en';
}

export default function SectMenuUI({ game, onChoice, language }: SectMenuUIProps) {
  const event = game.currentEvent;
  if (!event || event.id !== 'menu_hoat_dong_tong_mon') return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col font-body-sm bg-abyssal-ink/80 backdrop-blur-md">
      
      {/* Top AppBar */}
      <header className="flex items-center justify-between px-margin-page py-4 border-b border-ethereal-silver/10 bg-void-surface/90">
        <div className="flex items-center gap-stack-sm">
          <div className="w-10 h-10 rounded-full border border-jade-bloom/40 p-0.5 overflow-hidden shadow-[0_0_10px_rgba(11,196,226,0.3)]">
            <div className="w-full h-full bg-surface-container-high rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-jade-bloom text-[20px]">account_balance</span>
            </div>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-jade-bloom font-bold tracking-tight">
              {event.title ? getLocalizedText(event.title, language) : "Hoạt Động Tông Môn"}
            </h1>
            <p className="font-label-caps text-[10px] text-celestial-gold opacity-80 uppercase">
              {game.sect || "Chưa gia nhập"}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onChoice('action_back')}
          className="text-on-surface-variant hover:text-error transition-colors p-2"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-margin-page gap-stack-md overflow-hidden max-w-2xl mx-auto w-full">
        
        {/* Banner */}
        <div className="w-full h-32 rounded-xl border border-ethereal-silver/10 overflow-hidden relative shadow-lg shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-void-surface to-transparent z-10"></div>
          <div className="w-full h-full bg-surface-container-high"></div>
          <div className="absolute bottom-4 left-4 z-20 pr-4">
            <p className="text-jade-bloom font-label-caps text-[11px] mb-1">THÔNG BÁO TÔNG MÔN</p>
            <p className="text-ethereal-silver font-body-sm leading-relaxed line-clamp-2">
              {event.description ? getLocalizedText(event.description, language) : ""}
            </p>
          </div>
        </div>

        {/* Choices List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pb-24 pt-4">
          {event.choices.map((choice) => {
            if (choice.id === 'action_back') return null; // We already have a close button
            
            // Map specific icons and colors based on choice ID
            let icon = 'event_available';
            let colorClass = 'text-jade-bloom';
            let borderClass = 'border-jade-bloom/20 hover:border-jade-bloom/60 hover:bg-jade-bloom/10 shadow-[0_0_10px_rgba(11,196,226,0.1)]';
            let subText = '';
            
            if (choice.id.includes('tournament')) {
              icon = 'swords';
              colorClass = 'text-celestial-gold';
              borderClass = 'border-celestial-gold/20 hover:border-celestial-gold/60 hover:bg-celestial-gold/10 shadow-[0_0_10px_rgba(200,155,60,0.1)]';
              subText = language === 'vi' ? 'Yêu cầu: Luyện Khí Tầng 7' : 'Req: Qi Condensation 7';
            } else if (choice.id.includes('secret_realm')) {
              icon = 'cyclone';
              colorClass = 'text-[#e54545]'; // Custom red for dangerous areas
              borderClass = 'border-[#e54545]/20 hover:border-[#e54545]/60 hover:bg-[#e54545]/10 shadow-[0_0_10px_rgba(229,69,69,0.1)]';
              subText = language === 'vi' ? 'Hiểm địa. Yêu cầu: Luyện Khí 6' : 'Danger zone. Req: Qi Condensation 6';
            }

            return (
              <button 
                key={choice.id}
                onClick={() => onChoice(choice.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border bg-void-surface/60 backdrop-blur-md active:scale-[0.98] transition-all group shadow-md ${borderClass}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-background/50 border border-outline-variant ${colorClass}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-body-lg text-on-surface tracking-wide">
                      {getLocalizedText(choice.text, language)}
                    </span>
                    {/* Optional requirements or cost sub-text */}
                    {subText && (
                      <span className="text-on-surface-variant font-body-sm text-[12px] opacity-70">
                        {subText}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`material-symbols-outlined text-[24px] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${colorClass}`}>
                  chevron_right
                </span>
              </button>
            );
          })}
        </div>
      </main>

    </div>
  );
}
