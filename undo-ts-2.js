const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// Undo fix-ts-2.js
content = content.replace(/setLanguage\(language as any\); \/\/l\)/g, 'setLanguage(l)');

fs.writeFileSync(pageFile, content, 'utf8');
console.log("Undid setLanguage corruption");
