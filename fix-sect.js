const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'components/SectMissionsPanel.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace all `[(uiText[language]?.['en'] || 'en')]` with `[language as "vi"|"en"]`
content = content.replace(/\[\(uiText\[language\]\?\.\['en'\] \|\| 'en'\)\]/g, '[language as "vi" | "en"]');

// Same for `[(uiText[language]?.['vi'] || 'vi')]`? Just in case.
content = content.replace(/\[\(uiText\[language\]\?\.\['vi'\] \|\| 'vi'\)\]/g, '[language as "vi" | "en"]');

fs.writeFileSync(file, content, 'utf8');

const engineFile = path.join(__dirname, 'lib/engine.ts');
let engineContent = fs.readFileSync(engineFile, 'utf8');
// Fix lib/engine.ts(4951,23): Property 'zh' does not exist
engineContent = engineContent.replace(/\{ vi: "Sức mạnh cường đại", en: "Overwhelming Force" \}/g, '{ vi: "Sức mạnh cường đại", en: "Overwhelming Force", zh: "Overwhelming Force" }');
engineContent = engineContent.replace(/\{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme" \}/g, '{ vi: "Quỷ kế đa đoan", en: "Cunning Scheme", zh: "Cunning Scheme" }');
fs.writeFileSync(engineFile, engineContent, 'utf8');

console.log("Fixed SectMissionsPanel and engine.ts");
