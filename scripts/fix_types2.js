const fs = require('fs');
const file = 'types/index.ts';
let code = fs.readFileSync(file, 'utf8');

const lines = code.split('\\n');
const startIdx = lines.findIndex(l => l.startsWith('export type GameEffect = Partial<Stats> & {'));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l === '};' && lines[idx+2] === 'export type LogEntry = {');

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = \`export type GameEffect = Partial<Stats> & {
  age?: number;
  gainFragment?: {
    techniqueId: string;
    amount: number;
  };
  gainItem?: {
    itemId: string;
    quantity: number;
  };
  sectContribution?: number;
  spiritStones?: number;
  sectPrestige?: number;
  npcFavorability?: Record<string, number>;
  npcGrudges?: Record<string, number>;
  worldState?: {
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
    source?: 'ai' | 'author';
    model?: string;
    [key: string]: unknown;
  };
};

export type EventDefinition = {
  id: string;
  title: TextResource;
  description: TextResource;
  minAge: number;
  maxAge: number;
  weight: number;
  choices: EventChoice[];
  tags?: string[];
  metadata?: {
    source?: 'ai' | 'author';
    model?: string;
    [key: string]: unknown;
  };
};\`;

  lines.splice(startIdx, endIdx - startIdx + 1, newContent);
  fs.writeFileSync(file, lines.join('\\n'), 'utf8');
  console.log('Fixed types/index.ts completely.');
} else {
  console.log('Failed to find boundaries.', startIdx, endIdx);
}
