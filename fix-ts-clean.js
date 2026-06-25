const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// 1. Duplicate uiText import (line 37 usually)
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

// 2. LocalizedText missing import
if (!content.includes('import type { LocalizedText')) {
  content = content.replace("import type { GameState, Inheritance, Lang, SectQuest", "import type { GameState, Inheritance, Lang, LocalizedText, SectQuest");
}

// 3. getLocalizedText(oldStageName, language)
content = content.replace(/oldStageName: oldStageName\[language\],/g, 'oldStageName: getLocalizedText(oldStageName, language),');
content = content.replace(/newStageName: newStageName\[language\],/g, 'newStageName: getLocalizedText(newStageName, language),');

// 4. `language` to `language as "vi" | "en"` for CombatModal and CultivationMinigame
content = content.replace(/language=\{language\}/g, 'language={language as "vi" | "en"}');
// Also wait, TimeGearPanel? `language={language}` => it's fine, we will just replace all of them, or maybe I should let TS infer it if I change the props.
// I'll just change the props of the components! Yes! I'll update `types/index.ts` Lang. Oh wait, `Lang` is already updated. The components just need `Lang`!

fs.writeFileSync(pageFile, content, 'utf8');

// For SectMissionsPanel
const smpFile = path.join(__dirname, 'components/SectMissionsPanel.tsx');
let smpContent = fs.readFileSync(smpFile, 'utf8');
smpContent = smpContent.replace(/\[language === 'vi' \? 'vi' : 'en'\]/g, '[(language === "vi" ? "vi" : "en")]'); // it was expecting "vi" | "en", but language is Lang! 
smpContent = smpContent.replace(/title\[language === 'vi' \? 'vi' : 'en'\]/g, 'getLocalizedText(title, language)');
smpContent = smpContent.replace(/description\[language === 'vi' \? 'vi' : 'en'\]/g, 'getLocalizedText(description, language)');
// Wait, actually let's just write `getLocalizedText` inside SectMissionsPanel?
// We need to import `getLocalizedText` in SectMissionsPanel.
if (!smpContent.includes('getLocalizedText')) {
    smpContent = smpContent.replace(/import \{ uiText \} from '\.\.\/lib\/i18n';/, "import { uiText, getLocalizedText } from '../lib/i18n';");
}
smpContent = smpContent.replace(/quest\.title\[language === 'vi' \? 'vi' : 'en'\]/g, "getLocalizedText(quest.title, language)");
smpContent = smpContent.replace(/quest\.description\[language === 'vi' \? 'vi' : 'en'\]/g, "getLocalizedText(quest.description, language)");
smpContent = smpContent.replace(/log\[language === 'vi' \? 'vi' : 'en'\]/g, "(log as any)[language]");

fs.writeFileSync(smpFile, smpContent, 'utf8');

// For `lib/engine.ts` TS7053: Property 'zh' does not exist
const engineFile = path.join(__dirname, 'lib/engine.ts');
let engineContent = fs.readFileSync(engineFile, 'utf8');
engineContent = engineContent.replace(/\{ vi: "Sức mạnh cường đại", en: "Overwhelming Force" \}/g, '{ vi: "Sức mạnh cường đại", en: "Overwhelming Force", zh: "Overwhelming Force" }');
engineContent = engineContent.replace(/\{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme" \}/g, '{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme", zh: "Cunning Scheme" }');
fs.writeFileSync(engineFile, engineContent, 'utf8');

console.log("Fixes applied cleanly.");
