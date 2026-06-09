const fs = require('fs');
const file = 'lib/engine.ts';
let code = fs.readFileSync(file, 'utf8');

const anchor = 'newStats.cultivation = Math.min(getCultivationCap(state), newStats.cultivation);';
if (code.includes(anchor) && !code.includes('if (choice.effects.npcFavorability)')) {
  const insertCode = `
  // Generic Handling for WorldState, NpcFavorability, NpcGrudges
  let nextWorldState = state.worldState ? { ...state.worldState } : createInitialWorldState(false);
  if (choice.effects.worldState) {
    nextWorldState = JSON.parse(JSON.stringify(nextWorldState)); // Deep clone
    for (const category of Object.keys(choice.effects.worldState)) {
      if (nextWorldState[category as keyof WorldState]) {
        const changes = choice.effects.worldState[category as keyof typeof choice.effects.worldState];
        for (const [key, val] of Object.entries(changes || {})) {
           if (typeof val === 'number') {
             (nextWorldState as any)[category][key] += val;
             // Bound check
             if ((nextWorldState as any)[category][key] < 0) (nextWorldState as any)[category][key] = 0;
             if ((nextWorldState as any)[category][key] > 100 && category !== 'city' && key !== 'priceIndex') (nextWorldState as any)[category][key] = 100;
           }
        }
      }
    }
  }

  let nextNpcGrudges = state.inheritance?.npc_grudges ? { ...state.inheritance.npc_grudges } : {};
  if (choice.effects.npcGrudges) {
    for (const [npcId, val] of Object.entries(choice.effects.npcGrudges)) {
       nextNpcGrudges[npcId] = (nextNpcGrudges[npcId] || 0) + val;
    }
  }
  
  // Generic NpcFavorability handling
  let baseFavorability = state.npcFavorability ? { ...state.npcFavorability } : {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0,
  };
  
  if (choice.effects.npcFavorability) {
    for (const [npcId, val] of Object.entries(choice.effects.npcFavorability)) {
       baseFavorability = changeNpcFavorability(baseFavorability, npcId, val);
    }
  }
`;
  
  code = code.replace(anchor, anchor + '\n' + insertCode);
  
  // Now we must replace instances of `state.npcFavorability ? { ...state.npcFavorability } : {`
  // with `baseFavorability` in the existing manual logic.
  code = code.replace(`let nextNpcFavorability = state.npcFavorability ? { ...state.npcFavorability } : {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0,
  };`, `let nextNpcFavorability = baseFavorability;`);

  // We also need to update the returned state to include `worldState` and `inheritance`.
  // The return block is around line 2900: `return { ...state, age: nextAge ... }`
  // Let's find it.
  
  fs.writeFileSync(file, code, 'utf8');
  console.log("Patched generic effects successfully.");
} else {
  console.log("Already patched or anchor not found.");
}
