const fs = require('fs');
const path = require('path');

// 1. Modify app/page.tsx
const pagePath = path.join(__dirname, 'app', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Remove the creationAmbition state
pageContent = pageContent.replace(/const \[creationAmbition, setCreationAmbition\] = useState<.*?\('truong_sinh'\);\s*/, '');
pageContent = pageContent.replace(/setCreationAmbition\('truong_sinh'\);\s*/g, '');

// Remove the UI section for Dao Heart
// The section starts with {/* Đạo Tâm */} and ends before the start button
const daoHeartStart = pageContent.indexOf('{/* D?o Tm */}');
let daoHeartStart2 = pageContent.indexOf('{/* Đạo Tâm */}');
if (daoHeartStart2 !== -1) {
    const buttonStart = pageContent.indexOf('<button', daoHeartStart2);
    if (buttonStart !== -1) {
        pageContent = pageContent.slice(0, daoHeartStart2) + pageContent.slice(buttonStart);
    }
} else if (daoHeartStart !== -1) {
    const buttonStart = pageContent.indexOf('<button', daoHeartStart);
    if (buttonStart !== -1) {
        pageContent = pageContent.slice(0, daoHeartStart) + pageContent.slice(buttonStart);
    }
} else {
    // try finding by h3
    const h3Start = pageContent.indexOf('4. Ch');
    if (h3Start !== -1) {
        const divStart = pageContent.lastIndexOf('<div', h3Start);
        const nextDiv = pageContent.indexOf('<button', divStart);
        if (divStart !== -1 && nextDiv !== -1) {
            pageContent = pageContent.slice(0, divStart) + pageContent.slice(nextDiv);
        }
    }
}

// Remove passing ambition to initGame in handleStartGame
pageContent = pageContent.replace(/ambition: creationAmbition/g, '');
pageContent = pageContent.replace(/,\s*}/g, '}'); // clean up trailing commas

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('Updated app/page.tsx');

// 2. Modify lib/engine.ts
const enginePath = path.join(__dirname, 'lib', 'engine.ts');
let engineContent = fs.readFileSync(enginePath, 'utf8');

const replacement1 = `const ambitions = ['truong_sinh', 'ba_chu', 'dan_dao', 'kiem_tien', 'phu_quoc', 'ma_dao'] as const;
  const ambition = customParams?.ambition ?? ambitions[Math.floor(Math.random() * ambitions.length)];`;

engineContent = engineContent.replace(/const ambition = customParams\?\.ambition \?\? 'truong_sinh';/, replacement1);

const replacement2 = `const ambitions = ['truong_sinh', 'ba_chu', 'dan_dao', 'kiem_tien', 'phu_quoc', 'ma_dao'] as const;
  const ambition = customParams?.ambition ?? state.ambition ?? ambitions[Math.floor(Math.random() * ambitions.length)];`;

engineContent = engineContent.replace(/const ambition = customParams\?\.ambition \?\? state\.ambition \?\? 'truong_sinh';/, replacement2);

// Also randomize the Dao Heart stat to be between 30 and 70 initially, since it was 10 + Math.floor(inheritance.ancestralMemory / 2) before.
// Wait, the user said "random chỉ số đạo tâm", let's randomize base stats for daoHeart too.
engineContent = engineContent.replace(/let daoHeart = 10 \+ Math\.max\(0, Math\.floor\(inheritance\.ancestralMemory \/ 2\)\);/g, 'let daoHeart = Math.floor(Math.random() * 41) + 30 + Math.max(0, Math.floor(inheritance.ancestralMemory / 2)); // Random 30-70');

fs.writeFileSync(enginePath, engineContent, 'utf8');
console.log('Updated lib/engine.ts');
