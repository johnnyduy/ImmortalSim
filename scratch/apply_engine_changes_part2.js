const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Replace getBottlenecks with new version (including getSubStageMaxCultivation and checkAndApplySubStageTransition helpers)
const getBottlenecksTarget = `export const getBottlenecks = (state: GameState, config?: any) => {
  const activeConfig = config || combatConfig;
  const mult = activeConfig.cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  const b1 = Math.round((10 * Math.pow(mult, 3) - 0.01) * 100) / 100; // 21.96
  const b2 = Math.round((10 * Math.pow(mult, 6) - 0.01) * 100) / 100; // 48.26
  const b3 = Math.round((10 * Math.pow(mult, 9) - 0.01) * 100) / 100; // 106.04

  return [
    {
      realm_from: "Qi Refinement" as Realm,
      realm_to: "Qi Refinement" as Realm,
      threshold: b1,
      pill_item_id: null,
      success_rate_no_pill: 0.5,
      next_cult: b1 + 0.01,
      label: "Luyện Khí Tầng 4"
    },
    {
      realm_from: "Qi Refinement" as Realm,
      realm_to: "Qi Refinement" as Realm,
      threshold: b2,
      pill_item_id: null,
      success_rate_no_pill: 0.4,
      next_cult: b2 + 0.01,
      label: "Luyện Khí Tầng 7"
    },
    {
      realm_from: "Qi Refinement" as Realm,
      realm_to: "Foundation Establishment" as Realm,
      threshold: b3,
      pill_item_id: "item_truc_co_dan",
      success_rate_no_pill: 0.01,
      backlash_cultivation_loss: 3.0,
      next_cult: 0.0,
      label: "Trúc Cơ"
    },
    {
      realm_from: "Foundation Establishment" as Realm,
      realm_to: "Golden Core" as Realm,
      threshold: 19.99,
      pill_item_id: "item_kim_dan_dan",
      success_rate_no_pill: 0.01,
      backlash_cultivation_loss: 5.0,
      next_cult: 0.0,
      label: "Kim Đan"
    },
    {
      realm_from: "Golden Core" as Realm,
      realm_to: "Nascent Soul" as Realm,
      threshold: 39.99,
      pill_item_id: "item_nguyen_anh_dan",
      success_rate_no_pill: 0.01,
      backlash_cultivation_loss: 10.0,
      next_cult: 0.0,
      label: "Nguyên Anh"
    }
  ];
};`;

const getBottlenecksReplacement = `export const getSubStageMaxCultivation = (realm: Realm, subStageIndex: number, config?: any): number => {
  const activeConfig = config || combatConfig;
  const mult = activeConfig.cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  
  if (realm === 'Mortal') {
    return 10.0;
  }
  if (realm === 'Qi Refinement') {
    const N = Math.max(1, Math.min(9, subStageIndex));
    return Math.round((10 * Math.pow(mult, N - 1)) * 100) / 100;
  }
  if (realm === 'Foundation Establishment') {
    const N = Math.max(1, Math.min(3, subStageIndex - 10 + 1));
    return Math.round((100 * Math.pow(mult, N - 1)) * 100) / 100;
  }
  if (realm === 'Golden Core') {
    return 20.0;
  }
  return 30.0;
};

export const checkAndApplySubStageTransition = (
  state: GameState,
  stats: Stats,
  logs: LogEntry[],
  language: Lang,
  config?: any
): { stats: Stats; subStageIndex: number; realm: Realm; logs: LogEntry[] } => {
  const activeConfig = config || combatConfig;
  let currentRealm = state.realm;
  let currentSubStageIndex = state.subStageIndex;
  let currentCultivation = stats.cultivation;
  const updatedLogs = [...logs];
  
  let safetyCount = 0;
  while (safetyCount < 10) {
    safetyCount++;
    const cap = getCultivationCap({ ...state, realm: currentRealm, subStageIndex: currentSubStageIndex, stats: { ...stats, cultivation: currentCultivation } }, activeConfig);
    if (currentCultivation >= cap - 0.005) {
      const bottlenecks = getBottlenecks({ ...state, realm: currentRealm, subStageIndex: currentSubStageIndex }, activeConfig);
      const isBottleneck = bottlenecks.some(b => b.realm_from === currentRealm && b.subStageIndex === currentSubStageIndex);
      
      if (isBottleneck) {
        currentCultivation = cap;
        break;
      } else {
        const nextSubStageIndex = currentSubStageIndex + 1;
        let nextRealm = currentRealm;
        if (currentRealm === 'Mortal' && nextSubStageIndex === 1) {
          nextRealm = 'Qi Refinement';
        }
        
        const subStageInfoBefore = getRealmSubStage(0, currentRealm, currentSubStageIndex);
        const subStageInfoAfter = getRealmSubStage(0, nextRealm, nextSubStageIndex);
        
        updatedLogs.push({
          type: 'info',
          message: {
            vi: \`✨ Đột phá! Bạn đã tích lũy đầy đủ linh lực, tự động nâng cấp từ [\${subStageInfoBefore.subStageName.vi}] lên [\${subStageInfoAfter.subStageName.vi}]!\`,
            en: \`✨ Breakthrough! You accumulated enough spiritual energy, automatically upgrading from [\${subStageInfoBefore.subStageName.en}] to [\${subStageInfoAfter.subStageName.en}]!\`
          }
        });
        
        currentSubStageIndex = nextSubStageIndex;
        currentRealm = nextRealm;
        currentCultivation = 0.0;
      }
    } else {
      break;
    }
  }
  
  return {
    stats: {
      ...stats,
      cultivation: currentCultivation
    },
    subStageIndex: currentSubStageIndex,
    realm: currentRealm,
    logs: updatedLogs
  };
};

export const getBottlenecks = (state: GameState, config?: any) => {
  const activeConfig = config || combatConfig;
  const mult = activeConfig.cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  const b1 = Math.round((10 * Math.pow(mult, 2)) * 100) / 100;
  const b2 = Math.round((10 * Math.pow(mult, 5)) * 100) / 100;
  const b3 = Math.round((10 * Math.pow(mult, 8)) * 100) / 100;

  const t1 = Math.round((100 * Math.pow(mult, 2)) * 100) / 100;

  return [
    {
      realm_from: "Qi Refinement" as Realm,
      realm_to: "Qi Refinement" as Realm,
      subStageIndex: 3,
      threshold: b1,
      pill_item_id: null,
      success_rate_no_pill: 0.5,
      next_cult: 0.0,
      label: "Luyện Khí Tầng 4"
    },
    {
      realm_from: "Qi Refinement" as Realm,
      realm_to: "Qi Refinement" as Realm,
      subStageIndex: 6,
      threshold: b2,
      pill_item_id: null,
      success_rate_no_pill: 0.4,
      next_cult: 0.0,
      label: "Luyện Khí Tầng 7"
    },
    {
      realm_from: "Qi Refinement" as Realm,
      realm_to: "Foundation Establishment" as Realm,
      subStageIndex: 9,
      threshold: b3,
      pill_item_id: "item_truc_co_dan",
      success_rate_no_pill: 0.01,
      backlash_cultivation_loss: 3.0,
      next_cult: 0.0,
      label: "Trúc Cơ"
    },
    {
      realm_from: "Foundation Establishment" as Realm,
      realm_to: "Golden Core" as Realm,
      subStageIndex: 12,
      threshold: t1,
      pill_item_id: "item_kim_dan_dan",
      success_rate_no_pill: 0.01,
      backlash_cultivation_loss: 5.0,
      next_cult: 0.0,
      label: "Kim Đan"
    },
    {
      realm_from: "Golden Core" as Realm,
      realm_to: "Nascent Soul" as Realm,
      subStageIndex: 16,
      threshold: 20.0,
      pill_item_id: "item_nguyen_anh_dan",
      success_rate_no_pill: 0.01,
      backlash_cultivation_loss: 10.0,
      next_cult: 0.0,
      label: "Nguyên Anh"
    }
  ];
};`;

if (content.includes(getBottlenecksTarget)) {
  console.log('Found getBottlenecks target!');
  content = content.replace(getBottlenecksTarget, getBottlenecksReplacement);
} else {
  console.log('getBottlenecks target NOT found!');
}

// 2. ReincarnateState return statement
const reincarnateReturnTarget = `    realm: determineRealm(stats.cultivation, 'Mortal'),
    stats,
    inheritance: nextInheritance,`;

const reincarnateReturnReplacement = `    realm: determineRealm(stats.cultivation, 'Mortal'),
    subStageIndex: determineRealm(stats.cultivation, 'Mortal') === 'Qi Refinement' ? 1 : 0,
    stats,
    inheritance: nextInheritance,`;

if (content.includes(reincarnateReturnTarget)) {
  console.log('Found reincarnateState return target!');
  content = content.replace(reincarnateReturnTarget, reincarnateReturnReplacement);
} else {
  console.log('reincarnateState return target NOT found!');
}

// 3. Declare nextSubStageIndexOverride in applyChoiceToStateInternal
const declareOverrideTarget = `  let nextRealmOverride: Realm | null = null;
  let choiceText: LocalizedText | null = null;`;

const declareOverrideReplacement = `  let nextRealmOverride: Realm | null = null;
  let nextSubStageIndexOverride: number | null = null;
  let choiceText: LocalizedText | null = null;`;

if (content.includes(declareOverrideTarget)) {
  console.log('Found nextRealmOverride declaration target!');
  content = content.replace(declareOverrideTarget, declareOverrideReplacement);
} else {
  console.log('nextRealmOverride declaration target NOT found!');
}

// 4. Update Natural / Pill breakthroughs inside applyChoiceToStateInternal
const pillBreakthroughTarget = `                 nextStats.cultivation = matching.next_cult ?? (matching.threshold + 0.01);
                 nextRealmOverride = matching.realm_to as Realm;`;

const pillBreakthroughReplacement = `                 nextStats.cultivation = matching.next_cult;
                 nextRealmOverride = matching.realm_to as Realm;
                 nextSubStageIndexOverride = matching.subStageIndex + 1;`;

if (content.includes(pillBreakthroughTarget)) {
  console.log('Found pill breakthrough target!');
  content = content.replace(pillBreakthroughTarget, pillBreakthroughReplacement);
} else {
  console.log('pill breakthrough target NOT found!');
}

const naturalBreakthroughTarget = `               nextStats.cultivation = matching.next_cult ?? (matching.threshold + 0.01);
               nextRealmOverride = matching.realm_to as Realm;`;

const naturalBreakthroughReplacement = `               nextStats.cultivation = matching.next_cult;
               nextRealmOverride = matching.realm_to as Realm;
               nextSubStageIndexOverride = matching.subStageIndex + 1;`;

if (content.includes(naturalBreakthroughTarget)) {
  console.log('Found natural breakthrough target!');
  content = content.replace(naturalBreakthroughTarget, naturalBreakthroughReplacement);
} else {
  console.log('natural breakthrough target NOT found!');
}

// 5. Update applyChoiceToStateInternal effect application & transition results
const effectApplyTarget = `  const newStats = applyEffects(state.stats, choice.effects, state);
  newStats.cultivation = Math.min(getCultivationCap(state), newStats.cultivation);`;

const effectApplyReplacement = `  let newStats = applyEffects(state.stats, choice.effects, state);
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

if (content.includes(effectApplyTarget)) {
  console.log('Found applyEffects block!');
  content = content.replace(effectApplyTarget, effectApplyReplacement);
} else {
  console.log('applyEffects block NOT found!');
}

// 6. Update determineRealm call in applyChoiceToStateInternal
const oldRealmProgressionTarget = `  // Kiểm tra đột phá Cảnh giới (Realm) để tăng Thọ Nguyên (Lifespan)
  const oldRealm = state.realm;
  const newRealm = determineRealm(newStats.cultivation, state.realm);
  if (oldRealm !== newRealm) {`;

const oldRealmProgressionReplacement = `  // Kiểm tra đột phá Cảnh giới (Realm) để tăng Thọ Nguyên (Lifespan)
  const oldRealm = state.realm;
  const determinedRealm = nextRealmOverride || determineRealm(newStats.cultivation, state.realm);
  newRealm = determinedRealm;
  if (oldRealm !== newRealm) {`;

if (content.includes(oldRealmProgressionTarget)) {
  console.log('Found old realm progression check!');
  content = content.replace(oldRealmProgressionTarget, oldRealmProgressionReplacement);
} else {
  console.log('old realm progression check NOT found!');
}

// 7. Update return statements in applyChoiceToStateInternal to include subStageIndex
const deadStateTarget = `    const deadState: GameState = {
      ...state,
      alive: false,
      stats: newStats,
      realm: newRealm,`;

const deadStateReplacement = `    const deadState: GameState = {
      ...state,
      alive: false,
      stats: newStats,
      realm: newRealm,
      subStageIndex: nextSubStageIndex,`;

if (content.includes(deadStateTarget)) {
  console.log('Found deadState return block!');
  content = content.replace(deadStateTarget, deadStateReplacement);
} else {
  console.log('deadState return block NOT found!');
}

const finalReturnTarget = `  return {
    ...state,
    stats: newStats,
    realm: newRealm,
    currentEvent: nextEvent,`;

const finalReturnReplacement = `  return {
    ...state,
    stats: newStats,
    realm: newRealm,
    subStageIndex: nextSubStageIndex,
    currentEvent: nextEvent,`;

if (content.includes(finalReturnTarget)) {
  console.log('Found final return block!');
  content = content.replace(finalReturnTarget, finalReturnReplacement);
} else {
  console.log('final return block NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed applying part 2 of engine changes.');
