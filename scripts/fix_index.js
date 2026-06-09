const fs = require('fs');
const file = 'types/index.ts';
const content = fs.readFileSync(file, 'utf8');

const itemEnd = content.indexOf('export interface SectQuest') !== -1 ? content.indexOf('export interface SectQuest') : content.indexOf('export type GameState = {');

// The file might be so mangled that it doesn't have SectQuest or ItemInstance correctly.
// Let's just redefine the entire file because it's only 200 lines.
// But I don't want to lose the WorldState definitions at the bottom.
// Wait, I can just download the original file from github or write the whole file manually.
