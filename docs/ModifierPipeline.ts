import { Character, StatSnapshot, Buff, CombatEnvironment } from './CombatState';
import { FormulaEvaluator } from './FormulaEvaluator';

export class ModifierPipeline {
  /**
   * Calculates the current stats of a character at any given tick.
   * Parses string formulas from JSON buffs to determine final values.
   */
  static calculateCurrentStats(char: Character, env?: CombatEnvironment): StatSnapshot {
    // 1. Start with a fresh clone of base stats
    const currentStats = { ...char.base_stats };

    // 2. Combine personal buffs and environmental auras
    const activeBuffs = [...char.buffs, ...(env?.innate_auras || [])];

    // 3. Process each buff formula
    activeBuffs.forEach(buff => {
      for (const [statName, formula] of Object.entries(buff.modifiers)) {
        if (currentStats[statName] !== undefined) {
          currentStats[statName] = FormulaEvaluator.evaluateNumber(formula, {
            base: currentStats[statName],
            self: currentStats,
          });
        }
      }
    });

    currentStats.hp = Math.min(Math.max(0, currentStats.hp), currentStats.max_hp);
    currentStats.qi = Math.min(Math.max(0, currentStats.qi), currentStats.max_qi);

    return currentStats;
  }
}
