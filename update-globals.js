const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Update Google Fonts import
content = content.replace(
  /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Playfair\+Display[^']+'\);/,
  `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');`
);

// Replace themes with Taste Skill pure monochrome + emerald
const rootThemeRegex = /:root,[\s\S]*?--color-blue: #4a6fa5;\n}/;
content = content.replace(rootThemeRegex, `:root,
html.theme-dark {
  color-scheme: dark;
  --color-bg: #09090b; /* Zinc 950 */
  --color-surface: #18181b; /* Zinc 900 */
  --color-panel: #27272a; /* Zinc 800 */
  --color-text-primary: #f4f4f5; /* Zinc 100 */
  --color-text-secondary: #a1a1aa; /* Zinc 400 */
  --color-text-tertiary: #71717a; /* Zinc 500 */
  --color-accent: #10b981; /* Emerald 500 */
  --color-accent-hover: #34d399; /* Emerald 400 */
  --color-danger: #ef4444; /* Red 500 */
  --color-success: #10b981; /* Emerald 500 */
  --color-blue: #3b82f6; /* Blue 500 */
}`);

// Replace Obsidian theme
const obsidianRegex = /html\.theme-obsidian {[\s\S]*?--color-blue: #5b87c7;\n}/;
content = content.replace(obsidianRegex, `html.theme-obsidian {
  color-scheme: dark;
  --color-bg: #000000;
  --color-surface: #09090b;
  --color-panel: #18181b;
  --color-text-primary: #ffffff;
  --color-text-secondary: #d4d4d8;
  --color-text-tertiary: #a1a1aa;
  --color-accent: #059669; /* Emerald 600 */
  --color-accent-hover: #10b981;
  --color-danger: #dc2626;
  --color-success: #059669;
  --color-blue: #2563eb;
}`);

// Replace Parchment theme
const parchmentRegex = /html\.theme-parchment {[\s\S]*?--color-blue: #365f91;\n}/;
content = content.replace(parchmentRegex, `html.theme-parchment {
  color-scheme: light;
  --color-bg: #ffffff;
  --color-surface: #f4f4f5;
  --color-panel: #e4e4e7;
  --color-text-primary: #09090b;
  --color-text-secondary: #3f3f46;
  --color-text-tertiary: #71717a;
  --color-accent: #059669;
  --color-accent-hover: #047857;
  --color-danger: #dc2626;
  --color-success: #059669;
  --color-blue: #2563eb;
}`);

// Replace typography and body styles
content = content.replace(
  /font-family: 'Outfit', system-ui, sans-serif;/,
  `font-family: 'Outfit', system-ui, sans-serif;
  overflow: hidden; /* Lock the body to prevent scrolling, managed inside app/page.tsx */`
);

content = content.replace(
  /.narrative {[\s\S]*?letter-spacing: 0.2px;\n}/,
  `.narrative {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}`
);

content = content.replace(
  /.narrative-large {[\s\S]*?letter-spacing: 0.5px;\n}/,
  `.narrative-large {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-text-primary);
}`
);

// Fix RPG buttons
content = content.replace(
  /font-family: 'EB Garamond', Georgia, serif;/,
  `font-family: 'Outfit', system-ui, sans-serif; font-weight: 500;`
);

// Make sure we change the hardcoded brass shadows/borders to zinc/emerald
content = content.replace(/rgba\(197, 160, 89,/g, "rgba(16, 185, 129,"); // Emerald 500
content = content.replace(/#1e1915/g, "#18181b"); // Zinc 900
content = content.replace(/#16120f/g, "#09090b"); // Zinc 950
content = content.replace(/#362e24/g, "#27272a"); // Zinc 800
content = content.replace(/#1c1814/g, "#18181b"); // Zinc 900
content = content.replace(/#3e3328/g, "#27272a"); // Zinc 800
content = content.replace(/#241e19/g, "#27272a"); // Zinc 800
content = content.replace(/#1a1511/g, "#09090b"); // Zinc 950
content = content.replace(/#161310/g, "#09090b"); // Zinc 950
content = content.replace(/#110e0c/g, "#000000"); // Black
content = content.replace(/#1a1512/g, "#18181b"); // Zinc 900

fs.writeFileSync(cssPath, content, 'utf8');
console.log('globals.css updated for Taste Skill.');
