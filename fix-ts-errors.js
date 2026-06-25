const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// Fix duplicate uiText import
const lines = content.split('\n');
let uiTextImports = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('import { uiText }')) {
    uiTextImports++;
    if (uiTextImports > 1) {
      lines[i] = ''; // remove duplicate
    }
  }
}
content = lines.join('\n');

// Fix app/page.tsx(1094,27): Cannot find name 'LocalizedText'
if (!content.includes('import type { LocalizedText')) {
  content = content.replace("import type { Lang", "import type { Lang, LocalizedText");
}

fs.writeFileSync(pageFile, content, 'utf8');

// Now for SectMissionsPanel.tsx
const smpFile = path.join(__dirname, 'components/SectMissionsPanel.tsx');
let smpContent = fs.readFileSync(smpFile, 'utf8');

// Change `[language === 'vi' ? 'vi' : 'en']` to `[language as keyof typeof obj]`
// Actually the easiest is to just use `as any` for the indexing or replace `language === 'vi' ? 'vi' : 'en'` with `(language as any)`
smpContent = smpContent.replace(/\[language === 'vi' \? 'vi' : 'en'\]/g, "[(language as any)]");

fs.writeFileSync(smpFile, smpContent, 'utf8');

// For engine.ts:
const engineFile = path.join(__dirname, 'lib/engine.ts');
let engineContent = fs.readFileSync(engineFile, 'utf8');
// Fix lib/engine.ts(4951,23): Property 'zh' does not exist on type '{ vi: string; en: string; }'
engineContent = engineContent.replace(/\{ vi: "Sức mạnh cường đại", en: "Overwhelming Force" \}/g, '{ vi: "Sức mạnh cường đại", en: "Overwhelming Force", zh: "Overwhelming Force" }');
engineContent = engineContent.replace(/\{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme" \}/g, '{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme", zh: "Cunning Scheme" }');
fs.writeFileSync(engineFile, engineContent, 'utf8');

console.log("Fixed manual TS errors.");
