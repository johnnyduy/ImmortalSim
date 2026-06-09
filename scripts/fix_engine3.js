const fs = require('fs');
const file = 'lib/engine.ts';
let code = fs.readFileSync(file, 'utf8');

const originalStr = \`export const createInitialWorldState = (randomize = true): WorldState => {
  const jitter = (base: number, range = 15): number =>
    randomize ? clamp(base + (Math.random() * range * 2 - range), 0, 100) : base;

  return {
    sect: {
      reputation: jitter(65),
      resources:  jitter(72),
      stability:  jitter(80),
      warLevel:   jitter(12, 10),
    },
    city: {
      prosperity: jitter(65),
      security:   jitter(68),
      priceIndex: randomize ? clamp(100 + (Math.random() * 30 - 15), 50, 300) : 100,
      morale:     jitter(70),
    },
    mountain: {
      beastActivity: jitter(38, 12),
      resources:     jitter(72),
      danger:        jitter(42, 12),
    },
    demonic: {
      infiltration: jitter(15, 10),
      activity:     jitter(18, 10),
    },
    global: {
      spiritualQi:    jitter(70),
      daoFluctuation: jitter(20, 10),
      demonicEnergy:  jitter(18, 10),
    },
    history: [],
  };
};\`;

const startIdx = code.indexOf('export const createInitialWorldState');
// Find the end of the history array:
const historyIdx = code.indexOf('history: []', startIdx);
const endIdx = code.indexOf('};', historyIdx);
const secondEndIdx = code.indexOf('};', endIdx + 2);

if (startIdx !== -1 && secondEndIdx !== -1) {
  const oldChunk = code.substring(startIdx, secondEndIdx + 2);
  code = code.replace(oldChunk, originalStr);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Fixed engine.ts explicitly!');
} else {
  console.log('Could not find indices!');
}
