'use client';

import React from 'react';
import type { Lang } from '../types';
import { uiText } from '../lib/i18n';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'obsidian' | 'parchment';
  setTheme: (t: 'dark' | 'obsidian' | 'parchment') => void;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  setFontSize: (fs: 'sm' | 'md' | 'lg' | 'xl') => void;
  language: Lang;
  setLanguage: (l: Lang) => void;
  audioEnabled: boolean;
  setAudioEnabled: (e: boolean) => void;
  audioMuted: boolean;
  setAudioMuted: (m: boolean) => void;
  audioVolume: number;
  setAudioVolume: (v: number) => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  language,
  setLanguage,
  audioEnabled,
  setAudioEnabled,
  audioMuted,
  setAudioMuted,
  audioVolume,
  setAudioVolume,
}: Props) {
  if (!isOpen) return null;

  const copy = uiText[language] || uiText['en'];

  // Icons for audio
  const soundOnIcon = (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  );
  
  const soundOffIcon = (
    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <button 
        type="button" 
        className="absolute inset-0 cursor-default focus:outline-none" 
        onClick={onClose} 
        aria-label="Close settings" 
      />

      {/* Main Settings Card */}
      <div className="adventure-card w-full max-w-md p-6 relative z-10 animate-slide-up border-2 border-accent text-text-primary">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-xl font-serif focus:outline-none transition-colors"
        >
          ✕
        </button>

        {/* Header Title with golden gear icon */}
        <div className="flex items-center gap-3 border-b border-accent/20 pb-4 mb-6">
          <img
            src="/images/gear_icon.png"
            alt="Gear"
            className="w-7 h-7 object-contain animate-[spin_10s_linear_infinite]"
          />
          <h2 className="font-serif text-2xl text-accent font-bold tracking-wider uppercase">
            {copy.settingsTitle || 'Thái Cổ Cấu Hình'}
          </h2>
        </div>

        <div className="space-y-6">
          {/* 1. Theme Configuration */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-accent font-serif font-bold block">
              {copy.themeLabel || 'Thiên Địa Giao Diện'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 text-xs rounded-sm border transition font-serif ${
                  theme === 'dark'
                    ? 'border-accent bg-accent/10 text-accent font-bold'
                    : 'border-zinc-800 bg-black/30 text-text-secondary hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {copy.themeDark || 'U Tối'}
              </button>
              <button
                type="button"
                onClick={() => setTheme('obsidian')}
                className={`py-2 px-3 text-xs rounded-sm border transition font-serif ${
                  theme === 'obsidian'
                    ? 'border-accent bg-accent/10 text-accent font-bold'
                    : 'border-zinc-800 bg-black/30 text-text-secondary hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {copy.themeObsidian || 'Trầm Mặc'}
              </button>
              <button
                type="button"
                onClick={() => setTheme('parchment')}
                className={`py-2 px-3 text-xs rounded-sm border transition font-serif ${
                  theme === 'parchment'
                    ? 'border-accent bg-accent/10 text-accent font-bold'
                    : 'border-zinc-800 bg-black/30 text-text-secondary hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {copy.themeParchment || 'Bạch Tông'}
              </button>
            </div>
          </div>

          {/* 2. Font Size Configuration */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-accent font-serif font-bold block">
              {copy.fontSizeLabel || 'Thần Thức (Cỡ Chữ)'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => {
                const labelMap = {
                  sm: copy.fontSizeSm || 'Nhỏ',
                  md: copy.fontSizeMd || 'Vừa',
                  lg: copy.fontSizeLg || 'Lớn',
                  xl: copy.fontSizeXl || 'Cực Lớn',
                };
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontSize(sz)}
                    className={`py-2 px-1 text-xs rounded-sm border transition font-serif ${
                      fontSize === sz
                        ? 'border-accent bg-accent/10 text-accent font-bold'
                        : 'border-zinc-800 bg-black/30 text-text-secondary hover:border-accent/40 hover:text-text-primary'
                    }`}
                  >
                    {labelMap[sz]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Language Configuration */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-accent font-serif font-bold block">
              {copy.language || 'Ngôn Ngữ'}
            </label>
            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`flex-1 py-2 px-3 text-xs rounded-sm border transition font-serif ${
                  (uiText[language]?.['borderzinc800Bgblack'] || 'border-zinc-800 bg-black/30 text-text-secondary hover:border-accent/40 hover:text-text-primary')
                }`}
              >
                Tiếng Việt (VI)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 px-3 text-xs rounded-sm border transition font-serif ${
                  (uiText[language]?.['borderaccentBgaccent'] || 'border-accent bg-accent/10 text-accent font-bold')
                }`}
              >
                English (EN)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`flex-1 py-2 px-3 text-xs rounded-sm border transition font-serif ${
                  language === 'zh'
                    ? 'border-accent bg-accent/10 text-accent font-bold'
                    : 'border-zinc-800 bg-black/30 text-text-secondary hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                中文 (ZH)
              </button>
            </div>
          </div>

          {/* 4. Audio Control Configuration */}
          <div className="space-y-3.5 border-t border-accent/10 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-accent font-serif font-bold block">
                {copy.audio || 'Âm Thanh'}
              </label>
              
              <div className="flex items-center gap-2">
                {/* Audio Enable Toggle */}
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`px-3 py-1 text-[10px] font-medium border rounded-sm transition font-serif ${
                    audioEnabled
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-zinc-800 text-text-tertiary'
                  }`}
                >
                  {audioEnabled ? copy.audioOn || 'Bật' : copy.audioOff || 'Tắt'}
                </button>

                {/* Audio Mute Toggle */}
                <button
                  type="button"
                  onClick={() => setAudioMuted(!audioMuted)}
                  disabled={!audioEnabled}
                  className="p-1 border border-zinc-800 rounded-sm text-text-secondary hover:text-accent disabled:opacity-30 disabled:hover:text-text-secondary transition"
                  aria-label="Mute sound"
                >
                  {audioMuted ? soundOffIcon : soundOnIcon}
                </button>
              </div>
            </div>

            {/* Volume slider */}
            {audioEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-text-tertiary font-serif">
                  {copy.volume || 'Âm Lượng'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(audioVolume * 100)}
                  onChange={(e) => setAudioVolume(parseInt(e.target.value) / 100)}
                  disabled={!audioEnabled || audioMuted}
                  className="flex-1 h-1 bg-accent/20 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <span className="text-xs text-text-tertiary font-serif min-w-[2rem] text-right">
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confirm / Close Plaque at Bottom */}
        <div className="mt-8 pt-4 border-t border-accent/15">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-center text-sm font-semibold font-medium rounded-sm border border-accent bg-accent/10 text-accent hover:bg-accent hover:text-black transition-all duration-300 font-serif"
          >
            {copy.closeSettings || 'Đóng Thiết Lập'}
          </button>
        </div>
      </div>
    </div>
  );
}
