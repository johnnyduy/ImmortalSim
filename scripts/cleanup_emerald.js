const fs = require('fs');

const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // Legacy perks on start screen
  ['border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] bg-[#10b981]/10', 'border-secondary shadow-[0_0_12px_rgba(255,176,0,0.3)] bg-secondary/10'],
  ['hover:border-emerald-500/50', 'hover:border-secondary/50'],
  ['border-zinc-800/80 hover:border-secondary/50 hover:bg-zinc-900/80', 'border-outline-variant/30 hover:border-secondary/50 hover:bg-surface-container-low'],
  ['bg-black/40', 'bg-surface-container-lowest/80'],
  
  // A few more random emerald text that might have been left
  ['text-emerald-500', 'text-secondary'],
  ['text-emerald-400', 'text-secondary'],
  ['border-emerald-500', 'border-secondary'],
  ['bg-emerald-500', 'bg-secondary'],
];

for (const [oldStr, newStr] of replacements) {
  content = content.split(oldStr).join(newStr);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Cleaned up remaining emerald/wuxia styles in page.tsx');
