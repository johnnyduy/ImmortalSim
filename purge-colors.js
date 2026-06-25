const fs = require('fs');
const path = require('path');

const replaceColors = (content) => {
  return content
    // Text colors
    .replace(/text-\[#c5a059\]/g, 'text-emerald-500')
    .replace(/text-\[#e5c17b\]/g, 'text-emerald-400')
    .replace(/text-\[#f5d76e\]/g, 'text-emerald-300')
    .replace(/text-\[#847764\]/g, 'text-zinc-400')
    .replace(/text-\[#b89f65\]/g, 'text-emerald-500')
    .replace(/text-amber-900/g, 'text-emerald-900')
    
    // Backgrounds
    .replace(/bg-\[#1e1915\]/g, 'bg-zinc-900')
    .replace(/bg-\[#28211b\]/g, 'bg-zinc-800')
    .replace(/bg-\[#0c0a08\]/g, 'bg-zinc-950')
    .replace(/bg-\[#14110f\]/g, 'bg-zinc-950')
    .replace(/bg-\[#3e3328\]/g, 'bg-zinc-800')
    .replace(/bg-amber-900/g, 'bg-emerald-900')
    
    // Borders
    .replace(/border-\[#c5a059\]/g, 'border-emerald-500')
    .replace(/border-\[#3e3328\]/g, 'border-zinc-800')
    .replace(/border-\[#847764\]/g, 'border-zinc-600')
    .replace(/border-amber-950/g, 'border-emerald-950')
    
    // Hex literals inside style tags or strings
    .replace(/#c5a059/gi, '#10b981')
    .replace(/#c5920a/gi, '#10b981')
    .replace(/#e5c17b/gi, '#34d399')
    .replace(/#f5d76e/gi, '#6ee7b7')
    .replace(/#1e1915/gi, '#18181b')
    .replace(/#28211b/gi, '#27272a')
    .replace(/#0c0a08/gi, '#09090b')
    .replace(/#3e3328/gi, '#27272a')
    .replace(/#847764/gi, '#71717a')
    .replace(/#b89f65/gi, '#10b981')
    .replace(/#14110f/gi, '#09090b')
    .replace(/#5c3d1a/gi, '#064e3b')
    .replace(/#3d2610/gi, '#065f46')
    .replace(/#2a1a08/gi, '#022c22')
    .replace(/#2e1d0a/gi, '#022c22');
};

const processDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = replaceColors(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated colors in: ${fullPath}`);
      }
    }
  }
};

processDir(path.join(__dirname, 'app'));
processDir(path.join(__dirname, 'components'));
