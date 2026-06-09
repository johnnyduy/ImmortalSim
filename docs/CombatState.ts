import type { NarrativeTag } from './NarrativeCombatTypes';

/**
 * Core data structures for the Combat Engine.
 * These schemas match the JSON configurations stored in your database.
 */

export interface StatSnapshot {
  hp: number;
  max_hp: number;
  qi: number;
  max_qi: number;
  speed: number;
  comprehension: number;
  [key: string]: number; // Highly extensible for hidden stats like 'sword_intent'
}

export type ResourceKey = 'hp' | 'qi';

export interface StatModifier {
  id: string;
  source: string;
  stat: string;
  mode: 'add' | 'multiply' | 'override';
  value: number;
  priority?: number;
}

export interface Buff {
  id: string;
  type: 'stackable' | 'duration' | 'aura';
  duration_ticks: number;
  modifiers: Record<string, string>; // e.g. { "speed": "base * 1.5", "qi_regen": "base - 10" }
  tags?: string[];
  narrative?: string;
}

export interface CombatEffect {
  type: 'damage' | 'heal' | 'apply_buff' | 'restore_resource' | 'add_tension';
  formula?: string; // e.g., "self.qi_control * 1.5"
  buff_id?: string;
  resource?: ResourceKey;
  target: 'self' | 'enemy';
  narrative_template?: string; // Custom narrative for this specific effect
}

export interface CombatAction {
  id: string;
  name: string;
  narrativeTags?: NarrativeTag[];
  intentType?: 'sword' | 'flame' | 'blood' | 'curse' | 'lotus' | 'demonic';
  dangerRating?: number;
  costs?: Record<string, number>;
  effects: CombatEffect[];
  narrative_template?: string; // Custom narrative for initiating the action
}

export interface AIRule {
  condition: string; // e.g., "self.hp < 250" or "always"
  action_id: string;
  weight: number;    // Used for utility scoring
}

export interface CombatTrigger {
  event: 'on_take_damage' | 'on_deal_damage' | 'on_hp_threshold';
  condition: string;
  chance?: number;
  choice_id?: string;
  action_id?: string;
}

export type CombatPhase = 'setup' | 'active' | 'awaiting_player' | 'finished';

export interface CombatantRuntime {
  id: string;
  role: 'player' | 'enemy';
  character: Character;
  currentStats: StatSnapshot;
  lastActionId?: string;
  isDefeated: boolean;
}

export interface BattlefieldState {
  id: string;
  name: string;
  tension: number;
  tags: string[];
  innate_auras: Buff[];
}

export interface CombatRuntimeState {
  phase: CombatPhase;
  tick: number;
  player: CombatantRuntime;
  enemy: CombatantRuntime;
  battlefield: BattlefieldState;
  log: string[];
  winner?: 'player' | 'enemy';
}

export interface Character {
  id: string;
  name: string;
  realm_tier: number; // e.g., 1 = Qi Condensation, 5 = Soul Formation
  base_stats: StatSnapshot;
  tags: string[]; // e.g., ["demonic_state", "has_golden_core"]
  buffs: Buff[];
  ai_rules?: AIRule[];
  triggers?: CombatTrigger[];
}

export interface CombatEnvironment {
  id: string;
  name: string;
  innate_auras: Buff[]; // Applied to all combatants
  unlocked_choices: string[]; // Choice IDs available only here
  tension?: number;
  tags?: string[];
}

export type EffectExecutionResult = {
  amount?: number;
  triggeredChoices: string[];
  triggeredActions: string[];
  defeatedTarget?: boolean;
};
