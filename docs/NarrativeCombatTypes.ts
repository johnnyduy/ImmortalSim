import type { CombatPhase } from './CombatState';

export type NarrativeCombatPhase = 'probing' | 'pressure' | 'dominance' | 'desperation' | 'climax';

export type NarrativeTag =
  | 'sword'
  | 'flame'
  | 'blood'
  | 'curse'
  | 'lotus'
  | 'demonic'
  | 'calm'
  | 'fear'
  | 'rage'
  | 'suppression'
  | 'dao_pressure'
  | 'heart_demon'
  | 'enlightenment'
  | 'artifact'
  | 'bloodline'
  | 'spatial'
  | 'forbidden'
  | 'near_death'
  | 'momentum'
  | 'instability'
  | 'resource'
  | 'tension';

export type NarrativeLogType =
  | 'opening'
  | 'choice'
  | 'cast'
  | 'damage'
  | 'heal'
  | 'resource'
  | 'buff'
  | 'reaction'
  | 'suppression'
  | 'battlefield_pressure'
  | 'momentum_shift'
  | 'dao_instability'
  | 'intent_growth'
  | 'heart_demon'
  | 'enlightenment'
  | 'fear'
  | 'killing_intent'
  | 'spiritual_collapse'
  | 'atmosphere_distortion'
  | 'rare_event'
  | 'result'
  | 'system';

export type NarrativeCombatEvent = {
  tick: number;
  type: NarrativeLogType;
  text?: string;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetName?: string;
  actionId?: string;
  actionName?: string;
  amount?: number;
  actorHpPercent?: number;
  targetHpPercent?: number;
  tension: number;
  combatPhase: CombatPhase;
  tags: NarrativeTag[];
};

export type NarrativeLogEntry = {
  id: string;
  tick: number;
  type: NarrativeLogType;
  phase: NarrativeCombatPhase;
  actorId?: string;
  targetId?: string;
  actionId?: string;
  amount?: number;
  tags: NarrativeTag[];
  intensity: number;
  text: string;
  hidden?: {
    templateId?: string;
    memoryNotes?: string[];
  };
};

export type FighterNarrativeMemory = {
  actorId: string;
  repeatedActions: Record<string, number>;
  injuryCount: number;
  severeInjuryCount: number;
  consecutiveHitsLanded: number;
  consecutiveHitsTaken: number;
  composure: number;
  fear: number;
  rage: number;
  killingIntent: number;
  swordIntent: number;
  daoStability: number;
  heartDemonPressure: number;
  enlightenmentPressure: number;
};

export type NarrativeCombatState = {
  phase: NarrativeCombatPhase;
  tick: number;
  tension: number;
  momentumOwnerId?: string;
  battlefieldControllerId?: string;
  danger: number;
  atmosphereInstability: number;
  memory: Record<string, FighterNarrativeMemory>;
  recentTemplateIds: string[];
  rareEventsSeen: Record<string, number>;
};

export type NarrativeTemplate = {
  id: string;
  type: NarrativeLogType;
  phase?: NarrativeCombatPhase[];
  tags?: NarrativeTag[];
  weight: number;
  cooldown?: number;
  conditions?: {
    minTension?: number;
    maxTension?: number;
    minAmount?: number;
    targetHpBelow?: number;
    actorComposureBelow?: number;
    targetFearAbove?: number;
    repeatedActionAtLeast?: number;
    momentumOwner?: 'actor' | 'target' | 'none';
    rareChance?: number;
  };
  text: string;
};
