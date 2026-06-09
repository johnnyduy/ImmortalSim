const fs = require('fs');
const file = 'lib/engine.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `  const getEventWeight = (event: EventDefinition) => {
    let w = event.weight;
    if (ambition && event.tags && event.tags.includes(ambition)) {
      w *= 3.0; // matching ambition events are 3x more likely to spawn!
    }
    return w;
  };`;

const newStr = `  const getEventWeight = (event: EventDefinition) => {
    let w = event.weight;
    if (ambition && event.tags && event.tags.includes(ambition)) {
      w *= 3.0; // matching ambition events are 3x more likely to spawn!
    }
    
    // NPC Grudge Prioritization:
    if (state.inheritance?.npc_grudges && event.tags) {
      for (const [npcId, grudge] of Object.entries(state.inheritance.npc_grudges)) {
        if (event.tags.includes(npcId) && grudge > 50) {
          w *= 10.0; // Highly prioritize revenge events if grudge > 50
        }
      }
    }

    // WorldState Modifiers:
    if (state.worldState && event.tags) {
      if (event.tags.includes('demonic')) w *= (1 + (state.worldState.demonic?.infiltration || 0) / 50);
      if (event.tags.includes('auction')) w *= (1 + (state.worldState.city?.prosperity || 0) / 50);
      if (event.tags.includes('rebel')) w *= (1 + (100 - (state.worldState.sect?.stability || 100)) / 50);
      if (event.tags.includes('tournament')) w *= (1 + (state.worldState.global?.daoFluctuation || 0) / 50);
    }
    
    return w;
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched getRandomEvent successfully.');
} else {
  console.log('Target string not found or already patched.');
}
