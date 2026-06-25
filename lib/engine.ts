import { tickMonth, getVietnameseMonthName, getEnglishMonthName } from './game-controller';
import type {
  EventDefinition,
  GameEffect,
  GameState,
  Inheritance,
  Lang,
  LocalizedText,
  LogEntry,
  Realm,
  Stats,
  TextResource,
  TechniqueInstance,
  TechniqueCompleteness,
  ItemInstance,
  SectQuest,
  WorldState} from '../types';
import { getRealmSubStage, calculateCombatPower } from './cultivation-states';
import {
  defaultLanguage,
  defaultMessages,
  getLocalizedText,
  renderLocalizedTemplate,
  translateDeathReason} from '../lib/i18n';
import enEvents from '../locales/en/events.json';
import viEvents from '../locales/vi/events.json';
import zhEvents from '../locales/zh/events.json';
import combatConfig from '../data/combat-config.json';
import sectQuestsData from '../data/sect-quests.json';
import story1 from '../data/starting-stories/story_1.json';
import story2 from '../data/starting-stories/story_2.json';
import story3 from '../data/starting-stories/story_3.json';
import story4 from '../data/starting-stories/story_4.json';
import story5 from '../data/starting-stories/story_5.json';
import itemsData from '../data/items.json';

const startingStories = [story1, story2, story3, story4, story5];


const realmThresholds: Array<[number, Realm]> = [
  [0, 'Mortal'],
  [15, 'Qi Refinement'],
  [30, 'Foundation Establishment'],
  [50, 'Golden Core'],
  [90, 'Nascent Soul'],
];

// baseStats (Chỉ số cơ bản ban đầu khi bắt đầu một kiếp mới)
const baseStats = (inheritance: Inheritance, spiritualRoot?: string, sect?: string): Stats => {
  let health = 20 + Math.max(0, Math.floor(inheritance.blessing / 2));
  let luck = 5 + Math.max(0, Math.floor(inheritance.legacyPower / 4));
  let comprehension = 4 + Math.max(0, Math.floor(inheritance.ancestralMemory / 2));
  let karma = 0 + Math.min(10, Math.floor(inheritance.legacyPower / 2));
  let cultivation = 0 + Math.min(8, Math.floor(inheritance.ancestralMemory / 3));
  let lifespan = 80 + Math.max(0, Math.floor(inheritance.blessing * 1.5));
  let daoHeart = Math.floor(Math.random() * 41) + 30 + Math.max(0, Math.floor(inheritance.ancestralMemory / 2)); // Random 30-70
  let speed = 10 + Math.floor(luck * 0.2);
  let toxicity = 0;

  // Determine root
  let finalRoot = spiritualRoot || '';
  if (!finalRoot) {
    const elements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Lôi', 'Băng', 'Phong'];
    const rand = Math.random();
    if (rand < 0.10) {
      // Thiên Linh Căn (Single Pure)
      const el = elements[Math.floor(Math.random() * elements.length)];
      finalRoot = `${el} Thiên Linh Căn`;
    } else if (rand < 0.40) {
      // Đơn Linh Căn (Single Element)
      const el = elements[Math.floor(Math.random() * elements.length)];
      finalRoot = `${el} Linh Căn`;
    } else if (rand < 0.70) {
      // Song Linh Căn (2 Elements)
      const el1 = elements[Math.floor(Math.random() * elements.length)];
      let el2 = elements[Math.floor(Math.random() * elements.length)];
      while (el2 === el1) {
        el2 = elements[Math.floor(Math.random() * elements.length)];
      }
      finalRoot = `${el1}-${el2} Song Linh Căn`;
    } else if (rand < 0.90) {
      // Tam Linh Căn (3 Elements)
      const shuffled = [...elements].sort(() => 0.5 - Math.random());
      finalRoot = `${shuffled[0]}-${shuffled[1]}-${shuffled[2]} Tam Linh Căn`;
    } else {
      // Tạp Linh Căn (4-5 Elements)
      const count = Math.random() < 0.5 ? 4 : 5;
      const shuffled = [...elements].sort(() => 0.5 - Math.random());
      const parts = shuffled.slice(0, count);
      finalRoot = `${parts.join('-')} Tạp Linh Căn`;
    }
  }

  // Adjust starting stats based on sect bonuses
  if (sect === 'Kiếm Tông') {
    comprehension += 2;
    daoHeart += 5;
  } else if (sect === 'Ma Đạo') {
    luck += 3;
    karma -= 4; // Ma đạo nghiệp lực
  } else if (sect === 'Huyết Tông') {
    health += 10;
    lifespan += 10;
  } else if (sect === 'Đan Tông') {
    comprehension += 3;
  }

  return {
    health,
    luck,
    comprehension,
    karma,
    cultivation,
    lifespan,
    daoHeart,
    speed,
    toxicity,
    spiritualRoot: finalRoot};
};

const buildStartingEvent = (
  gender: 'nam' | 'nữ',
  spiritualRoot: string,
  sect: string,
  startingAge: number,
  storyId: number
): EventDefinition => {
  const story = startingStories[storyId - 1];
  
  const genderTermVi = gender === 'nam' ? 'nam tử' : 'nữ nhi';
  const genderTermEn = gender === 'nam' ? 'young boy' : 'young girl';
  
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/{gender_term}/g, gender === 'nam' ? genderTermVi : genderTermVi)
      .replace(/{spiritualRoot}/g, spiritualRoot)
      .replace(/{starting_age}/g, String(startingAge));
  };
  
  const descriptionVi = replacePlaceholders(story.description.vi);
  const descriptionEn = replacePlaceholders(story.description.en);
  
  return {
    id: 'birth_and_recruitment',
    title: story.title,
    description: { vi: descriptionVi, en: descriptionEn},
    minRealm: 'Mortal',
    
    weight: 1,
    choices: story.choices.map((choice: any) => ({
      id: choice.id,
      text: choice.text,
      effects: choice.effects
    }))
  };
};

export const getCultivationCap = (state: GameState, configData?: any): number => {
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
};

export const getCultivationGainMultiplier = (state: GameState, configData?: any): number => {
  let multiplier = 1.0;
  if (!state || !state.techniques) return multiplier;

  const activeConfig = configData || combatConfig;
  const configTechs = activeConfig?.techniques || [];
  const cs = activeConfig?.cultivation_system;

  const playerRoot = state.stats.spiritualRoot || '';
  
  // 1. Calculate Spiritual Root Multiplier
  let key = 'don';
  if (playerRoot.includes('Thiên Linh Căn')) key = 'thien';
  else if (playerRoot.includes('Tạp Linh Căn')) key = 'tap';
  else if (playerRoot.includes('Tam Linh Căn')) key = 'tam';
  else if (playerRoot.includes('Song Linh Căn')) key = 'song';
  else if (playerRoot.includes('Linh Căn')) key = 'don';
  else key = 'don';
  
  let rootMult = 1.0;
  if (cs?.spiritual_roots) {
    const match = cs.spiritual_roots.find((r: any) => r.id === key);
    if (match) rootMult = match.multiplier;
  } else {
    const fallbacks: Record<string, number> = {
      thien: 2.5,
      don: 1.2,
      song: 0.9,
      tam: 0.7,
      tap: 0.4
    };
    rootMult = fallbacks[key] ?? 1.0;
  }

  // 2. Calculate Manual Multiplier
  let manualMult = 1.0;

  state.techniques.forEach((tech) => {
    if (tech.isActive) {
      const configTech = configTechs.find((t: any) => t.id === tech.id);
      if (configTech && configTech.type === 'tâm_pháp') {
        // Matching elemental tâm pháp gives +10% tu vi
        if (configTech.spiritual_root && playerRoot.includes(configTech.spiritual_root)) {
          multiplier += 0.10;
        }

        let techMult = 1.0;
        if (configTech.m_manual !== undefined) {
          techMult = Number(configTech.m_manual);
        } else {
          const tier = configTech.tier || 'hoàng';
          if (cs?.manual_tiers) {
            const tierConfig = cs.manual_tiers.find((m: any) => m.tier === tier);
            if (tierConfig) {
              techMult = tierConfig.multiplier;
            }
          } else {
            const fallbacks: Record<string, number> = {
              'hoàng': 1.0,
              'huyền': 1.5,
              'địa': 2.2,
              'thiên': 3.5
            };
            techMult = fallbacks[tier] ?? 1.0;
          }
        }
        manualMult = Math.max(manualMult, techMult);
      }
    }
  });

  return multiplier * rootMult * manualMult;
};

// applyEffects (Áp dụng các thay đổi chỉ số từ quyết định sự kiện)
const applyEffects = (stats: Stats, effects: GameEffect, state?: GameState): Stats => {
  let cultivationGain = effects.cultivation ?? 0;
  if (cultivationGain > 0 && state) {
    const mult = getCultivationGainMultiplier(state);
    cultivationGain = Math.round(cultivationGain * mult * 100) / 100;
  }
  return {
    health: Math.max(0, stats.health + (effects.health ?? 0)),
    luck: Math.max(0, stats.luck + (effects.luck ?? 0)),
    comprehension: Math.max(0, stats.comprehension + (effects.comprehension ?? 0)),
    karma: stats.karma + (effects.karma ?? 0),
    cultivation: Math.max(0, stats.cultivation + cultivationGain),
    lifespan: Math.max(10, stats.lifespan + (effects.lifespan ?? 0)),
    daoHeart: Math.max(0, Math.min(100, stats.daoHeart + (effects.daoHeart ?? effects.daoMind ?? 0))),
    speed: Math.max(0, stats.speed + (effects.speed ?? 0)),
    toxicity: Math.max(0, stats.toxicity + (effects.toxicity ?? 0)),
    spiritualRoot: stats.spiritualRoot, // Linh căn cố định xuyên suốt kiếp sống
    alchemyLevel: Math.max(0, (stats.alchemyLevel || 0) + (effects.alchemyLevel ?? 0)),
  };
};

export const getSubStageMaxCultivation = (realm: Realm, subStageIndex: number, config?: any): number => {
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
            vi: `✨ Đột phá! Bạn đã tích lũy đầy đủ linh lực, tự động nâng cấp từ [${subStageInfoBefore.subStageName.vi}] lên [${subStageInfoAfter.subStageName.vi}]!`,
            en: `✨ Breakthrough! You accumulated enough spiritual energy, automatically upgrading from [${subStageInfoBefore.subStageName.en}] to [${subStageInfoAfter.subStageName.en}]!`
          }
        });
        
        currentSubStageIndex = nextSubStageIndex;
        currentRealm = nextRealm;
        currentCultivation = Math.max(0, currentCultivation - cap);
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
};

export const getTechniqueBreakthroughCost = (tier: string, costIncreasePct?: number): number => {
  const baseCosts: Record<string, number> = {
    'hoàng': 5.0,
    'huyền': 15.0,
    'địa': 40.0,
    'thiên': 100.0
  };
  const base = baseCosts[tier.toLowerCase()] ?? 5.0;
  const pct = costIncreasePct ?? 0;
  return base * (1 + pct / 100);
};

export const determineRealm = (cultivation: number, currentRealm: Realm): Realm => {
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
};

export const getNpcFavorabilityLabel = (favor: number): string => {
  if (favor <= -90) return 'Sinh tử thù địch';
  if (favor <= -70) return 'Huyết hải thâm thù';
  if (favor <= -50) return 'Căm ghét';
  if (favor <= -30) return 'Ác cảm';
  if (favor <= -10) return 'Không ưa';
  if (favor < 10) return 'Người xa lạ';
  if (favor < 30) return 'Có thiện ý';
  if (favor < 50) return 'Bằng hữu';
  if (favor < 70) return 'Tri kỷ';
  if (favor < 90) return 'Tâm phúc';
  return 'Nguyện sống chết cùng nhau';
};

export const changeNpcFavorability = (
  currentFavorability: Record<string, number> | undefined,
  npcId: string,
  amount: number
): Record<string, number> => {
  const favor = { ...(currentFavorability || {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0}) };

  const keys = ['npc_kiem_tong_chap_su', 'npc_kiem_tong_ta_tieu', 'npc_dan_tong_chap_su', 'npc_ma_dao_chap_su', 'npc_huyet_tong_chap_su'];
  keys.forEach(k => {
    if (favor[k] === undefined) favor[k] = 0;
  });

  const oldVal = favor[npcId] ?? 0;
  let newVal = Math.max(-100, Math.min(100, oldVal + amount));
  favor[npcId] = newVal;

  if (npcId === 'npc_kiem_tong_ta_tieu') {
    const diff = newVal - oldVal;
    if (diff !== 0) {
      const factor = diff < 0 ? 0.6 : 0.3;
      const chapsuOld = favor['npc_kiem_tong_chap_su'] ?? 0;
      const chapsuNew = Math.max(-100, Math.min(100, chapsuOld + Math.round(diff * factor)));
      favor['npc_kiem_tong_chap_su'] = chapsuNew;
    }
  }

  return favor;
};

let dynamicLocaleEvents: Record<Lang, EventDefinition[]> | null = null;

export const setDynamicEvents = (events: any[]) => {
  const vi: EventDefinition[] = events.map(ev => ({
    ...ev,
    title: typeof ev.title === 'object' ? ev.title.vi : ev.title,
    description: typeof ev.description === 'object' ? ev.description.vi : ev.description,
    choices: ev.choices.map((c: any) => ({
      ...c,
      text: typeof c.text === 'object' ? c.text.vi : c.text
    }))
  }));

  const en: EventDefinition[] = events.map(ev => ({
    ...ev,
    title: typeof ev.title === 'object' ? ev.title.en : ev.title,
    description: typeof ev.description === 'object' ? ev.description.en : ev.description,
    choices: ev.choices.map((c: any) => ({
      ...c,
      text: typeof c.text === 'object' ? c.text.en : c.text
    }))
  }));

  const zh: EventDefinition[] = events.map(ev => ({
    ...ev,
    title: typeof ev.title === 'object' ? ev.title.zh : ev.title,
    description: typeof ev.description === 'object' ? ev.description.zh : ev.description,
    choices: ev.choices.map((c: any) => ({
      ...c,
      text: typeof c.text === 'object' ? c.text.zh : c.text
    }))
  }));

  dynamicLocaleEvents = { vi, en, zh };
};

const localeEvents: Record<string, EventDefinition[]> = { en: enEvents as EventDefinition[], vi: viEvents as EventDefinition[],
  zh: zhEvents as EventDefinition[]};

export const getLocalizedEvents = (language: Lang): EventDefinition[] => {
  if (dynamicLocaleEvents) {
    return dynamicLocaleEvents[language] ?? dynamicLocaleEvents['vi'];
  }
  return localeEvents[language] ?? localeEvents[defaultLanguage];
};
/** Clamp helper */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));

/**
 * Khởi tạo WorldState ban đầu.
 * @param randomize true → random ±15 quanh giá trị chuẩn (Option B)
 */
export const createInitialWorldState = (randomize = true): WorldState => {
  const jitter = (base: number, range = 15): number =>
    randomize ? clamp(base + (Math.random() * range * 2 - range), 0, 100) : base;

  return {
    sect: {
      reputation: jitter(65),
      resources:  jitter(72),
      stability:  jitter(80),
      warLevel:   jitter(12, 10)},
    city: {
      prosperity: jitter(65),
      security:   jitter(68),
      priceIndex: randomize ? clamp(100 + (Math.random() * 30 - 15), 50, 300) : 100,
      morale:     jitter(70)},
    mountain: {
      beastActivity: jitter(38, 12),
      resources:     jitter(72),
      danger:        jitter(42, 12)},
    demonic: {
      infiltration: jitter(15, 10),
      activity:     jitter(18, 10)},
    global: {
      spiritualQi:    jitter(70),
      daoFluctuation: jitter(20, 10),
      demonicEnergy:  jitter(18, 10)},
    history: []};
};

/**
 * Tiến hóa WorldState mỗi tháng theo logic nội tại.
 * Giữ lại lịch sử 24 tháng gần nhất.
 */
export const tickWorldState = (
  world: WorldState,
  age: number,
  month: number
): WorldState => {
  const w = world;
  const rnd = () => Math.random();

  // Helpers
  const drift = (v: number, lo = 0, hi = 100, speed = 0.8): number =>
    clamp(v + (rnd() - 0.5) * speed * 2, lo, hi);

  // ── Tông môn ──
  let reputation = drift(w.sect.reputation, 0, 100, 1.0);
  // Tài nguyên cao → danh vọng tăng chậm
  if (w.sect.resources > 75) reputation = clamp(reputation + 0.3, 0, 100);
  // Chiến tranh → danh vọng dao động mạnh hơn
  if (w.sect.warLevel > 60) reputation = clamp(reputation + (rnd() > 0.5 ? 1 : -1.5), 0, 100);

  let resources = drift(w.sect.resources, 0, 100, 1.2);
  // Chiến tranh tiêu hao tài nguyên
  if (w.sect.warLevel > 50) resources = clamp(resources - 0.8, 0, 100);
  // Danh vọng cao → đệ tử cống hiến nhiều
  if (w.sect.reputation > 80) resources = clamp(resources + 0.4, 0, 100);

  let stability = drift(w.sect.stability, 0, 100, 1.0);
  // Ma đạo thâm nhập làm bất ổn
  if (w.demonic.infiltration > 50) stability = clamp(stability - 1.2, 0, 100);
  // Tài nguyên thấp làm bất ổn
  if (w.sect.resources < 30) stability = clamp(stability - 0.8, 0, 100);

  let warLevel = drift(w.sect.warLevel, 0, 100, 0.8);
  // Ma khí cao thúc đẩy xung đột
  if (w.global.demonicEnergy > 60) warLevel = clamp(warLevel + 0.6, 0, 100);
  // Danh vọng cao làm nản chí kẻ địch
  if (w.sect.reputation > 85) warLevel = clamp(warLevel - 0.4, 0, 100);

  // ── Thành thị ──
  let prosperity = drift(w.city.prosperity, 0, 100, 1.0);
  // An ninh thấp → phồn vinh giảm
  if (w.city.security < 35) prosperity = clamp(prosperity - 1.0, 0, 100);
  // Dân tâm cao → thương nghiệp phát triển
  if (w.city.morale > 70) prosperity = clamp(prosperity + 0.3, 0, 100);

  let security = drift(w.city.security, 0, 100, 1.2);
  // Ma đạo hoạt động → mất an ninh
  if (w.demonic.activity > 55) security = clamp(security - 1.5, 0, 100);
  // Danh vọng tông môn cao → bảo vệ thành tốt hơn
  if (w.sect.reputation > 75) security = clamp(security + 0.4, 0, 100);

  // Giá hàng hóa dao động: yêu thú hoạt động → linh dược khan hiếm → giá tăng
  let priceIndex = clamp(
    w.city.priceIndex + (rnd() - 0.5) * 8,
    50, 300
  );
  if (w.mountain.beastActivity > 70) priceIndex = clamp(priceIndex + 5, 50, 300);
  if (w.mountain.resources > 80)     priceIndex = clamp(priceIndex - 4, 50, 300);

  let morale = drift(w.city.morale, 0, 100, 0.9);
  if (w.city.security < 40) morale = clamp(morale - 1.0, 0, 100);
  if (w.city.prosperity > 75) morale = clamp(morale + 0.4, 0, 100);

  // ── Sơn mạch ──
  let beastActivity = drift(w.mountain.beastActivity, 0, 100, 1.5);
  // Ma khí kích thích yêu thú
  if (w.global.demonicEnergy > 55) beastActivity = clamp(beastActivity + 1.0, 0, 100);
  // Đánh nhiều thú thì bớt
  if (w.sect.warLevel > 50) beastActivity = clamp(beastActivity - 0.6, 0, 100);

  let mountainResources = drift(w.mountain.resources, 0, 100, 1.0);
  // Yêu thú nhiều → ăn linh dược, tài nguyên giảm
  if (w.mountain.beastActivity > 65) mountainResources = clamp(mountainResources - 0.8, 0, 100);
  // Linh khí cao → thiên tài địa bảo nhiều hơn
  if (w.global.spiritualQi > 75) mountainResources = clamp(mountainResources + 0.5, 0, 100);

  let danger = drift(w.mountain.danger, 0, 100, 1.2);
  // Yêu thú nhiều → nguy hiểm tăng
  if (w.mountain.beastActivity > 60) danger = clamp(danger + 1.0, 0, 100);
  if (w.mountain.beastActivity < 30) danger = clamp(danger - 0.8, 0, 100);

  // ── Ma đạo ──
  let infiltration = drift(w.demonic.infiltration, 0, 100, 0.8);
  // Ma khí cao → dễ thâm nhập
  if (w.global.demonicEnergy > 60) infiltration = clamp(infiltration + 0.8, 0, 100);
  // Ổn định cao → khó thâm nhập
  if (w.sect.stability > 80) infiltration = clamp(infiltration - 0.5, 0, 100);

  let demonicActivity = drift(w.demonic.activity, 0, 100, 1.0);
  if (w.global.demonicEnergy > 55) demonicActivity = clamp(demonicActivity + 0.9, 0, 100);
  // An ninh thành thị cao → khó hoạt động
  if (w.city.security > 70) demonicActivity = clamp(demonicActivity - 0.6, 0, 100);

  // ── Thế giới ──
  let spiritualQi = drift(w.global.spiritualQi, 20, 100, 0.7);
  // Thiên đạo dị động → linh khí biến đổi mạnh
  if (w.global.daoFluctuation > 60) spiritualQi = clamp(spiritualQi + (rnd() - 0.5) * 3, 20, 100);

  let daoFluctuation = drift(w.global.daoFluctuation, 0, 100, 1.0);
  // Ma khí cao khuấy đảo thiên đạo
  if (w.global.demonicEnergy > 70) daoFluctuation = clamp(daoFluctuation + 0.6, 0, 100);

  let demonicEnergy = drift(w.global.demonicEnergy, 0, 100, 0.9);
  // Chiến tranh sinh ra ma khí
  if (w.sect.warLevel > 60) demonicEnergy = clamp(demonicEnergy + 0.7, 0, 100);
  // Linh khí cao ức chế ma khí
  if (w.global.spiritualQi > 80) demonicEnergy = clamp(demonicEnergy - 0.4, 0, 100);

  const newWorld: WorldState = {
    sect:     { reputation, resources, stability, warLevel },
    city:     { prosperity, security, priceIndex, morale },
    mountain: { beastActivity, resources: mountainResources, danger },
    demonic:  { infiltration, activity: demonicActivity },
    global:   { spiritualQi, daoFluctuation, demonicEnergy }};

  // Lưu snapshot lịch sử (tối đa 24 tháng)
  const history = [
    ...(w.history || []).slice(-23),
    { month, age, snapshot: { ...w, history: undefined } as Omit<WorldState, 'history'> }
  ];

  return { ...newWorld, history };
};

/**
 * Trả về multiplier điều chỉnh weight cho từng tag của event pool.
 * Tag trên EventDefinition.tags sẽ được nhân với giá trị tương ứng.
 */
export const getWorldEventModifiers = (world: WorldState): Record<string, number> => {
  const mod: Record<string, number> = {};

  // Yêu thú hoạt động cao → sự kiện liên quan thú tăng weight
  if (world.mountain.beastActivity > 65) {
    mod['beast'] = 1 + (world.mountain.beastActivity - 65) / 35 * 2.0;
    mod['hunt']  = mod['beast'];
  }
  // Sơn mạch nguy hiểm → sự kiện nguy hiểm tăng
  if (world.mountain.danger > 60) {
    mod['danger'] = 1 + (world.mountain.danger - 60) / 40 * 1.5;
  }
  // An ninh thấp → gặp cướp / ma tu nhiều hơn
  if (world.city.security < 40) {
    mod['crime']   = 1 + (40 - world.city.security) / 40 * 2.0;
    mod['demonic'] = (mod['demonic'] ?? 1) * 1.5;
  }
  // Phồn vinh cao → đấu giá / thương mại xuất hiện nhiều
  if (world.city.prosperity > 70) {
    mod['market']  = 1 + (world.city.prosperity - 70) / 30 * 1.5;
    mod['auction'] = mod['market'];
  }
  // Danh vọng tông môn cao → sự kiện tông môn tích cực nhiều
  if (world.sect.reputation > 80) {
    mod['sect_positive'] = 1 + (world.sect.reputation - 80) / 20 * 1.8;
  }
  // Nội bộ bất ổn → sự kiện tông môn tiêu cực
  if (world.sect.stability < 35) {
    mod['sect_chaos'] = 1 + (35 - world.sect.stability) / 35 * 2.5;
  }
  // Thiên đạo dị động → bí cảnh, cơ duyên hiếm
  if (world.global.daoFluctuation > 55) {
    mod['secret_realm'] = 1 + (world.global.daoFluctuation - 55) / 45 * 3.0;
    mod['opportunity']  = 1 + (world.global.daoFluctuation - 55) / 45 * 1.5;
  }
  // Ma khí cao → ma tu sự kiện
  if (world.global.demonicEnergy > 50) {
    mod['demonic'] = Math.max(mod['demonic'] ?? 1, 1 + (world.global.demonicEnergy - 50) / 50 * 2.5);
  }
  // Linh khí cao → tu luyện sự kiện tăng
  if (world.global.spiritualQi > 75) {
    mod['cultivation'] = 1 + (world.global.spiritualQi - 75) / 25 * 1.5;
  }
  // Chiến tranh tông môn → sự kiện chiến đấu tăng
  if (world.sect.warLevel > 55) {
    mod['combat']   = 1 + (world.sect.warLevel - 55) / 45 * 2.0;
    mod['war']      = mod['combat'];
  }

  return mod;
};

/**
 * Sinh sự kiện đặc biệt khi biến trạng thái vượt ngưỡng cực đoan.
 * Trả về null nếu không có threshold nào bị kích hoạt.
 */
export const generateWorldThresholdEvent = (
  world: WorldState,
  state: GameState,
  language: Lang
): EventDefinition | null => {
  const isVi = language === 'vi';

  // Thú triều tấn công (beastActivity > 85)
  if (world.mountain.beastActivity > 85 && Math.random() < 0.35) {
    return {
      id: 'world_event_beast_tide',
      title: { vi: '🌊 Thú Triều Tràn Thành!', en: '🌊 Beast Tide Invades!'},
      description: {
        vi: `Vạn Thú Sơn Mạch bỗng dậy sóng — yêu thú từng đàn tràn xuống tấn công thành trì. Tiếng gầm vang trời, linh lực khắp nơi hỗn loạn. An ninh thành giảm xuống thấp nguy hiểm. Môn phái huy động đệ tử cơ hội lập công.`,
        en: `The Beast Mountains erupt — waves of demonic beasts storm the city. Roars shake the sky, spiritual energy fluctuates wildly. Security plummets. The sect mobilizes disciples to earn merit.`
      },
      minRealm: 'Mortal', weight: 1,
      tags: ['beast', 'world_event'],
      choices: [
        {
          id: 'world_beast_tide_fight',
          text: { vi: '⚔️ Ra trận nghênh địch, lập chiến công', en: '⚔️ Fight the beasts, earn merit' },
          effects: { health: -10, sectContribution: 30, sectPrestige: 15, cultivation: 1.5 }
        },
        {
          id: 'world_beast_tide_harvest',
          text: { vi: '🌿 Thu hoạch xác yêu thú kiếm tài nguyên', en: '🌿 Harvest beast corpses for resources'},
          effects: { health: -5, spiritStones: 40 }
        },
        {
          id: 'world_beast_tide_hide',
          text: { vi: '🏠 Ẩn náu tránh thú triều', en: '🏠 Hide and survive the tide'},
          effects: { luck: -2 }
        }
      ]
    };
  }

  // Nội loạn môn phái (stability < 20)
  if (world.sect.stability < 20 && Math.random() < 0.30 && state.sect) {
    return {
      id: 'world_event_sect_chaos',
      title: { vi: '⚡ Môn Phái Nội Loạn!', en: '⚡ Sect Internal Strife!'},
      description: {
        vi: `Nội bộ ${state.sect} bùng phát tranh đoạt quyền lực — các trưởng lão kéo bè phái đấu đá, chấp sự có kẻ bị ám sát. Cả tông môn rơi vào cảnh hỗn loạn. Đây là thời cơ hoặc hiểm họa tùy người.`,
        en: `${state.sect} erupts in power struggles — elders form factions, a sect supervisor is assassinated. The whole sect falls into chaos. This is either opportunity or peril.`
      },
      minRealm: 'Mortal', weight: 1,
      tags: ['sect_chaos', 'world_event'],
      choices: [
        {
          id: 'world_chaos_side_strong',
          text: { vi: '🤝 Theo phe mạnh kiếm lợi', en: '🤝 Side with the stronger faction'},
          effects: { sectPrestige: 20, karma: -3, luck: 2 }
        },
        {
          id: 'world_chaos_neutral',
          text: { vi: '🧘 Giữ trung lập, tĩnh tu chờ thời', en: '🧘 Stay neutral, cultivate and wait' },
          effects: { cultivation: 2, daoHeart: 3 }
        },
        {
          id: 'world_chaos_opportunist',
          text: { vi: '🗄️ Nhân lúc loạn chiếm đoạt tài nguyên', en: '🗄️ Exploit the chaos to seize resources'},
          effects: { spiritStones: 60, karma: -6, luck: -3 }
        }
      ]
    };
  }

  // Bí cảnh khai mở (daoFluctuation > 78)
  if (world.global.daoFluctuation > 78 && Math.random() < 0.28) {
    return {
      id: 'world_event_secret_realm',
      title: { vi: '✨ Bí Cảnh Hiện Thế!', en: '✨ Secret Realm Appears!'},
      description: {
        vi: `Thiên đạo dị động cực mạnh — không trung xuất hiện dị tượng thất sắc, một bí cảnh cổ đại từ từ mở ra nơi sơn mạch. Khắp tu tiên giới xôn xao. Cơ duyên thiên địa bên trong không thể đo lường.`,
        en: `Extreme Dao fluctuations — a seven-colored aurora appears in the sky as an ancient secret realm slowly opens in the mountains. The entire cultivation world buzzes with excitement.`
      },
      minRealm: 'Mortal', weight: 1,
      tags: ['secret_realm', 'opportunity', 'world_event'],
      choices: [
        {
          id: 'world_realm_enter',
          text: { vi: '🌟 Mạo hiểm vào bí cảnh', en: '🌟 Dare to enter the secret realm'},
          effects: { health: -15, cultivation: 5, comprehension: 5, luck: 3 }
        },
        {
          id: 'world_realm_guard',
          text: { vi: '🛡️ Canh gác cửa bí cảnh kiếm linh thạch', en: '🛡️ Guard the realm entrance for spirit stones'},
          effects: { spiritStones: 50, sectContribution: 20 }
        },
        {
          id: 'world_realm_skip',
          text: { vi: '🧘 Tu luyện bên ngoài hấp thụ linh khí tràn ra', en: '🧘 Cultivate outside absorbing leaked spiritual energy'},
          effects: { cultivation: 2.5, daoHeart: 2 }
        }
      ]
    };
  }

  // Ma đạo đại xâm nhập (demonicEnergy > 80 AND infiltration > 70)
  if (world.global.demonicEnergy > 80 && world.demonic.infiltration > 70 && Math.random() < 0.25) {
    return {
      id: 'world_event_demonic_siege',
      title: { vi: '💀 Ma Đạo Đại Xâm Nhập!', en: '💀 Demonic Sect Invasion!'},
      description: {
        vi: `Ma khí khắp trời đất tràn ngập — đại ma tu giấu mặt bộc lộ thân phận, chân truyền bị đoạt xá, nhiều chấp sự là nội gián. ${state.sect || 'Tông môn'} đứng trước hiểm họa tiêu vong!`,
        en: `Demonic energy floods the world — hidden great demons reveal themselves, true disciples are possessed, supervisors exposed as spies. ${state.sect || 'The sect'} faces existential danger!`
      },
      minRealm: 'Mortal', weight: 1,
      tags: ['demonic', 'war', 'world_event'],
      choices: [
        {
          id: 'world_demonic_fight',
          text: { vi: '⚔️ Xả thân chiến đấu bảo vệ tông môn', en: '⚔️ Fight to defend the sect'},
          effects: { health: -20, sectPrestige: 40, cultivation: 3, karma: 8 }
        },
        {
          id: 'world_demonic_escape',
          text: { vi: '🏃 Đào thoát, bảo toàn sinh mạng', en: '🏃 Escape and preserve your life' },
          effects: { health: -5, sectPrestige: -20, luck: 2 }
        },
        {
          id: 'world_demonic_surrender',
          text: { vi: '😈 Gia nhập ma đạo đổi lấy quyền lực', en: '😈 Join the demonic sect for power'},
          effects: { cultivation: 6, karma: -15, daoHeart: -10 }
        }
      ]
    };
  }

  // Đại đấu giá hội (prosperity > 85)
  if (world.city.prosperity > 85 && Math.random() < 0.30) {
    return {
      id: 'world_event_grand_auction',
      title: { vi: '🏛️ Đại Đấu Giá Thập Niên!', en: '🏛️ Grand Decennial Auction!'},
      description: {
        vi: `Thành phố phồn hoa tột bậc, thương hội lớn tổ chức đại đấu giá mười năm một lần. Dị bảo, công pháp cổ đại, thần dược trân phẩm bày la liệt. Đây là cơ hội mua bán nghìn năm có một.`,
        en: `The thriving city hosts its grand decennial auction. Rare treasures, ancient techniques, divine pills on display. A once-in-a-millennium trading opportunity.`
      },
      minRealm: 'Mortal', weight: 1,
      tags: ['market', 'auction', 'opportunity', 'world_event'],
      choices: [
        {
          id: 'world_auction_bid_pill',
          text: { vi: '💊 Đấu giá Đan dược đột phá (Tốn 80 Linh thạch)', en: '💊 Bid for Breakthrough Pill (Cost 80 Stones)'},
          effects: { spiritStones: -80, cultivation: 4, daoHeart: 2 }
        },
        {
          id: 'world_auction_bid_technique',
          text: { vi: '📖 Đấu giá Công pháp tàn quyển (Tốn 60 Linh thạch)', en: '📖 Bid for Technique Shard (Cost 60 Stones)'},
          effects: { spiritStones: -60, comprehension: 4 }
        },
        {
          id: 'world_auction_sell',
          text: { vi: '💰 Bán hàng tồn kho kiếm lời cao', en: '💰 Sell your inventory at premium prices'},
          effects: { spiritStones: 70, luck: 2 }
        }
      ]
    };
  }

  return null;
};

/**
 * Tạo chuỗi tin tức thế giới ngắn gọn từ các biến trạng thái.
 * Trả về mảng string để hiển thị trong monthly log.
 */
export const worldStateToNews = (world: WorldState, language: Lang): string[] => {
  const news: string[] = [];
  const isVi = language === 'vi';

  if (world.mountain.beastActivity > 75)
    news.push(isVi ? `🐾 Yêu thú hoạt động mạnh (${Math.round(world.mountain.beastActivity)}%), nguy hiểm sơn mạch tăng cao.`
                   : `🐾 Beast activity surging (${Math.round(world.mountain.beastActivity)}%), mountain danger elevated.`);
  if (world.city.priceIndex > 140)
    news.push(isVi ? `📈 Giá linh dược leo thang (${Math.round(world.city.priceIndex)}%), khan hiếm hàng hóa.`
                   : `📈 Spirit medicine prices spike (${Math.round(world.city.priceIndex)}%), goods scarce.`);
  if (world.city.priceIndex < 70)
    news.push(isVi ? `📉 Thị trường dư thừa, giá hàng giảm mạnh (${Math.round(world.city.priceIndex)}%).`
                   : `📉 Market surplus, prices crash (${Math.round(world.city.priceIndex)}%).`);
  if (world.sect.stability < 30)
    news.push(isVi ? `⚡ Nội bộ tông môn bất ổn (${Math.round(world.sect.stability)}%), đấu đá phe phái.`
                   : `⚡ Sect internal instability (${Math.round(world.sect.stability)}%), faction conflicts.`);
  if (world.global.daoFluctuation > 65)
    news.push(isVi ? `✨ Thiên đạo dị động (${Math.round(world.global.daoFluctuation)}%), cơ duyên phi thường có thể xuất hiện.`
                   : `✨ Dao fluctuations (${Math.round(world.global.daoFluctuation)}%), extraordinary opportunities may emerge.`);
  if (world.demonic.activity > 60)
    news.push(isVi ? `💀 Ma tu hoạt động mạnh (${Math.round(world.demonic.activity)}%), đường sá không an toàn.`
                   : `💀 Demonic cultivators active (${Math.round(world.demonic.activity)}%), roads unsafe.`);
  if (world.sect.warLevel > 60)
    news.push(isVi ? `⚔️ Tông môn chiến sự leo thang (${Math.round(world.sect.warLevel)}%), đại chiến có thể bùng nổ.`
                   : `⚔️ Sect war escalating (${Math.round(world.sect.warLevel)}%), major conflict possible.`);
  if (world.city.prosperity > 80)
    news.push(isVi ? `🏙️ Thành thị phồn hoa (${Math.round(world.city.prosperity)}%), cơ hội kinh doanh tốt.`
                   : `🏙️ City prosperity booming (${Math.round(world.city.prosperity)}%), good trading conditions.`);

  return news.slice(0, 3); // Chỉ hiển thị 3 tin quan trọng nhất
};

export const filterEventsForState = (
  events: EventDefinition[],
  state: GameState,
  age: number
): EventDefinition[] => {
  return events.filter((event) => {
    // 1. Check Realm Limits
    const realmTiers: Record<string, number> = {
      'Mortal': 0, 'Qi Refinement': 1, 'Foundation Establishment': 2, 'Golden Core': 3,
      'Nascent Soul': 4, 'Soul Formation': 5, 'Void Amalgamation': 6, 'Body Integration': 7,
      'Mahayana': 8, 'Tribulation': 9, 'True Immortal': 10
    };
    const reqTier = event.minRealm ? (realmTiers[event.minRealm as string] ?? 0) : 0;
    const currentTier = realmTiers[state.realm] ?? 0;
    if (currentTier < reqTier) return false;
    
    if (currentTier === reqTier && event.minSubStageIndex !== undefined) {
      if ((state.subStageIndex || 0) < event.minSubStageIndex) return false;
    }
    
    if (event.maxRealm) {
      const maxTier = realmTiers[event.maxRealm as string] ?? 99;
      if (currentTier > maxTier) return false;
      if (currentTier === maxTier && event.maxSubStageIndex !== undefined) {
        if ((state.subStageIndex || 0) > event.maxSubStageIndex) return false;
      }
    }

    // 2. Check Sect Prestige Requirements if they are sect-specific events
    const eventMetadata = event.metadata || {};
    if (eventMetadata.sect_event) {
      if (!state.sect) return false;
      if (eventMetadata.minSectPrestige !== undefined) {
        if ((state.sectPrestige || 0) < (eventMetadata.minSectPrestige as number)) {
          return false;
        }
      }
      if (eventMetadata.maxSectPrestige !== undefined) {
        if ((state.sectPrestige || 0) > (eventMetadata.maxSectPrestige as number)) {
          return false;
        }
      }
    }

    // 3. Location filtering logic
    const tags = event.tags || [];
    const loc = state.currentLocation || 'sect';
    if (loc === 'city') {
      const cityTags = ['city', 'market', 'auction', 'crime'];
      if (!tags.some((t) => cityTags.includes(t))) return false;
    } else if (loc === 'mountain') {
      const mountainTags = ['mountain', 'beast', 'danger', 'opportunity', 'hunt'];
      if (!tags.some((t) => mountainTags.includes(t))) return false;
    } else if (loc === 'sect') {
      const cityTags = ['city', 'market', 'auction', 'crime'];
      const mountainTags = ['mountain', 'beast', 'danger', 'opportunity', 'hunt'];
      const secretRealmTags = ['secret_realm', 'ruin'];
      const hasOtherLocTags = tags.some((t) =>
        cityTags.includes(t) || mountainTags.includes(t) || secretRealmTags.includes(t)
      );
      const hasSectTags = tags.includes('sect_positive') || tags.includes('sect_chaos');
      if (!hasSectTags && hasOtherLocTags) return false;
    } else if (loc === 'secret_realm') {
      const secretRealmTags = ['secret_realm', 'ruin'];
      if (!tags.some((t) => secretRealmTags.includes(t))) return false;
    }
    // 4. Custom event conditions
    if (event.id === 'auction_house_conflict') {
      if (!state.worldState || (state.worldState.city.prosperity ?? 0) <= 70) return false;
    } else if (event.id === 'beast_king_lotus') {
      if (!state.worldState || (state.worldState.mountain.beastActivity ?? 0) <= 65) return false;
    } else if (event.id === 'corrupt_sect_deacon') {
      if (!state.worldState || (state.worldState.sect.stability ?? 0) >= 35) return false;
    } else if (event.id === 'save_demonic_cultivator') {
      if (!state.worldState || (state.worldState.global.demonicEnergy ?? 0) <= 50) return false;
    } else if (event.id === 'slum_black_market') {
      if (!state.worldState || (state.worldState.city.security ?? 0) >= 40) return false;
    }

    return true;
  });
};

export const getRandomEvent = (
  state: GameState,
  language: Lang
): EventDefinition => {
  const age = state.age;
  const available = filterEventsForState(getLocalizedEvents(language), state, age);

  if (available.length === 0) {
    return {
      id: 'quiet_reflection',
      title: getLocalizedText({ en: 'Quiet Reflection', vi: 'Suy ngẫm tĩnh lặng'}, language),
      description: getLocalizedText({
        en: 'A quiet period passes, and you reflect on your cultivation path.',
        vi: 'Một khoảng tĩnh lặng trôi qua, bạn suy tư về con đường tu chân.'}, language),
      minRealm: 'Mortal',
      
      weight: 1,
      choices: [
        {
          id: 'keep_training',
          text: getLocalizedText({ en: 'Keep training through the quiet.', vi: 'Tiếp tục tu luyện trong tĩnh lặng.'}, language),
          effects: { cultivation: 1, comprehension: 1 }},
        {
          id: 'rest',
          text: getLocalizedText({ en: 'Rest and restore your spirit.', vi: 'Nghỉ ngơi và hồi phục tinh thần.'}, language),
          effects: { health: 2, luck: 1 }},
      ]};
  }

  const getEventWeight = (event: EventDefinition) => {
    let w = event.weight;
    if (state.ambition && event.tags && event.tags.includes(state.ambition)) {
      w *= 3.0; // matching ambition events are 3x more likely to spawn!
    }
    return w;
  };

  const totalWeight = available.reduce((sum, event) => sum + getEventWeight(event), 0);
  let roll = Math.random() * totalWeight;
  for (const event of available) {
    roll -= getEventWeight(event);
    if (roll <= 0) {
      return event;
    }
  }
  return available[0];
};

const initTechniquesFromInheritance = (inheritance: Inheritance): TechniqueInstance[] => {
  const list: TechniqueInstance[] = [];
  const unlocked = inheritance.unlockedTechniques || {};
  const configTechniques = (combatConfig.techniques || []) as any[];

  configTechniques.forEach((tech) => {
    if (unlocked[tech.id]) {
      list.push({
        id: tech.id,
        name: tech.label,
        type: tech.type as any,
        tier: tech.tier as any,
        completeness: unlocked[tech.id],
        fragmentsCollected: 0,
        fragmentsRequired: tech.fragments_required || 3,
        isActive: false
      });
    }
  });

  return list;
};

const checkAndActivateTechniques = (
  techniques: TechniqueInstance[],
  stats: Stats,
  age: number,
  realm: Realm,
  language: Lang
): { techniques: TechniqueInstance[]; activatedLogs: LogEntry[] } => {
  // Bỏ auto-activate, việc nhập môn sẽ thông qua UI Mini Game
  // Hàm này giờ chỉ trả về techniques nguyên vẹn, 
  // giữ lại interface để khỏi sửa nhiều chỗ gọi hàm.
  return { techniques, activatedLogs: [] };
};

export const completeTechniqueLearning = (
  state: GameState,
  techniqueId: string,
  perfect: boolean,
  language: Lang
): GameState => {
  const techniques = state.techniques ? [...state.techniques] : [];
  const techIndex = techniques.findIndex(t => t.id === techniqueId);
  if (techIndex === -1) return state;

  const tech = techniques[techIndex];
  if (tech.isActive) return state;

  const configTech = (combatConfig.techniques || []).find((t: any) => t.id === techniqueId);
  if (!configTech) return state;

  techniques[techIndex] = { ...tech, isActive: true };

  const bonusComprehension = perfect ? 2 : 1;
  const newStats = { ...state.stats, comprehension: state.stats.comprehension + bonusComprehension };

  const logEntry: LogEntry = {
    type: 'technique_breakthrough',
    age: state.age,
    message: { en: `Successfully cultivated [${tech.name}]! Gained ${bonusComprehension} Comprehension.`, vi: `Nhập môn thành công [${tech.name}]! Khí huyết lưu thông, tăng ${bonusComprehension} Ngộ tính.`
    }
  };

  return {
    ...state,
    techniques,
    stats: newStats,
    log: [...state.log, logEntry]
  };
};

export const addFragment = (
  techniques: TechniqueInstance[],
  techniqueId: string,
  amount: number,
  age: number,
  language: Lang,
  stats?: Stats
): { techniques: TechniqueInstance[]; logs: LogEntry[]; cultivationDeducted: number } => {
  const logs: LogEntry[] = [];
  let cultivationDeducted = 0;
  const configTech = (combatConfig.techniques || []).find((t: any) => t.id === techniqueId);
  if (!configTech) return { techniques, logs, cultivationDeducted };

  let techIndex = techniques.findIndex((t) => t.id === techniqueId);
  let updated = [...techniques];

  const completenessOrder: TechniqueCompleteness[] = ['tàn_quyển', 'khuyết_thiên', 'hoàn_chỉnh', 'viên_mãn'];

  if (techIndex === -1) {
    const newTech: TechniqueInstance = {
      id: techniqueId,
      name: configTech.label,
      type: configTech.type as any,
      tier: configTech.tier as any,
      completeness: 'tàn_quyển',
      fragmentsCollected: amount,
      fragmentsRequired: configTech.fragments_required || 3,
      isActive: false
    };

    updated.push(newTech);

    logs.push({
      type: 'technique_fragment',
      age,
      message: { en: `You found a fragment of [${configTech.label}] (${amount}/${newTech.fragmentsRequired} fragments).`, vi: `Bạn nhặt được mảnh tàn quyển của [${configTech.label}] (đã thu thập ${amount}/${newTech.fragmentsRequired} mảnh).`
      }
    });

    let newFragments = amount;
    let newCompleteness: TechniqueCompleteness = 'tàn_quyển';
    let upgraded = false;
    let currentIdx = 0;

    while (newFragments >= newTech.fragmentsRequired && currentIdx < completenessOrder.length - 1) {
      const cost = getTechniqueBreakthroughCost(newTech.tier, configTech.breakthrough_cost_increase_pct);
      const currentCult = stats ? (stats.cultivation - cultivationDeducted) : 999999;
      if (currentCult >= cost) {
        newFragments -= newTech.fragmentsRequired;
        currentIdx += 1;
        newCompleteness = completenessOrder[currentIdx];
        upgraded = true;
        cultivationDeducted += cost;
      } else {
        logs.push({
          type: 'info',
          age,
          message: {
            en: `Breakthrough blocked! You need ${cost.toFixed(1)} Cultivation to upgrade [${newTech.name}] to ${completenessOrder[currentIdx + 1].replace('_', ' ')}, currently have ${currentCult.toFixed(2)}.`,
            vi: `Đột phá bị chặn! Bạn cần ${cost.toFixed(1)} Tu Vi để nâng cấp [${newTech.name}] lên ${completenessOrder[currentIdx + 1].replace('_', ' ')}, hiện có ${currentCult.toFixed(2)}.`
          }
        });
        break;
      }
    }

    if (upgraded) {
      updated[updated.length - 1] = {
        ...newTech,
        fragmentsCollected: newFragments,
        completeness: newCompleteness
      };
      logs.push({
        type: 'technique_breakthrough',
        age,
        message: {
          en: `Great! You merged fragments and upgraded [${newTech.name}] to ${newCompleteness.replace('_', ' ')}! Deducted ${cultivationDeducted.toFixed(1)} Cultivation.`,
          vi: `Đại cơ duyên! Bạn đã hợp nhất các mảnh và nâng cấp [${newTech.name}] lên cảnh giới ${newCompleteness.replace('_', ' ')}! Khấu trừ ${cultivationDeducted.toFixed(1)} Tu Vi.`
        }
      });
    }
  } else {
    const tech = updated[techIndex];
    if (tech.completeness === 'viên_mãn') {
      logs.push({
        type: 'info',
        age,
        message: {
          en: `You found a fragment of [${tech.name}], but this technique is already at Consummate (Viên Mãn) level.`,
          vi: `Bạn nhặt được mảnh tàn quyển của [${tech.name}], nhưng công pháp này đã đạt cảnh giới Viên Mãn.`
        }
      });
      return { techniques, logs, cultivationDeducted };
    }

    let newFragments = tech.fragmentsCollected + amount;
    let newCompleteness: TechniqueCompleteness = tech.completeness;
    let upgraded = false;
    let currentIdx = completenessOrder.indexOf(tech.completeness);

    while (newFragments >= tech.fragmentsRequired && currentIdx < completenessOrder.length - 1) {
      const cost = getTechniqueBreakthroughCost(tech.tier, configTech.breakthrough_cost_increase_pct);
      const currentCult = stats ? (stats.cultivation - cultivationDeducted) : 999999;
      if (currentCult >= cost) {
        newFragments -= tech.fragmentsRequired;
        currentIdx += 1;
        newCompleteness = completenessOrder[currentIdx];
        upgraded = true;
        cultivationDeducted += cost;
      } else {
        logs.push({
          type: 'info',
          age,
          message: {
            en: `Breakthrough blocked! You need ${cost.toFixed(1)} Cultivation to upgrade [${tech.name}] to ${completenessOrder[currentIdx + 1].replace('_', ' ')}, currently have ${currentCult.toFixed(2)}.`,
            vi: `Đột phá bị chặn! Bạn cần ${cost.toFixed(1)} Tu Vi để nâng cấp [${tech.name}] lên ${completenessOrder[currentIdx + 1].replace('_', ' ')}, hiện có ${currentCult.toFixed(2)}.`
          }
        });
        break;
      }
    }

    updated[techIndex] = {
      ...tech,
      fragmentsCollected: newFragments,
      completeness: newCompleteness
    };

    if (upgraded) {
      logs.push({
        type: 'technique_breakthrough',
        age,
        message: {
          en: `Great! You merged fragments and upgraded [${tech.name}] to ${newCompleteness.replace('_', ' ')}! Deducted ${cultivationDeducted.toFixed(1)} Cultivation.`,
          vi: `Đại cơ duyên! Bạn đã hợp nhất các mảnh và nâng cấp [${tech.name}] lên cảnh giới ${newCompleteness.replace('_', ' ')}! Khấu trừ ${cultivationDeducted.toFixed(1)} Tu Vi.`
        }
      });
    } else {
      logs.push({
        type: 'technique_fragment',
        age,
        message: { en: `You found a fragment of [${tech.name}] (${updated[techIndex].fragmentsCollected}/${tech.fragmentsRequired} fragments).`, vi: `Bạn nhặt được mảnh tàn quyển của [${tech.name}] (đã thu thập ${updated[techIndex].fragmentsCollected}/${tech.fragmentsRequired} mảnh).`
        }
      });
    }
  }

  return { techniques: updated, logs, cultivationDeducted };
};

const initItemsFromInheritance = (inheritance: Inheritance): ItemInstance[] => {
  const list = (inheritance.unlockedItems || []).map((item) => ({
    ...item,
    equipped: false
  }));
  return list;
};

export const addItem = (
  inventory: ItemInstance[],
  itemId: string,
  quantity: number,
  age: number
): { inventory: ItemInstance[]; logs: LogEntry[] } => {
  const logs: LogEntry[] = [];
  const configItem = (itemsData || []).find((i: any) => i.id === itemId);
  if (!configItem) return { inventory, logs };

  let updated = [...inventory];
  const isStackable = ['consumable', 'material', 'currency'].includes(configItem.category);

  if (isStackable) {
    const itemIndex = updated.findIndex((i) => i.id === itemId);
    if (itemIndex > -1) {
      updated[itemIndex] = {
        ...updated[itemIndex],
        quantity: updated[itemIndex].quantity + quantity
      };
    } else {
      updated.push({
        id: itemId,
        name: configItem.name,
        category: configItem.category as any,
        type: configItem.type as any,
        tier: configItem.tier as any,
        quantity: quantity,
        description: configItem.description,
        effects: configItem.effects,
        soulbound: configItem.soulbound
      });
    }
  } else {
    for (let count = 0; count < quantity; count++) {
      updated.push({
        id: itemId,
        name: configItem.name,
        category: configItem.category as any,
        type: configItem.type as any,
        tier: configItem.tier as any,
        quantity: 1,
        description: configItem.description,
        combatStats: configItem.combatStats,
        soulbound: configItem.soulbound,
        equipped: false,
        sealLevel: configItem.sealLevel as any
      });
    }
  }

  logs.push({
    type: 'item_gain',
    age,
    message: { en: `You acquired [${configItem.name}] x${quantity}.`, vi: `Bạn đã nhận được [${configItem.name}] x${quantity}.`
    }
  });

  return { inventory: updated, logs };
};

export const useItemInState = (state: GameState, itemIndexInInventory: number): GameState => {
  if (!state.alive) return state;

  const inventory = state.inventory || [];
  if (itemIndexInInventory < 0 || itemIndexInInventory >= inventory.length) return state;

  const item = inventory[itemIndexInInventory];
  if (!['consumable', 'relic'].includes(item.category)) return state;

  let newStats = { ...state.stats };

  // Custom Breakthrough Pill logic
  const cs = combatConfig?.cultivation_system;
  const bottlenecks = [
    ...(cs?.bottlenecks || [
      { realm_from: "Qi Refinement", threshold: 29.99, pill_item_id: "item_truc_co_dan", next_cult: 30.0, label: "Trúc Cơ" },
      { realm_from: "Foundation Establishment", threshold: 49.99, pill_item_id: "item_kim_dan_dan", next_cult: 50.0, label: "Kim Đan" },
      { realm_from: "Golden Core", threshold: 89.99, pill_item_id: "item_nguyen_anh_dan", next_cult: 90.0, label: "Nguyên Anh" }
    ]),
    { realm_from: "Qi Refinement", threshold: 29.99, pill_item_id: "item_truc_co_dan_ha_pham", next_cult: 30.0, label: "Trúc Cơ" }
  ];

  const matchingBottleneck = bottlenecks.find((b: any) => b.pill_item_id === item.id);
  if (matchingBottleneck) {
    if (newStats.cultivation >= matchingBottleneck.threshold && newStats.cultivation < (matchingBottleneck.next_cult ?? (matchingBottleneck.threshold + 0.1))) {
      // Perform breakthrough!
      newStats.cultivation = matchingBottleneck.next_cult ?? (matchingBottleneck.threshold + 0.01);
      
      // Consume 1 item
      let updatedInventory = [...inventory];
      if (item.quantity > 1) {
        updatedInventory[itemIndexInInventory] = {
          ...item,
          quantity: item.quantity - 1
        };
      } else {
        updatedInventory.splice(itemIndexInInventory, 1);
      }
      
      const newRealm = determineRealm(newStats.cultivation, state.realm);
      const oldRealm = state.realm;
      if (oldRealm !== newRealm) {
        if (newRealm === 'Qi Refinement') newStats.lifespan += 40;
        else if (newRealm === 'Foundation Establishment') newStats.lifespan += 80;
        else if (newRealm === 'Golden Core') newStats.lifespan += 200;
        else if (newRealm === 'Nascent Soul') newStats.lifespan += 500;
      }
      
      if (item.id === 'item_truc_co_dan_ha_pham') {
        newStats.lifespan -= 5;
      }

      const logEntry: LogEntry = {
        type: 'item_use',
        age: state.age,
        message: item.id === 'item_truc_co_dan_ha_pham'
          ? {
              vi: `🎉 Bạn đã sử dụng [${item.name}] và đột phá thành công Trúc Cơ, nhưng Đan độc phát tác tổn hại 5 năm thọ nguyên!`,
              en: `🎉 You used [${item.name}] and successfully broke through to Foundation, but Pill poison takes away 5 years of lifespan!`
            }
          : {
              vi: `🎉 Bạn đã sử dụng [${item.name}] và đột phá thành công bình cảnh, bước vào cảnh giới mới! Thọ nguyên gia tăng!`,
              en: `🎉 You used [${item.name}] and successfully broke through to the next realm! Lifespan increased!`
            }
      };
      
      let currentTechniques = state.techniques || [];
      const checkResult = checkAndActivateTechniques(currentTechniques, newStats, state.age, newRealm, 'vi');
      currentTechniques = checkResult.techniques;
      
      return {
        ...state,
        stats: newStats,
        realm: newRealm,
        inventory: updatedInventory,
        techniques: currentTechniques,
        log: [...state.log, logEntry, ...checkResult.activatedLogs],
        lastMessage: logEntry.message
      };
    } else {
      // Cannot use breakthrough pill yet
      const errorLog: LogEntry = {
        type: 'info',
        age: state.age,
        message: {
          vi: `Tu vi của bạn (${newStats.cultivation}) chưa đạt tới bình cảnh cực hạn (${matchingBottleneck.threshold}), chưa thể sử dụng [${item.name}].`,
          en: `Your cultivation (${newStats.cultivation}) has not reached the bottleneck threshold (${matchingBottleneck.threshold}) yet, cannot use [${item.name}].`
        }
      };
      return {
        ...state,
        log: [...state.log, errorLog],
        lastMessage: errorLog.message
      };
    }
  }

  // Normal elixir/consumable logic
  if (item.effects) {
    const fx = item.effects;
    newStats.health = Math.max(0, newStats.health + (fx.health ?? 0));
    newStats.luck = Math.max(0, newStats.luck + (fx.luck ?? 0));
    newStats.comprehension = Math.max(0, newStats.comprehension + (fx.comprehension ?? 0));
    newStats.karma = newStats.karma + (fx.karma ?? 0);
    newStats.cultivation = Math.max(0, newStats.cultivation + (fx.cultivation ?? 0));
    newStats.lifespan = Math.max(10, newStats.lifespan + (fx.lifespan ?? 0));
    newStats.daoHeart = Math.max(0, Math.min(100, newStats.daoHeart + (fx.daoHeart ?? 0)));
  }

  // Cap cultivation if using normal pills
  newStats.cultivation = Math.min(getCultivationCap({ ...state, stats: newStats }), newStats.cultivation);

  let updatedInventory = [...inventory];
  if (item.quantity > 1) {
    updatedInventory[itemIndexInInventory] = {
      ...item,
      quantity: item.quantity - 1
    };
  } else {
    updatedInventory.splice(itemIndexInInventory, 1);
  }

  const useLogEntry: LogEntry = {
    type: 'item_use',
    age: state.age,
    message: { en: `You used [${item.name}].`, vi: `Bạn đã sử dụng [${item.name}].`
    }
  };

  const newRealm = determineRealm(newStats.cultivation, state.realm);
  const oldRealm = state.realm;
  if (oldRealm !== newRealm) {
    if (newRealm === 'Qi Refinement') {
      newStats.lifespan += 40;
    } else if (newRealm === 'Foundation Establishment') {
      newStats.lifespan += 80;
    } else if (newRealm === 'Golden Core') {
      newStats.lifespan += 200;
    } else if (newRealm === 'Nascent Soul') {
      newStats.lifespan += 500;
    }
  }

  let currentTechniques = state.techniques || [];
  const checkResult = checkAndActivateTechniques(currentTechniques, newStats, state.age, newRealm, 'vi');
  currentTechniques = checkResult.techniques;

  return {
    ...state,
    stats: newStats,
    realm: newRealm,
    inventory: updatedInventory,
    techniques: currentTechniques,
    log: [...state.log, useLogEntry, ...checkResult.activatedLogs],
    lastMessage: useLogEntry.message
  };
};

export const equipItemInState = (state: GameState, itemIndexInInventory: number): GameState => {
  if (!state.alive) return state;

  const inventory = state.inventory || [];
  if (itemIndexInInventory < 0 || itemIndexInInventory >= inventory.length) return state;

  const item = inventory[itemIndexInInventory];
  if (item.category !== 'equipment') return state;

  const targetEquip = !item.equipped;

  let updatedInventory = inventory.map((invItem, idx) => {
    if (idx === itemIndexInInventory) {
      return { ...invItem, equipped: targetEquip };
    }
    
    if (targetEquip && invItem.category === 'equipment' && invItem.type === item.type && invItem.equipped) {
      return { ...invItem, equipped: false };
    }
    
    return invItem;
  });

  const equipLogEntry: LogEntry = {
    type: 'item_equip',
    age: state.age,
    message: { en: targetEquip ? `You equipped [${item.name}].` : `You unequipped [${item.name}].`, vi: targetEquip ? `Bạn đã trang bị [${item.name}].` : `Bạn đã tháo bỏ [${item.name}].`
    }
  };

  return {
    ...state,
    inventory: updatedInventory,
    log: [...state.log, equipLogEntry],
    lastMessage: equipLogEntry.message
  };
};

// getInitialInheritance (Lấy di sản thừa kế khởi tạo ban đầu khi chưa có điểm tích lũy)
export const getInitialInheritance = (): Inheritance => ({
  legacyPower: 0,
  ancestralMemory: 0,
  blessing: 0,
  unlockedTechniques: {},
  unlockedItems: []});

// calculateInheritance (Tính toán tích lũy di sản sau khi kiếp sống kết thúc để truyền lại cho kiếp sau)
export const calculateInheritance = (state: GameState): Inheritance => {
  // Điểm sức mạnh di sản mới dựa trên tu vi (cultivation) và nghiệp lực (karma) của kiếp này
  const newLegacy = Math.max(0, state.inheritance.legacyPower + Math.floor((state.stats.cultivation + state.stats.karma) / 5));
  // Điểm ký ức tổ tiên mới dựa trên ngộ tính (comprehension) và nghiệp lực (karma)
  const newAncestral = Math.max(0, state.inheritance.ancestralMemory + Math.floor((state.stats.comprehension + state.stats.karma) / 6));
  // Điểm phúc trạch mới dựa trên vận may (luck) và tu vi (cultivation)
  const newBlessing = Math.max(0, state.inheritance.blessing + Math.floor((state.stats.luck + state.stats.cultivation) / 5));
  
  // Lưu giữ lại công pháp đã học truyền kiếp
  const unlocked: Record<string, TechniqueCompleteness> = { ...(state.inheritance.unlockedTechniques || {}) };
  
  (state.techniques || []).forEach((tech) => {
    // Chỉ kế thừa nếu đã hoàn chỉnh hoặc viên mãn
    if (tech.completeness === 'hoàn_chỉnh' || tech.completeness === 'viên_mãn') {
      const existing = unlocked[tech.id];
      if (!existing || (existing === 'hoàn_chỉnh' && tech.completeness === 'viên_mãn')) {
        unlocked[tech.id] = tech.completeness;
      }
    }
  });

  // Kế thừa các vật phẩm Soulbound hoặc Relic truyền kiếp
  const inheritedItems = (state.inventory || []).filter(
    (item) => item.soulbound || item.category === 'relic'
  );

  return {
    legacyPower: newLegacy,
    ancestralMemory: newAncestral,
    blessing: newBlessing,
    unlockedTechniques: unlocked,
    unlockedItems: inheritedItems};
};

// createNewGame (Khởi tạo một giả lập game hoàn toàn mới, reset cuộc đời từ xuất thế tuổi 11)
export const createNewGame = (
  inheritance: Inheritance,
  run: number,
  language: Lang,
  customParams?: {
    gender: 'nam' | 'nữ';
    spiritualRoot: string;
    sect: string;
    ambition?: 'truong_sinh' | 'ba_chu' | 'dan_dao' | 'kiem_tien' | 'phu_quoc' | 'ma_dao';
  }
): GameState => {
  const activeConfig = combatConfig as any;
  const startingAge = activeConfig.time_gear?.starting_age ?? 11;
  
  const gender = customParams?.gender ?? 'nam';
  const spiritualRoot = customParams?.spiritualRoot ?? 'Kim Linh Căn';
  const sect = customParams?.sect ?? 'Kiếm Tông';
  const ambitions = ['truong_sinh', 'ba_chu', 'dan_dao', 'kiem_tien', 'phu_quoc', 'ma_dao'] as const;
  const ambition = customParams?.ambition ?? ambitions[Math.floor(Math.random() * ambitions.length)];
  
  const stats = baseStats(inheritance, spiritualRoot, sect);
  
  // Random starting story ID from 1 to 5
  const startingStoryId = Math.floor(Math.random() * 5) + 1;
  const currentEvent = buildStartingEvent(gender, spiritualRoot, sect, startingAge, startingStoryId);
  
  let techniques = initTechniquesFromInheritance(inheritance);
  const checkResult = checkAndActivateTechniques(techniques, stats, startingAge, determineRealm(stats.cultivation, 'Mortal'), language);
  techniques = checkResult.techniques;
 
  const inventory = initItemsFromInheritance(inheritance);
 
  return {
    run: run + 1,
    life: 1,
    age: startingAge,
    alive: true,
    realm: determineRealm(stats.cultivation, 'Mortal'),
    subStageIndex: determineRealm(stats.cultivation, 'Mortal') === 'Qi Refinement' ? 1 : 0,
    stats,
    inheritance,
    log: [
      {
        type: 'info',
        message: { vi: `Kiếp sống mới bắt đầu tại ${sect === 'Kiếm Tông' ? 'Làng Tàn Kiếm' : sect === 'Ma Đạo' ? 'Làng Hắc Thạch' : sect === 'Huyết Tông' ? 'Làng Xích Huyết' : 'Làng Bách Thảo'}.`, en: `A new life starts at your village.`}},
      ...checkResult.activatedLogs
    ],
    currentEvent,
    lastMessage: { vi: `Bạn bước vào hành trình làm đệ tử ngoại môn của ${sect}.`, en: `Your journey as an outer disciple of ${sect} begins.`
    },
    history: [],
    techniques,
    inventory,
    month: 1,
    isTicking: false,
    monthlyLog: [],
    gender,
    sect,
    startingStoryId,
    sectContribution: 0,
    sectPrestige: 0,
    spiritStones: Math.max(0, Math.floor(inheritance.blessing * 2)),
    sectRank: 'ngoại_môn',
    activeQuest: null,
    ambition,
    menuStack: [],
    questsCompletedThisYear: 0,
    npcFavorability: {
      npc_kiem_tong_chap_su: 0,
      npc_kiem_tong_ta_tieu: 0,
      npc_dan_tong_chap_su: 0,
      npc_ma_dao_chap_su: 0,
      npc_huyet_tong_chap_su: 0},
    worldState: createInitialWorldState(true),
    currentLocation: 'sect'};
};

const beQuanQuest = (months: number): SectQuest => ({
  id: `quest_be_quan_${months}`,
  title: { vi: `Bế Quan Tu Luyện (${months} tháng)`, en: `Closed-door Retreat (${months} months)` },
  description: { vi: `Bế quan tĩnh tu để hấp thụ tinh khí đất trời.`, en: `Closed-door retreat to absorb world spiritual energy.`},
  difficulty: 'Hoàng',
  durationMonths: months,
  minRank: 'ngoại_môn',
  rewards: {
    contribution: 0,
    cultivation: 0 // Tu vi sẽ được cộng dần mỗi tháng trong tickMonth
  },
  progressLogs: {
    vi: [
      "Bạn ngồi xếp bằng, vận hành đại chu thiên tuần hoàn khí.",
      "Linh khí hội tụ quanh phủ đệ, đạo tâm yên bình không chút xao nhãng.",
      "Kinh mạch mở rộng, chân khí toàn thân tuần hoàn lưu thông sảng khoái."
    ],
    en: [
      "You sit cross-legged, circulating your breathing cycle.",
      "Spiritual energy gathers around your cave, Dao Heart calm and undisturbed.",
      "Meridians expand, Qi circulates smoothly throughout your body."
    ]
  }
});

const farmingQuest = (): SectQuest => ({
  id: 'quest_farm_herbs',
  title: { vi: 'Trồng Linh Thảo Linh Điền', en: 'Herb Farming'},
  description: { vi: 'Thuê ruộng linh điền để gieo hạt Linh Thảo.', en: 'Lease spirit land to cultivate Spirit Herbs.'},
  difficulty: 'Hoàng',
  durationMonths: 6,
  minRank: 'ngoại_môn',
  rewards: {
    contribution: 0,
    item: { itemId: 'item_linh_thao', quantity: 5 }
  },
  progressLogs: {
    vi: [
      "Bạn gieo hạt giống xuống linh điền và tưới nước linh tuyền.",
      "Mầm non linh thảo nhô lên khỏi mặt đất, tỏa ra dược hương thoang thoảng.",
      "Thảo dược lớn nhanh dưới sự bảo hộ của linh trận."
    ],
    en: [
      "You sow seeds in the spirit land and water them with spring water.",
      "Herb sprouts push through the soil, releasing a faint aroma.",
      "The herbs grow rapidly under the protection of the spirit array."
    ]
  }
});

export const SectPunishmentEvent: EventDefinition = {
  id: 'sect_punishment_event',
  title: { vi: '⚠️ Tông Môn Trừng Phạt', en: '⚠️ Sect Punishment'},
  description: {
    vi: 'Năm vừa qua bạn lười biếng không hoàn thành bất kỳ nhiệm vụ tông môn nào. Theo môn quy của đệ tử Luyện Khí, Chấp Pháp Đường giáng xuống trừng phạt!',
    en: 'In the past year, you did not complete any sect quests. According to the rules of Qi Refinement disciples, the Law Hall inflicts punishment!'
  },
  minRealm: 'Mortal',
  weight: 0,
  choices: [
    {
      id: 'action_punishment_labor',
      text: {
        vi: 'Lao dịch khổ sai (HP -15, Tuổi +1)',
        en: 'Hard labor (HP -15, Age +1)'
      },
      effects: {}
    },
    {
      id: 'action_punishment_fine',
      text: { vi: 'Nộp phạt tiền tài (-100 Linh Thạch)', en: 'Pay fine (-100 Spirit Stones)'},
      effects: {}
    },
    {
      id: 'action_punishment_whip',
      text: {
        vi: 'Chịu phạt roi pháp luật (-2.0 Tu vi, -5 Đạo Tâm)',
        en: 'Law lashes (-2.0 Cultivation, -5 Dao Heart)'
      },
      effects: {}
    }
  ]
};

export const TournamentAnnualStartEvent: EventDefinition = {
  id: 'tournament_annual_start',
  title: { vi: '🏟️ Ngoại Môn Đại Bỉ Khai Mở!', en: '🏟️ Outer Sect Tournament Begins!'},
  description: {
    vi: 'Tháng 12 hàng năm, Đại Hội Tỷ Thí Ngoại Môn chính thức khai mở! Trống lôi đài vang rền khắp sơn môn, các đệ tử Luyện Khí từ khắp các phong tập hợp. Đây là cơ hội lấy Trúc Cơ Đan phá cảnh và chứng minh thực lực của bản thân trước toàn tông môn!\n\n💎 Phần thưởng: Top 10 → 1x Trúc Cơ Đan. Top 50 → 50-100 Điểm cống hiến.\n⚠️ Lưu ý: Nếu không tham gia, trừ 30 Điểm cống hiến tông môn vì thiếu sự hiện diện.',
    en: 'Every year in December, the Outer Sect Tournament officially opens! War drums echo across the mountain gates as Qi Refinement disciples from every peak gather. This is your chance to claim a Foundation Pill and prove your might before the whole sect!\n\n💎 Rewards: Top 10 → 1x Foundation Pill. Top 50 → 50-100 Contribution Points.\n⚠️ Warning: Skipping the tournament costs 30 Sect Contribution Points for absence.'
  },
  minRealm: 'Mortal',
  weight: 0,
  choices: [
    {
      id: 'action_tournament_participate',
      text: { vi: '⚔️ Báo danh thi đấu (Tham gia Đại Bỉ)', en: '⚔️ Register to compete (Enter Tournament)'},
      effects: {}
    },
    {
      id: 'action_tournament_watch',
      text: { vi: '👁️ Tọa sơn quan hổ đấu (Đứng ngoài quan sát)', en: '👁️ Observe from the sidelines (Watch & Bet)'},
      effects: {}
    },
    {
      id: 'action_tournament_skip',
      text: { vi: '🚶 Bỏ qua không tham gia (-30 Cống Hiến)', en: '🚶 Skip the tournament (-30 Contribution)'},
      effects: {}
    }
  ]
};

export const getMenuEvent = (menuId: string, state: GameState, language: Lang): EventDefinition => {
  const monthLabel = language === 'vi' ? getVietnameseMonthName(state.month) : `Month ${state.month}`;
  
  if (menuId === 'menu_monthly_plan') {
    const isMortalWithManual = state.realm === 'Mortal' && state.techniques && state.techniques.some(t => !t.isActive);
    let choices: any[] = [];
    
    if (isMortalWithManual) {
      choices = [
        {
          id: 'action_mortal_breakthrough_minigame',
          text: { vi: 'Vạn dặm tiên lộ, bắt đầu từ bước chân đầu tiên.', en: 'A thousand miles journey begins with a single step.' },
          effects: {}
        }
      ];
    } else {
      choices = [
        { id: 'goto_menu_tinh_tu', text: { vi: '🧘 [1] Tĩnh Tu (Meditation)', en: '🧘 [1] Tĩnh Tu (Meditation)'}, effects: {} },
        { id: 'goto_menu_nhan_nhiem_vu', text: { vi: '📜 [2] Nhận Nhiệm Vụ Tông Môn', en: '📜 [2] Accept Sect Quests'}, effects: {} },
        { id: 'goto_menu_hoat_dong_tong_mon', text: { vi: '🏛️ [3] Hoạt Động Tông Môn', en: '🏛️ [3] Sect Activities'}, effects: {} },
        { id: 'goto_menu_kiem_tai_nguyen', text: { vi: '⛏️ [4] Kiếm Tài Nguyên (Tại tông môn)', en: '⛏️ [4] Gather Resources (Inside Sect)'}, effects: {} },
        { id: 'goto_menu_quan_he_xa_hoi', text: { vi: '👥 [5] Quan Hệ Xã Hội', en: '👥 [5] Social Relations'}, effects: {} },
        { id: 'goto_menu_lich_luyen', text: { vi: '🗺️ [6] Lịch Luyện Thế Giới', en: '🗺️ [6] World Travel'}, effects: {} },
        { id: 'goto_menu_sect_shop', text: { vi: '📜 [7] Tông Môn Bảo Các', en: '📜 [7] Sect Vault'}, effects: {} }
      ];

      const cap = getCultivationCap(state);
      const bottlenecks = getBottlenecks(state, combatConfig);
      const isBottleneck = bottlenecks.some(b => b.realm_from === state.realm && b.subStageIndex === state.subStageIndex);

      if (state.stats.cultivation >= cap && isBottleneck) {
        choices.unshift({
          id: 'action_trigger_breakthrough',
          text: { vi: '🌟 Đột Phá Bình Cảnh (Breakthrough)', en: '🌟 Breakthrough Bottleneck'},
          effects: {}
        });
      }
    }

    return {
      id: 'menu_monthly_plan',
      title: { vi: `☯ Kế Hoạch Tu Hành - ${monthLabel} (Tuổi ${state.age})`, en: `☯ Cultivation Plan - ${monthLabel} (Age ${state.age})`
      },
      description: { vi: `Thời gian khả dụng trong tháng này: 1 tháng. Bạn muốn lên kế hoạch hoạt động nào cho tháng này?`, en: `Time available for this month: 1 month. What actions do you want to plan for this month?`},
      minRealm: 'Mortal',
      weight: 1,
      choices
    };
  }
  if (menuId === 'menu_tinh_tu') {
    return {
      id: 'menu_tinh_tu',
      title: { vi: '🧘 Động Phủ Tĩnh Tu', en: '🧘 Meditation Chamber'},
      description: { vi: 'Linh khí xung quanh hội tụ. Việc tu luyện đòi hỏi sự kiên trì và tập trung cao độ.', en: 'Spiritual energy gathers around. Cultivation demands persistence and absolute focus.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_tinh_tu_binh_thuong', text: { vi: '✨ Tĩnh tu bình thường (An toàn, +Tu vi)', en: '✨ Normal Meditation (Safe, +Cultivation)' }, effects: {} },
        { id: 'goto_menu_be_quan', text: { vi: '🚪 Bế quan dài hạn (Tăng nhiều tu vi)', en: '🚪 Closed-door Retreat (High Cultivation)'}, effects: {} },
        { id: 'goto_menu_dot_tai_nguyen', text: { vi: '🔥 Đốt tài nguyên tu luyện (Tốn Linh thạch)', en: '🔥 Spend resources to cultivate'}, effects: {} },
        { id: 'goto_menu_nghien_cuu_cong_phap', text: { vi: '📖 Tham ngộ/Nghiên cứu công pháp', en: '📖 Comprehend/Study Techniques'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại menu chính', en: '↩️ Back to main menu'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_be_quan') {
    return {
      id: 'menu_be_quan',
      title: { vi: '🚪 Bế Quan Tu Luyện', en: '🚪 Closed-Door Retreat'},
      description: { vi: 'Chọn khoảng thời gian bế quan. Trong suốt thời gian này thời gian sẽ trôi tự động và không có sự kiện ngoài cắt ngang.', en: 'Select the retreat duration. Time will pass automatically without external events during this period.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_be_quan_3', text: { vi: '⏳ Bế quan 3 tháng (+2 Tu Vi)', en: '⏳ Retreat for 3 months (+2 Cultivation)'}, effects: {} },
        { id: 'action_be_quan_6', text: { vi: '⏳ Bế quan 6 tháng (+5 Tu Vi)', en: '⏳ Retreat for 6 months (+5 Cultivation)'}, effects: {} },
        { id: 'action_be_quan_12', text: { vi: '⏳ Bế quan 1 năm (+10 Tu Vi)', en: '⏳ Retreat for 1 year (+10 Cultivation)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_dot_tai_nguyen') {
    const hasPill = (state.inventory || []).some(item => item.id === 'item_huyen_nguyen_dan');
    return {
      id: 'menu_dot_tai_nguyen',
      title: { vi: '🔥 Đốt Tài Nguyên Tu Luyện', en: '🔥 Cultivate With Resources'},
      description: { vi: `Sử dụng Linh thạch hoặc Đan dược để tăng tốc độ hấp thu linh năng. Linh thạch hiện có: ${state.spiritStones} 💎.`, en: `Use Spirit Stones or Elixirs to boost Qi absorption. Spirit Stones owned: ${state.spiritStones} 💎.`
      },
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_dot_tai_nguyen_it', text: { vi: '🔹 Tiêu hao ít (Tốn 5 Linh thạch, +0.8 Tu vi)', en: '🔹 Low cost (Costs 5 Stones, +0.8 Cultivation)' }, effects: {} },
        { id: 'action_dot_tai_nguyen_vua', text: { vi: '🔸 Tiêu hao vừa (Tốn 15 Linh thạch, +2.0 Tu vi)', en: '🔸 Moderate cost (Costs 15 Stones, +2.0 Cultivation)' }, effects: {} },
        { id: 'action_dot_tai_nguyen_toan_luc', text: { vi: `💥 Toàn lực (Tốn 30 Linh thạch + 1 Huyền Nguyên Đan, +5.0 Tu vi) ${hasPill ? '✓' : '❌ (Thiếu đan)'}`, en: `💥 All-out (Costs 30 Stones + 1 Elixir, +5.0 Cultivation) ${hasPill ? '✓' : '❌ (No Elixir)'}` }, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_nghien_cuu_cong_phap') {
    return {
      id: 'menu_nghien_cuu_cong_phap',
      title: { vi: '📖 Tham Ngộ Công Pháp', en: '📖 Study Techniques'},
      description: {
        vi: 'Không tăng tu vi bản thân, nhưng tăng độ thuần thục công pháp và nâng cao Ngộ tính/Đạo tâm.',
        en: 'Does not increase cultivation, but increases technique mastery and Comprehension/Dao Heart.'
      },
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_nghien_cuu_kiem', text: { vi: '⚔️ Nghiên cứu Kiếm Quyết (+1 Ngộ Tính)', en: '⚔️ Study Sword Secrets (+1 Comprehension)'}, effects: {} },
        { id: 'action_nghien_cuu_tam_phap', text: { vi: '🧘 Tĩnh tâm nghiên cứu Tâm Pháp (+2 Đạo Tâm)', en: '🧘 Meditate on Mind Manuals (+2 Dao Heart)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_nhan_nhiem_vu') {
    return {
      id: 'menu_nhan_nhiem_vu',
      title: { vi: '📜 Nhiệm Vụ Đường', en: '📜 Sect Quest Hall'},
      description: { vi: 'Bảng gỗ nhiệm vụ tông môn chứa nhiều ủy thác khác nhau giúp tích lũy cống hiến môn phái.', en: 'The sect bulletin board displays various requests to accumulate contribution.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'goto_menu_quest_lao_vu', text: { vi: '🧹 Lao dịch tông môn (An toàn, tẻ nhạt)', en: '🧹 Sect Chores (Safe, tedious)' }, effects: {} },
        { id: 'goto_menu_quest_chien_dau', text: { vi: '⚔️ Nhiệm vụ chiến đấu (Nguy hiểm, thưởng cao)', en: '⚔️ Combat Missions (Dangerous, high rewards)' }, effects: {} },
        { id: 'goto_menu_quest_bi_mat', text: { vi: '🕵️ Nhiệm vụ bí mật từ Trưởng Lão', en: '🕵️ Secret Elder Request'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_quest_lao_vu' || menuId === 'menu_quest_chien_dau') {
    const isChores = menuId === 'menu_quest_lao_vu';
    const allQuests = (sectQuestsData as SectQuest[]) || [];
    
    const isChoreQuest = (q: SectQuest) => 
      q.id.includes('chore') || 
      q.id.includes('water') || 
      q.id.includes('refining') || 
      q.id.includes('beast') || 
      q.id.includes('herb');

    const filtered = allQuests.filter(q => {
      const catMatch = isChores ? isChoreQuest(q) : !isChoreQuest(q);
      
      const rankOrder: Record<string, number> = { 'ngoại_môn': 1, 'nội_môn': 2, 'chân_truyền': 3, 'trưởng_lão': 4 };
      const playerRankVal = rankOrder[state.sectRank ?? 'ngoại_môn'] ?? 1;
      const questRankVal = rankOrder[q.minRank] ?? 1;
      
      return catMatch && playerRankVal >= questRankVal;
    });

    const choices = filtered.map(q => {
      const rewardDescVi = `Thưởng: +${q.rewards.contribution} cống hiến, +${q.rewards.gold ?? 0} Linh thạch${q.rewards.item ? `, +Item[${q.rewards.item.itemId.replace('item_', '')}]` : ''}`;
      const rewardDescEn = `Reward: +${q.rewards.contribution} Contrib, +${q.rewards.gold ?? 0} Gold${q.rewards.item ? `, +Item[${q.rewards.item.itemId.replace('item_', '')}]` : ''}`;
      
      return {
        id: `action_quest_${q.id}`,
        text: {
          vi: `${q.title.vi} (${q.durationMonths} tháng, ${rewardDescVi})`,
          en: `${q.title.en} (${q.durationMonths} months, ${rewardDescEn})`
        },
        effects: {}
      };
    });

    choices.push({ id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} });

    return {
      id: menuId,
      title: isChores 
        ? { vi: '🧹 Nhiệm Vụ Lao Dịch', en: '🧹 Sect Chores'}
        : { vi: '⚔️ Nhiệm Vụ Chiến Đấu', en: '⚔️ Combat Missions'},
      description: isChores
        ? { vi: 'Nhiệm vụ tay chân giúp rèn luyện cơ thể một cách vững chãi.', en: 'Manual labor that trains the physical body steadily.'}
        : { vi: 'Chiến đấu bảo vệ tài sản tông môn và trừ yêu diệt ma.', en: 'Fight against demons and guard sect assets.'},
      minRealm: 'Mortal',
      weight: 1,
      choices
    };
  }

  if (menuId === 'menu_quest_bi_mat') {
    return {
      id: 'menu_quest_bi_mat',
      title: { vi: '🕵️ Nhiệm Vụ Mật Của Trưởng Lão', en: '🕵️ Secret Elder Request'},
      description: { vi: 'Trưởng lão giao nhiệm vụ riêng: Điều tra một đệ tử ngoại môn có biểu hiện khả nghi buôn lậu đan dược tông môn.', en: 'The Elder gives you a secret request: Investigate an outer disciple suspected of smuggling sect pills.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_quest_bi_mat_trung_thanh', text: { vi: '⚖️ Báo cáo trung thực tông môn (+30 Cống Hiến, +1 Đạo Tâm)', en: '⚖️ Honestly report it (+30 Contrib, +1 Dao Heart)' }, effects: {} },
        { id: 'action_quest_bi_mat_nhan_hoi_lo', text: { vi: '💰 Nhận hối lộ của đệ tử buôn lậu (+100 Linh Thạch, -4 Nghiệp Lực)', en: '💰 Accept smuggler\'s bribe (+100 Spirit Stones, -4 Karma)' }, effects: {} },
        { id: 'action_quest_bi_mat_bo_mac', text: { vi: '🙈 Bỏ mặc không quan tâm (+2 Vận may, -1 Đạo tâm)', en: '🙈 Ignore the issue (+2 Luck, -1 Dao Heart)' }, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_lich_luyen') {
    return {
      id: 'menu_lich_luyen',
      title: { vi: '🗺️ Xuống Núi Lịch Luyện', en: '🗺️ Mountain Travel & Adventure'},
      description: {
        vi: 'Rời tông môn tầm bảo, đi săn yêu thú hoặc giao thương tại thành thị tu chân.',
        en: 'Leave the sect gates to search for treasures, hunt monsters, or trade in cultivator towns.'
      },
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'goto_menu_lich_luyen_nui_rung', text: { vi: '⛰️ Vào Vạn Thú Sơn Mạch (Săn bắn, hái thuốc)', en: '⛰️ Enter Beast Mountain Range (Hunting, herbs)' }, effects: {} },
        { id: 'goto_menu_lich_luyen_thanh_thi', text: { vi: '🏮 Đến Thành Thị Tu Chân (Giao thương, đấu giá)', en: '🏮 Visit Cultivator Town (Trade, auction)' }, effects: {} },
        { id: 'goto_menu_lich_luyen_di_xa', text: { vi: '🐪 Đi viễn du phương xa (Theo thương đoàn)', en: '🐪 Long distance travel (With merchant caravan)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_lich_luyen_nui_rung') {
    return {
      id: 'menu_lich_luyen_nui_rung',
      title: { vi: '⛰️ Vạn Thú Sơn Mạch', en: '⛰️ Beast Mountain Range'},
      description: { vi: 'Sơn mạch trùng điệp đầy linh thảo hoang dã nhưng cũng đầy rẫy thú dữ săn mồi.', en: 'Endless mountain ranges filled with wild spiritual herbs but also fearsome predators.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_hunt_herbs', text: { vi: '🌿 Tìm linh dược (Có tỷ lệ nhận Linh Thảo/Tuyết Liên)', en: '🌿 Search for herbs (Chance to gain Spirit Herbs/Tuyết Liên)'}, effects: {} },
        { id: 'action_hunt_beasts', text: { vi: '🐆 Săn yêu thú (Có tỷ lệ nhận Linh Quặng/Thần cốt)', en: '🐆 Hunt beasts (Chance to gain Spirit Ore/Beast Shard)'}, effects: {} },
        { id: 'action_find_ancient_cave', text: { vi: '🕸️ Khám phá Động Phủ cổ tu sĩ (Cực kỳ may rủi)', en: '🕸️ Discover Ancient Cave Dwelling (High risk/reward)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_lich_luyen_thanh_thi') {
    return {
      id: 'menu_lich_luyen_thanh_thi',
      title: { vi: '🏮 Thành Thị Tu Chân', en: '🏮 Cultivator Town'},
      description: { vi: 'Chợ giao dịch sầm uất. Nơi tu sĩ tụ tập trao đổi tin tức và vật phẩm.', en: 'Busy trading market where cultivators gather to trade news and items.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_town_auction', text: { vi: '🏛️ Vào Đấu Giá Hội (Mua Đan dược bằng Linh thạch)', en: '🏛️ Enter Auction Hall (Buy Elixirs with Gold)'}, effects: {} },
        { id: 'action_town_black_market', text: { vi: '👁️ Giao dịch Chợ Đen (Mua bán nguyên liệu thô)', en: '👁️ Black Market Trade (Buy/sell raw materials)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_lich_luyen_di_xa') {
    return {
      id: 'menu_lich_luyen_di_xa',
      title: { vi: '🐪 Đi Viễn Du Phương Xa', en: '🐪 Long Distance Travel'},
      description: { vi: 'Vượt vạn dặm núi rừng để sang quốc gia tu chân khác. Chuyến đi tốn nhiều thời gian và tiền bạc.', en: 'Cross ten thousand miles of wilderness to another cultivation empire. Takes time and gold.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_travel_caravan', text: { vi: '🐫 Đi theo thương đoàn (Tốn 10 Linh thạch, 6 tháng, Thưởng: +3 Ngộ tính, +3 Vận may)', en: '🐫 Go with caravan (Costs 10 Gold, 6 months, Reward: +3 Comp, +3 Luck)' }, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_kiem_tai_nguyen') {
    const isAlchEligible = state.stats.comprehension >= 10 || state.sect === 'Đan Tông';
    const isSmithEligible = state.stats.health >= 15 || state.sect === 'Kiếm Tông';
    return {
      id: 'menu_kiem_tai_nguyen',
      title: { vi: '💎 Kiếm Thêm Tài Nguyên', en: '💎 Earn Resources'},
      description: {
        vi: 'Lao động làm thuê đan dược, rèn khí cụ hoặc đấu pháp cá cược để trang trải cuộc sống.',
        en: 'Work making elixirs, forging tools, or betting on fights to make a living.'
      },
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_work_alchemy', text: { vi: `🧪 Luyện đan thuê (+20 Linh thạch) ${isAlchEligible ? '✓' : '❌ (Cần Ngộ Tính >= 10)'}`, en: `🧪 Alchemy work (+20 Gold) ${isAlchEligible ? '✓' : '❌ (Requires Comp >= 10)'}` }, effects: {} },
        { id: 'action_work_blacksmith', text: { vi: `⚒️ Rèn đúc pháp khí thuê (+20 Linh thạch) ${isSmithEligible ? '✓' : '❌ (Cần Sức Khỏe >= 15)'}`, en: `⚒️ Forging work (+20 Gold) ${isSmithEligible ? '✓' : '❌ (Requires HP >= 15)'}` }, effects: {} },
        { id: 'action_farm_herbs', text: { vi: '🌾 Thuê linh điền trồng Linh thảo (Tốn 5 Linh thạch, thu hoạch 5x Linh thảo sau 6 tháng)', en: '🌾 Lease spirit land (Costs 5 Gold, harvest 5x Herbs after 6 months)' }, effects: {} },
        { id: 'action_bet_arena', text: { vi: '🎲 Đấu pháp cá cược (Tốn 10 Linh thạch, 50% thắng nhận +30 Linh thạch, 50% thua mất sạch)', en: '🎲 Bet on arena fight (Costs 10 Gold, 50% win +30 Gold, 50% lose)' }, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_quan_he_xa_hoi') {
    return {
      id: 'menu_quan_he_xa_hoi',
      title: { vi: '🤝 Nhân Mạch Quan Hệ', en: '🤝 Social Networks'},
      description: {
        vi: 'Kết hảo hữu, chọn phe cánh trong nội bộ môn phái để thuận lợi tu hành.',
        en: 'Make friends and join factions within the sect to facilitate cultivation.'
      },
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_social_gift', text: { vi: '🎁 Tặng lễ kết giao đồng môn (Tốn 15 Linh thạch, Thưởng: +10 Cống Hiến)', en: '🎁 Give gift to fellow disciples (Costs 15 Gold, Reward: +10 Contrib)' }, effects: {} },
        { id: 'action_social_faction_li', text: { vi: '⚖️ Theo phe Trưởng Lão Vương (Tốn 10 Linh thạch, Thưởng: +10 Cống Hiến, +5 Đạo tâm)', en: '⚖️ Join Elder Wang\'s faction (Costs 10 Gold, Reward: +10 Contrib, +5 Dao Heart)' }, effects: {} },
        { id: 'action_social_dao_companion', text: { vi: '🍶 Uống rượu giao lưu tìm Đạo Lữ (Thưởng: +5 Vận May)', en: '🍶 Drink and search for Dao Companion (Reward: +5 Luck)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  if (menuId === 'menu_hoat_dong_tong_mon') {
    return {
      id: 'menu_hoat_dong_tong_mon',
      title: { vi: '⚔️ Hoạt Động Tông Môn', en: '⚔️ Sect Events'},
      description: { vi: 'Đại hội so tài hoặc thám hiểm bí cảnh do tông môn tổ chức hàng năm.', en: 'Arena tournament or secret realm expedition organized by the sect.'},
      minRealm: 'Mortal',
      weight: 1,
      choices: [
        { id: 'action_event_tournament', text: { vi: '🏟️ Đăng ký tham gia Ngoại Môn Đại Bỉ', en: '🏟️ Register for Outer Sect Tournament'}, effects: {} },
        { id: 'action_event_secret_realm', text: { vi: '🌀 Tế đàn Cổ Ma Bí Cảnh (Yêu cầu Luyện Khí tầng 6 trở lên)', en: '🌀 Ancient Demon Secret Realm (Requires Qi Level 6+)'}, effects: {} },
        { id: 'action_back', text: { vi: '↩️ Quay lại', en: '↩️ Back'}, effects: {} }
      ]
    };
  }

  return getMenuEvent('menu_monthly_plan', state, language);
};

export const isMenuEvent = (eventId: string): boolean => {
  return eventId.startsWith('menu_') || eventId === 'monthly_plan';
};

const applyChoiceToStateInternal = (state: GameState, choiceId: string, language: Lang): GameState => {
  if (!state.currentEvent || !state.alive) {
    return state;
  }

  if (choiceId.startsWith('action_punishment_')) {
    let nextStats = { ...state.stats };
    let nextAge = state.age;
    let nextMonth = state.month;
    let nextSpiritStones = state.spiritStones ?? 0;
    let nextSectContribution = state.sectContribution ?? 0;
    let tempLogs: LogEntry[] = [];
    let alive = true;
    let deathCause: LocalizedText | undefined;
    let lastMessage: LocalizedText = { vi: '', en: ''};

    if (choiceId === 'action_punishment_labor') {
      nextStats.health = Math.max(1, nextStats.health - 15);
      nextAge += 1;
      tempLogs.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Lao dịch khổ sai trừng phạt: Trừ 15 HP, thọ nguyên hao tổn +1 tuổi.`,
          en: `Hard labor punishment: -15 HP, aged +1 year.`
        }
      });
      lastMessage = { vi: `Bạn chấp nhận lao dịch khổ sai để chuộc tội.`, en: `You accepted hard labor to redeem yourself.`};
    } else if (choiceId === 'action_punishment_fine') {
      const stones = nextSpiritStones;
      const contribution = nextSectContribution;
      if (stones >= 100) {
        nextSpiritStones = stones - 100;
        tempLogs.push({
          type: 'info',
          age: state.age,
          message: { vi: `Nộp phạt tiền tài: Khấu trừ 100 Linh Thạch.`, en: `Paid fine: Deducted 100 Spirit Stones.`}
        });
        lastMessage = { vi: `Bạn nộp phạt 100 Linh Thạch để giải quyết vi phạm.`, en: `You paid 100 Spirit Stones to settle the violation.`};
      } else {
        const remainingNeeded = 100 - stones;
        nextSpiritStones = 0;
        if (contribution >= remainingNeeded) {
          nextSectContribution = contribution - remainingNeeded;
          tempLogs.push({
            type: 'info',
            age: state.age,
            message: { vi: `Nộp phạt tiền tài: Khấu trừ hết ${stones} Linh Thạch đang có và bù thêm ${remainingNeeded} cống hiến tông môn.`, en: `Paid fine: Deducted all ${stones} Spirit Stones and compensated with ${remainingNeeded} sect contribution.`
            }
          });
          lastMessage = { vi: `Bù trừ linh thạch và cống hiến tông môn để nộp phạt.`, en: `Compensated with spirit stones and sect contribution to pay the fine.`};
        } else {
          nextSectContribution = 0;
          // Forced hard labor penalty
          nextStats.health = Math.max(1, nextStats.health - 15);
          nextAge += 1;
          tempLogs.push({
            type: 'info',
            age: state.age,
            message: {
              vi: `Nộp phạt thất bại: Không đủ Linh Thạch và Điểm cống hiến tông môn! Bị cưỡng chế đi Lao dịch khổ sai (HP -15, Tuổi +1).`,
              en: `Fine failed: Insufficient Spirit Stones and Sect Contribution! Forced into hard labor instead (HP -15, Age +1).`
            }
          });
          lastMessage = {
            vi: `Không đủ tiền nộp phạt, bị cưỡng chế lao dịch khổ sai.`,
            en: `Insufficient funds for fine, forced into hard labor.`
          };
        }
      }
    } else if (choiceId === 'action_punishment_whip') {
      nextStats.cultivation = Math.max(0, Math.round((nextStats.cultivation - 2.0) * 100) / 100);
      nextStats.daoHeart = Math.max(0, nextStats.daoHeart - 5);
      tempLogs.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Roi pháp luật trừng phạt: Trừ 2.0 Tu Vi, trừ 5 Đạo Tâm.`,
          en: `Law lashes punishment: -2.0 Cultivation, -5 Dao Heart.`
        }
      });
      lastMessage = { vi: `Chịu phạt roi pháp luật tại Chấp Pháp Đường.`, en: `Suffered law lashes at the Law Enforcement Hall.`};
    }

    if (nextAge >= nextStats.lifespan) {
      alive = false;
      const deathText = translateDeathReason({ stats: nextStats, age: nextAge });
      deathCause = deathText;
      tempLogs.push({
        type: 'death',
        age: nextAge,
        message: renderLocalizedTemplate(defaultMessages.deathAtAge, { age: nextAge })
      });
    }

    const choiceLogEntry: LogEntry = {
      type: 'choice',
      age: state.age,
      eventTitle: state.currentEvent.title,
      choiceText: state.currentEvent.choices.find(c => c.id === choiceId)?.text || { vi: '', en: ''},
      message: renderLocalizedTemplate(defaultMessages.choiceProgress, {
        age: state.age,
        event: state.currentEvent.title,
        choice: state.currentEvent.choices.find(c => c.id === choiceId)?.text || { vi: '', en: ''}
      })
    };

    const newLog = [...state.log, choiceLogEntry, ...tempLogs];
    const newRealm = determineRealm(nextStats.cultivation, state.realm);

    if (!alive) {
      return {
        ...state,
        alive: false,
        stats: nextStats,
        realm: newRealm,
        currentEvent: null,
        lastMessage: deathCause ?? { vi: 'Tịch Diệt', en: 'Deceased'},
        log: newLog,
        deathCause,
        isTicking: false,
        activeQuest: null,
        age: nextAge,
        month: nextMonth,
        spiritStones: nextSpiritStones,
        sectContribution: nextSectContribution
      };
    }

    const nextEvent = getMenuEvent('menu_monthly_plan', {
      ...state,
      age: nextAge,
      month: nextMonth,
      stats: nextStats,
      realm: newRealm,
      spiritStones: nextSpiritStones,
      sectContribution: nextSectContribution
    }, language);

    return {
      ...state,
      stats: nextStats,
      realm: newRealm,
      currentEvent: nextEvent,
      lastMessage,
      log: newLog,
      history: [...(state.history || []), { event: state.currentEvent, selectedChoiceId: choiceId }],
      isTicking: false,
      activeQuest: null,
      spiritStones: nextSpiritStones,
      sectContribution: nextSectContribution,
      age: nextAge,
      month: nextMonth
    };
  }

  if (choiceId === 'claim_welfare_and_continue') {
    const activeConfig = combatConfig as any;
    const timeGear = activeConfig.time_gear || {};
    const startingStones = timeGear.starting_spirit_stones ?? 10;

    let nextSpiritStones = (state.spiritStones ?? 0) + startingStones;

    const sectIdMap: Record<string, string> = {
      'Kiếm Tông': 'kiem_tong',
      'Ma Đạo': 'ma_dao',
      'Huyết Tông': 'huyet_tong',
      'Đan Tông': 'dan_tong'
    };

    const rootIdMap: Record<string, string> = {
      'Kim': 'kim',
      'Mộc': 'moc',
      'Thủy': 'thuy',
      'Hỏa': 'hoa',
      'Thổ': 'tho',
      'Lôi': 'loi',
      'Băng': 'bang',
      'Phong': 'phong'
    };

    const rootName = (state.stats.spiritualRoot || '').split(' ')[0] || 'Kim';
    const sId = sectIdMap[state.sect || 'Kiếm Tông'] || 'kiem_tong';
    const rId = rootIdMap[rootName] || 'kim';
    const targetManualId = `manual_${sId}_${rId}`;

    const configTech = (combatConfig.techniques || []).find((t: any) => t.id === targetManualId);
    let nextTechniques = state.techniques ? [...state.techniques] : [];
    let tempLogs: LogEntry[] = [];
    let nextStats = { ...state.stats };

    if (configTech) {
      const hasTech = nextTechniques.some(t => t.id === targetManualId);
      if (!hasTech) {
        nextTechniques.push({
          id: targetManualId,
          name: configTech.label,
          type: 'tâm_pháp',
          tier: 'hoàng',
          completeness: 'hoàn_chỉnh',
          fragmentsCollected: 1,
          fragmentsRequired: 1,
          isActive: false
        });
        tempLogs.push({
          type: 'technique_breakthrough',
          age: state.age,
          message: {
            vi: `Đã nhận tâm pháp sơ cấp nhập môn [${configTech.label}], hãy vận công để nhập môn!`,
            en: `Received the basic manual [${configTech.label}], begin your cultivation to initiate!`
          }
        });
      }
    }

    tempLogs.push({
      type: 'item_gain',
      age: state.age,
      message: { vi: `Nhận phúc lợi nhập môn: +${startingStones} Hạ Phẩm Linh Thạch.`, en: `Received entry welfare: +${startingStones} Spirit Stones.`
      }
    });

    const nextState = {
      ...state,
      stats: nextStats,
      realm: state.realm,
      spiritStones: nextSpiritStones,
      techniques: nextTechniques,
      log: [...state.log, ...tempLogs]
    };

    return {
      ...nextState,
      currentEvent: getMenuEvent('menu_monthly_plan', nextState, language),
      lastMessage: {
        vi: `Chính thức nhập môn ${state.sect}, bắt đầu quá trình tu luyện đệ tử ngoại môn.`,
        en: `Officially entered ${state.sect}, beginning outer disciple cultivation.`
      }
    };
  }

  if (choiceId === 'action_back' && (state.currentEvent.id === 'combat_encounter_tournament_2' || state.currentEvent.id === 'combat_encounter_tournament_3')) {
    let nextSectContribution = state.sectContribution ?? 0;
    let nextSpiritStones = state.spiritStones ?? 0;
    let nextInventory = state.inventory ? [...state.inventory] : [];
    let tempLogs: LogEntry[] = [];

    if (state.currentEvent.id === 'combat_encounter_tournament_2') {
      nextSectContribution += 50;
      nextSpiritStones += 20;
      tempLogs.push({
        type: 'info',
        age: state.age,
        message: { 
          vi: 'Bạn tự nguyện rút lui khỏi vòng bán kết đại hội tỷ thí: Nhận cống hiến +50, linh thạch +20.', 
          en: 'You voluntarily withdrew from the Semi-finals: Recieved +50 Contrib, +20 Gold.' 
        }
      });
    } else {
      nextSectContribution += 100;
      nextSpiritStones += 50;
      const result = addItem(nextInventory, 'item_huyen_nguyen_dan', 1, state.age);
      nextInventory = result.inventory;
      tempLogs = [...tempLogs, ...result.logs];
      tempLogs.push({
        type: 'info',
        age: state.age,
        message: { 
          vi: 'Bạn tự nguyện rút lui khỏi trận chung kết đại hội tỷ thí: Nhận giải Á Quân (+100 Cống hiến, +50 Linh thạch, +1 Huyền Nguyên Đan).', 
          en: 'You voluntarily withdrew from the Finals: Recieved Runner-up reward (+100 Contrib, +50 Gold, +1 Elixir).' 
        }
      });
    }

    return {
      ...state,
      sectContribution: nextSectContribution,
      spiritStones: nextSpiritStones,
      inventory: nextInventory,
      log: [...state.log, ...tempLogs],
      currentEvent: getMenuEvent('menu_monthly_plan', { ...state, sectContribution: nextSectContribution, spiritStones: nextSpiritStones, inventory: nextInventory }, language),
      lastMessage: { vi: 'Rút lui đại hội', en: 'Withdrew from tournament'}
    };
  }

  // Intercept Menu Events
  if (isMenuEvent(state.currentEvent.id)) {
    let menuStack = state.menuStack ? [...state.menuStack] : [];
    
    // 1. Back Action
    if (choiceId === 'action_back') {
      const parentMenu = menuStack.pop() || 'menu_monthly_plan';
      const event = getMenuEvent(parentMenu, state, language);
      return {
        ...state,
        currentEvent: event,
        menuStack
      };
    }
    
    // 2. Sub-menu transition
    if (choiceId.startsWith('goto_')) {
      const targetMenu = choiceId.replace('goto_', '');
      menuStack.push(state.currentEvent.id);
      const event = getMenuEvent(targetMenu, state, language);
      return {
        ...state,
        currentEvent: event,
        menuStack
      };
    }
    
    // 3. Final Actions (action_)
    if (choiceId.startsWith('action_')) {
      let nextStats = { ...state.stats };
      let nextRealmOverride: Realm | null = null;
      let nextSubStageIndexOverride: number | null = null;
      let nextSpiritStones = state.spiritStones ?? 0;
      let nextSectContribution = state.sectContribution ?? 0;
      let nextSectPrestige = state.sectPrestige ?? 0;
      let nextInventory = state.inventory ? [...state.inventory] : [];
      let tempLogs: LogEntry[] = [];
      let nextActiveQuest = state.activeQuest ? { ...state.activeQuest } : null;
      let nextIsTicking = false;
      let durationMonths = 1;
      let logTitle = state.currentEvent.title;
      let choiceText: TextResource = { vi: 'Hành động', en: 'Action'};
      
      if (choiceId === 'action_tinh_tu_binh_thuong') {
        const mult = getCultivationGainMultiplier(state);
        const gain = (0.3 + (nextStats.comprehension * 0.05)) * mult;
        nextStats.cultivation = Math.round((nextStats.cultivation + gain) * 100) / 100;
        nextStats.health = Math.min(100, nextStats.health + 2);
        choiceText = { vi: 'Tĩnh tu thường', en: 'Normal Meditation'};
        tempLogs.push({
          type: 'info',
          message: {
            vi: `Bế quan tĩnh tu hồi khí: Tu vi +${Number(gain.toFixed(2))}, Khí huyết +2.`,
            en: `Meditating inside chamber: Cultivation +${Number(gain.toFixed(2))}, HP +2.`
          }
        });
      }
      else if (choiceId === 'action_be_quan_3' || choiceId === 'action_be_quan_6' || choiceId === 'action_be_quan_12') {
        const months = choiceId === 'action_be_quan_3' ? 3 : choiceId === 'action_be_quan_6' ? 6 : 12;
        nextActiveQuest = {
          quest: beQuanQuest(months),
          monthsRemaining: months,
          progressLogs: [],
          isParty: false,
          accumulatedCultivation: 0
        };
        nextIsTicking = true;
        durationMonths = 0; // ticking advances time
        choiceText = { vi: `Bế quan ${months} tháng`, en: `Retreat for ${months} months` };
      }
      else if (choiceId === 'action_dot_tai_nguyen_it') {
        if (nextSpiritStones < 5) return state;
        nextSpiritStones -= 5;
        const mult = getCultivationGainMultiplier(state);
        const gain = (0.8 + (nextStats.comprehension * 0.05)) * mult;
        nextStats.cultivation = Math.round((nextStats.cultivation + gain) * 100) / 100;
        choiceText = { vi: 'Đốt tài nguyên ít', en: 'Low-cost resource cultivation'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Đốt 5 Linh Thạch luyện khí: Tu vi +${Number(gain.toFixed(2))}.`, en: `Spent 5 Stones: Cultivation +${Number(gain.toFixed(2))}.` }
        });
      }
      else if (choiceId === 'action_dot_tai_nguyen_vua') {
        if (nextSpiritStones < 15) return state;
        nextSpiritStones -= 15;
        const mult = getCultivationGainMultiplier(state);
        const gain = (2.0 + (nextStats.comprehension * 0.05)) * mult;
        nextStats.cultivation = Math.round((nextStats.cultivation + gain) * 100) / 100;
        choiceText = { vi: 'Đốt tài nguyên vừa', en: 'Moderate-cost resource cultivation'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Đốt 15 Linh Thạch luyện khí: Tu vi +${Number(gain.toFixed(2))}.`, en: `Spent 15 Stones: Cultivation +${Number(gain.toFixed(2))}.` }
        });
      }
      else if (choiceId === 'action_dot_tai_nguyen_toan_luc') {
        const pillIdx = nextInventory.findIndex(item => item.id === 'item_huyen_nguyen_dan');
        if (nextSpiritStones < 30 || pillIdx === -1) return state;
        nextSpiritStones -= 30;
        
        const item = nextInventory[pillIdx];
        if (item.quantity > 1) {
          nextInventory[pillIdx] = { ...item, quantity: item.quantity - 1 };
        } else {
          nextInventory.splice(pillIdx, 1);
        }
        
        const mult = getCultivationGainMultiplier(state);
        const gain = (5.0 + (nextStats.comprehension * 0.05)) * mult;
        nextStats.cultivation = Math.round((nextStats.cultivation + gain) * 100) / 100;
        choiceText = { vi: 'Đốt lực lượng tối đa', en: 'All-out resource cultivation'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Đốt 30 Linh Thạch và 1 Huyền Nguyên Đan: Tu vi +${Number(gain.toFixed(2))}.`, en: `Spent 30 Stones & 1 Pill: Cultivation +${Number(gain.toFixed(2))}.` }
        });
      }
      else if (choiceId === 'action_nghien_cuu_kiem') {
        nextStats.comprehension += 1;
        choiceText = { vi: 'Tham ngộ kiếm quyết', en: 'Study Sword Secrets'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Nghiên cứu kiếm quyết tinh túy: Ngộ Tính +1.`, en: `Studied sword secrets: Comprehension +1.`}
        });
      }
      else if (choiceId === 'action_nghien_cuu_tam_phap') {
        nextStats.daoHeart = Math.min(100, nextStats.daoHeart + 2);
        choiceText = { vi: 'Tĩnh tâm tâm pháp', en: 'Study Mind Manuals'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Tĩnh tâm nghiên cứu đạo thư: Đạo Tâm +2.`, en: `Meditated on Dao scriptures: Dao Heart +2.`}
        });
      }
      else if (choiceId === 'action_work_alchemy') {
        const isEligible = nextStats.comprehension >= 10 || state.sect === 'Đan Tông';
        const coins = isEligible ? 20 : 2;
        nextSpiritStones += coins;
        choiceText = { vi: 'Luyện đan thuê', en: 'Alchemy Work'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Lao động luyện đan thuê cho hiệu thuốc: Nhận +${coins} Linh Thạch.`, en: `Refined pills for medical shop: Received +${coins} Spirit Stones.` }
        });
      }
      else if (choiceId === 'action_work_blacksmith') {
        const isEligible = nextStats.health >= 15 || state.sect === 'Kiếm Tông';
        const coins = isEligible ? 20 : 2;
        nextSpiritStones += coins;
        choiceText = { vi: 'Rèn đúc thuê', en: 'Forging Work'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Rèn đúc vũ khí pháp khí thuê cho thợ rèn: Nhận +${coins} Linh Thạch.`, en: `Forged tools for blacksmith: Received +${coins} Spirit Stones.` }
        });
      }
      else if (choiceId === 'action_farm_herbs') {
        if (nextSpiritStones < 5) return state;
        nextSpiritStones -= 5;
        nextActiveQuest = {
          quest: farmingQuest(),
          monthsRemaining: 6,
          progressLogs: [],
          isParty: false
        };
        nextIsTicking = true;
        durationMonths = 0;
        choiceText = { vi: 'Thuê ruộng trồng Linh thảo', en: 'Leased spirit farm'};
      }
      else if (choiceId === 'action_bet_arena') {
        if (nextSpiritStones < 10) return state;
        nextSpiritStones -= 10;
        const win = Math.random() < 0.5;
        if (win) {
          nextSpiritStones += 30;
          tempLogs.push({
            type: 'info',
            message: { vi: `Đặt cược trận đấu pháp tại võ đài: Thắng cược! Nhận +30 Linh thạch.`, en: `Placed bet at arena: Won bet! Received +30 Spirit Stones.`}
          });
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: `Đặt cược trận đấu pháp tại võ đài: Thua cuộc! Mất trắng 10 Linh thạch.`, en: `Placed bet at arena: Lost bet! Lost 10 Spirit Stones.`}
          });
        }
        choiceText = { vi: 'Đấu pháp cá cược', en: 'Bet on arena fight'};
      }
      else if (choiceId === 'action_social_gift') {
        if (nextSpiritStones < 15) return state;
        nextSpiritStones -= 15;
        nextSectContribution += 10;
        choiceText = { vi: 'Tặng lễ kết giao', en: 'Gave social gifts'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Tặng quà linh vật kết hảo hữu với đồng môn: Cống hiến tông môn +10.`, en: `Gave gifts to fellow disciples: Sect Contribution +10.`}
        });
      }
      else if (choiceId === 'action_social_faction_li') {
        if (nextSpiritStones < 10) return state;
        nextSpiritStones -= 10;
        nextSectContribution += 10;
        nextStats.daoHeart = Math.min(100, nextStats.daoHeart + 5);
        choiceText = { vi: 'Bái phái theo phe Vương', en: 'Joined Wang\'s faction'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Dâng lễ gia nhập phe cánh Trưởng Lão Vương: Cống hiến +10, Đạo Tâm +5.`, en: `Joined Elder Wang's faction: Sect Contribution +10, Dao Heart +5.` }
        });
      }
      else if (choiceId === 'action_social_dao_companion') {
        nextStats.luck += 5;
        choiceText = { vi: 'Uống rượu giao lưu tìm Đạo lữ', en: 'Drink and find Dao Companion'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Đàm đạo uống rượu cùng hồng nhan đạo hữu: Vận may +5.`, en: `Drank with potential Dao Companions: Luck +5.`}
        });
      }
      else if (choiceId.startsWith('action_quest_') && !choiceId.startsWith('action_quest_bi_mat_')) {
        const questId = choiceId.replace('action_quest_', '');
        const questDef = (sectQuestsData as SectQuest[]).find(q => q.id === questId);
        if (!questDef) return state;
        nextActiveQuest = {
          quest: questDef,
          monthsRemaining: questDef.durationMonths,
          progressLogs: [],
          isParty: false
        };
        nextIsTicking = true;
        durationMonths = 0;
        choiceText = questDef.title;
      }
      else if (choiceId === 'action_quest_bi_mat_trung_thanh') {
        nextSectContribution += 30;
        nextStats.daoHeart = Math.min(100, nextStats.daoHeart + 2);
        choiceText = { vi: 'Báo cáo trung thực', en: 'Reported Smuggling'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Báo cáo trung thực đệ tử buôn lậu cho chấp pháp trưởng lão: Cống hiến +30, Đạo Tâm +2.`, en: `Reported smuggler to Law Enforcement: Sect Contribution +30, Dao Heart +2.` }
        });
      }
      else if (choiceId === 'action_quest_bi_mat_nhan_hoi_lo') {
        nextSpiritStones += 100;
        nextStats.karma -= 4;
        choiceText = { vi: 'Nhận hối lộ đệ tử khả nghi', en: 'Accepted Bribe'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Nhận 100 Linh Thạch hối lộ để làm ngơ cho vụ buôn lậu: Linh Thạch +100, Nghiệp Lực -4.`, en: `Accepted 100 Spirit Stones bribe to turn a blind eye: Gold +100, Karma -4.` }
        });
      }
      else if (choiceId === 'action_quest_bi_mat_bo_mac') {
        nextStats.luck += 2;
        nextStats.daoHeart = Math.max(0, nextStats.daoHeart - 1);
        choiceText = { vi: 'Làm ngơ bỏ mặc', en: 'Ignored Elder Request'};
        tempLogs.push({
          type: 'info',
          message: { vi: `Làm ngơ không can thiệp, tập trung tu luyện: Vận may +2, Đạo tâm -1.`, en: `Ignored request and focused on meditation: Luck +2, Dao Heart -1.` }
        });
      }
      else if (choiceId === 'action_hunt_herbs') {
        choiceText = { vi: 'Hái linh thảo dã ngoại', en: 'Harvest Herbs'};
        const roll = Math.random();
        if (roll < 0.3) {
          const isLien = Math.random() < 0.2;
          const itemId = isLien ? 'item_tuyet_lien' : 'item_linh_thao';
          const qty = isLien ? 1 : (Math.random() < 0.5 ? 1 : 2);
          const result = addItem(nextInventory, itemId, qty, state.age);
          nextInventory = result.inventory;
          tempLogs = [...tempLogs, ...result.logs];
        } else if (roll < 0.7) {
          const combatEvent: EventDefinition = {
            id: 'combat_encounter_beast_herb',
            title: { vi: '🌳 Yêu Thú Linh Thảo', en: '🌳 Herb Guardian Beast'},
            description: { vi: 'Một con Dã Linh Hổ hung tợn đang nhe nanh bảo vệ cụm Linh Thảo ở gốc sồi cổ thụ. Bạn có muốn giao chiến để đoạt lấy?', en: 'A ferocious Spirit Tiger is snarling, guarding the Spirit Herbs under the ancient oak tree. Will you fight to claim them?'},
            minRealm: 'Mortal',
            weight: 1,
            choices: [
              { id: 'start_combat_beast_herb', text: { vi: '⚔️ Giao Chiến Đoạt Dược', en: '⚔️ Fight to Claim Herbs'}, effects: {} },
              { id: 'action_back', text: { vi: '↩️ Bỏ chạy thối lui', en: '↩️ Retreat safely'}, effects: {} }
            ]
          };
          return {
            ...state,
            currentEvent: combatEvent,
            inventory: nextInventory,
            isTicking: false
          };
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: `Bạn lội qua suối sâu sườn đá rừng hoang nhưng không thu hoạch được Linh thảo nào.`, en: `You searched through valleys but found no spiritual herbs.`}
          });
        }
      }
      else if (choiceId === 'action_hunt_beasts') {
        choiceText = { vi: 'Săn dã thú dã ngoại', en: 'Hunt Beasts'};
        const roll = Math.random();
        if (roll < 0.75) {
          const combatEvent: EventDefinition = {
            id: 'combat_encounter_beast_hunt',
            title: { vi: '🐆 Gặp Yêu Thú', en: '🐆 Beast Encounter'},
            description: {
              vi: 'Một con Lôi Tê yêu thú hung dữ bỗng nhảy ra từ bụi rậm rít gào, lao thẳng về phía bạn!',
              en: 'A fearsome Thunder Rhino jumps out of the brush growling, charging directly at you!'
            },
            minRealm: 'Mortal',
            weight: 1,
            choices: [
              { id: 'start_combat_beast_hunt', text: { vi: '⚔️ Quyết Chiến Sinh Tử', en: '⚔️ Fight to the Death'}, effects: {} },
              { id: 'action_back', text: { vi: '↩️ Trốn chạy lánh xa', en: '↩️ Flee safely'}, effects: {} }
            ]
          };
          return {
            ...state,
            currentEvent: combatEvent,
            inventory: nextInventory,
            isTicking: false
          };
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: `Bạn đuổi theo dấu chân Yêu cọp nhưng bị mất dấu trong rừng sâu.`, en: `You tracked a demon tiger but lost its trail in the deep woods.`}
          });
        }
      }
      else if (choiceId === 'action_find_ancient_cave') {
        choiceText = { vi: 'Khám phá Động phủ cổ', en: 'Discover Ancient Cave'};
        const roll = Math.random();
        if (roll < 0.5) {
          const combatEvent: EventDefinition = {
            id: 'combat_encounter_demonic',
            title: { vi: '🔮 Ma Tu Phục Kích', en: '🔮 Demonic Cultivator Ambush'},
            description: {
              vi: 'Lối vào động phủ sụp đổ bỗng trào ra ma khí cuồn cuộn. Một Ma Tu mặt quỷ rít lên: "Đệ tử danh môn chính phái, nộp mạng!"',
              en: 'Thick demonic aura overflows from the ruined cave. A demonic cultivator shrieks: "Righteous disciple, pay with your life!"'
            },
            minRealm: 'Mortal',
            weight: 1,
            choices: [
              { id: 'start_combat_demonic', text: { vi: '⚔️ Trảm Sát Ma Tu', en: '⚔️ Fight the Demonic Cultivator'}, effects: {} },
              { id: 'action_back', text: { vi: '↩️ Rút lui bảo toàn tính mạng', en: '↩️ Flee and escape'}, effects: {} }
            ]
          };
          return {
            ...state,
            currentEvent: combatEvent,
            inventory: nextInventory,
            isTicking: false
          };
        } else if (roll < 0.8) {
          const techResult = addFragment(state.techniques || [], 'liet_duong_hoa', 1, state.age, language);
          nextStats.comprehension += 2;
          tempLogs.push({
            type: 'technique_breakthrough',
            message: { vi: `Đại kỳ ngộ! Bạn giải mã thành công trận pháp động phủ cổ sĩ: Ngộ tính +2.`, en: `Great Serendipity! Deciphered ancient cave array: Comprehension +2.`}
          });
          tempLogs = [...tempLogs, ...techResult.logs];
        } else {
          nextStats.health = Math.max(1, nextStats.health - 8);
          tempLogs.push({
            type: 'info',
            message: { vi: `Bẫy rập động phủ phát sinh tự bạo! Bạn bị chấn thương nhẹ (-8 HP).`, en: `Ancient trap detonated! You were injured (-8 HP).`}
          });
        }
      }
      else if (choiceId === 'action_town_auction') {
        choiceText = { vi: 'Vào Đấu giá hội', en: 'Town Auction'};
        if (nextSpiritStones >= 50) {
          nextSpiritStones -= 50;
          const result = addItem(nextInventory, 'item_tho_nguyen_dan', 1, state.age);
          nextInventory = result.inventory;
          tempLogs = [...tempLogs, ...result.logs];
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: `Linh thạch của bạn không đủ tham gia đấu giá Thọ Nguyên Đan (Cần 50 Linh thạch).`, en: `You do not have enough Spirit Stones to bid on Lifespan Pills (Requires 50).`}
          });
        }
      }
      else if (choiceId === 'action_town_black_market') {
        choiceText = { vi: 'Giao thương Chợ đen', en: 'Black Market Trade'};
        if (nextSpiritStones >= 10) {
          nextSpiritStones -= 10;
          const result = addItem(nextInventory, 'item_linh_thao', 2, state.age);
          nextInventory = result.inventory;
          tempLogs = [...tempLogs, ...result.logs];
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: `Linh thạch không đủ để mua Linh Thảo thô tại chợ đen (Cần 10 Linh thạch).`, en: `Insufficient Spirit Stones to trade on black market (Requires 10).`}
          });
        }
      }
      else if (choiceId === 'action_travel_caravan') {
        const caravanQuest: SectQuest = {
          id: 'quest_caravan_travel',
          title: { vi: 'Theo Thương Đoàn Viễn Hành', en: 'Travel With Caravan'},
          description: { vi: 'Vượt vạn lý núi tuyết sang vương quốc Đại Chu giao thương.', en: 'Cross snow mountains to trade with the Great Zhou Empire.'},
          difficulty: 'Hoàng',
          durationMonths: 6,
          minRank: 'ngoại_môn',
          rewards: { contribution: 0, comprehension: 3, daoHeart: 3 },
          progressLogs: {
            vi: [
              "Bạn ngồi trên xe thồ lạc đà di chuyển qua sa mạc.",
              "Vượt qua núi tuyết lạnh buốt, thấu hiểu ý chí kiên định.",
              "Học hỏi giao tiếp xã hội, nhận được nhiều tin tức mới."
            ],
            en: [
              "You ride a camel cart traveling across the desert.",
              "Crossing freezing snow mountains, training your resolve.",
              "Exchanging ideas with foreign merchants, learning new lore."
            ]
          }
        };
        nextActiveQuest = {
          quest: caravanQuest,
          monthsRemaining: 6,
          progressLogs: [],
          isParty: false
        };
        nextIsTicking = true;
        durationMonths = 0;
        choiceText = { vi: 'Viễn du Đại Chu', en: 'Travel to Great Zhou'};
      }
      else if (choiceId === 'action_event_tournament') {
        if (state.realm !== 'Qi Refinement' || state.sectRank !== 'ngoại_môn') {
          tempLogs.push({
            type: 'info',
            message: { vi: 'Ngoại môn đại bỉ chỉ dành cho đệ tử Ngoại Môn cảnh giới Luyện Khí.', en: 'Outer Sect Tournament is only open to Outer Disciples in Qi Refinement.'}
          });
        } else if (state.month !== 12) {
          tempLogs.push({
            type: 'info',
            message: { vi: 'Ngoại môn đại bỉ chỉ khai mạc vào tháng 12 hàng năm. Hãy tích lũy thọ nguyên và tu vi.', en: 'Outer Sect Tournament only starts in December. Prepare yourself.'}
          });
        } else {
          const combatEvent: EventDefinition = {
            id: 'combat_encounter_tournament_1',
            title: { vi: '🏟️ Đại Hội Tỷ Thí Ngoại Môn (Vòng Tứ Kết)', en: '🏟️ Outer Sect Tournament (Quarter-finals)'},
            description: {
              vi: 'Đến hẹn lại lên, Đại Hội Tỷ Thí sơn môn khai mở. Vòng đầu tiên: Bạn gặp đối thủ Lâm Phong (Luyện Khí tầng 2). Hãy chứng tỏ thực lực của mình!',
              en: 'The Mount Gates open for the Sect Tournament. Round 1: Opponent is Lâm Phong (Qi Refinement Layer 2). Show your strength!'
            },
            minRealm: 'Mortal',
            weight: 1,
            choices: [
              { id: 'start_combat_tournament_1', text: { vi: '⚔️ Vào Võ Đài Tỷ Thí', en: '⚔️ Step onto the Ring'}, effects: {} },
              { id: 'action_back', text: { vi: '↩️ Rút lui không tham gia', en: '↩️ Withdraw'}, effects: {} }
            ]
          };
          return {
            ...state,
            currentEvent: combatEvent,
            isTicking: false
          };
        }
      }
      else if (choiceId === 'action_event_secret_realm') {
        choiceText = { vi: 'Tiến vào Cổ Ma Bí Cảnh', en: 'Ancient Demon Secret Realm'};
        if (nextStats.cultivation < 20) {
          tempLogs.push({
            type: 'info',
            message: { vi: `Tu vi của bạn quá yếu, kết giới bí cảnh cấm đệ tử Luyện Khí tầng 6 trở xuống đi vào.`, en: `Your cultivation is too low, the boundary array forbids entry for Qi Level < 6.` }
          });
        } else {
          nextStats.health = Math.max(1, nextStats.health - 12);
          const mult = getCultivationGainMultiplier(state);
          nextStats.cultivation = Math.round((nextStats.cultivation + 2.0 * mult) * 100) / 100;
          const result = addItem(nextInventory, 'item_luan_hoi_thach', 1, state.age);
          nextInventory = result.inventory;
          tempLogs.push({
            type: 'info',
            message: { vi: `Tiến vào bí cảnh thám hiểm đầm lầy: Tổn thương kinh mạch (-12 HP), hấp thụ tinh khí Cổ Ma (+2.0 Tu Vi), nhặt được 1x Luân Hồi Thạch.`, en: `Explored the dangerous swamp: Injured meridians (-12 HP), absorbed demon aura (+2.0 Cult), found 1x Reincarnation Stone.` }
          });
          tempLogs = [...tempLogs, ...result.logs];
        }
      }
      else if (choiceId === 'action_trigger_breakthrough') {
        const breakthroughEvent = generateBreakthroughEvent(state, nextStats, combatConfig, language);
        if (breakthroughEvent) {
          return {
            ...state,
            currentEvent: breakthroughEvent,
            isTicking: false
          };
        }
      }
      else if (choiceId === 'action_breakthrough_natural' || choiceId === 'action_breakthrough_pill') {
        const bottlenecks = getBottlenecks(state, combatConfig);
        const matching = bottlenecks.find((b: any) => 
          state.realm === b.realm_from && 
          nextStats.cultivation >= b.threshold - 0.005
        );
        
        if (matching) {
          if (choiceId === 'action_breakthrough_pill') {
             const pillIdx = nextInventory.findIndex(i => i.id === matching.pill_item_id);
             if (pillIdx !== -1) {
                const item = nextInventory[pillIdx];
                if (item.quantity > 1) {
                  nextInventory[pillIdx] = { ...item, quantity: item.quantity - 1 };
                } else {
                  nextInventory.splice(pillIdx, 1);
                }
                nextStats.cultivation = matching.next_cult;
                 nextRealmOverride = matching.realm_to as Realm;
                 nextSubStageIndexOverride = matching.subStageIndex + 1;
                choiceText = { vi: 'Dùng đan dược đột phá', en: 'Breakthrough with Pill'};
                tempLogs.push({
                  type: 'info',
                  message: { vi: `✨ Hoàn mỹ! Sử dụng đan dược phá vỡ bình cảnh, tu vi chuyển biến cảnh giới mới!`, en: `✨ Perfect! Used pill to break the bottleneck, transitioned to the next realm!` }
                });
             }
          } else {
            let baseChance = 0;
            if (matching.realm_to === 'Foundation Establishment') baseChance = 8;
            else if (matching.realm_to === 'Golden Core') baseChance = 4;
            else if (matching.realm_to === 'Nascent Soul') baseChance = 1;
            else {
              baseChance = (matching.success_rate_no_pill ?? 0.5) * 100;
            }

            const compMod = nextStats.comprehension * 0.4;
            const luckMod = nextStats.luck * 0.3;
            const daoMod = nextStats.daoHeart * 0.3;
            const karmaMod = nextStats.karma * 0.2;
            const totalChance = Math.max(1, baseChance + compMod + luckMod + daoMod + karmaMod);
            const roll = Math.random() * 100;
            
            if (roll <= totalChance) {
              nextStats.cultivation = matching.next_cult;
                 nextRealmOverride = matching.realm_to as Realm;
                 nextSubStageIndexOverride = matching.subStageIndex + 1;
              choiceText = { vi: 'Thuận Thiên Đột Phá', en: 'Natural Breakthrough'};
              tempLogs.push({
                type: 'info',
                message: {
                  vi: `✨ Thành công! Ngộ ra chân lý đất trời, tự nhiên đột phá bình cảnh ${matching.label}!`,
                  en: `✨ Success! Grasped worldly truth, naturally broke ${matching.label} bottleneck!`
                }
              });
            } else {
              nextStats.health = Math.max(1, nextStats.health - 20); // recoil
              choiceText = { vi: 'Đột phá thất bại', en: 'Breakthrough Failed'};
              tempLogs.push({
                type: 'info',
                message: { vi: `🔥 Thất bại! Linh lực bạo động cắn trả, tổn thương kinh mạch (-20 HP). Bình cảnh vẫn chưa thể phá vỡ.`, en: `🔥 Failed! Spiritual backlash damaged meridians (-20 HP). The bottleneck remains.` }
              });
            }
          }
        }
      }
      else if (choiceId === 'action_breakthrough_wait' || choiceId === 'action_breakthrough_pill_disabled') {
        choiceText = { vi: 'Chờ đợi thời cơ', en: 'Wait for opportunity'};
        tempLogs.push({
          type: 'info',
          message: { vi: 'Tạm thời áp chế tu vi, chờ cơ hội đột phá tốt hơn.', en: 'Suppressed cultivation, waiting for a better breakthrough opportunity.' }
        });
      }
      
      let nextMonth = state.month;
      let nextAge = state.age;
      let alive: boolean = state.alive;
      let deathCause = state.deathCause;
      let lastMessage = state.lastMessage;
      let nextQuestsCompletedThisYear = state.questsCompletedThisYear ?? 0;
      let triggerPunishment = false;
      
      if (durationMonths > 0) {
        nextMonth += durationMonths;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextAge += 1;
          
          if (state.realm === 'Qi Refinement' && nextQuestsCompletedThisYear === 0) {
            triggerPunishment = true;
            tempLogs.push({
              type: 'info',
              age: nextAge,
              message: {
                vi: `⚠️ Trừng phạt hàng năm: Do lười biếng không làm nhiệm vụ tông môn nào, Chấp Pháp Đường giáng lâm trừng phạt!`,
                en: `⚠️ Annual Punishment: Having completed no sect quests, the Law Enforcement Hall inflicts punishment!`
              }
            });
          }
          nextQuestsCompletedThisYear = 0;
        }
        
        if (nextAge >= nextStats.lifespan) {
          alive = false;
          const deathText = translateDeathReason({ stats: nextStats, age: nextAge });
          deathCause = deathText;
          lastMessage = deathText;
          tempLogs.push({
            type: 'death',
            age: nextAge,
            message: renderLocalizedTemplate(defaultMessages.deathAtAge, { age: nextAge })
          });
        }
      }
      
      // Auto-upgrade techniques if player has enough fragments and cultivation
      let currentTechniques = state.techniques ? [...state.techniques] : [];
      let techniquesUpdated = false;
      const completenessOrder: TechniqueCompleteness[] = ["tàn_quyển", "khuyết_thiên", "hoàn_chỉnh", "viên_mãn"];

      currentTechniques = currentTechniques.map((tech) => {
        if (tech.completeness === "viên_mãn") return tech;
        
        const configTech = (combatConfig.techniques || []).find((t) => t.id === tech.id);
        if (!configTech) return tech;

        let newFragments = tech.fragmentsCollected;
        let newCompleteness: TechniqueCompleteness = tech.completeness;
        let currentIdx = completenessOrder.indexOf(tech.completeness);
        let upgraded = false;
        let totalDeduction = 0;

        while (newFragments >= tech.fragmentsRequired && currentIdx < completenessOrder.length - 1) {
          const cost = getTechniqueBreakthroughCost(tech.tier, configTech.breakthrough_cost_increase_pct);
          if (nextStats.cultivation - totalDeduction >= cost) {
            newFragments -= tech.fragmentsRequired;
            currentIdx += 1;
            newCompleteness = completenessOrder[currentIdx];
            totalDeduction += cost;
            upgraded = true;
          } else {
            break;
          }
        }

        if (upgraded) {
          nextStats.cultivation = Math.max(0, Math.round((nextStats.cultivation - totalDeduction) * 100) / 100);
          techniquesUpdated = true;
          tempLogs.push({
            type: "technique_breakthrough",
            age: state.age,
            message: {
              en: "Auto Breakthrough! Upgraded [" + tech.name + "] to " + newCompleteness.replace("_", " ") + "! Deducted " + totalDeduction.toFixed(1) + " Cultivation.",
              vi: "Tự Động Đột Phá! Đã nâng cấp [" + tech.name + "] lên cảnh giới " + newCompleteness.replace("_", " ") + "! Khấu trừ " + totalDeduction.toFixed(1) + " Tu Vi."
            }
          });
          return {
            ...tech,
            fragmentsCollected: newFragments,
            completeness: newCompleteness
          };
        }
        return tech;
      });

      menuStack = [];
      const oldRealm = state.realm;
      const newRealm = nextRealmOverride || determineRealm(nextStats.cultivation, state.realm);
      if (oldRealm !== newRealm) {
        if (newRealm === "Qi Refinement") nextStats.lifespan += 40;
        else if (newRealm === "Foundation Establishment") nextStats.lifespan += 80;
        else if (newRealm === "Golden Core") nextStats.lifespan += 200;
        else if (newRealm === "Nascent Soul") nextStats.lifespan += 500;
      }
      
      const cap = getCultivationCap(state);
      if (nextStats.cultivation >= cap) {
        nextStats.cultivation = cap;
      }
      
      const choiceLogEntry: LogEntry = {
        type: 'choice',
        age: state.age,
        eventTitle: logTitle,
        choiceText: choiceText,
        message: renderLocalizedTemplate(defaultMessages.choiceProgress, {
          age: state.age,
          event: logTitle,
          choice: choiceText
        })
      };
      
      const newLog = [...state.log, choiceLogEntry, ...tempLogs];
      
      if (!alive) {
        return {
          ...state,
          alive: false,
          stats: nextStats,
          realm: newRealm,
          currentEvent: null,
          lastMessage: deathCause ?? { vi: 'Tịch Diệt', en: 'Deceased'},
          log: newLog,
          deathCause,
          isTicking: false,
          activeQuest: null,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          inventory: nextInventory,
          techniques: currentTechniques
        };
      }
      
      let nextEvent: EventDefinition | null = null;
      
      const hitCapThisTurn = state.stats.cultivation < cap && nextStats.cultivation >= cap;
      if (hitCapThisTurn && !choiceId.startsWith('action_breakthrough_')) {
        nextEvent = generateBreakthroughEvent(state, nextStats, combatConfig, language) || null;
        if (nextEvent) {
          nextIsTicking = false;
          nextActiveQuest = null;
        }
      }

      if (!nextEvent && triggerPunishment) {
        nextEvent = SectPunishmentEvent;
        nextIsTicking = false;
        nextActiveQuest = null;
      } else if (!nextEvent && !nextIsTicking) {
        const isEligibleForTournament = 
          nextMonth === 12 &&
          state.sect &&
          (state.sectRank === 'ngoại_môn' || state.sectRank === undefined);
        
        if (isEligibleForTournament) {
          nextEvent = TournamentAnnualStartEvent;
          tempLogs.push({
            type: 'info',
            age: nextAge,
            message: { vi: '🏟️ Ngoại Môn Đại Bỉ năm nay khai mở! Trống lôi đài vang rền toàn tông môn.', en: '🏟️ The annual Outer Sect Tournament has begun! War drums echo across the whole sect.'}
          });
        } else {
          const activeConfig = combatConfig;
          const configDenom = activeConfig?.time_gear?.event_chance_denominator ?? 5;
          const rollEvent = Math.random() < (1 / configDenom);
          if (rollEvent) {
            nextEvent = getRandomEvent({
              ...state,
              age: nextAge,
              stats: nextStats,
              realm: newRealm,
              sectContribution: nextSectContribution,
              spiritStones: nextSpiritStones,
              sectPrestige: nextSectPrestige
            }, language);
          } else {
            nextEvent = getMenuEvent('menu_monthly_plan', { ...state, age: nextAge, month: nextMonth, stats: nextStats }, language);
          }
        }
      }
      
      return {
        ...state,
        stats: nextStats,
        realm: newRealm,
        currentEvent: nextEvent,
        lastMessage: choiceText,
        log: newLog,
        history: [...(state.history || []), { event: state.currentEvent, selectedChoiceId: choiceId }],
        isTicking: nextIsTicking,
        activeQuest: nextActiveQuest,
        spiritStones: nextSpiritStones,
        sectContribution: nextSectContribution,
        sectPrestige: nextSectPrestige,
        inventory: nextInventory,
        age: nextAge,
        month: nextMonth,
        menuStack,
        questsCompletedThisYear: nextQuestsCompletedThisYear,
        techniques: currentTechniques
      };
    }
  }

  const choice = state.currentEvent.choices.find((item) => item.id === choiceId);
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
  tempLogs = transitionResult.logs;

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
    npc_huyet_tong_chap_su: 0};
  
  if (choice.effects.npcFavorability) {
    for (const [npcId, val] of Object.entries(choice.effects.npcFavorability)) {
       baseFavorability = changeNpcFavorability(baseFavorability, npcId, val);
    }
  }


  let nextNpcFavorability = state.npcFavorability ? { ...state.npcFavorability } : {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0};

  let currentTechniques = state.techniques ? [...state.techniques] : [];
  let currentInventory = state.inventory ? [...state.inventory] : [];

  let newSectContribution = (state.sectContribution ?? 0) + (choice.effects.sectContribution ?? 0);
  let newSectPrestige = (state.sectPrestige ?? 0) + (choice.effects.sectPrestige ?? 0);
  let newSpiritStones = (state.spiritStones ?? 0) + (choice.effects.spiritStones ?? choice.effects.money ?? 0);
  let newRank = state.sectRank ?? 'ngoại_môn';

  let npcLogEntries: LogEntry[] = [];
  
  if (choiceId === 'action_tournament_participate') {
    // ── Tham gia Ngoại Môn Đại Bỉ ──
    if (state.realm !== 'Qi Refinement') {
      tempLogs.push({
        type: 'info',
        message: {
          vi: '⚠️ Bạn chưa đột phá cảnh giới Luyện Khí (Qi Refinement), không đủ điều kiện báo danh thi đấu! Buộc chuyển sang quan sát.',
          en: '⚠️ You are not in Qi Refinement realm, not eligible to compete! Forced to observe instead.'
        }
      });
      const bettingEvent: EventDefinition = {
        id: 'tournament_betting',
        title: { vi: '👁️ Quan Sát & Cá Cược Đại Bỉ', en: '👁️ Watch & Bet Tournament'},
        description: {
          vi: 'Bạn ngồi trên khán đài quan sát các cao thủ tỷ thí. Linh khí trên lôi đài giao thoa mãnh liệt, từng thức chiêu đều chứa đựng cơ hội ngộ đạo. Bạn có muốn cá cược không?',
          en: 'You watch from the stands as masters compete. Spiritual energy clashes intensely on the arena – every technique holds enlightenment. Do you want to bet?'
        },
        minRealm: 'Mortal', weight: 0,
        choices: [
          { id: 'action_bet_tournament_20', text: { vi: '🎲 Đặt cược 20 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 20 Stones (50% x2, 50% mất)' }, effects: {} },
          { id: 'action_bet_tournament_50', text: { vi: '🎲 Đặt cược 50 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 50 Stones (50% x2, 50% mất)' }, effects: {} },
          { id: 'action_bet_tournament_none', text: { vi: '🧘 Không cá cược, chỉ quan sát (+3 Ngộ Tính)', en: '🧘 Just watch (+3 Comprehension)' }, effects: {} }
        ]
      };
      return {
        ...state,
        currentEvent: bettingEvent,
        stats: newStats,
        isTicking: false,
        log: [...state.log, ...tempLogs.map(l => ({ ...l, age: state.age }))]
      };
    }

    if (newStats.health < 15) {
      // Too injured – forced to watch
      tempLogs.push({
        type: 'info',
        message: {
          vi: '⚠️ Khí huyết quá thấp (< 15), không đủ sức thi đấu! Buộc chuyển sang quan sát.',
          en: '⚠️ HP too low (< 15) to compete! Forced to observe instead.'
        }
      });
      const bettingEvent: EventDefinition = {
        id: 'tournament_betting',
        title: { vi: '👁️ Quan Sát & Cá Cược Đại Bỉ', en: '👁️ Watch & Bet Tournament'},
        description: {
          vi: 'Bạn ngồi trên khán đài quan sát các cao thủ tỷ thí. Linh khí trên lôi đài giao thoa mãnh liệt, từng thức chiêu đều chứa đựng cơ hội ngộ đạo. Bạn có muốn cá cược không?',
          en: 'You watch from the stands as masters compete. Spiritual energy clashes intensely on the arena – every technique holds enlightenment. Do you want to bet?'
        },
        minRealm: 'Mortal', weight: 0,
        choices: [
          { id: 'action_bet_tournament_20', text: { vi: '🎲 Đặt cược 20 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 20 Stones (50% x2, 50% mất)' }, effects: {} },
          { id: 'action_bet_tournament_50', text: { vi: '🎲 Đặt cược 50 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 50 Stones (50% x2, 50% mất)' }, effects: {} },
          { id: 'action_bet_tournament_none', text: { vi: '🧘 Không cá cược, chỉ quan sát (+3 Ngộ Tính)', en: '🧘 Just watch (+3 Comprehension)' }, effects: {} }
        ]
      };
      return {
        ...state,
        currentEvent: bettingEvent,
        stats: newStats,
        isTicking: false,
        log: [...state.log, ...tempLogs.map(l => ({ ...l, age: state.age }))]
      };
    }

    // Deduct HP for fighting
    newStats.health = Math.max(1, newStats.health - 15);

    // RNG outcome based on luck and cultivation
    const luck = newStats.luck;
    const cult = newStats.cultivation;
    const roll = Math.random();

    // High realm + high luck → semi-finalist, trigger Vương Tư Thông bribe
    if (cult >= 25 && luck >= 10 && roll < 0.5) {
      const briberEvent: EventDefinition = {
        id: 'tournament_bribe_vuong_thieu_gia',
        title: { vi: '💰 Vương Tư Thông Hối Lộ', en: '💰 Vuong Tu Thong\\\'s Bribe'},
        description: {
          vi: 'Trước khi vào bán kết, Vương Tư Thông – con trai của Vương trưởng lão – chặn đường bạn trong hành lang tối. Hắn ném túi linh thạch xuống sàn nói lạnh lùng: "500 Linh thạch và ta đảm bảo ngươi được chứng nhận Top 10 mà không cần đánh trận chung kết. Còn không... ngươi đấu với Long Ngạo Thiên mà xem!"',
          en: 'Before the semi-finals, Vuong Tu Thong – son of Elder Wang – intercepts you in a dark corridor. He drops a pouch of stones and says coldly: "500 Spirit Stones and I guarantee you a Top 10 certification without fighting the final. Or face Long Ngao Thien... your choice!"'
        },
        minRealm: 'Mortal', weight: 0,
        choices: [
          { id: 'action_bribe_accept', text: { vi: '💰 Chấp nhận tiền hối lộ (+500 Linh thạch, +50 Cống hiến, -10 Đạo Tâm)', en: '💰 Accept bribe (+500 Stones, +50 Contribution, -10 Dao Heart)' }, effects: {} },
          { id: 'action_bribe_refuse', text: { vi: '⚔️ Cự tuyệt! Đối mặt Long Ngạo Thiên trong trận chung kết!', en: '⚔️ Refuse! Face Long Ngao Thien in the final!'}, effects: {} }
        ]
      };
      tempLogs.push({
        type: 'info',
        message: { vi: '🏟️ Bạn vượt qua các vòng đầu xuất sắc, tiến vào bán kết! Nhưng trước cổng lôi đài chính...', en: '🏟️ You advanced through the early rounds brilliantly, reaching the semi-finals! But before the main arena gate...' }
      });
      return {
        ...state,
        stats: newStats,
        currentEvent: briberEvent,
        log: [...state.log, ...tempLogs.map(l => ({ ...l, age: state.age }))],
        isTicking: false
      };
    }

    // Low luck/cult → Top 50, contribution reward
    const contribution = 50 + Math.floor(Math.random() * 51); // 50-100
    newSectContribution += contribution;
    tempLogs.push({
      type: 'info',
      message: {
        vi: '🏟️ Tham gia Ngoại Môn Đại Bỉ, lực bất tòng tâm bạn dừng lại ở Top 50. Nhận cống hiến tông môn +' + contribution + '.',
        en: '🏟️ Participated in the Outer Sect Tournament, stopped at Top 50. Received +' + contribution + ' Sect Contribution.'
      }
    });
  }
  else if (choiceId === 'action_tournament_watch') {
    // ── Quan sát & cá cược ──
    const bettingEvent: EventDefinition = {
      id: 'tournament_betting',
      title: { vi: '👁️ Quan Sát & Cá Cược Đại Bỉ', en: '👁️ Watch & Bet Tournament'},
      description: {
        vi: 'Bạn ngồi trên khán đài quan sát các cao thủ tỷ thí. Linh khí trên lôi đài giao thoa mãnh liệt, từng thức chiêu đều chứa đựng cơ hội ngộ đạo. Bạn có muốn cá cược không?',
        en: 'You watch from the stands as masters compete. Spiritual energy clashes intensely on the arena – every technique holds enlightenment. Do you want to bet?'
      },
      minRealm: 'Mortal', weight: 0,
      choices: [
        { id: 'action_bet_tournament_20', text: { vi: '🎲 Đặt cược 20 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 20 Stones (50% x2, 50% lose)' }, effects: {} },
        { id: 'action_bet_tournament_50', text: { vi: '🎲 Đặt cược 50 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 50 Stones (50% x2, 50% lose)' }, effects: {} },
        { id: 'action_bet_tournament_none', text: { vi: '🧘 Không cá cược, chỉ quan sát (+3 Ngộ Tính)', en: '🧘 Just watch (+3 Comprehension)' }, effects: {} }
      ]
    };
    return { ...state, currentEvent: bettingEvent, isTicking: false };
  }
  else if (choiceId === 'action_bet_tournament_20' || choiceId === 'action_bet_tournament_50' || choiceId === 'action_bet_tournament_none') {
    // ── Cá cược / quan sát ──
    // Always gain +3 comprehension from watching
    newStats.comprehension += 3;

    if (choiceId === 'action_bet_tournament_none') {
      tempLogs.push({
        type: 'info',
        message: { vi: 'Tọa sơn quan hổ đấu: Tham ngộ chiêu thức của các cao thủ trên đài tỷ võ (+3 Ngộ Tính).', en: 'Observed the tournament masters\\\'s techniques without betting (+3 Comprehension).'}
      });
    } else {
      const betAmount = choiceId === 'action_bet_tournament_20' ? 20 : 50;
      if (newSpiritStones < betAmount) {
        // Not enough stones – just watch
        tempLogs.push({
          type: 'info',
          message: { vi: 'Không đủ Linh thạch để cá cược! Đành ngồi quan sát tích lũy kinh nghiệm (+3 Ngộ Tính).', en: 'Insufficient Stones to bet! Observed and gained experience instead (+3 Comprehension).'}
        });
      } else {
        newSpiritStones -= betAmount;
        const win = Math.random() < 0.5 + (newStats.luck * 0.01); // luck improves odds slightly
        if (win) {
          newSpiritStones += betAmount * 2;
          tempLogs.push({
            type: 'info',
            message: { vi: 'Cá cược ' + betAmount + ' Linh thạch: Thắng cược! Nhận lại +' + (betAmount * 2) + ' Linh thạch (lời ' + betAmount + '). Quan sát đài tỷ võ (+3 Ngộ Tính).', en: 'Bet ' + betAmount + ' Stones: Won! Received +' + (betAmount * 2) + ' Stones (profit ' + betAmount + '). Observed the arena (+3 Comprehension).'}
          });
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: 'Cá cược ' + betAmount + ' Linh thạch: Thua cược! Mất trắng ' + betAmount + ' Linh thạch. Quan sát đài tỷ võ (+3 Ngộ Tính).', en: 'Bet ' + betAmount + ' Stones: Lost! Lost ' + betAmount + ' Stones. Observed the arena (+3 Comprehension).'}
          });
        }
      }
    }
  }
  else if (choiceId === 'action_tournament_skip') {
    // ── Bỏ qua đại bỉ ──
    newSectContribution = Math.max(0, newSectContribution - 30);
    tempLogs.push({
      type: 'info',
      message: {
        vi: '⚠️ Bạn vắng mặt Ngoại Môn Đại Bỉ, Chấp Pháp Đường ghi nhận và trừ đi 30 Điểm cống hiến vì thiếu sự hiện diện.',
        en: '⚠️ You were absent from the Outer Sect Tournament. The Law Hall noted your absence and deducted 30 Contribution Points.'
      }
    });
  }
  else if (choiceId === 'action_bribe_accept') {
    // ── Nhận hối lộ từ Vương Tư Thông ──
    newSpiritStones += 500;
    newSectContribution += 50;
    newStats.daoHeart = Math.max(0, newStats.daoHeart - 10);
    tempLogs.push({
      type: 'info',
      message: {
        vi: 'Bạn nuốt tự trọng nhận túi linh thạch của Vương Tư Thông. Hắn cười khinh thường rồi đi. Bạn nhận +500 Linh thạch, +50 Cống hiến nhưng Đạo Tâm suy yếu -10.',
        en: 'Bạn nhận hối lộ từ Vương Tư Thông. Gained +500 Spirit Stones, +50 Contribution but Dao Heart weakened -10.'
      }
    });
  }
  else if (choiceId === 'action_bribe_refuse') {
    // ── Cự tuyệt → chiến đấu Long Ngạo Thiên ──
    const ngaoThienEvent: EventDefinition = {
      id: 'combat_encounter_ngao_thien',
      title: { vi: '⚔️ Trận Chung Kết: Long Ngạo Thiên!', en: '⚔️ Championship Final: Long Ngao Thien!'},
      description: {
        vi: 'Long Ngạo Thiên – Thiên Kiêu đương đại của ngoại môn, Luyện Khí tầng 12 viên mãn. Hắn đứng trên lôi đài áo trắng phất phơ, linh khí bạo động cuộn xoáy. "Ngươi dám đến? Tốt lắm. Ta sẽ không nương tay!"',
        en: 'Long Ngao Thien – the top genius of the outer sect, Qi Refinement Layer 12 Consummate. He stands on the arena in white robes, spiritual energy raging. "You dare come? Very well. I will show no mercy!"'
      },
      minRealm: 'Mortal', weight: 0,
      choices: [
        { id: 'start_combat_tournament_ngao_thien', text: { vi: '⚔️ Dốc toàn lực quyết chiến!', en: '⚔️ Fight with all your strength!'}, effects: {} }
      ]
    };
    return {
      ...state,
      stats: newStats,
      currentEvent: ngaoThienEvent,
      isTicking: false
    };
  }
  else if (choiceId === 'slap_young_master') {
    const cp = getPlayerStat(state, 'combatPower');
    if (cp >= 150) {
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Bạn vận dụng thực lực đánh bại thủ hạ của Vương Tư Thông! Vương Tư Thông biến sắc tháo chạy, đánh rơi 50 Linh thạch. Bạn giữ được Trúc Cơ Đan nhưng nhận oán hận khổng lồ.`,
          en: `You utilize your power to defeat Vuong Tu Thong's guards! Vuong Tu Thong flees in terror, dropping 50 Spirit Stones. You keep the Foundation Pill but earn his immense grudge.`
        }
      });
    } else {
      newStats.cultivation = state.stats.cultivation;
      newStats.health = Math.max(1, state.stats.health - 30);
      newStats.daoHeart = Math.max(0, state.stats.daoHeart - 5);
      newSpiritStones = (state.spiritStones ?? 0) + 10;
      
      const idx = currentInventory.findIndex(item => item.id === 'item_truc_co_dan');
      if (idx !== -1) {
        if (currentInventory[idx].quantity > 1) {
          currentInventory[idx] = { ...currentInventory[idx], quantity: currentInventory[idx].quantity - 1 };
        } else {
          currentInventory.splice(idx, 1);
        }
        npcLogEntries.push({
          type: 'info',
          age: state.age,
          message: {
            vi: `Thực lực không đủ! Bạn bị thủ hạ của Vương Tư Thông đánh trọng thương (-30 HP), cướp mất Trúc Cơ Đan, hắn ném lại 10 Linh thạch bố thí.`,
            en: `Insufficient power! You are heavily injured by Vuong Tu Thong's guards (-30 HP), who rob your Foundation Pill and throw 10 Spirit Stones as charity.`
          }
        });
      } else {
        npcLogEntries.push({
          type: 'info',
          age: state.age,
          message: {
            vi: `Thực lực không đủ! Bạn bị thủ hạ của Vương Tư Thông đánh trọng thương (-30 HP), hắn ném lại 10 Linh thạch sỉ nhục rồi rời đi.`,
            en: `Insufficient power! You are heavily injured by Vuong Tu Thong's guards (-30 HP), who throw 10 Spirit Stones as insult and leave.`
          }
        });
      }
    }
  }
  else if (choiceId === 'endure_humiliation') {
    const idx = currentInventory.findIndex(item => item.id === 'item_truc_co_dan');
    if (idx !== -1) {
      if (currentInventory[idx].quantity > 1) {
        currentInventory[idx] = { ...currentInventory[idx], quantity: currentInventory[idx].quantity - 1 };
      } else {
        currentInventory.splice(idx, 1);
      }
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Bạn cắn răng nuốt hận giao nộp Trúc Cơ Đan, Vương Tư Thông hất hàm nhận lấy rồi nghênh ngang rời đi.`,
          en: `You endure the anger and hand over the Foundation Pill. Vuong Tu Thong takes it arrogantly and leaves.`
        }
      });
    } else {
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: { vi: `Bạn cúi đầu nhận 10 Linh thạch sỉ nhục từ Vương Tư Thông để bảo toàn tính mạng.`, en: `You bow your head and accept 10 Spirit Stones as insult from Vuong Tu Thong to preserve your life.`}
      });
    }
  }
  else if (choiceId === 'steal_lotus') {
    const luck = getPlayerStat(state, 'luck');
    const comp = getPlayerStat(state, 'comprehension');
    if (luck >= 8 && comp >= 8) {
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: { vi: `Thành công! Bạn khéo léo lập trận pháp ẩn nấp hái đi Huyết Liên ngàn năm và rút lui an toàn trước khi Yêu Vương thức giấc.`, en: `Success! You skillfully set up a stealth array, harvest the thousand-year Blood Lotus, and escape safely before the Beast King wakes.`}
      });
    } else {
      newStats.luck = Math.max(0, state.stats.luck - 3);
      newStats.health = Math.max(1, state.stats.health - 20);
      choice.effects.gainItem = undefined;
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Thất bại! Huyết Mãng Yêu Vương đột nhiên tỉnh giấc cắn đứt một cánh tay của bạn (-20 HP, Vận may vĩnh viễn -3)! Bạn may mắn trốn thoát giữ được mạng.`,
          en: `Failure! The Blood Python Beast King suddenly wakes up and bites off your arm (-20 HP, Luck permanently -3)! You barely escape with your life.`
        }
      });
    }
  }
  else if (choiceId === 'bribe_deacon') {
    if ((state.spiritStones ?? 0) >= 50) {
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: { vi: `Bạn nộp 50 Linh thạch bôi trơn. Tên Chấp Sự cười híp mắt nhận tiền và giao cho bạn nhiệm vụ hái thuốc nhàn nhã.`, en: `You pay the 50 Spirit Stone greasing fee. The Deacon grins and assigns you a relaxed herb-gathering quest.`}
      });
    } else {
      newSpiritStones = state.spiritStones ?? 0;
      newStats.health = Math.max(1, state.stats.health - 15);
      newStats.cultivation = Math.min(getCultivationCap(state), state.stats.cultivation + 1);
      newStats.daoHeart = Math.min(100, state.stats.daoHeart + 5);
      
      const result = addItem(currentInventory, 'item_linh_quang_tho', 2, state.age);
      currentInventory = result.inventory;
      
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Bạn không đủ 50 Linh thạch hối lộ! Tên Chấp Sự bực dọc sai người áp giải bạn xuống hầm quặng sâu đầy hiểm họa (HP -15, Tu vi +1, Đạo tâm +5, nhận 2x Linh Quặng thô).`,
          en: `Insufficient Spirit Stones! The Deacon angrily orders you down to the deep mining pits (HP -15, Cultivation +1, Dao Heart +5, acquired 2x Raw Spirit Ore).`
        }
      });
    }
  }
  else if (choiceId === 'refuse_and_mine') {
    npcLogEntries.push({
      type: 'info',
      age: state.age,
      message: {
        vi: `Bạn khẳng khái từ chối hối lộ và đi thẳng xuống hầm quặng sâu làm việc lao lực (HP -15, Tu vi +1, Đạo tâm +5, nhận 2x Linh Quặng thô).`,
        en: `You proudly refuse the bribe and descend to the deep mines for exhausting work (HP -15, Cultivation +1, Dao Heart +5, acquired 2x Raw Spirit Ore).`
      }
    });
  }
  else if (choiceId === 'save_demonic_girl') {
    const idx = currentInventory.findIndex(item => item.id === 'item_hoi_huyet_dan');
    if (idx !== -1) {
      if (currentInventory[idx].quantity > 1) {
        currentInventory[idx] = { ...currentInventory[idx], quantity: currentInventory[idx].quantity - 1 };
      } else {
        currentInventory.splice(idx, 1);
      }
      
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: { vi: `Bạn cho nữ tử tà tu uống Hồi Huyết Đan trị thương và che giấu nàng khỏi đám chính đạo. Nàng trao cho bạn một Tàn quyển Ma công rồi rời đi.`, en: `You feed the demonic woman a Blood Elixir and hide her from the righteous cultivators. She hands you a Demonic Manual Fragment and departs.`}
      });
    } else {
      newStats.karma = state.stats.karma;
      newSpiritStones = (state.spiritStones ?? 0) + 100;
      choice.effects.gainFragment = undefined;
      
      nextWorldState = JSON.parse(JSON.stringify(nextWorldState));
      nextWorldState.sect.reputation += 2;
      
      nextNpcGrudges['npc_hong_nhan_ma_dao'] = (nextNpcGrudges['npc_hong_nhan_ma_dao'] || 0) + 100;
      nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_hong_nhan_ma_dao', -100);
      
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: {
          vi: `Bạn không có Hồi Huyết Đan để trị thương cho nàng! Không còn cách nào khác, bạn hô hoán tu sĩ chính đạo vây bắt nàng và nhận 100 Linh thạch tiền thưởng.`,
          en: `You do not have a Blood Elixir to heal her! Having no choice, you shout for righteous cultivators to capture her and receive 100 Spirit Stones.`
        }
      });
    }
  }
  else if (choiceId === 'buy_bloody_pill') {
    if ((state.spiritStones ?? 0) >= 150) {
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: { vi: `Bạn trả 150 Linh thạch mua viên Trúc Cơ Đan Hạ Phẩm chứa đầy đan độc tanh nồng. Tên thương nhân cười gian ngoắt tay ra hiệu giao dịch hoàn tất.`, en: `You pay 150 Spirit Stones to buy the low-grade Foundation Pill full of bloody poison. The merchant grins and winks as the trade completes.`}
      });
    } else {
      newStats.karma = state.stats.karma;
      newSpiritStones = state.spiritStones ?? 0;
      choice.effects.gainItem = undefined;
      npcLogEntries.push({
        type: 'info',
        age: state.age,
        message: { vi: `Bạn không đủ 150 Linh thạch! Tên thương nhân chợ đen liếc xéo khinh bỉ rồi thu hồi đan dược không thèm nói chuyện tiếp.`, en: `Insufficient Spirit Stones! The black market merchant glares at you with contempt, retrieves the pill, and refuses to trade.`}
      });
    }
  }
  else if (choiceId === 'rob_the_merchant') {
    npcLogEntries.push({
      type: 'info',
      age: state.age,
      message: { vi: `Bạn rút kiếm uy hiếp thương nhân và cướp lấy Trúc Cơ Đan Hạ Phẩm. Trong lúc giao chiến dữ dội bạn bị thương (-12 HP) và bị chợ đen truy nã.`, en: `You draw your sword to threaten the merchant and rob the low-grade Foundation Pill. During the fierce brawl, you get injured (-12 HP) and blacklisted.`}
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_lend') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', 20);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Tạ Tiêu cười híp mắt nhận 10 Linh thạch: "Đạo hữu sảng khoái! Hảo huynh đệ!" (Hảo cảm Tạ Tiêu +20, Tạ Trần +6).`,
        en: `Tạ Tiêu smiles accepting 10 Stones: "Great! My good brother!" (Tạ Tiêu favor +20, Tạ Trần favor +6).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_refuse') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', -30);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Tạ Tiêu mặt đen lại tức giận: "Được lắm! Ngươi hãy đợi đấy!" (Hảo cảm Tạ Tiêu -30, Tạ Trần -18).`,
        en: `Tạ Tiêu glares at you: "Fine! Just you wait!" (Tạ Tiêu favor -30, Tạ Trần favor -18).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_demand_debt') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', -50);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn đòi nợ cũ làm Tạ Tiêu xấu hổ tức giận đỏ mặt bỏ đi oán hận (Hảo cảm Tạ Tiêu -50, Tạ Trần -30).`,
        en: `You demand old debt. He storms off with absolute hatred (Tạ Tiêu favor -50, Tạ Trần favor -30).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_save') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', -40);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn ra tay đẩy lùi Tạ Tiêu cứu đồng môn. Đồng môn mang ơn sâu sắc, Tạ Tiêu bỏ chạy thề sẽ báo thù (Hảo cảm Tạ Tiêu -40, Tạ Trần -24).`,
        en: `You step in to save the disciple. Tạ Tiêu retreats vowing revenge (Tạ Tiêu favor -40, Tạ Trần favor -24).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_help_bully') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', 20);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn cùng Tạ Tiêu cướp linh thạch đệ tử mới. Tạ Tiêu khoái chí chia cho bạn 5 Linh thạch (Hảo cảm Tạ Tiêu +20, Tạ Trần +6).`,
        en: `You assist Tạ Tiêu in extortion. Tạ Tiêu shares 5 Stones with you (Tạ Tiêu favor +20, Tạ Trần favor +6).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_drink') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', 10);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn uống rượu vui vẻ cùng Tạ Tiêu, nghe hắn khoe khoang gia thế (Hảo cảm Tạ Tiêu +10, Tạ Trần +3).`,
        en: `You drink with Tạ Tiêu, listening to his bragging (Tạ Tiêu favor +10, Tạ Trần favor +3).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_decline_friendly') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', -5);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn từ chối rượu để tu luyện làm Tạ Tiêu mất hứng chép miệng bỏ đi (Hảo cảm Tạ Tiêu -5, Tạ Trần -2).`,
        en: `You decline the invitation to cultivate, ruining his mood (Tạ Tiêu favor -5, Tạ Trần favor -2).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tieu_bribe') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_ta_tieu', 15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn đưa 20 Linh thạch cầu hòa. Tạ Tiêu nhận tiền khinh khỉnh: "Biết điều đấy!" rồi bỏ đi (Hảo cảm Tạ Tiêu +15, Tạ Trần +5).`,
        en: `You offer 20 Stones. Tạ Tiêu takes it arrogantly: "Smart!" (Tạ Tiêu favor +15, Tạ Trần favor +5).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tran_accept_punish') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_chap_su', 5);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn chịu phạt lao dịch nặng quét dọn Tẩy Kiếm Trì. Chấp sự Tạ Trần gật đầu hài lòng (Hảo cảm Tạ Trần +5).`, en: `You clean the Sword Pool. Chấp sự Tạ Trần nods in satisfaction (Tạ Trần favor +5).`}
    });
  }
  else if (choiceId === 'action_npc_ta_tran_protest') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_chap_su', -15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn lớn tiếng phản kháng lệnh phạt vô lý, chấp sự Tạ Trần biến sắc tức giận (Hảo cảm Tạ Trần -15).`,
        en: `You loudly protest, Chấp sự Tạ Trần is enraged (Tạ Trần favor -15).`
      }
    });
  }
  else if (choiceId === 'action_npc_ta_tran_gift') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_chap_su', 15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn dâng 15 Linh thạch trà nước. Chấp sự Tạ Trần cười hớn hở: "Đồng môn tốt!" (Hảo cảm Tạ Trần +15).`, en: `You offer 15 Stones. Chấp sự Tạ Trần is pleased (Tạ Trần favor +15).`}
    });
  }
  else if (choiceId === 'action_npc_ta_tran_talk') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_kiem_tong_chap_su', 2);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn đàm đạo lễ phép với chấp sự. Tạ Trần gật đầu hài lòng (Hảo cảm Tạ Trần +2).`, en: `You converse politely with the Chấp sự (Tạ Trần favor +2).`}
    });
  }
  else if (choiceId === 'action_npc_linh_duong_eat') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_dan_tong_chap_su', 10);
    const bonusComp = Math.random() < 0.3;
    if (bonusComp) {
      newStats.comprehension += 1;
    }
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn nuốt viên độc đan chịu đau đớn dữ dội (-15 HP). Linh Dương gật gù ghi lại kết quả (Hảo cảm Linh Dương +10)${bonusComp ? ' • Cơ duyên giúp Ngộ tính +1!' : ''}.`, en: `You swallow the poisonous pill suffering severe pain (-15 HP). Linh Dương is satisfied (Linh Dương favor +10)${bonusComp ? ' • Comprehension +1!' : ''}.`
      }
    });
  }
  else if (choiceId === 'action_npc_linh_duong_refuse') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_dan_tong_chap_su', -15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn cự tuyệt làm vật thí nghiệm thuốc. Linh Dương tức giận bỏ đi (Hảo cảm Linh Dương -15).`, en: `You refuse to test the pill. Linh Dương is angry (Linh Dương favor -15).`}
    });
  }
  else if (choiceId === 'action_npc_khau_vo_ky_surrender') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_ma_dao_chap_su', 15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn ngoan ngoãn dâng nộp 30 Linh thạch cầu hòa. Khấu Vô Kỵ cười dâm dật: "Khặc khặc, thức thời lắm!" (Hảo cảm +15).`,
        en: `You pay 30 Stones. Khấu Vô Kỵ is pleased (Khấu Vô Kỵ favor +15).`
      }
    });
  }
  else if (choiceId === 'action_npc_khau_vo_ky_raid') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_ma_dao_chap_su', 20);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn cùng Khấu Vô Kỵ đi cướp đoạt (+40 Linh thạch, Hảo cảm +20, Nghiệp lực -5).`,
        en: `You join Khấu Vô Kỵ to raid (+40 Stones, Khấu Vô Kỵ favor +20, Karma -5).`
      }
    });
  }
  else if (choiceId === 'action_npc_khau_vo_ky_decline') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_ma_dao_chap_su', -5);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn từ chối đi cướp. Khấu Vô Kỵ chép miệng khinh bỉ: "Đồ nhát gan!" (Hảo cảm -5).`, en: `You refuse the raid. Khấu Vô Kỵ is disappointed (Khấu Vô Kỵ favor -5).`}
    });
  }
  else if (choiceId === 'action_npc_khau_vo_ky_pay') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_ma_dao_chap_su', 15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn nộp 10 Linh thạch phí bảo kê. Khấu Vô Kỵ hài lòng hứa hẹn bảo hộ (Hảo cảm +15).`, en: `You pay 10 Stones protection fee. Khấu Vô Kỵ is pleased (Khấu Vô Kỵ favor +15).`}
    });
  }
  else if (choiceId === 'action_npc_khau_vo_ky_defy') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_ma_dao_chap_su', -20);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: {
        vi: `Bạn cự tuyệt nộp bảo kê, Khấu Vô Kỵ nổi giận đánh bạn chấn thương nhẹ (-5 HP, Hảo cảm -20).`,
        en: `You refuse to pay, Khấu Vô Kỵ beats you up (-5 HP) (Khấu Vô Kỵ favor -20).`
      }
    });
  }
  else if (choiceId === 'action_npc_xich_liet_give_blood') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_huyet_tong_chap_su', 15);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn tự trích tinh huyết dâng nộp (-25 HP). Xích Liệt cười lớn hài lòng (Hảo cảm Xích Liệt +15).`, en: `You sacrifice blood (-25 HP). Xích Liệt is satisfied (Xích Liệt favor +15).`}
    });
  }
  else if (choiceId === 'action_npc_xich_liet_rebel') {
    nextNpcFavorability = changeNpcFavorability(nextNpcFavorability, 'npc_huyet_tong_chap_su', -25);
    npcLogEntries.push({
      type: 'info', age: state.age,
      message: { vi: `Bạn cự tuyệt hiến tế máu và bỏ chạy thoát thân (Hảo cảm Xích Liệt -25).`, en: `You refuse blood feast and escape (Xích Liệt favor -25).`}
    });
  }
  
  // Using variables declared earlier
  
  if (choice.effects.gainFragment) {
    const fragmentResult = addFragment(
      currentTechniques,
      choice.effects.gainFragment.techniqueId,
      choice.effects.gainFragment.amount,
      state.age,
      language
    );
    currentTechniques = fragmentResult.techniques;
    tempLogs = [...tempLogs, ...fragmentResult.logs];
  }

  if (choice.effects.gainItem) {
    const itemResult = addItem(
      currentInventory,
      choice.effects.gainItem.itemId,
      choice.effects.gainItem.quantity,
      state.age
    );
    currentInventory = itemResult.inventory;
    tempLogs = [...tempLogs, ...itemResult.logs];
  }

  // Kiểm tra đột phá Cảnh giới (Realm) để tăng Thọ Nguyên (Lifespan)
  const oldRealm = state.realm;
  const determinedRealm = determineRealm(newStats.cultivation, state.realm);
  newRealm = determinedRealm;
  if (oldRealm !== newRealm) {
    if (newRealm === 'Qi Refinement') {
      newStats.lifespan += 40; // Đột phá Luyện Khí tăng 40 năm thọ nguyên
    } else if (newRealm === 'Foundation Establishment') {
      newStats.lifespan += 80; // Đột phá Trúc Cơ tăng 80 năm thọ nguyên
    } else if (newRealm === 'Golden Core') {
      newStats.lifespan += 200; // Đột phá Kim Đan tăng 200 năm thọ nguyên
    } else if (newRealm === 'Nascent Soul') {
      newStats.lifespan += 500; // Đột phá Nguyên Anh tăng 500 năm thọ nguyên
    }
  }

  // Tự động kích hoạt công pháp truyền thừa kiếp trước nếu đủ điều kiện
  const checkResult = checkAndActivateTechniques(currentTechniques, newStats, state.age, newRealm, language);
  currentTechniques = checkResult.techniques;
  tempLogs = [...tempLogs, ...checkResult.activatedLogs];

  // Using variables declared earlier
  if (newSectContribution >= 5000 && (newRealm === 'Golden Core' || newRealm === 'Nascent Soul') && newRank === 'chân_truyền') {
    newRank = 'trưởng_lão';
  } else if (newSectContribution >= 1000 && newRank === 'nội_môn') {
    newRank = 'chân_truyền';
  } else if (newSectContribution >= 200 && newRank === 'ngoại_môn') {
    newRank = 'nội_môn';
  }

  const rankLogEntries: LogEntry[] = [];
  if (newRank !== (state.sectRank ?? 'ngoại_môn')) {
    const rankNames = {
      'ngoại_môn': { vi: 'Đệ Tử Ngoại Môn', en: 'Outer Disciple'},
      'nội_môn': { vi: 'Đệ Tử Nội Môn', en: 'Inner Disciple'},
      'chân_truyền': { vi: 'Đệ Tử Chân Truyền', en: 'Core Disciple'},
      'trưởng_lão': { vi: 'Trưởng Lão Tông Môn', en: 'Sect Elder'}
    };
    rankLogEntries.push({
      type: 'info',
      age: state.age,
      message: { vi: `Chúc mừng! Bạn đã thăng cấp thân phận tông môn thành [${rankNames[newRank].vi}]!`, en: `Congratulations! Your sect rank has been promoted to [${rankNames[newRank].en}]!`
      }
    });
  }

  // Đổi điều kiện sống sót (alive) dựa trên chỉ số lifespan của nhân vật
  const alive = newStats.health > 0 && newStats.karma > -11;

  const eventMessage: LocalizedText = renderLocalizedTemplate(defaultMessages.choiceSummary, {
    choice: choice.text,
    age: state.age});

  const choiceLogEntry: LogEntry = {
    type: 'choice',
    age: state.age,
    eventTitle: state.currentEvent.title,
    choiceText: choice.text,
    message: renderLocalizedTemplate(defaultMessages.choiceProgress, {
      age: state.age,
      event: state.currentEvent.title,
      choice: choice.text})};

  const newLog = [...state.log, choiceLogEntry, ...tempLogs, ...npcLogEntries];
  const updatedHistory = [
    ...(state.history ?? []),
    { event: state.currentEvent, selectedChoiceId: choiceId },
  ];

  if (!alive) {
    const deathText = translateDeathReason({ stats: newStats, age: state.age });
    const deadState: GameState = {
      ...state,
      alive: false,
      stats: newStats,
      realm: newRealm,
      subStageIndex: nextSubStageIndex,
      currentEvent: null,
      lastMessage: deathText,
      log: [
        ...newLog,
        ...rankLogEntries,
        {
          type: 'death',
          age: state.age,
          message: renderLocalizedTemplate(defaultMessages.deathAtAge, { age: state.age })},
      ],
      deathCause: deathText,
      history: updatedHistory,
      techniques: currentTechniques,
      inventory: currentInventory,
      sectContribution: newSectContribution,
      sectPrestige: newSectPrestige,
      spiritStones: newSpiritStones,
      sectRank: newRank,
      npcFavorability: nextNpcFavorability,
      worldState: nextWorldState,
      inheritance: { ...(state.inheritance || {}), npc_grudges: nextNpcGrudges } as any};
    return deadState;
  }

  let nextEvent: EventDefinition;
  if (state.currentEvent.id === 'birth_and_recruitment') {
    const activeConfig = combatConfig as any;
    const timeGear = activeConfig.time_gear || {};
    const startingStones = timeGear.starting_spirit_stones ?? 10;
    
    nextEvent = {
      id: 'sect_entry_welfare',
      title: { vi: 'Bái Kiến Sơn Môn & Nhập Môn Phúc Lợi', en: 'Mountain Gate Greeting & Welcoming Welfare'},
      description: {
        vi: `Sơn môn sừng sững hiện ra giữa ngàn khơi vân ảnh. Phù hợp với tôn phong của ${state.sect}, một hành trình nghịch thiên mới bắt đầu.\n\nNhập môn Đệ tử Ngoại môn, Chấp pháp Chấp sự đã chuẩn bị sẵn phúc lợi cho bạn bao gồm: ${startingStones} hạ phẩm linh thạch (tinh chỉnh tại Thần Điện) và 1 quyển tâm pháp luyện khí sơ cấp tương ứng với Linh Căn của bản thể.`,
        en: `The grand gates rise high into the swirling clouds. In accordance with the way of ${state.sect}, a new path opens before you.\n\nOfficially joining as an Outer Disciple, you receive your entry welfare: ${startingStones} low-grade spirit stones and 1 basic qi refinement manual matching your spiritual root.`
      },
      minRealm: 'Mortal',
      
      weight: 1,
      choices: [
        {
          id: 'claim_welfare_and_continue',
          text: { vi: 'Tiếp tục hành trình ➔', en: 'Continue Journey ➔'},
          effects: {}
        }
      ]
    };
  } else if (choice.effects && choice.effects.nextEvent) {
    const allEvents = getLocalizedEvents(language);
    const targetEvent = allEvents.find((e: EventDefinition) => e.id === choice.effects!.nextEvent);
    if (targetEvent) {
      nextEvent = targetEvent;
    } else {
      nextEvent = getMenuEvent('menu_monthly_plan', { ...state, stats: newStats, realm: newRealm, npcFavorability: nextNpcFavorability }, language);
    }
  } else {
    nextEvent = getMenuEvent('menu_monthly_plan', { ...state, stats: newStats, realm: newRealm, npcFavorability: nextNpcFavorability }, language);
  }

  return {
    ...state,
    stats: newStats,
    realm: newRealm,
    subStageIndex: nextSubStageIndex,
    currentEvent: nextEvent,
    lastMessage: eventMessage,
    log: [...newLog, ...rankLogEntries],
    history: updatedHistory,
    techniques: currentTechniques,
    inventory: currentInventory,
    isTicking: false,
    monthlyLog: [],
    sectContribution: newSectContribution,
    sectPrestige: newSectPrestige,
    spiritStones: newSpiritStones,
    sectRank: newRank,
    npcFavorability: nextNpcFavorability,
      worldState: nextWorldState,
      inheritance: { ...(state.inheritance || {}), npc_grudges: nextNpcGrudges } as any};
};

export const generateBreakthroughEvent = (state: GameState, stats: Stats, activeConfig: any, language: Lang): EventDefinition | null => {
  const cs = activeConfig?.cultivation_system;
  const bottlenecks = getBottlenecks(state, activeConfig);
  
  const matching = bottlenecks.find((b: any) => 
    state.realm === b.realm_from && 
    stats.cultivation >= b.threshold - 0.005
  );
  if (!matching) return null;

  let baseChance = 0;
  if (matching.realm_to === 'Foundation Establishment') baseChance = 8;
  else if (matching.realm_to === 'Golden Core') baseChance = 4;
  else if (matching.realm_to === 'Nascent Soul') baseChance = 1;
  else {
    baseChance = (matching.success_rate_no_pill ?? 0.5) * 100;
  }

  const compMod = stats.comprehension * 0.4;
  const luckMod = stats.luck * 0.3;
  const daoMod = stats.daoHeart * 0.3;
  const karmaMod = stats.karma * 0.2;
  const totalChance = Math.max(1, baseChance + compMod + luckMod + daoMod + karmaMod);
  const thanh = (totalChance / 10).toFixed(1);

  const pillNameVi = matching.label === 'Trúc Cơ' ? 'Trúc Cơ Đan' : matching.label === 'Kim Đan' ? 'Kim Đan Đan' : 'Nguyên Anh Đan';
  const pillNameEn = matching.label === 'Trúc Cơ' ? 'Foundation Pill' : matching.label === 'Kim Đan' ? 'Golden Core Pill' : 'Nascent Soul Pill';

  const choices = [
    {
      id: 'action_breakthrough_natural',
      text: { vi: '🔥 Quyết định đột phá (Tự nhiên)', en: '🔥 Decide to Breakthrough (Natural)'},
      effects: {}
    }
  ];

  if (matching.pill_item_id) {
    const hasPill = (state.inventory || []).some(i => i.id === matching.pill_item_id && i.quantity > 0);
    choices.push(hasPill ? {
      id: 'action_breakthrough_pill',
      text: { vi: `💊 Sử dụng đan dược (${pillNameVi})`, en: `💊 Use Pill (${pillNameEn})` },
      effects: {}
    } : {
      id: 'action_breakthrough_pill_disabled',
      text: { vi: `💊 Chưa có ${pillNameVi} (Đột phá thất bại nếu ép dùng)`, en: `💊 Need ${pillNameEn} (Not owned)` },
      effects: {}
    });
  }

  choices.push({
    id: 'action_breakthrough_wait',
    text: { vi: '🧘 Nghỉ ngơi chờ thời cơ tốt hơn', en: '🧘 Rest and wait for a better chance'},
    effects: {}
  });

  return {
    id: 'event_breakthrough_' + matching.threshold,
    title: { vi: `Đột Phá Bình Cảnh: ${matching.label}`, en: `Breakthrough Bottleneck: ${matching.label}` },
    description: {
      vi: `Bạn đã tu luyện đến đỉnh phong, chạm đến bình cảnh ${matching.label}. Khí hải trong cơ thể cuồn cuộn không ngừng, đây là lúc quyết định đột phá hay chờ đợi cơ hội tốt hơn.\n\nPhân tích tỉ lệ thành công tự nhiên: **${thanh} thành** (${totalChance.toFixed(1)}%).\n*(Ngộ tính, Vận may, Đạo tâm và Nghiệp lực ảnh hưởng trực tiếp đến tỉ lệ này)*.`,
      en: `You have reached the peak of your realm, touching the ${matching.label} bottleneck. Your spiritual sea is boiling, it's time to decide whether to breakthrough or wait.\n\nEstimated natural success rate: **${thanh} out of 10** (${totalChance.toFixed(1)}%).\n*(Comprehension, Luck, Dao Heart, and Karma directly affect this rate)*.`
    },
    minRealm: 'Mortal', weight: 1,
    choices
  };
};

// Hàm xử lý đột phá tự nhiên dùng chung
const attemptNaturalBreakthrough = (
  stats: Stats, 
  age: number, 
  log: LogEntry[], 
  activeConfig: any, 
  isQuest: boolean,
  currentRealm: Realm = 'Mortal'
): { success: boolean, lastMessage?: LocalizedText } => {
  const cs = activeConfig?.cultivation_system;
  const bottlenecks = getBottlenecks({ realm: currentRealm } as any, activeConfig);
  
  const matching = bottlenecks.find((b: any) => 
    currentRealm === b.realm_from && 
    stats.cultivation >= b.threshold - 0.005
  );
  if (matching) {
    let baseChance = 0;
    if (matching.realm_to === 'Foundation Establishment') baseChance = 8;
    else if (matching.realm_to === 'Golden Core') baseChance = 4;
    else if (matching.realm_to === 'Nascent Soul') baseChance = 1;
    else {
      baseChance = (matching.success_rate_no_pill ?? 0.5) * 100;
    }

    const compMod = stats.comprehension * 0.4;
    const luckMod = stats.luck * 0.3;
    const daoMod = stats.daoHeart * 0.3;
    const karmaMod = stats.karma * 0.2;
    const totalChance = Math.max(1, baseChance + compMod + luckMod + daoMod + karmaMod);
    const roll = Math.random() * 100;

    if (roll <= totalChance) {
      stats.cultivation = matching.next_cult ?? (matching.threshold + 0.01);
      const newRealm = matching.realm_to || determineRealm(stats.cultivation, currentRealm);
      if (newRealm === 'Foundation Establishment') stats.lifespan += 80;
      else if (newRealm === 'Golden Core') stats.lifespan += 200;
      else if (newRealm === 'Nascent Soul') stats.lifespan += 500;

      const successLog: LogEntry = {
        type: 'info',
        age: age,
        message: {
          vi: `✨ Đạo pháp tự nhiên! Trong lúc tĩnh tu bạn ngộ ra chân lý, đột phá bình cảnh [${matching.label}] mà không cần đan dược!`,
          en: `✨ Natural Dao! During meditation you grasped the truth, naturally breaking the [${matching.label}] bottleneck without pills!`
        }
      };
      log.push(successLog);
      return { success: true, lastMessage: successLog.message };
    } else {
      if (isQuest) {
        const failLog: LogEntry = {
          type: 'info',
          age: age,
          message: {
            vi: `Bạn cảm nhận được bình cảnh [${matching.label}], nhưng chưa đủ cơ duyên để tự nhiên đột phá. (Tỷ lệ: ${totalChance.toFixed(1)}%)`,
            en: `You sense the [${matching.label}] bottleneck, but lack the karma to naturally break through. (Chance: ${totalChance.toFixed(1)}%)`
          }
        };
        log.push(failLog);
      }
    }
  }
  return { success: false };
};

const getMenuLocation = (menuId: string): 'sect' | 'mountain' | 'city' | 'secret_realm' | null => {
  if (menuId === 'menu_lich_luyen_nui_rung') return 'mountain';
  if (menuId === 'menu_lich_luyen_thanh_thi') return 'city';
  if (menuId === 'menu_lich_luyen_di_xa') return 'city';
  
  if (
    menuId === 'menu_monthly_plan' ||
    menuId === 'menu_tinh_tu' ||
    menuId === 'menu_be_quan' ||
    menuId === 'menu_dot_tai_nguyen' ||
    menuId === 'menu_nghien_cuu_cong_phap' ||
    menuId === 'menu_nhan_nhiem_vu' ||
    menuId === 'menu_hoat_dong_tong_mon' ||
    menuId === 'menu_quan_he_xa_hoi' ||
    menuId === 'menu_kiem_tai_nguyen' ||
    menuId === 'menu_lich_luyen'
  ) {
    return 'sect';
  }
  return null;
};

export const applyChoiceToState = (state: GameState, choiceId: string, language: Lang): GameState => {
  const nextState = applyChoiceToStateInternal(state, choiceId, language);
  if (nextState.currentEvent) {
    const loc = getMenuLocation(nextState.currentEvent.id);
    if (loc) {
      return {
        ...nextState,
        currentLocation: loc
      };
    }
  }
  return nextState;
};

// reincarnate (Luân hồi chuyển kiếp - Kế thừa điểm di sản tích lũy sang kiếp mới)
export const reincarnate = (
  state: GameState,
  language: Lang,
  customParams?: {
    gender: 'nam' | 'nữ';
    spiritualRoot: string;
    sect: string;
    ambition?: 'truong_sinh' | 'ba_chu' | 'dan_dao' | 'kiem_tien' | 'phu_quoc' | 'ma_dao';
  }
): GameState => {
  const nextInheritance = calculateInheritance(state); // Tính toán di sản thừa kế cho kiếp tiếp theo
  
  const activeConfig = combatConfig as any;
  const startingAge = activeConfig.time_gear?.starting_age ?? 11;
  
  const gender = customParams?.gender ?? 'nam';
  const spiritualRoot = customParams?.spiritualRoot ?? 'Kim Linh Căn';
  const sect = customParams?.sect ?? 'Kiếm Tông';
  const ambitions = ['truong_sinh', 'ba_chu', 'dan_dao', 'kiem_tien', 'phu_quoc', 'ma_dao'] as const;
  const ambition = customParams?.ambition ?? state.ambition ?? ambitions[Math.floor(Math.random() * ambitions.length)];
  
  const stats = baseStats(nextInheritance, spiritualRoot, sect);
  
  const startingStoryId = Math.floor(Math.random() * 5) + 1;
  const currentEvent = buildStartingEvent(gender, spiritualRoot, sect, startingAge, startingStoryId);

  let techniques = initTechniquesFromInheritance(nextInheritance);
  const checkResult = checkAndActivateTechniques(techniques, stats, startingAge, determineRealm(stats.cultivation, 'Mortal'), language);
  techniques = checkResult.techniques;

  const inventory = initItemsFromInheritance(nextInheritance);

  return {
    run: state.run + 1,
    life: state.life + 1,
    age: startingAge,
    alive: true,
    realm: determineRealm(stats.cultivation, 'Mortal'),
    subStageIndex: determineRealm(stats.cultivation, 'Mortal') === 'Qi Refinement' ? 1 : 0,
    stats,
    inheritance: nextInheritance,
    log: [
      ...state.log,
      {
        type: 'reincarnation',
        message: defaultMessages.reincarnation},
      ...checkResult.activatedLogs
    ],
    currentEvent,
    lastMessage: defaultMessages.reincarnation,
    history: [],
    techniques,
    inventory,
    month: 1,
    isTicking: false,
    monthlyLog: [],
    gender,
    sect,
    startingStoryId,
    sectContribution: 0,
    sectPrestige: 0,
    spiritStones: Math.max(0, Math.floor(nextInheritance.blessing * 2)),
    sectRank: 'ngoại_môn',
    activeQuest: null,
    ambition,
    menuStack: [],
    questsCompletedThisYear: 0,
    npcFavorability: {
      npc_kiem_tong_chap_su: 0,
      npc_kiem_tong_ta_tieu: 0,
      npc_dan_tong_chap_su: 0,
      npc_ma_dao_chap_su: 0,
      npc_huyet_tong_chap_su: 0},
    currentLocation: 'sect'};
};

export const monthlyNarrativesVi = [
  "Bạn tĩnh tọa điều tức trong động phủ, linh khí xung quanh dao động nhẹ.",
  "Tiết trời thay đổi, đạo tâm cầu trường sinh của bạn vẫn kiên định.",
  "Bạn vận chuyển đại chu thiên, rèn luyện kinh mạch chân khí.",
  "Một tháng trôi qua trong suy ngẫm tĩnh lặng, ý chí tu tiên thêm vững chắc.",
  "Không có kỳ ngộ nào xảy ra. Bạn tiếp tục chu kỳ tiểu chu thiên.",
  "Bạn mở mắt ngắm trăng ngoài hang động, cảm nhận thiên địa linh khí.",
  "Linh lực lượn lờ quanh đan điền, đan hải của bạn dần dần ngưng tụ.",
  "Bạn dành cả tháng đọc lại sách cổ về tu chân, ngộ ra một số quy tắc.",
  "Một tháng lặng lẽ trôi qua, thân thể khỏe mạnh thanh thản.",
  "Bạn tĩnh tọa nghe tiếng gió thổi qua mây ngàn, lòng không gợn sóng."
];

export const monthlyNarrativesEn = [
  "You focused your breathing in your cave, feeling the natural flow of spiritual energy.",
  "The seasons change, but your determination to reach immortality remains unyielding.",
  "You practiced your breathing exercises, refining your meridians.",
  "A quiet month passes in deep meditation, your Dao Heart grows calmer.",
  "No events occurred. You continued your internal circulation cycle.",
  "You opened your eyes to watch the moon, feeling the cosmic aura.",
  "Spiritual energy lingers in your dantian, slowly consolidating.",
  "You spent the month reading ancient texts, understanding some worldly principles.",
  "A quiet month passes, your physical body feels healthy and calm.",
  "You meditated listening to the wind sweeping through clouds, mind untroubled."
];

export const getPlayerStat = (state: GameState, stat: 'combatPower' | 'luck' | 'comprehension' | 'daoHeart' | 'health' | 'speed'): number => {
  if (stat === 'health') return state.stats.health;
  if (stat === 'luck') return state.stats.luck;
  if (stat === 'comprehension') return state.stats.comprehension;
  if (stat === 'daoHeart') return state.stats.daoHeart;

  const equipSpdBonus = (state.inventory || [])
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.speed ?? 0), 0);
    
  const techSpdBonus = (state.techniques || [])
    .filter(tech => tech.isActive && tech.type === 'thân_pháp')
    .reduce((sum, tech) => {
      const configTech = combatConfig.techniques?.find((t: any) => t.id === tech.id);
      return sum + (configTech?.passive_bonus?.speed ?? 0);
    }, 0);

  const speed = (state.stats.speed || 10) + Math.floor(state.stats.luck * 0.2) + equipSpdBonus + techSpdBonus;
  if (stat === 'speed') return speed;
  
  if (stat === 'combatPower') {
    const subStageInfo = getRealmSubStage(state.stats.cultivation);
    
    // Calculate inventory equipment bonuses
    const inventory = state.inventory || [];
    const equipHpBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.maxHp ?? 0), 0);
    const maxHp = 20 + Math.max(0, Math.floor(state.inheritance.blessing / 2)) + subStageInfo.bonus.max_hp + equipHpBonus;

    const equipQiBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.maxQi ?? 0), 0);
    const maxQi = 60 + subStageInfo.bonus.max_qi + equipQiBonus;

    const equipAtkBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.attack ?? 0), 0);
    const attack = 15 + Math.floor(state.stats.cultivation * 0.4) + subStageInfo.bonus.attack + equipAtkBonus;



    const equipDefBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.defense ?? 0), 0);
    const qiControl = 10 + Math.floor(state.stats.daoHeart * 0.15) + equipDefBonus;

    return calculateCombatPower(
      maxHp,
      attack,
      speed,
      qiControl,
      state.stats.comprehension,
      maxQi,
      subStageInfo.subStageIndex
    );
  }
  
  return 0;
};

export const buildQuestCompleteEvent = (quest: SectQuest, language: Lang, isParty: boolean): EventDefinition => {
  const title = language === 'vi' ? `Hoàn Thành: ${quest.title.vi}` : `Completed: ${quest.title.en}`;
  
  // Halve contribution and gold if isParty is true
  const contributionReward = isParty ? Math.max(1, Math.floor(quest.rewards.contribution * 0.5)) : quest.rewards.contribution;
  const goldReward = quest.rewards.gold ? (isParty ? Math.max(1, Math.floor(quest.rewards.gold * 0.5)) : quest.rewards.gold) : 0;
  
  const desc = language === 'vi' 
    ? `Chúc mừng! Bạn đã hoàn thành xuất sắc nhiệm vụ "${quest.title.vi}" (${isParty ? 'Tổ Đội' : 'Độc Hành'}).\n\nPhần thưởng nhận được:\n- Cống hiến Tông môn: +${contributionReward}\n- Linh thạch: +${goldReward}\n${quest.rewards.health ? `- Sinh lực: +${quest.rewards.health}\n` : ''}${quest.rewards.comprehension ? `- Ngộ tính: +${quest.rewards.comprehension}\n` : ''}${quest.rewards.cultivation ? `- Tu vi: +${Math.floor(quest.rewards.cultivation)}\n` : ''}${quest.rewards.daoHeart ? `- Đạo tâm: +${quest.rewards.daoHeart}\n` : ''}${quest.rewards.item ? `- Vật phẩm: Nhận được [${quest.rewards.item.itemId}]\n` : ''}`
    : `Congratulations! You have successfully completed the quest "${quest.title.en}" (${isParty ? 'Party' : 'Solo'}).\n\nRewards claimed:\n- Sect Contribution: +${contributionReward}\n- Spirit Stones: +${goldReward}\n${quest.rewards.health ? `- Health: +${quest.rewards.health}\n` : ''}${quest.rewards.comprehension ? `- Comprehension: +${quest.rewards.comprehension}\n` : ''}${quest.rewards.cultivation ? `- Cultivation: +${Math.floor(quest.rewards.cultivation)}\n` : ''}${quest.rewards.daoHeart ? `- Dao Heart: +${quest.rewards.daoHeart}\n` : ''}${quest.rewards.item ? `- Item: Acquired [${quest.rewards.item.itemId}]\n` : ''}`;

  const fillEffects: GameEffect = {
    sectContribution: contributionReward,
    spiritStones: goldReward,
    health: quest.rewards.health,
    comprehension: quest.rewards.comprehension,
    cultivation: quest.rewards.cultivation,
    daoHeart: quest.rewards.daoHeart};

  if (quest.rewards.item && quest.id !== 'quest_cleanup') {
    fillEffects.gainItem = {
      itemId: quest.rewards.item.itemId,
      quantity: quest.rewards.item.quantity};
  }

  // Apply macro updates and custom rewards for the 7 new quests
  if (quest.id === 'quest_cleanup') {
    const isBloodCrystal = Math.random() < 0.5;
    fillEffects.gainItem = {
      itemId: isBloodCrystal ? 'item_huyet_tinh' : 'item_oan_hon_chau',
      quantity: 1
    };
    fillEffects.worldState = { global: { demonicEnergy: -8 } };
  } else if (quest.id === 'quest_mine_ore' || quest.id === 'quest_harvest_herbs' || quest.id === 'quest_beast_care') {
    fillEffects.worldState = { sect: { resources: 5 } };
  } else if (quest.id === 'quest_patrol') {
    fillEffects.worldState = { demonic: { infiltration: -8 } };
  } else if (quest.id === 'quest_logistics') {
    fillEffects.worldState = { sect: { resources: 10, reputation: 4, stability: 4 } };
  } else if (quest.id === 'quest_diplomacy') {
    fillEffects.worldState = { sect: { reputation: 8 }, city: { morale: -6 } };
  }

  const effects = fillEffects;

  return {
    id: `quest_complete_${quest.id}`,
    title: { vi: title, en: title},
    description: { vi: desc, en: desc},
    minRealm: 'Mortal',
    weight: 1,
    choices: [
      {
        id: `claim_rewards_${quest.id}`,
        text: { vi: "Nhận Phần Thưởng", en: "Claim Rewards"},
        effects
      }
    ]
  };
};

export const buildQuestFailedEvent = (quest: SectQuest, language: Lang, isParty: boolean): EventDefinition => {
  const title = language === 'vi' ? `Thất Bại: ${quest.title.vi}` : `Failed: ${quest.title.en}`;
  
  // Calculate damage
  let hpDamage = 0;
  if (!isParty) {
    // Solo damage depending on quest difficulty
    const diff = quest.difficulty.toLowerCase();
    if (diff === 'thiên') hpDamage = 20;
    else if (diff === 'địa') hpDamage = 15;
    else if (diff === 'huyền') hpDamage = 10;
    else hpDamage = 5;
  }

  const desc = language === 'vi'
    ? `Nhiệm vụ thất bại! Bạn không đủ thực lực để hoàn thành "${quest.title.vi}".\n\n${isParty ? 'May mắn nhờ đi theo tổ đội nên đồng môn đã hỗ trợ giải cứu bạn an toàn, không bị tổn hại kinh mạch.' : `Do độc hành phiêu bạt, bạn bị chấn thương nặng tổn thất -${hpDamage} Khí huyết!`}`
    : `Quest failed! You were not strong enough to complete "${quest.title.en}".\n\n${isParty ? 'Fortunately, since you were in a party, your companions supported and rescued you safely, suffering no damage.' : `Because you traveled solo, you were heavily injured and lost -${hpDamage} HP!`}`;

  const effects: GameEffect = {
    health: -hpDamage
  };

  return {
    id: `quest_failed_${quest.id}`,
    title: { vi: title, en: title},
    description: { vi: desc, en: desc},
    minRealm: 'Mortal',
    weight: 1,
    choices: [
      {
        id: `confirm_fail_${quest.id}`,
        text: { vi: "Xác Nhận", en: "Confirm"},
        effects
      }
    ]
  };
};

export const generateNpcEvent = (state: GameState, language: Lang): EventDefinition | null => {
  if (!state.sect) return null;
  const favor = state.npcFavorability || {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0};

  const sect = state.sect;

  if (sect === 'Kiếm Tông') {
    const rollNpc = Math.random() < 0.5;
    if (rollNpc) {
      const tatieuFavor = favor['npc_kiem_tong_ta_tieu'] ?? 0;
      
      if (tatieuFavor <= -30) {
        return {
          id: 'event_npc_ta_tieu_revenge',
          title: { vi: '☠️ Tạ Tiêu Báo Thù', en: '☠️ Tạ Tiêu\'s Revenge'},
          description: {
            vi: `Tạ Tiêu mang vẻ mặt oán hận chặn đường bạn cùng hai tên đệ tử ngoại môn khác. Hắn cười lạnh: "Lần trước dám làm ta bẽ mặt, hôm nay ta phải phế đi tu vi của ngươi!" Cả ba rút kiếm lao vào oanh kích.`,
            en: `Tạ Tiêu blocks your path with two other outer disciples. He sneers: "You humiliated me last time, today I will ruin your cultivation!" They draw swords.`
          },
          minRealm: 'Mortal', weight: 1,
          choices: [
            {
              id: 'start_combat_npc_ta_tieu',
              text: { vi: '⚔️ Rút kiếm quyết đấu', en: '⚔️ Draw sword and fight'},
              effects: {}
            },
            {
              id: 'action_npc_ta_tieu_bribe',
              text: { vi: '💸 Chi ra 20 Linh thạch để cầu hòa', en: '💸 Spend 20 Spirit Stones to make peace'},
              effects: { spiritStones: -20 }
            }
          ]
        };
      } else if (tatieuFavor >= 30) {
        return {
          id: 'event_npc_ta_tieu_friendly',
          title: { vi: '🍶 Tạ Tiêu Chiêu Đãi', en: '🍶 Tạ Tiêu\'s Invitation'},
          description: {
            vi: `Tạ Tiêu hồ hởi chạy đến vỗ vai bạn: "Đạo hữu! Hôm nay ta vừa kiếm được bình Bách Hoa Tửu cực ngon, lại đây đàm đạo uống rượu cùng ta!"`,
            en: `Tạ Tiêu runs up and pats your shoulder: "Daoist brother! I just got a flask of fine Hundred Flowers Wine, come drink and talk with me!"`
          },
          minRealm: 'Mortal', weight: 1,
          choices: [
            {
              id: 'action_npc_ta_tieu_drink',
              text: { vi: '🍶 Vui vẻ uống rượu cạn ly', en: '🍶 Gladly drink with him'},
              effects: { luck: 2, daoHeart: -1 }
            },
            {
              id: 'action_npc_ta_tieu_decline_friendly',
              text: { vi: '🧘 Từ chối khéo để lo tu luyện', en: '🧘 Politely decline to meditate'},
              effects: { cultivation: 0.5 }
            }
          ]
        };
      } else {
        const rollSub = Math.random() < 0.5;
        if (rollSub) {
          return {
            id: 'event_npc_ta_tieu_borrow',
            title: { vi: '💰 Tạ Tiêu Mượn Linh Thạch', en: '💰 Tạ Tiêu Borrows Stones'},
            description: {
              vi: `Tạ Tiêu chặn đường bạn, bộ dáng ngả ngớn nói: "Đạo hữu, gần đây ta túng thiếu quá, cho ta mượn tạm 10 Linh thạch tiêu xài, vài ngày nữa ta trả!" (Ai cũng biết hắn mượn không bao giờ trả).`,
              en: `Tạ Tiêu blocks you, saying casually: "Daoist brother, I am short on cash, lend me 10 Spirit Stones for fun, I will return it soon!" (Everyone knows he never returns money).`
            },
            minRealm: 'Mortal', weight: 1,
            choices: [
              {
                id: 'action_npc_ta_tieu_lend',
                text: { vi: '💸 Ngậm ngùi cho mượn 10 Linh thạch', en: '💸 Reluctantly lend 10 Stones'},
                effects: { spiritStones: -10 }
              },
              {
                id: 'action_npc_ta_tieu_refuse',
                text: { vi: '❌ Từ chối thẳng thừng và răn đe', en: '❌ Flatly refuse and warn him'},
                effects: {}
              },
              {
                id: 'action_npc_ta_tieu_demand_debt',
                text: { vi: '👊 Đòi lại món nợ cũ, dạy dỗ hắn', en: '👊 Demand old debt, teach him a lesson' },
                effects: {}
              }
            ]
          };
        } else {
          return {
            id: 'event_npc_ta_tieu_bully',
            title: { vi: '👿 Tạ Tiêu Ỷ Thế Hiếp Người', en: '👿 Tạ Tiêu Bullying Disciples'},
            description: { vi: `Bạn bắt gặp Tạ Tiêu đang bắt một tên đệ tử ngoại môn mới nhập môn phải quỳ xuống nộp linh thạch phí bảo kê. Tên đệ tử tội nghiệp đang khóc lóc cầu xin.`, en: `You catch Tạ Tiêu forcing a newly entered outer disciple to kneel and hand over spirit stones as protection fee. The poor disciple is crying.`},
            minRealm: 'Mortal', weight: 1,
            choices: [
              {
                id: 'action_npc_ta_tieu_save',
                text: { vi: '🛡️ Can thiệp bảo vệ đồng môn, dạy dỗ Tạ Tiêu', en: '🛡️ Intervene to protect fellow disciple, teach Tạ Tiêu' },
                effects: { daoHeart: 3, sectPrestige: 10 }
              },
              {
                id: 'action_npc_ta_tieu_help_bully',
                text: { vi: '🤝 Tiếp tay cùng Tạ Tiêu cướp đoạt', en: '🤝 Join Tạ Tiêu to extort'},
                effects: { spiritStones: 5, karma: -3, daoHeart: -3 }
              },
              {
                id: 'action_npc_ta_tieu_ignore',
                text: { vi: '🚶 Coi như không thấy, đi đường vòng', en: '🚶 Ignore and walk away' },
                effects: {}
              }
            ]
          };
        }
      }
    } else {
      const tatranFavor = favor['npc_kiem_tong_chap_su'] ?? 0;
      
      if (tatranFavor <= -30) {
        return {
          id: 'event_npc_ta_tran_punish',
          title: { vi: '⚖️ Chấp Sự Tạ Trần Gây Khó Dễ', en: '⚖️ Chấp Sự Tạ Trần\'s Punishment'},
          description: {
            vi: `Chấp sự Tạ Trần nhìn bạn bằng ánh mắt lạnh lùng: "Đệ tử ngoại môn phải siêng năng, ngươi tu luyện chểnh mảng, đi quét dọn Tẩy Kiếm Trì 3 tháng cho ta!"`,
            en: `Chấp sự Tạ Trần looks at you coldly: "Outer disciples must work hard, you are lazy, clean the Sword Washing Pool for 3 months!"`
          },
          minRealm: 'Mortal', weight: 1,
          choices: [
            {
              id: 'action_npc_ta_tran_accept_punish',
              text: { vi: '🧹 Chấp nhận chịu phạt lao dịch nặng', en: '🧹 Accept hard chore punishment'},
              effects: { health: -10 }
            },
            {
              id: 'action_npc_ta_tran_protest',
              text: { vi: '🗣️ Kháng nghị vô lý, bất tuân mệnh lệnh', en: '🗣️ Protest unfair treatment, disobey' },
              effects: { sectPrestige: -10 }
            }
          ]
        };
      } else if (tatranFavor >= 30) {
        return {
          id: 'event_npc_ta_tran_reward',
          title: { vi: '🎁 Chấp Sự Tạ Trần Chỉ Điểm', en: '🎁 Chấp Sự Tạ Trần\'s Guidance'},
          description: {
            vi: `Chấp sự Tạ Trần vẻ mặt nhu hòa, gọi bạn lại: "Ngươi gần đây có tiến bộ, kiếm ý vững vàng. Quyển kiếm quyết tàn thiên này ta vô tình có được, ban cho ngươi tham ngộ."`,
            en: `Chấp sự Tạ Trần looks pleased: "You have shown progress, sword intent is firm. I found this fragment of sword manual, I bestow it upon you."`
          },
          minRealm: 'Mortal', weight: 1,
          choices: [
            {
              id: 'action_npc_ta_tran_receive_manual',
              text: { vi: '🙇 Cúi đầu cảm tạ, nhận Kiếm Quyết tàn thiên', en: '🙇 Bow and accept manual fragment' },
              effects: { comprehension: 2 }
            }
          ]
        };
      } else {
        return {
          id: 'event_npc_ta_tran_normal',
          title: { vi: '🤝 Chấp Sự Tạ Trần Gặp Gỡ', en: '🤝 Chấp Sự Tạ Trần\'s Enquiry'},
          description: {
            vi: `Chấp sự Tạ Trần đi tuần ngang qua động phủ của bạn, dừng chân hỏi thăm: "Tiến độ tu luyện gần đây thế nào? Môn phái chuẩn bị kiểm tra đệ tử ngoại môn đấy."`,
            en: `Chấp sự Tạ Trần patrols past your cave, asking: "How is your cultivation progressing? The sect exam for outer disciples is coming."`
          },
          minRealm: 'Mortal', weight: 1,
          choices: [
            {
              id: 'action_npc_ta_tran_gift',
              text: { vi: '🎁 Biếu Chấp sự 15 Linh thạch trà nước', en: '🎁 Offer 15 Spirit Stones as tea money'},
              effects: { spiritStones: -15 }
            },
            {
              id: 'action_npc_ta_tran_talk',
              text: { vi: '💬 Báo cáo trung thực, đàm đạo lễ phép', en: '💬 Honestly report and converse politely' },
              effects: { comprehension: 1 }
            }
          ]
        };
      }
    }
  }

  else if (sect === 'Đan Tông') {
    const linhduongFavor = favor['npc_dan_tong_chap_su'] ?? 0;
    if (linhduongFavor <= -30) {
      return {
        id: 'event_npc_linh_duong_test',
        title: { vi: '☠️ Linh Dương Thử Thuốc', en: '☠️ Linh Dương\'s Elixir Test'},
        description: {
          vi: `Chấp sự Linh Dương đưa cho bạn một viên đan dược đen xì, tỏa ra mùi hăng hắc: "Ta đang luyện chế độc môn đan dược, ngươi đi thử thuốc cho ta!"`,
          en: `Chấp sự Linh Dương hands you a dark, pungent pill: "I am refining a custom pill, test it for me!"`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_linh_duong_eat',
            text: { vi: '🤢 Cắn răng nuốt thử dược', en: '🤢 Swallow the experimental pill'},
            effects: { health: -15 }
          },
          {
            id: 'action_npc_linh_duong_refuse',
            text: { vi: '❌ Cự tuyệt làm vật thí nghiệm', en: '❌ Refuse to be a lab rat'},
            effects: {}
          }
        ]
      };
    } else if (linhduongFavor >= 30) {
      return {
        id: 'event_npc_linh_duong_reward',
        title: { vi: '🧪 Linh Dương Tặng Đan', en: '🧪 Linh Dương\'s Elixir Gift'},
        description: {
          vi: `Chấp sự Linh Dương vẻ mặt vui cười, đưa cho bạn một lọ thuốc ngọc bích: "Đạo hữu, viên đan dược này ta luyện chế dư ra, tặng cho ngươi ôn dưỡng kinh mạch."`,
          en: `Chấp sự Linh Dương smiles, handing you a jade bottle: "Daoist brother, I refined this extra pill, take it to soothe your meridians."`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_linh_duong_receive',
            text: { vi: '🙇 Nhận đan dược (Nhận 1x Huyền Nguyên Đan)', en: '🙇 Accept pill (Gain 1x Huyền Nguyên Đan)'},
            effects: {}
          }
        ]
      };
    } else {
      return {
        id: 'event_npc_linh_duong_normal',
        title: { vi: '🌿 Linh Dương Thu Mua Dược Liệu', en: '🌿 Linh Dương Seeks Herbs'},
        description: {
          vi: `Chấp sự Linh Dương đang cần gấp một số Linh Thảo để luyện đan, hỏi xem bạn có bán lại cho lão không.`,
          en: `Chấp sự Linh Dương urgently needs some Spirit Herbs for alchemy, asking if you can sell them to him.`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_linh_duong_sell_herbs',
            text: { vi: '🌿 Nộp 2 Linh Thảo đổi lấy 10 Linh thạch', en: '🌿 Hand over 2 Spirit Herbs for 10 Stones'},
            effects: { spiritStones: 10 }
          },
          {
            id: 'action_npc_linh_duong_donate_herbs',
            text: { vi: '🎁 Biếu không Linh dược cống hiến', en: '🎁 Gift him the herbs for free'},
            effects: { sectContribution: 10 }
          },
          {
            id: 'action_npc_linh_duong_ignore',
            text: { vi: '💬 Lắc đầu từ chối vì không có sẵn', en: '💬 Politely decline'},
            effects: {}
          }
        ]
      };
    }
  }

  else if (sect === 'Ma Đạo') {
    const khauvokyFavor = favor['npc_ma_dao_chap_su'] ?? 0;
    if (khauvokyFavor <= -30) {
      return {
        id: 'event_npc_khau_vo_ky_ambush',
        title: { vi: '🔮 Khấu Vô Kỵ Âm Mưu Ám Hại', en: '🔮 Khấu Vô Kỵ\'s Plot'},
        description: {
          vi: `Chấp sự Khấu Vô Kỵ mặt sạm đen chặn đường bạn tại ngách núi hoang vắng. Lão cười khặc khặc âm hiểm: "Ngươi đắc tội với bản chấp sự, hôm nay lấy hồn của ngươi luyện cờ!"`,
          en: `Chấp sự Khấu Vô Kỵ blocks you in a deserted canyon. He cackles: "You offended me, today I will take your soul to refine my banner!"`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'start_combat_npc_khau_vo_ky',
            text: { vi: '⚔️ Quyết chiến sinh tử cùng Ma đầu', en: '⚔️ Fight to the death with the Demon'},
            effects: {}
          },
          {
            id: 'action_npc_khau_vo_ky_surrender',
            text: { vi: '🙇 Quỳ xuống nộp hết 30 Linh thạch cầu tha mạng', en: '🙇 Kneel and hand over 30 Stones for mercy'},
            effects: { spiritStones: -30 }
          }
        ]
      };
    } else if (khauvokyFavor >= 30) {
      return {
        id: 'event_npc_khau_vo_ky_friendly',
        title: { vi: '🔮 Khấu Vô Kỵ Chỉ Điểm Cướp Đoạt', en: '🔮 Khấu Vô Kỵ\'s Raid Offer'},
        description: {
          vi: `Chấp sự Khấu Vô Kỵ cười lớn vỗ vai bạn: "Hắc hắc, ta vừa nghe nói đệ tử Đan Tông vận chuyển một lô dược liệu đi ngang phụ cận. Ngươi có gan cùng ta đi cướp một chuyến không?"`,
          en: `Chấp sự Khấu Vô Kỵ laughs and pats you: "Heh, I heard a Dan sect disciple carrying pill materials is passing by. Dare to raid them with me?"`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_khau_vo_ky_raid',
            text: { vi: '🩸 Đi cướp đoạt (Linh thạch +40, Hảo cảm +20, Nghiệp lực -5)', en: '🩸 Join the raid (Stones +40, Favor +20, Karma -5)' },
            effects: { spiritStones: 40, karma: -5 }
          },
          {
            id: 'action_npc_khau_vo_ky_decline',
            text: { vi: '❌ Từ chối vì không muốn gây thêm thù oán', en: '❌ Decline the offer'},
            effects: { daoHeart: 2 }
          }
        ]
      };
    } else {
      return {
        id: 'event_npc_khau_vo_ky_normal',
        title: { vi: '💸 Khấu Vô Kỵ Thu Phí Bảo Kê', en: '💸 Khấu Vô Kỵ\'s Extortion'},
        description: {
          vi: `Chấp sự Khấu Vô Kỵ chìa bàn tay xương xẩu ra trước mặt bạn: "Tuần này thu phí bảo kê ngoại môn, nộp 10 Linh thạch ra đây, nếu không đừng trách ta không che chở ngươi."`,
          en: `Chấp sự Khấu Vô Kỵ stretches out his bony hand: "Weekly outer sect fee, hand over 10 Stones, or don't blame me for not protecting you."`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_khau_vo_ky_pay',
            text: { vi: '💸 Nộp tiền yên ổn (Tốn 10 Linh thạch)', en: '💸 Pay the fee (Spend 10 Stones)'},
            effects: { spiritStones: -10 }
          },
          {
            id: 'action_npc_khau_vo_ky_defy',
            text: { vi: '👊 Kiên quyết từ chối nộp tiền vô lý', en: '👊 Firmly refuse to pay'},
            effects: { health: -5 }
          }
        ]
      };
    }
  }

  else if (sect === 'Huyết Tông') {
    const xichlietFavor = favor['npc_xich_liet'] ?? favor['npc_huyet_tong_chap_su'] ?? 0;
    if (xichlietFavor <= -30) {
      return {
        id: 'event_npc_xich_liet_drain',
        title: { vi: '🩸 Xích Liệt Ép Buộc Tế Huyết', en: '🩸 Xích Liệt\'s Blood Feast'},
        description: {
          vi: `Chấp sự Xích Liệt toàn thân mùi huyết tinh rống lên: "Lò luyện huyết hải của ta đang thiếu huyết khí, ngươi tự nộp ra tinh huyết nhục thân tế luyện cho ta!"`,
          en: `Chấp sự Xích Liệt, smelling of fresh blood, roars: "My blood sea furnace lacks energy, hand over your vital blood to refine!"`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_xich_liet_give_blood',
            text: { vi: '🩸 Chấp nhận hiến tinh huyết (Tổn hại kinh mạch: -25 HP)', en: '🩸 Accept blood sacrifice (HP -25)'},
            effects: { health: -25 }
          },
          {
            id: 'action_npc_xich_liet_rebel',
            text: { vi: '❌ Cự tuyệt và trốn chạy khỏi lò luyện', en: '❌ Refuse and escape'},
            effects: { spiritStones: -10 }
          }
        ]
      };
    } else if (xichlietFavor >= 30) {
      return {
        id: 'event_npc_xich_liet_reward',
        title: { vi: '🩸 Xích Liệt Ban Huyết Đan', en: '🩸 Xích Liệt\'s Blood Elixir'},
        description: {
          vi: `Chấp sự Xích Liệt ném cho bạn viên đan dược đỏ lòm như máu: "Tốt lắm, đệ tử đắc lực của ta. Viên Huyết Phách Đan này rèn luyện nhục thân rất tốt, cầm lấy tu luyện!"`,
          en: `Chấp sự Xích Liệt tosses you a bloody red pill: "Very well, my disciple. This Blood Soul Pill is great for the physical body, take it!"`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_xich_liet_eat_pill',
            text: { vi: '🤤 Nuốt viên Huyết Đan (Hồi phục +30 HP, Tăng tu vi +2.0)', en: '🤤 Swallow the Blood Pill (Heal +30 HP, Cultivation +2.0)' },
            effects: { health: 30, cultivation: 2.0 }
          }
        ]
      };
    } else {
      return {
        id: 'event_npc_xich_liet_normal',
        title: { vi: '🦴 Xích Liệt Thu Thập Yêu Cốt', en: '🦴 Xích Liệt Demands Bones'},
        description: {
          vi: `Chấp sự Xích Liệt đang rèn đúc Huyết Sát Ma khí, yêu cầu bạn nộp cho hắn Linh Thú Thần Cốt hoặc Linh Quặng thô để chế luyện.`,
          en: `Chấp sự Xích Liệt is forging blood weapons, demanding you to bring him Beast Bones or Ore.`
        },
        minRealm: 'Mortal', weight: 1,
        choices: [
          {
            id: 'action_npc_xich_liet_give_bone',
            text: { vi: '🦴 Nộp 1 mảnh Thần Cốt', en: '🦴 Hand over 1 Beast Bone'},
            effects: { sectContribution: 25 }
          },
          {
            id: 'action_npc_xich_liet_ignore',
            text: { vi: '💬 Nói rằng chưa đi săn nên không có', en: '💬 Say you do not have any'},
            effects: {}
          }
        ]
      };
    }
  }

  return null;
};




export const changeLocation = (
  state: GameState,
  newLocation: 'sect' | 'mountain' | 'city' | 'secret_realm',
  language: Lang,
  customConfig?: any
): GameState => {
  if (!state.alive) return state;

  const activeConfig = customConfig || combatConfig;
  const timeGear = activeConfig?.time_gear || {};
  const costHp = timeGear.travel_cost_hp ?? 2;
  const costStones = timeGear.travel_cost_stones ?? 10;

  const nextStats = {
    ...state.stats,
    health: Math.max(1, state.stats.health - costHp)
  };
  const nextSpiritStones = Math.max(0, (state.spiritStones ?? 0) - costStones);

  const locLabels: Record<string, LocalizedText> = {
    sect: { vi: 'Tông Môn', en: 'Sect', zh: '宗门' },
    city: { vi: 'Thanh Dương Thành', en: 'Thanh Duong City', zh: '青阳城' },
    mountain: { vi: 'Vạn Thú Sơn Mạch', en: 'Beast Mountain Range', zh: '万兽山脉' },
    secret_realm: { vi: 'Bí Cảnh Cổ Đại', en: 'Ancient Secret Realm', zh: '古代秘境' }
  };

  const oldLocLabel = locLabels[state.currentLocation || 'sect']?.[language] || 'Tông Môn';
  const newLocLabel = locLabels[newLocation]?.[language] || 'Tông Môn';

  const travelLog: LogEntry = {
    type: 'info',
    age: state.age,
    message: {
      vi: `🚗 Bạn di chuyển từ ${oldLocLabel} đến ${newLocLabel} (Tốn ${costHp} HP, ${costStones} Linh thạch).`,
      en: `🚗 You traveled from ${oldLocLabel} to ${newLocLabel} (Cost: ${costHp} HP, ${costStones} Spirit Stones).`
    }
  };

  const intermediateState: GameState = {
    ...state,
    currentLocation: newLocation,
    stats: nextStats,
    spiritStones: nextSpiritStones,
    log: [...state.log, travelLog]
  };

  return tickMonth(intermediateState, language, customConfig);
};

export const getItemPrice = (item: ItemInstance, worldState?: WorldState, isBuying: boolean = true): number => {
  const basePrice = item.basePrice || 10;
  let priceIndex = worldState?.city?.priceIndex || 100;
  
  // Các vật phẩm tà đạo, tạp đan thường có giá rẻ mạt nếu bán cho tiệm thường, 
  // nhưng nếu ở chợ đen thì giá sẽ khác. Hiện tại ta nhân với priceIndex.
  let finalPrice = (basePrice * priceIndex) / 100;

  if (item.category === 'material') {
    // Dược liệu bị ảnh hưởng bởi beastActivity (thú dữ phong tỏa núi)
    if (worldState && worldState.mountain && worldState.mountain.beastActivity > 70) {
      finalPrice *= 1.5;
    }
  }

  // Khi người chơi mua, giá cao hơn. Khi bán, giá thấp hơn.
  if (isBuying) {
    return Math.max(1, Math.floor(finalPrice));
  } else {
    return Math.max(1, Math.floor(finalPrice * 0.5)); // Bán lại chỉ được 50% giá
  }
};
