const fs = require('fs');
const path = require('path');

// Fix app/page.tsx duplicate import
const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');
const lines = content.split('\n');
let imports = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('import { uiText }')) {
    imports++;
    if (imports > 1) {
      lines[i] = '';
    }
  }
}
content = lines.join('\n');
fs.writeFileSync(pageFile, content, 'utf8');

// Fix components/SectMissionsPanel.tsx
const smpFile = path.join(__dirname, 'components/SectMissionsPanel.tsx');
let smpContent = fs.readFileSync(smpFile, 'utf8');
// Fix: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type
smpContent = smpContent.replace(/\[language === 'vi' \? 'vi' : 'en'\]/g, '[(language === "vi" ? "vi" : "en") as "vi" | "en"]');
// Also wait! What if it's `log[language === 'vi' ? 'vi' : 'en']`?
// The error says: `No index signature with a parameter of type 'string' was found`
// Casting to `"vi" | "en"` will solve it.
fs.writeFileSync(smpFile, smpContent, 'utf8');

// Fix lib/engine.ts
const engineFile = path.join(__dirname, 'lib/engine.ts');
let engineContent = fs.readFileSync(engineFile, 'utf8');
engineContent = engineContent.replace(/\{ vi: "Sức mạnh cường đại", en: "Overwhelming Force" \}/g, '{ vi: "Sức mạnh cường đại", en: "Overwhelming Force", zh: "Overwhelming Force" }');
engineContent = engineContent.replace(/\{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme" \}/g, '{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme", zh: "Cunning Scheme" }');
fs.writeFileSync(engineFile, engineContent, 'utf8');
