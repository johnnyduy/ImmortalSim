const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\r\n/g, '\n');

// 1. Move tempLogs and activeConfig declarations and update transitionResult call
const target1 = `  const choice = state.currentEvent.choices.find((item) => item.id === choiceId);
  if (!choice) {
    return state;
  }

  let newStats = applyEffects(state.stats, choice.effects, state);
  const transitionResult = checkAndApplySubStageTransition(
    state,
    newStats,
    tempLogs,
    language,
    activeConfig
  );
  newStats = transitionResult.stats;
  let newRealm = nextRealmOverride || transitionResult.realm;
  let nextSubStageIndex = nextSubStageIndexOverride !== null ? nextSubStageIndexOverride : transitionResult.subStageIndex;
  tempLogs = transitionResult.logs;`;

const replacement1 = `  const choice = state.currentEvent.choices.find((item) => item.id === choiceId);
  if (!choice) {
    return state;
  }

  let tempLogs: LogEntry[] = [];
  const activeConfig = combatConfig;

  let newStats = applyEffects(state.stats, choice.effects, state);
  const transitionResult = checkAndApplySubStageTransition(
    state,
    newStats,
    tempLogs,
    language,
    activeConfig
  );
  newStats = transitionResult.stats;
  let newRealm = transitionResult.realm;
  let nextSubStageIndex = transitionResult.subStageIndex;
  tempLogs = transitionResult.logs;`;

if (content.includes(target1)) {
  console.log('Found target 1!');
  content = content.replace(target1, replacement1);
} else {
  console.log('Target 1 NOT found!');
}

// 2. Remove the duplicate tempLogs declaration later in the function
const target2 = `  let nextNpcFavorability = state.npcFavorability ? { ...state.npcFavorability } : {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0,
  };

  let currentTechniques = state.techniques ? [...state.techniques] : [];
  let currentInventory = state.inventory ? [...state.inventory] : [];
  let tempLogs: LogEntry[] = [];`;

const replacement2 = `  let nextNpcFavorability = state.npcFavorability ? { ...state.npcFavorability } : {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0,
  };

  let currentTechniques = state.techniques ? [...state.techniques] : [];
  let currentInventory = state.inventory ? [...state.inventory] : [];`;

if (content.includes(target2)) {
  console.log('Found target 2!');
  content = content.replace(target2, replacement2);
} else {
  console.log('Target 2 NOT found!');
}

// 3. Fix the determinedRealm definition where nextRealmOverride is not defined
const target3 = `  // Kiểm tra đột phá Cảnh giới (Realm) để tăng Thọ Nguyên (Lifespan)
  const oldRealm = state.realm;
  const determinedRealm = nextRealmOverride || determineRealm(newStats.cultivation, state.realm);
  newRealm = determinedRealm;`;

const replacement3 = `  // Kiểm tra đột phá Cảnh giới (Realm) để tăng Thọ Nguyên (Lifespan)
  const oldRealm = state.realm;
  const determinedRealm = determineRealm(newStats.cultivation, state.realm);
  newRealm = determinedRealm;`;

if (content.includes(target3)) {
  console.log('Found target 3!');
  content = content.replace(target3, replacement3);
} else {
  console.log('Target 3 NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied scope fixes.');
