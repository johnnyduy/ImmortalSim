import { Character, CombatTrigger, CombatEnvironment, StatSnapshot } from './CombatState';
import { ModifierPipeline } from './ModifierPipeline';
import { FormulaEvaluator } from './FormulaEvaluator';

export class TriggerEngine {
  static evaluateTriggers(
    event: string,
    source: Character,
    target: Character,
    env: CombatEnvironment,
    triggerContext: Record<string, any>
  ): CombatTrigger[] {
    const activeTriggers = source.triggers?.filter(t => t.event === event) || [];
    const sourceStats = ModifierPipeline.calculateCurrentStats(source, env);
    const targetStats = ModifierPipeline.calculateCurrentStats(target, env);

    const activatedTriggers: CombatTrigger[] = [];

    for (const trigger of activeTriggers) {
      if (trigger.chance !== undefined && Math.random() > trigger.chance) continue;

      if (this.evaluateCondition(trigger.condition, sourceStats, targetStats, triggerContext)) {
        activatedTriggers.push(trigger);
      }
    }

    return activatedTriggers;
  }

  private static evaluateCondition(
    condition: string,
    sourceStats: StatSnapshot,
    targetStats: StatSnapshot,
    context: Record<string, any>
  ): boolean {
    if (!condition || condition === 'always') return true;

    return FormulaEvaluator.evaluateBoolean(condition, {
      self: sourceStats,
      target: targetStats,
      context,
    });
  }
}
