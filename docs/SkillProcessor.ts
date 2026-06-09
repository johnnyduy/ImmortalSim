import {
  Character,
  CombatAction,
  CombatEffect,
  CombatEnvironment,
  EffectExecutionResult,
  StatSnapshot,
} from './CombatState';
import { FormulaEvaluator } from './FormulaEvaluator';
import { ModifierPipeline } from './ModifierPipeline';
import { NarrativeCompiler } from './NarrativeCompiler';
import type { NarrativeCombatEvent } from './NarrativeCombatTypes';
import { TriggerEngine } from './TriggerEngine';

type EffectContext = {
  action: CombatAction;
  source: Character;
  target: Character;
  env: CombatEnvironment;
  sourceStats: StatSnapshot;
  targetStats: StatSnapshot;
  addLog: (msg: string, event?: Partial<NarrativeCombatEvent>) => void;
};

type EffectHandler = (effect: CombatEffect, context: EffectContext) => EffectExecutionResult;

const emptyResult = (): EffectExecutionResult => ({
  triggeredChoices: [],
  triggeredActions: [],
});

export class SkillProcessor {
  private static effectHandlers: Record<CombatEffect['type'], EffectHandler> = {
    damage: (effect, context) => this.applyDamage(effect, context),
    heal: (effect, context) => this.applyHeal(effect, context),
    apply_buff: (effect, context) => this.applyBuff(effect, context),
    restore_resource: (effect, context) => this.applyRestoreResource(effect, context),
    add_tension: (effect, context) => this.applyTension(effect, context),
  };

  static executeAction(
    action: CombatAction,
    source: Character,
    target: Character,
    env: CombatEnvironment,
    addLog: (msg: string, event?: Partial<NarrativeCombatEvent>) => void
  ): { triggeredChoices: string[], triggeredActions: string[] } {
    const sourceStats = ModifierPipeline.calculateCurrentStats(source, env);
    const targetStats = ModifierPipeline.calculateCurrentStats(target, env);

    const triggeredChoices: string[] = [];
    const triggeredActions: string[] = [];

    const narrativeData: Record<string, any> = {
      source,
      target,
      env,
      action,
      amount: 0,
      stat: '',
      cost: 0,
      buff_id: ''
    };

    if (!this.canPayCosts(action, source)) {
      addLog(`${source.name} tried to form ${action.name}, but their inner reserves faltered.`, {
        type: 'resource',
        actorId: source.id,
        actorName: source.name,
        targetId: target.id,
        targetName: target.name,
        actionId: action.id,
        actionName: action.name,
        tags: ['resource', ...(action.narrativeTags ?? [])],
      });
      return { triggeredChoices, triggeredActions };
    }

    const castText = action.narrative_template
      ? NarrativeCompiler.compile(action.narrative_template, narrativeData)
      : `${source.name} initiates [${action.name}].`;

    if (action.narrative_template) {
       addLog(castText, {
         type: 'cast',
         actorId: source.id,
         actorName: source.name,
         targetId: target.id,
         targetName: target.name,
         actionId: action.id,
         actionName: action.name,
         tags: action.narrativeTags ?? [],
       });
    } else {
       addLog(castText, {
         type: 'cast',
         actorId: source.id,
         actorName: source.name,
         targetId: target.id,
         targetName: target.name,
         actionId: action.id,
         actionName: action.name,
         tags: action.narrativeTags ?? [],
       });
    }

    if (action.costs) {
      for (const [stat, cost] of Object.entries(action.costs)) {
        if (source.base_stats[stat] !== undefined) {
          source.base_stats[stat] = Math.max(0, source.base_stats[stat] - cost);
          narrativeData.stat = stat.toUpperCase();
          narrativeData.cost = cost;
          addLog(NarrativeCompiler.compile("{source.name} consumed {cost} {stat}.", narrativeData), {
            type: 'resource',
            actorId: source.id,
            actorName: source.name,
            targetId: target.id,
            targetName: target.name,
            actionId: action.id,
            actionName: action.name,
            amount: cost,
            tags: ['resource', ...(action.narrativeTags ?? [])],
          });
        }
      }
    }

    for (const effect of action.effects) {
      const handler = this.effectHandlers[effect.type];
      if (!handler) continue;

      const result = handler(effect, {
        action,
        source,
        target,
        env,
        sourceStats,
        targetStats,
        addLog,
      });

      triggeredChoices.push(...result.triggeredChoices);
      triggeredActions.push(...result.triggeredActions);
    }

    return { triggeredChoices, triggeredActions };
  }

  private static canPayCosts(action: CombatAction, source: Character): boolean {
    if (!action.costs) return true;
    return Object.entries(action.costs).every(([stat, cost]) => (source.base_stats[stat] ?? 0) >= cost);
  }

  private static getEffectTarget(effect: CombatEffect, context: EffectContext): Character {
    return effect.target === 'self' ? context.source : context.target;
  }

  private static buildNarrativeData(
    effect: CombatEffect,
    context: EffectContext,
    amount = 0
  ): Record<string, any> {
    const effectTarget = this.getEffectTarget(effect, context);

    return {
      source: context.source,
      target: effectTarget,
      env: context.env,
      action: context.action,
      amount: amount.toFixed(0),
      stat: effect.resource?.toUpperCase() ?? '',
      cost: 0,
      buff_id: effect.buff_id ?? '',
      tension: context.env.tension ?? 0,
    };
  }

  private static baseEvent(effect: CombatEffect, context: EffectContext, amount?: number): Partial<NarrativeCombatEvent> {
    const effectTarget = this.getEffectTarget(effect, context);

    return {
      actorId: context.source.id,
      actorName: context.source.name,
      targetId: effectTarget.id,
      targetName: effectTarget.name,
      actionId: context.action.id,
      actionName: context.action.name,
      amount,
      actorHpPercent: context.source.base_stats.hp / context.source.base_stats.max_hp,
      targetHpPercent: effectTarget.base_stats.hp / effectTarget.base_stats.max_hp,
      tags: context.action.narrativeTags ?? [],
    };
  }

  private static evaluateEffectAmount(effect: CombatEffect, context: EffectContext): number {
    return Math.max(0, FormulaEvaluator.evaluateNumber(effect.formula, {
      self: context.sourceStats,
      target: context.targetStats,
      context: { tension: context.env.tension ?? 0 },
    }));
  }

  private static applyDamage(effect: CombatEffect, context: EffectContext): EffectExecutionResult {
    const result = emptyResult();
    const effectTarget = this.getEffectTarget(effect, context);
    const amount = this.evaluateEffectAmount(effect, context);

    effectTarget.base_stats.hp = Math.max(0, effectTarget.base_stats.hp - amount);

    const defaultTemplate = "{source.name}'s attack lands, dealing {amount} damage to {target.name}!";
    const text = NarrativeCompiler.compile(
      effect.narrative_template || defaultTemplate,
      this.buildNarrativeData(effect, context, amount)
    );
    context.addLog(text, {
      ...this.baseEvent(effect, context, amount),
      type: 'damage',
    });

    const triggers = TriggerEngine.evaluateTriggers('on_take_damage', effectTarget, context.source, context.env, { amount });
    for (const trigger of triggers) {
      if (trigger.choice_id) result.triggeredChoices.push(trigger.choice_id);
      if (trigger.action_id) result.triggeredActions.push(trigger.action_id);
    }

    result.amount = amount;
    result.defeatedTarget = effectTarget.base_stats.hp <= 0;
    return result;
  }

  private static applyHeal(effect: CombatEffect, context: EffectContext): EffectExecutionResult {
    const effectTarget = this.getEffectTarget(effect, context);
    const amount = this.evaluateEffectAmount(effect, context);

    effectTarget.base_stats.hp = Math.min(effectTarget.base_stats.max_hp, effectTarget.base_stats.hp + amount);

    const defaultTemplate = "A restorative force mends {target.name}, recovering {amount} HP.";
    const text = NarrativeCompiler.compile(
      effect.narrative_template || defaultTemplate,
      this.buildNarrativeData(effect, context, amount)
    );
    context.addLog(text, {
      ...this.baseEvent(effect, context, amount),
      type: 'heal',
      tags: ['calm', ...(context.action.narrativeTags ?? [])],
    });

    return { ...emptyResult(), amount };
  }

  private static applyBuff(effect: CombatEffect, context: EffectContext): EffectExecutionResult {
    const effectTarget = this.getEffectTarget(effect, context);
    const buffId = effect.buff_id ?? 'unnamed_buff';

    effectTarget.buffs.push({
      id: buffId,
      type: 'duration',
      duration_ticks: 30,
      modifiers: {},
      narrative: effect.narrative_template,
    });

    const defaultTemplate = "{target.name} is now affected by [{buff_id}].";
    const text = NarrativeCompiler.compile(
      effect.narrative_template || defaultTemplate,
      this.buildNarrativeData(effect, context)
    );
    context.addLog(text, {
      ...this.baseEvent(effect, context),
      type: 'buff',
    });

    return emptyResult();
  }

  private static applyRestoreResource(effect: CombatEffect, context: EffectContext): EffectExecutionResult {
    const effectTarget = this.getEffectTarget(effect, context);
    const resource = effect.resource ?? 'qi';
    const maxResource = `max_${resource}`;
    const amount = this.evaluateEffectAmount(effect, context);

    effectTarget.base_stats[resource] = Math.min(
      effectTarget.base_stats[maxResource] ?? effectTarget.base_stats[resource],
      effectTarget.base_stats[resource] + amount
    );

    const defaultTemplate = "{target.name} recovers {amount} {stat}.";
    const text = NarrativeCompiler.compile(
      effect.narrative_template || defaultTemplate,
      this.buildNarrativeData(effect, context, amount)
    );
    context.addLog(text, {
      ...this.baseEvent(effect, context, amount),
      type: 'resource',
      tags: ['resource', ...(context.action.narrativeTags ?? [])],
    });

    return { ...emptyResult(), amount };
  }

  private static applyTension(effect: CombatEffect, context: EffectContext): EffectExecutionResult {
    const amount = this.evaluateEffectAmount(effect, context);
    context.env.tension = Math.max(0, Math.min(100, (context.env.tension ?? 0) + amount));

    const defaultTemplate = "The battlefield tension rises to {tension}.";
    const text = NarrativeCompiler.compile(
      effect.narrative_template || defaultTemplate,
      this.buildNarrativeData(effect, context, amount)
    );
    context.addLog(text, {
      ...this.baseEvent(effect, context, amount),
      type: 'battlefield_pressure',
      tags: ['tension', 'dao_pressure', ...(context.action.narrativeTags ?? [])],
    });

    return { ...emptyResult(), amount };
  }
}
