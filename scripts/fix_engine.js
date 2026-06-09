const fs = require('fs');
const file = 'lib/engine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /export const createInitialWorldState = \\(randomize = true\\): WorldState => \\{[\\s\\S]*?history: \\[\\]\\,\\s*\\}\\;\\s*\\}\\;/m;

const replacement = \`export const createInitialWorldState = (randomize = true): WorldState => {
  const jitter = (base: number, range = 15): number =>
    randomize ? clamp(base + (Math.random() * range * 2 - range), 0, 100) : base;

  return {
    sect: {
      reputation: jitter(65),
      resources:  jitter(72),
      stability:  jitter(80),
      defenses:   jitter(50, 15),
    },
    city: {
      prosperity: jitter(65),
      corruption: jitter(30, 10),
      priceIndex: randomize ? clamp(100 + (Math.random() * 30 - 15), 50, 300) : 100,
      mortalFaith: jitter(50, 15),
    },
    mountain: {
      beastDensity: jitter(38, 12),
      herbRichness: jitter(72),
      dangerLevel:  jitter(42, 12),
    },
    demonic: {
      infiltration: jitter(15, 10),
      bloodSacrifice: jitter(10, 5),
      sectAlliance: jitter(18, 10),
    },
    global: {
      spiritualDensity: jitter(70),
      daoFluctuation: jitter(20, 10),
      calamityProgress: jitter(5, 5),
      immortalEdict: 0,
    },
    history: [],
  };
};\`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code, 'utf8');
console.log('Fixed createInitialWorldState in engine.ts');
