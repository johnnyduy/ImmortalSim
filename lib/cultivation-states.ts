import combatConfig from '../data/combat-config.json';
import type { Realm } from '../types';

export interface CultivationStatus {
  hpLabel: string;
  hpText: string;
  defLabel: string;
  defText: string;
  qiLabel: string;
  qiText: string;
}

export interface RealmSubStage {
  majorRealm: Realm;
  subStageIndex: number; // 0 to 24
  subStageName: { en: string; vi: string };
  bonus: { hp: number; max_hp: number; qi: number; max_qi: number; attack: number };
}

export function normalizeRealmKey(realm: string): string {
  const r = realm.toLowerCase();
  if (r.includes('golden') || r.includes('đan')) return 'golden_core';
  if (r.includes('foundation') || r.includes('cơ')) return 'foundation';
  if (r.includes('nascent') || r.includes('anh')) return 'nascent_soul';
  return 'qi'; // Default Luyện Khí/Phàm Nhân
}

export function getRealmSubStage(cultivation: number, realm?: Realm, subStageIndex?: number): RealmSubStage {
  // Fallback to guess the realm if not provided
  if (!realm) {
    if (subStageIndex !== undefined) {
      if (subStageIndex >= 17) realm = 'Nascent Soul';
      else if (subStageIndex >= 13) realm = 'Golden Core';
      else if (subStageIndex >= 10) realm = 'Foundation Establishment';
      else if (subStageIndex >= 1) realm = 'Qi Refinement';
      else realm = 'Mortal';
    } else {
      if (cultivation >= 90) realm = 'Nascent Soul';
      else if (cultivation >= 50) realm = 'Golden Core';
      else if (cultivation >= 30) realm = 'Foundation Establishment';
      else if (cultivation >= 10) realm = 'Qi Refinement';
      else realm = 'Mortal';
    }
  }

  if (realm === 'Mortal') {
    return {
      majorRealm: 'Mortal',
      subStageIndex: 0,
      subStageName: { en: 'Mortal', vi: 'Phàm Nhân' },
      bonus: { hp: 0, max_hp: 0, qi: 0, max_qi: 0, attack: 0 }
    };
  } else if (realm === 'Qi Refinement') {
    let layer = 1;
    if (subStageIndex !== undefined && subStageIndex >= 1 && subStageIndex <= 9) {
      layer = subStageIndex;
    } else {
      const mult = (combatConfig as any).cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
      for (let l = 9; l >= 1; l--) {
        if (cultivation >= 10 * Math.pow(mult, l - 1) - 0.005) {
          layer = l;
          break;
        }
      }
    }
    const labelVi = layer === 9 ? 'Luyện Khí Tầng 9 (Viên Mãn)' : `Luyện Khí Tầng ${layer}`;
    const labelEn = layer === 9 ? 'Qi Refinement Layer 9 (Consummate)' : `Qi Refinement Layer ${layer}`;
    return {
      majorRealm: 'Qi Refinement',
      subStageIndex: layer,
      subStageName: { en: labelEn, vi: labelVi },
      bonus: {
        hp: Math.round(layer * 2.7),
        max_hp: Math.round(layer * 2.7),
        qi: Math.round(layer * 2.7),
        max_qi: Math.round(layer * 2.7),
        attack: Math.round(layer * 0.67 * 10) / 10
      }
    };
  } else if (realm === 'Foundation Establishment') {
    let subIdx = 0;
    if (subStageIndex !== undefined && subStageIndex >= 10 && subStageIndex <= 12) {
      subIdx = subStageIndex - 10;
    } else {
      if (cultivation >= 13.0) subIdx = 2;
      else if (cultivation >= 6.0) subIdx = 1;
    }
    
    let nameVi = 'Trúc Cơ Sơ Kỳ';
    let nameEn = 'Foundation Establishment Early';
    let statBonus = { hp: 35, max_hp: 35, qi: 30, max_qi: 30, attack: 8.0 };
    
    if (subIdx === 2) {
      nameVi = 'Trúc Cơ Hậu Kỳ';
      nameEn = 'Foundation Establishment Late';
      statBonus = { hp: 65, max_hp: 65, qi: 60, max_qi: 60, attack: 15.5 };
    } else if (subIdx === 1) {
      nameVi = 'Trúc Cơ Trung Kỳ';
      nameEn = 'Foundation Establishment Middle';
      statBonus = { hp: 50, max_hp: 50, qi: 45, max_qi: 45, attack: 11.5 };
    }
    
    return {
      majorRealm: 'Foundation Establishment',
      subStageIndex: 10 + subIdx, // indices 10 to 12
      subStageName: { en: nameEn, vi: nameVi },
      bonus: statBonus
    };
  } else if (realm === 'Golden Core') {
    let subIdx = 0;
    if (subStageIndex !== undefined && subStageIndex >= 13 && subStageIndex <= 16) {
      subIdx = subStageIndex - 13;
    } else {
      if (cultivation >= 30.0) subIdx = 3;
      else if (cultivation >= 20.0) subIdx = 2;
      else if (cultivation >= 10.0) subIdx = 1;
    }
    let nameVi = 'Kim Đan Sơ Kỳ';
    let nameEn = 'Golden Core Early';
    let statBonus = { hp: 80, max_hp: 80, qi: 70, max_qi: 70, attack: 18.0 };
    
    if (subIdx === 3) {
      nameVi = 'Kim Đan Viên Mãn';
      nameEn = 'Golden Core Consummate';
      statBonus = { hp: 125, max_hp: 125, qi: 115, max_qi: 115, attack: 28.5 };
    } else if (subIdx === 2) {
      nameVi = 'Kim Đan Hậu Kỳ';
      nameEn = 'Golden Core Late';
      statBonus = { hp: 110, max_hp: 110, qi: 100, max_qi: 100, attack: 25.0 };
    } else if (subIdx === 1) {
      nameVi = 'Kim Đan Trung Kỳ';
      nameEn = 'Golden Core Middle';
      statBonus = { hp: 95, max_hp: 95, qi: 85, max_qi: 85, attack: 21.5 };
    }
    
    return {
      majorRealm: 'Golden Core',
      subStageIndex: 13 + subIdx, // indices 13 to 16
      subStageName: { en: nameEn, vi: nameVi },
      bonus: statBonus
    };
  } else {
    let subIdx = 0;
    if (subStageIndex !== undefined && subStageIndex >= 17 && subStageIndex <= 20) {
      subIdx = subStageIndex - 17;
    } else {
      if (cultivation >= 45.0) subIdx = 3;
      else if (cultivation >= 30.0) subIdx = 2;
      else if (cultivation >= 15.0) subIdx = 1;
    }
    let nameVi = 'Nguyên Anh Sơ Kỳ';
    let nameEn = 'Nascent Soul Early';
    let statBonus = { hp: 150, max_hp: 150, qi: 140, max_qi: 140, attack: 35.0 };
    
    if (subIdx === 3) {
      nameVi = 'Nguyên Anh Viên Mãn';
      nameEn = 'Nascent Soul Consummate';
      statBonus = { hp: 250, max_hp: 250, qi: 240, max_qi: 240, attack: 58.0 };
    } else if (subIdx === 2) {
      nameVi = 'Nguyên Anh Hậu Kỳ';
      nameEn = 'Nascent Soul Late';
      statBonus = { hp: 210, max_hp: 210, qi: 200, max_qi: 200, attack: 49.0 };
    } else if (subIdx === 1) {
      nameVi = 'Nguyên Anh Trung Kỳ';
      nameEn = 'Nascent Soul Middle';
      statBonus = { hp: 180, max_hp: 180, qi: 170, max_qi: 170, attack: 42.0 };
    }
    
    return {
      majorRealm: 'Nascent Soul',
      subStageIndex: 17 + subIdx, // indices 17 to 20
      subStageName: { en: nameEn, vi: nameVi },
      bonus: statBonus
    };
  }
}

export function calculateCombatPower(
  maxHp: number,
  attack: number,
  speed: number,
  qiControl: number,
  comprehension: number,
  maxQi: number,
  subStageIndex: number
): number {
  return Math.round(
    maxHp * 0.5 +
    attack * 3.0 +
    speed * 2.0 +
    qiControl * 1.5 +
    comprehension * 1.0 +
    maxQi * 0.3 +
    subStageIndex * 25
  );
}

export function getCultivationStatus(
  hp: number,
  maxHp: number,
  qi: number,
  maxQi: number,
  defense: number,
  maxDefense: number,
  realmName: string
): CultivationStatus {
  const realmKey = normalizeRealmKey(realmName);
  const realmsData = (combatConfig.cultivation_states?.realms || {}) as any;
  const realmConfig = realmsData[realmKey] || realmsData['qi'];

  const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const qiPercent = maxQi > 0 ? (qi / maxQi) * 100 : 0;
  const defPercent = maxDefense > 0 ? (defense / maxDefense) * 100 : 0;

  // 1. Resolve HP / Vitality Narrative
  let hpText = '';
  const tiers = realmConfig.hp_tiers || [];
  for (const tier of tiers) {
    if (hpPercent >= tier.min && hpPercent <= tier.max) {
      hpText = tier.text;
      break;
    }
  }
  if (!hpText && tiers.length > 0) {
    hpText = tiers[tiers.length - 1].text; // Fallback to lowest
  }

  // 2. Resolve Defense Narrative
  let defText = '';
  const defLabel = realmConfig.def_label;
  if (defPercent >= 80) {
    defText = `${defLabel} kiên cố`;
  } else if (defPercent >= 40) {
    defText = `${defLabel} suy giảm`;
  } else if (defPercent >= 10) {
    defText = `${defLabel} lung lay`;
  } else {
    defText = `${defLabel} phá vỡ`;
  }

  // 3. Resolve Qi Narrative
  let qiText = '';
  const qiLabel = realmConfig.qi_label;
  if (qiPercent >= 75) {
    qiText = `${qiLabel} sung mãn`;
  } else if (qiPercent >= 40) {
    qiText = `${qiLabel} dao động`;
  } else if (qiPercent >= 15) {
    qiText = `${qiLabel} cạn kiệt`;
  } else {
    qiText = `${qiLabel} cạn khô`;
  }

  return {
    hpLabel: realmConfig.hp_label,
    hpText,
    defLabel,
    defText,
    qiLabel,
    qiText,
  };
}
