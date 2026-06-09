import type {
  FighterNarrativeMemory,
  NarrativeCombatEvent,
  NarrativeCombatState,
  NarrativeLogType,
  NarrativeTemplate,
} from './NarrativeCombatTypes';
import { NARRATIVE_TEMPLATE_POOL } from './NarrativeTemplatePool';

export class NarrativeTemplateSelector {
  select(
    type: NarrativeLogType,
    event: NarrativeCombatEvent,
    state: NarrativeCombatState,
    actorMemory?: FighterNarrativeMemory,
    targetMemory?: FighterNarrativeMemory
  ): NarrativeTemplate | null {
    const candidates = NARRATIVE_TEMPLATE_POOL.filter((template) =>
      this.matches(template, type, event, state, actorMemory, targetMemory)
    );

    if (candidates.length === 0) return null;

    const weighted = candidates.flatMap((template) => Array(Math.max(1, template.weight)).fill(template));
    return weighted[Math.floor(Math.random() * weighted.length)] ?? candidates[0];
  }

  private matches(
    template: NarrativeTemplate,
    type: NarrativeLogType,
    event: NarrativeCombatEvent,
    state: NarrativeCombatState,
    actorMemory?: FighterNarrativeMemory,
    targetMemory?: FighterNarrativeMemory
  ) {
    if (template.type !== type) return false;
    if (template.phase && !template.phase.includes(state.phase)) return false;
    if (template.tags?.length && !template.tags.some((tag) => event.tags.includes(tag))) return false;
    if (template.cooldown && state.recentTemplateIds.slice(0, template.cooldown).includes(template.id)) return false;

    const conditions = template.conditions;
    if (!conditions) return true;

    if (conditions.minTension !== undefined && event.tension < conditions.minTension) return false;
    if (conditions.maxTension !== undefined && event.tension > conditions.maxTension) return false;
    if (conditions.minAmount !== undefined && (event.amount ?? 0) < conditions.minAmount) return false;
    if (conditions.targetHpBelow !== undefined && (event.targetHpPercent ?? 1) > conditions.targetHpBelow) return false;
    if (conditions.actorComposureBelow !== undefined && (targetMemory?.composure ?? 100) > conditions.actorComposureBelow) return false;
    if (conditions.targetFearAbove !== undefined && (targetMemory?.fear ?? 0) < conditions.targetFearAbove) return false;
    if (
      conditions.repeatedActionAtLeast !== undefined &&
      (!event.actionId || (actorMemory?.repeatedActions[event.actionId] ?? 0) < conditions.repeatedActionAtLeast)
    ) return false;
    if (conditions.momentumOwner === 'actor' && state.momentumOwnerId !== event.actorId) return false;
    if (conditions.momentumOwner === 'target' && state.momentumOwnerId !== event.targetId) return false;
    if (conditions.momentumOwner === 'none' && state.momentumOwnerId) return false;
    if (conditions.rareChance !== undefined && Math.random() > conditions.rareChance) return false;

    return true;
  }
}
