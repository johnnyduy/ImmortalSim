const fs = require('fs');
const path = require('path');

const filesToProcess = [
  path.join(__dirname, 'app/page.tsx'),
  path.join(__dirname, 'lib/engine.ts')
];

for (const file of filesToProcess) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace { vi: '...', en: '...' } with { vi: '...', en: '...', zh: '[ZH-TODO] ...' }
    // We'll use a regex that matches { vi: "...", en: "..." } or { en: "...", vi: "..." }
    // It's a bit tricky to parse the values safely with regex. 
    // Let's match { \s*vi: ([^,]+), \s*en: ([^}]+) }
    content = content.replace(/\{\s*vi:\s*([^,]+),\s*en:\s*([^}]+?)\s*\}/g, (match, viVal, enVal) => {
      // Create zhVal from enVal (just stripping the last character which might be spaces or quotes, wait)
      // actually enVal is a JS expression, we can just do `zh: "[ZH-TODO] " + String(${enVal})`
      return `{ vi: ${viVal}, en: ${enVal}, zh: "[ZH-TODO] " + String(${enVal}) }`;
    });

    content = content.replace(/\{\s*en:\s*([^,]+),\s*vi:\s*([^}]+?)\s*\}/g, (match, enVal, viVal) => {
      return `{ en: ${enVal}, vi: ${viVal}, zh: "[ZH-TODO] " + String(${enVal}) }`;
    });
    
    // Also fix `customDeathCause: { vi: string; en: string }`
    content = content.replace(/customDeathCause:\s*\{\s*vi:\s*string;\s*en:\s*string\s*\}/g, "customDeathCause: LocalizedText");

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed LocalizedText in ${path.basename(file)}`);
  }
}
