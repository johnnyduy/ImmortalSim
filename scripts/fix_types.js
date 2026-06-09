const fs = require('fs');
const file = 'types/index.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `  worldState?: {
    sect?: Partial<Record<keyof SectWorldVars, number>>;
    city?: Partial<Record<keyof CityWorldVars, number>>;
  metadata?: {
    source?: 'ai' | 'author';`;

const replacementStr = `  worldState?: {
    sect?: Partial<Record<keyof SectWorldVars, number>>;
    city?: Partial<Record<keyof CityWorldVars, number>>;
    mountain?: Partial<Record<keyof MountainWorldVars, number>>;
    demonic?: Partial<Record<keyof DemonicWorldVars, number>>;
    global?: Partial<Record<keyof GlobalWorldVars, number>>;
  };
};

export type NpcDefinition = {
  id: string;
  name: string;
  archetype: string;
  spiritualRoot: string;
  karma: number;
  meta_memory_id: string;
  description: string;
  sect?: string;
  role?: { vi: string; en: string };
  avatar?: string;
};

export type EventChoice = {
  id: string;
  text: TextResource;
  effects: GameEffect;
  metadata?: {
    source?: 'ai' | 'author';`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed types/index.ts');
} else {
  console.log('Target string not found');
}
