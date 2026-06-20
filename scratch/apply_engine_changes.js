const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update determineRealm
const determineRealmTarget = `const determineRealm = (cultivation: number, currentRealm: Realm): Realm => {
  if (currentRealm === 'Foundation Establishment' || currentRealm === 'Golden Core' || currentRealm === 'Nascent Soul') {
    return currentRealm;
  }
  if (cultivation >= 10.0) {
    return 'Qi Refinement';
  }
  return 'Mortal';
};`;

const determineRealmReplacement = `const determineRealm = (cultivation: number, currentRealm: Realm): Realm => {
  if (
    currentRealm === 'Qi Refinement' ||
    currentRealm === 'Foundation Establishment' ||
    currentRealm === 'Golden Core' ||
    currentRealm === 'Nascent Soul'
  ) {
    return currentRealm;
  }
  if (cultivation >= 10.0) {
    return 'Qi Refinement';
  }
  return 'Mortal';
};`;

if (content.includes(determineRealmTarget)) {
  console.log('Found determineRealm!');
  content = content.replace(determineRealmTarget, determineRealmReplacement);
} else {
  console.log('determineRealm NOT found!');
}

// 2. Update getBottlenecks and insert helpers getSubStageMaxCultivation and checkAndApplySubStageTransition
const getBottlenecksTarget = `export const getBottlenecks = (state: GameState, config?: any) => {
  const activeConfig = config || combatConfig;
  const mult = activeConfig.cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  const b1 = Math.round((10 * Math.pow(mult, 2)) * 100) / 100; // Tầng 3 cap: 10 * x^2
  const b2 = Math.round((10 * Math.pow(mult, 5)) * 100) / 100; // Tầng 6 cap: 10 * x^5
  const b3 = Math.round((10 * Math.pow(mult, 8)) * 100) / 100; // Tầng 9 cap: 10 * x^8

  const t1 = Math.round((100 * Math.pow(mult, 2)) * 100) / 100; // Trúc Cơ Hậu Kỳ cap: 100 * x^2

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
  let currentLifespan = stats.lifespan;
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
          currentLifespan += 40;
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
      cultivation: currentCultivation,
      lifespan: currentLifespan
    },
    subStageIndex: currentSubStageIndex,
    realm: currentRealm,
    logs: updatedLogs
  };
};

export const getBottlenecks = (state: GameState, config?: any) => {
  const activeConfig = config || combatConfig;
  const mult = activeConfig.cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  const b1 = Math.round((10 * Math.pow(mult, 2)) * 100) / 100; // Tầng 3 cap: 10 * x^2
  const b2 = Math.round((10 * Math.pow(mult, 5)) * 100) / 100; // Tầng 6 cap: 10 * x^5
  const b3 = Math.round((10 * Math.pow(mult, 8)) * 100) / 100; // Tầng 9 cap: 10 * x^8

  const t1 = Math.round((100 * Math.pow(mult, 2)) * 100) / 100; // Trúc Cơ Hậu Kỳ cap: 100 * x^2

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
  console.log('Found getBottlenecks!');
  content = content.replace(getBottlenecksTarget, getBottlenecksReplacement);
} else {
  console.log('getBottlenecks NOT found!');
}

// 3. Update getCultivationCap
const getCultivationCapTarget = `export const getCultivationCap = (state: GameState, configData?: any): number => {
  const activeConfig = configData || combatConfig;
  const activeTechs = (state.techniques || []).filter(t => t.isActive);
  const activeTampHap = activeTechs.filter(t => t.type === 'tâm_pháp');
  
  if (activeTampHap.length === 0) {
    // Nếu không có bất kì tâm pháp nào đang luyện, kẹt ở Phàm Nhân tối đa
    return 14.99;
  }

  let maxCap = 0;
  let hasUncapped = false;
  const cs = activeConfig?.cultivation_system;

  activeTampHap.forEach(tech => {
    const configTech = (activeConfig.techniques || []).find((t: any) => t.id === tech.id);
    if (configTech) {
      if (configTech.max_cultivation_level !== undefined) {
        maxCap = Math.max(maxCap, configTech.max_cultivation_level);
      } else {
        const tier = configTech.tier || 'hoàng';
        const tierConfig = cs?.manual_tiers?.find((m: any) => m.tier === tier);
        if (tierConfig) {
          maxCap = Math.max(maxCap, tierConfig.max_level_no_pill);
        } else {
          const fallbacks: Record<string, number> = {
            'hoàng': 26.99,
            'huyền': 49.99,
            'địa': 89.99,
            'thiên': 149.99
          };
          maxCap = Math.max(maxCap, fallbacks[tier] ?? 26.99);
        }
      }
    } else {
      hasUncapped = true;
    }
  });

  if (hasUncapped) {
    maxCap = 999999.0;
  }

  // Apply bottleneck limits if player does NOT possess the required pill in inventory
  const currentCult = state.stats?.cultivation ?? 0;
  const inventory = state.inventory || [];
  const bottlenecks = getBottlenecks(state, activeConfig);

  for (const b of bottlenecks) {
    if (state.realm === b.realm_from) {
      if (currentCult <= b.threshold && maxCap > b.threshold) {
        if (b.pill_item_id) {
          const hasPill = inventory.some(i => i.id === b.pill_item_id && i.quantity > 0);
          if (!hasPill) {
            maxCap = Math.min(maxCap, b.threshold);
          }
        } else {
          maxCap = Math.min(maxCap, b.threshold);
        }
      }
    }
  }

  return maxCap;
};`;

const getCultivationCapReplacement = `export const getCultivationCap = (state: GameState, configData?: any): number => {
  const activeConfig = configData || combatConfig;
  const activeTechs = (state.techniques || []).filter(t => t.isActive);
  const activeTampHap = activeTechs.filter(t => t.type === 'tâm_pháp');
  
  if (activeTampHap.length === 0) {
    return 9.99; // Mortal max
  }

  let hasUncapped = false;
  const realmOrder: Realm[] = ['Mortal', 'Qi Refinement', 'Foundation Establishment', 'Golden Core', 'Nascent Soul'];
  const getManualMaxSupportedRealm = (tier: string): Realm => {
    const t = tier.toLowerCase();
    if (t === 'hoàng') return 'Qi Refinement';
    if (t === 'huyền') return 'Foundation Establishment';
    if (t === 'địa') return 'Golden Core';
    return 'Nascent Soul';
  };

  activeTampHap.forEach(tech => {
    const configTech = (activeConfig.techniques || []).find((t: any) => t.id === tech.id);
    if (configTech) {
      const tier = configTech.tier || 'hoàng';
      const maxRealm = getManualMaxSupportedRealm(tier);
      const currentRealmIdx = realmOrder.indexOf(state.realm);
      const maxRealmIdx = realmOrder.indexOf(maxRealm);
      
      if (currentRealmIdx < maxRealmIdx) {
        hasUncapped = true;
      } else if (currentRealmIdx === maxRealmIdx) {
        if (state.realm === 'Qi Refinement' && state.subStageIndex <= 9) {
          hasUncapped = true;
        } else if (state.realm === 'Foundation Establishment' && state.subStageIndex <= 12) {
          hasUncapped = true;
        } else if (state.realm === 'Golden Core' && state.subStageIndex <= 16) {
          hasUncapped = true;
        }
      }
    } else {
      hasUncapped = true;
    }
  });

  if (!hasUncapped) {
    return 0.0;
  }

  let subStageCap = getSubStageMaxCultivation(state.realm, state.subStageIndex, activeConfig);

  const currentCult = state.stats?.cultivation ?? 0;
  const inventory = state.inventory || [];
  const bottlenecks = getBottlenecks(state, activeConfig);

  for (const b of bottlenecks) {
    if (state.realm === b.realm_from && state.subStageIndex === b.subStageIndex) {
      if (currentCult <= b.threshold) {
        if (b.pill_item_id) {
          const hasPill = inventory.some(i => i.id === b.pill_item_id && i.quantity > 0);
          if (!hasPill) {
            subStageCap = Math.min(subStageCap, b.threshold);
          }
        } else {
          subStageCap = Math.min(subStageCap, b.threshold);
        }
      }
    }
  }

  return subStageCap;
};`;

if (content.includes(getCultivationCapTarget)) {
  console.log('Found getCultivationCap!');
  content = content.replace(getCultivationCapTarget, getCultivationCapReplacement);
} else {
  console.log('getCultivationCap NOT found!');
}

// 4. Update createNewGame return block to include subStageIndex
const createNewGameReturnTarget = `    realm: determineRealm(stats.cultivation, 'Mortal'),
    stats,`;

const createNewGameReturnReplacement = `    realm: determineRealm(stats.cultivation, 'Mortal'),
    subStageIndex: determineRealm(stats.cultivation, 'Mortal') === 'Qi Refinement' ? 1 : 0,
    stats,`;

if (content.includes(createNewGameReturnTarget)) {
  console.log('Found createNewGame return block!');
  content = content.replace(createNewGameReturnTarget, createNewGameReturnReplacement);
} else {
  console.log('createNewGame return block NOT found!');
}

// Save partial updates before the other complex replacements
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied determineRealm, getBottlenecks, and getCultivationCap changes.');
