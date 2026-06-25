const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, searchRegex, replacement) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
  }
};

// 1. Fix engine.ts missing imports
const enginePath = path.join(__dirname, 'lib', 'engine.ts');
let engineContent = fs.readFileSync(enginePath, 'utf8');
// Add import at the top
if (!engineContent.includes('import { tickMonth')) {
  engineContent = "import { tickMonth, getVietnameseMonthName, getEnglishMonthName } from './game-controller';\n" + engineContent;
}
fs.writeFileSync(enginePath, engineContent, 'utf8');

// 2. Fix game-controller.ts - remove getVietnameseMonthName and getEnglishMonthName if they are now exported in engine?
// Wait, I extracted them into game-controller.ts and removed them from engine.ts.
// So importing them from game-controller into engine is correct. Let's make sure they are exported in game-controller.ts.
const gcPath = path.join(__dirname, 'lib', 'game-controller.ts');
let gcContent = fs.readFileSync(gcPath, 'utf8');
gcContent = gcContent.replace(/export function getVietnameseMonthName/g, 'export function getVietnameseMonthName'); // Just ensuring they are exported, which my previous script did
fs.writeFileSync(gcPath, gcContent, 'utf8');

// 3. Fix app/page.tsx
const pagePath = path.join(__dirname, 'app', 'page.tsx');
if (fs.existsSync(pagePath)) {
  let content = fs.readFileSync(pagePath, 'utf8');
  // tickMonth might be imported like: import { tickMonth, ... } from '../lib/engine';
  // We need to remove tickMonth from engine import, and import it from game-controller.
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/lib\/engine['"]/, (match, group1) => {
    let imports = group1.split(',').map(s => s.trim());
    if (imports.includes('tickMonth')) {
      imports = imports.filter(i => i !== 'tickMonth');
      if (imports.length === 0) return ``;
      return `import { ${imports.join(', ')} } from '../lib/engine';\nimport { tickMonth } from '../lib/game-controller';`;
    }
    return match;
  });
  // Also check if it's imported in a separate line
  fs.writeFileSync(pagePath, content, 'utf8');
}

// 4. Fix components/AdminPanel.tsx
const adminPath = path.join(__dirname, 'components', 'AdminPanel.tsx');
if (fs.existsSync(adminPath)) {
  let content = fs.readFileSync(adminPath, 'utf8');
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/lib\/engine['"]/, (match, group1) => {
    let imports = group1.split(',').map(s => s.trim());
    if (imports.includes('tickMonth')) {
      imports = imports.filter(i => i !== 'tickMonth');
      if (imports.length === 0) return ``;
      return `import { ${imports.join(', ')} } from '../lib/engine';\nimport { tickMonth } from '../lib/game-controller';`;
    }
    return match;
  });
  fs.writeFileSync(adminPath, content, 'utf8');
}

// 5. Fix scripts/test-simulation.ts
const testPath = path.join(__dirname, 'scripts', 'test-simulation.ts');
if (fs.existsSync(testPath)) {
  let content = fs.readFileSync(testPath, 'utf8');
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/lib\/engine['"]/, (match, group1) => {
    let imports = group1.split(',').map(s => s.trim());
    if (imports.includes('tickMonth')) {
      imports = imports.filter(i => i !== 'tickMonth');
      if (imports.length === 0) return ``;
      return `import { ${imports.join(', ')} } from '../lib/engine';\nimport { tickMonth } from '../lib/game-controller';`;
    }
    return match;
  });
  fs.writeFileSync(testPath, content, 'utf8');
}

console.log('Imports fixed.');
