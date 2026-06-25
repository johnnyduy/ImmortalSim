const fs = require('fs');

const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // Container backgrounds
  ['bg-zinc-950/95 border border-emerald-500/40 shadow-2xl', 'bg-surface-container-lowest/90 border border-outline-variant/30 shadow-2xl backdrop-blur-sm'],
  ['bg-[#eae1c8]', 'bg-surface-container-lowest'],
  ['text-neutral-800', 'text-on-surface'],
  ['border-[#10b981]/35', 'border-outline-variant/30'],
  
  // Section Titles
  ['text-xs  text-emerald-500 font-semibold font-serif', 'font-label-caps text-label-caps text-secondary-fixed opacity-80 uppercase tracking-widest'],
  ['text-[10px]  text-zinc-400 font-serif', 'font-label-caps text-label-caps text-secondary-fixed opacity-60 mb-2 block'],
  ['font-serif text-emerald-400 text-2xl', 'font-headline-lg text-headline-lg text-primary uppercase tracking-widest'],
  ['font-serif text-emerald-400 text-xl', 'font-headline-md text-headline-md text-primary uppercase tracking-widest'],
  ['text-xl sm:text-2xl font-serif font-bold text-center text-emerald-400', 'text-xl sm:text-2xl font-headline-lg font-bold text-center text-primary uppercase tracking-widest'],
  
  // Gender buttons
  ['border-zinc-800 bg-black/40 text-text-secondary hover:border-zinc-600 hover:text-white', 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-secondary'],
  ['border-[#34d399] bg-[#34d399]/10 text-white shadow-[0_0_12px_rgba(229,193,123,0.25)]', 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(255,176,0,0.2)]'],
  
  // Root/Sect unselected buttons
  ['border-zinc-800/80 bg-black/30 text-text-secondary hover:border-zinc-600 hover:text-white', 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-secondary'],
  ['border-zinc-800/80 bg-black/40 text-text-secondary hover:border-zinc-600', 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-secondary'],
  
  // Root/Sect selected buttons
  ['border-[#34d399] bg-[#34d399]/10 text-white shadow-[0_0_10px_rgba(229,193,123,0.2)]', 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(255,176,0,0.2)]'],
  
  // The BIG Start/Journey Buttons
  ['w-full py-4 text-center font-serif text-base font-bold  rounded-sm border border-emerald-500 bg-gradient-to-r from-[#18181b] to-[#2d241c] text-emerald-400 hover:text-white hover:border-[#34d399] transition-all duration-300 shadow-[0_4px_15px_rgba(197,160,89,0.2)] hover:shadow-[0_4px_25px_rgba(229,193,123,0.4)]', 'w-full py-4 text-center font-headline-sm text-headline-sm font-bold border transition-all duration-300 uppercase tracking-widest border-secondary/40 text-secondary hover:border-secondary hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(255,176,0,0.2)] hover:-translate-y-0.5 cursor-pointer bg-surface-container-low/80'],
  
  // Other small buttons in settings/menus
  ['font-serif text-emerald-400', 'font-mono-data text-secondary'],
  ['text-emerald-400', 'text-secondary'],
  ['border-emerald-500', 'border-secondary'],
  ['bg-emerald-500', 'bg-secondary'],
  ['hover:border-emerald-500', 'hover:border-secondary'],
  ['hover:text-[#34d399]', 'hover:text-secondary'],
  ['text-[#34d399]', 'text-secondary'],
];

for (const [oldStr, newStr] of replacements) {
  content = content.split(oldStr).join(newStr);
}

// Replace the Start Screen Background
content = content.replace(
  `background: 'linear-gradient(180deg, #1a2f5a 0%, #2d4a8a 20%, #6b8fd4 45%, #a8c5e8 65%, #c5d8f0 80%, #e8f0f8 95%, #f0f4fa 100%)'`,
  `background: 'var(--background)'`
);

content = content.replace(
  `src="/images/start_screen_bg.png"`,
  `src="/images/start.png"`
);

// We need to fix the Language toggle styling in the Start menu
content = content.replace(
  `background: language === l
                            ? 'linear-gradient(180deg, #064e3b 0%, #022c22 100%)'
                            : 'rgba(255,255,255,0.6)',
                          border: language === l ? '2px solid #10b981' : '2px solid rgba(150,110,40,0.4)',
                          color: language === l ? '#6ee7b7' : 'rgba(60,40,10,0.7)',
                          boxShadow: language === l ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'`,
  `background: language === l
                            ? 'rgba(255,176,0,0.1)'
                            : 'rgba(0,0,0,0.4)',
                          border: language === l ? '1px solid #ffb000' : '1px solid rgba(255,255,255,0.2)',
                          color: language === l ? '#ffb000' : 'rgba(255,255,255,0.5)',
                          boxShadow: language === l ? '0 0 10px rgba(255,176,0,0.2)' : 'none'`
);

content = content.replace(
  `background: audioEnabled
                          ? 'linear-gradient(180deg, #064e3b 0%, #022c22 100%)'
                          : 'rgba(255,255,255,0.6)',
                        border: audioEnabled ? '2px solid #10b981' : '2px solid rgba(150,110,40,0.4)',`,
  `background: audioEnabled
                          ? 'rgba(255,176,0,0.1)'
                          : 'rgba(0,0,0,0.4)',
                        border: audioEnabled ? '1px solid #ffb000' : '1px solid rgba(255,255,255,0.2)',`
);

content = content.replace(
  `color: audioEnabled ? '#6ee7b7' : 'rgba(60,40,10,0.7)',
                        boxShadow: audioEnabled ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'`,
  `color: audioEnabled ? '#ffb000' : 'rgba(255,255,255,0.5)',
                        boxShadow: audioEnabled ? '0 0 10px rgba(255,176,0,0.2)' : 'none'`
);

// Write back
fs.writeFileSync(file, content, 'utf8');
console.log('UI theme updated in page.tsx');
