const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Replace the main shell to force Mobile-First layout
const mainRegex = /<main className="([^"]*)"([^>]*)>/;
const match = content.match(mainRegex);
if (match) {
  content = content.replace(mainRegex, `<main className="max-w-md mx-auto min-h-[100dvh] flex flex-col relative bg-zinc-950 text-zinc-100 overflow-hidden shadow-2xl"$2>`);
}

// Ensure html/body have dark theme background in layout if needed (we already did this in globals.css)
// Let's also enforce background colors on ChoiceButtons, EventLog
const statsPath = path.join(__dirname, 'components', 'StatsPanel.tsx');
if (fs.existsSync(statsPath)) {
  let statsContent = fs.readFileSync(statsPath, 'utf8');
  // Taste Skill: Bento grids, clean pills. We'll simplify the inline styles that have hardcoded brown colors.
  statsContent = statsContent.replace(/bg-\[#1a1511\]\/80/g, 'bg-zinc-900/80');
  statsContent = statsContent.replace(/bg-\[#16120f\]/g, 'bg-zinc-950');
  statsContent = statsContent.replace(/border-\[#3e3328\]/g, 'border-zinc-800');
  statsContent = statsContent.replace(/border-\[#c5a059\]/g, 'border-emerald-500/30');
  statsContent = statsContent.replace(/text-\[#e5c17b\]/g, 'text-zinc-100');
  statsContent = statsContent.replace(/text-\[#f5d76e\]/g, 'text-emerald-400');
  statsContent = statsContent.replace(/text-\[#b89f65\]/g, 'text-zinc-400');
  fs.writeFileSync(statsPath, statsContent, 'utf8');
}

const choicesPath = path.join(__dirname, 'components', 'ChoiceButtons.tsx');
if (fs.existsSync(choicesPath)) {
  let choicesContent = fs.readFileSync(choicesPath, 'utf8');
  // Enforce minimal high contrast buttons
  choicesContent = choicesContent.replace(/bg-\[#1a1512\]/g, 'bg-zinc-900');
  choicesContent = choicesContent.replace(/hover:bg-\[#241e19\]/g, 'hover:bg-zinc-800');
  choicesContent = choicesContent.replace(/border-\[#3e3328\]/g, 'border-zinc-800');
  choicesContent = choicesContent.replace(/hover:border-\[#c5a059\]/g, 'hover:border-emerald-500/50');
  choicesContent = choicesContent.replace(/text-\[#e5c17b\]/g, 'text-zinc-100');
  choicesContent = choicesContent.replace(/group-hover:text-white/g, 'group-hover:text-emerald-400');
  fs.writeFileSync(choicesPath, choicesContent, 'utf8');
}

const eventLogPath = path.join(__dirname, 'components', 'EventLog.tsx');
if (fs.existsSync(eventLogPath)) {
  let eventLogContent = fs.readFileSync(eventLogPath, 'utf8');
  // Make it raw terminal feel
  eventLogContent = eventLogContent.replace(/border-\[#3e3328\]\/30/g, 'border-zinc-800/50');
  eventLogContent = eventLogContent.replace(/border-\[#3e3328\]/g, 'border-zinc-800');
  eventLogContent = eventLogContent.replace(/bg-\[#0c0a08\]\/80/g, 'bg-zinc-950/80');
  eventLogContent = eventLogContent.replace(/text-\[#b89f65\]/g, 'text-zinc-400');
  fs.writeFileSync(eventLogPath, eventLogContent, 'utf8');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Mobile shell and component colors updated for Taste Skill.');
