const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to Unix LF
content = content.replace(/\r\n/g, '\n');

// Helper to count matches
function countMatches(str, target) {
  let count = 0;
  let pos = str.indexOf(target);
  while (pos !== -1) {
    count++;
    pos = str.indexOf(target, pos + target.length);
  }
  return count;
}

// 1. Replace all getRealmSubStage calls to pass realm argument
content = content.replace(/getRealmSubStage\(game\.stats\.cultivation\)/g, 'getRealmSubStage(game.stats.cultivation, game.realm)');
content = content.replace(/getRealmSubStage\(previous\.stats\.cultivation\)/g, 'getRealmSubStage(previous.stats.cultivation, previous.realm)');
content = content.replace(/getRealmSubStage\(next\.stats\.cultivation\)/g, 'getRealmSubStage(next.stats.cultivation, next.realm)');

// 2. Replace getSubStageNameByIndex definition
const target = `      const getSubStageNameByIndex = (idx: number) => {
        if (idx === 0) return { vi: 'Phàm Nhân', en: 'Mortal' };
        if (idx <= 12) {
          const layer = idx;
          const labelVi = layer === 12 ? 'Luyện Khí Tầng 12 (Viên Mãn)' : \`Luyện Khí Tầng \${layer}\`;
          const labelEn = layer === 12 ? 'Qi Refinement Layer 12 (Consummate)' : \`Qi Refinement Layer \${layer}\`;
          return { vi: labelVi, en: labelEn };
        }
        if (idx <= 16) {
          const subIdx = idx - 13;
          const namesVi = ['Trúc Cơ Sơ Kỳ', 'Trúc Cơ Trung Kỳ', 'Trúc Cơ Hậu Kỳ', 'Trúc Cơ Viên Mãn'];
          const namesEn = ['Foundation Establishment Early', 'Foundation Establishment Middle', 'Foundation Establishment Late', 'Foundation Establishment Consummate'];
          return { vi: namesVi[subIdx], en: namesEn[subIdx] };
        }
        if (idx <= 20) {
          const subIdx = idx - 17;
          const namesVi = ['Kim Đan Sơ Kỳ', 'Kim Đan Trung Kỳ', 'Kim Đan Hậu Kỳ', 'Kim Đan Viên Mãn'];
          const namesEn = ['Golden Core Early', 'Golden Core Middle', 'Golden Core Late', 'Golden Core Consummate'];
          return { vi: namesVi[subIdx], en: namesEn[subIdx] };
        }
        const subIdx = idx - 21;
        const namesVi = ['Nguyên Anh Sơ Kỳ', 'Nguyên Anh Trung Kỳ', 'Nguyên Anh Hậu Kỳ', 'Nguyên Anh Viên Mãn'];
        const namesEn = ['Nascent Soul Early', 'Nascent Soul Middle', 'Nascent Soul Late', 'Nascent Soul Consummate'];
        return { vi: namesVi[subIdx], en: namesEn[subIdx] };
      };`.replace(/\r\n/g, '\n');

const replacement = `      const getSubStageNameByIndex = (idx: number) => {
        if (idx === 0) return { vi: 'Phàm Nhân', en: 'Mortal' };
        if (idx <= 9) {
          const layer = idx;
          const labelVi = layer === 9 ? 'Luyện Khí Tầng 9 (Viên Mãn)' : \`Luyện Khí Tầng \${layer}\`;
          const labelEn = layer === 9 ? 'Qi Refinement Layer 9 (Consummate)' : \`Qi Refinement Layer \${layer}\`;
          return { vi: labelVi, en: labelEn };
        }
        if (idx <= 12) {
          const subIdx = idx - 10;
          const namesVi = ['Trúc Cơ Sơ Kỳ', 'Trúc Cơ Trung Kỳ', 'Trúc Cơ Hậu Kỳ'];
          const namesEn = ['Foundation Establishment Early', 'Foundation Establishment Middle', 'Foundation Establishment Late'];
          return { vi: namesVi[subIdx], en: namesEn[subIdx] };
        }
        if (idx <= 16) {
          const subIdx = idx - 13;
          const namesVi = ['Kim Đan Sơ Kỳ', 'Kim Đan Trung Kỳ', 'Kim Đan Hậu Kỳ', 'Kim Đan Viên Mãn'];
          const namesEn = ['Golden Core Early', 'Golden Core Middle', 'Golden Core Late', 'Golden Core Consummate'];
          return { vi: namesVi[subIdx], en: namesEn[subIdx] };
        }
        const subIdx = idx - 17;
        const namesVi = ['Nguyên Anh Sơ Kỳ', 'Nguyên Anh Trung Kỳ', 'Nguyên Anh Hậu Kỳ', 'Nguyên Anh Viên Mãn'];
        const namesEn = ['Nascent Soul Early', 'Nascent Soul Middle', 'Nascent Soul Late', 'Nascent Soul Consummate'];
        return { vi: namesVi[subIdx], en: namesEn[subIdx] };
      };`.replace(/\r\n/g, '\n');

if (countMatches(content, target) === 1) {
  content = content.replace(target, replacement);
} else {
  console.error('ERROR: target matched ' + countMatches(content, target) + ' times');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: All app/page.tsx cultivation/realm updates applied!');
