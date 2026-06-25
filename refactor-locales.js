const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const appDir = path.join(__dirname, 'app');

const filesToProcess = [];

function findFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      filesToProcess.push(fullPath);
    }
  }
}

findFiles(componentsDir);
findFiles(appDir);

let enUi = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/en/ui.json'), 'utf8'));
let viUi = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/vi/ui.json'), 'utf8'));
let zhUi = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/zh/ui.json'), 'utf8'));

function generateKey(enStr) {
  let key = enStr.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map((word, i) => {
    if (i === 0) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
  if (key.length > 20) key = key.substring(0, 20);
  if (!key) key = 'uiKey' + Math.floor(Math.random() * 10000);
  
  // ensure uniqueness
  let finalKey = key;
  let counter = 1;
  while (enUi[finalKey] && enUi[finalKey] !== enStr) {
    finalKey = key + counter;
    counter++;
  }
  return finalKey;
}

const regex1 = /language\s*===\s*'vi'\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/g;
const regex2 = /language\s*===\s*'vi'\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/g;
// match language === 'vi' ? `...` : `...` without inner variables for now
const regex3 = /language\s*===\s*'vi'\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`/g;

let totalReplaced = 0;

for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  function replacer(match, viStr, enStr) {
    const key = generateKey(enStr);
    enUi[key] = enStr;
    viUi[key] = viStr;
    zhUi[key] = `[ZH-TODO] ${enStr}`; // Temporary placeholder
    totalReplaced++;
    
    // We need to ensure uiText is imported in the file, we will add it later if missing
    return `(uiText[language]?.['${key}'] || '${enStr}')`;
  }

  content = content.replace(regex1, replacer);
  content = content.replace(regex2, replacer);
  content = content.replace(regex3, replacer);

  // Also match language === 'en' ? 'enStr' : 'viStr' (rare but possible)
  const regexEnFirst = /language\s*===\s*'en'\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/g;
  content = content.replace(regexEnFirst, (match, enStr, viStr) => replacer(match, viStr, enStr));

  if (content !== originalContent) {
    // Check if uiText is imported
    if (!content.includes('uiText')) {
      // Find the last import
      const importMatches = [...content.matchAll(/^import .*;$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const index = lastImport.index + lastImport[0].length;
        // Determine relative path to lib/i18n.ts
        const depth = file.split(path.sep).length - path.join(__dirname, '').split(path.sep).length - 1;
        const relativePath = depth === 0 ? './lib/i18n' : '../'.repeat(depth) + 'lib/i18n';
        content = content.slice(0, index) + `\nimport { uiText } from '${relativePath}';` + content.slice(index);
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
  }
}

// Write updated JSON files
fs.writeFileSync(path.join(__dirname, 'locales/en/ui.json'), JSON.stringify(enUi, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname, 'locales/vi/ui.json'), JSON.stringify(viUi, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname, 'locales/zh/ui.json'), JSON.stringify(zhUi, null, 2) + '\n', 'utf8');

console.log(`Done. Replaced ${totalReplaced} occurrences.`);
