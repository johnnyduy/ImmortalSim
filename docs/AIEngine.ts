import { Character, CombatAction, CombatEnvironment } from './CombatState';
import { FormulaEvaluator } from './FormulaEvaluator';
import { ModifierPipeline } from './ModifierPipeline';

export class AIEngine {
  static decideNextAction(
    self: Character,
    target: Character,
    env: CombatEnvironment,
    allActions: CombatAction[]
  ): CombatAction | null {
    const rules = self.ai_rules ?? [];
    const matchingRules = rules.filter((rule) =>
      this.evaluateCondition(rule.condition, self, target, env)
    );

    const selectedRule = matchingRules.sort((a, b) => b.weight - a.weight)[0];
    if (!selectedRule) return null;

    return allActions.find((action) => action.id === selectedRule.action_id) ?? null;
  }

  private static evaluateCondition(
    condition: string,
    self: Character,
    target: Character,
    env: CombatEnvironment
  ): boolean {
    if (!condition || condition === 'always') return true;

    return FormulaEvaluator.evaluateBoolean(condition, {
      self: ModifierPipeline.calculateCurrentStats(self, env),
      target: ModifierPipeline.calculateCurrentStats(target, env),
      context: { tension: env.tension ?? 0 },
    });
  }
}
