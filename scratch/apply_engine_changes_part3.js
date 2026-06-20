const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\r\n/g, '\n');

// 1. Declare nextSubStageIndexOverride in applyChoiceToStateInternal
const target1 = 'let nextRealmOverride: Realm | null = null;';
const replacement1 = 'let nextRealmOverride: Realm | null = null;\n      let nextSubStageIndexOverride: number | null = null;';

if (content.includes(target1)) {
  console.log('Found nextRealmOverride declaration!');
  content = content.split(target1).join(replacement1);
} else {
  console.log('nextRealmOverride declaration NOT found!');
}

// 2. Regex replace for pill & natural breakthrough blocks
const regexBreakthrough = /nextStats\.cultivation\s*=\s*matching\.next_cult\s*\?\?\s*\(matching\.threshold\s*\+\s*0\.01\);\s*nextRealmOverride\s*=\s*matching\.realm_to\s*as\s*Realm;/g;

const matchCount = (content.match(regexBreakthrough) || []).length;
console.log(`Matched breakthrough blocks: ${matchCount}`);

content = content.replace(regexBreakthrough, (match) => {
  // Determine indentation
  const indent = match.match(/^\s*/)[0] || '                 ';
  return `nextStats.cultivation = matching.next_cult;\n${indent}nextRealmOverride = matching.realm_to as Realm;\n${indent}nextSubStageIndexOverride = matching.subStageIndex + 1;`;
});

// Save updates
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed part 3 of engine changes.');
