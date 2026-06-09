import { Character } from './CombatState';

export interface ChoiceRule {
  id: string;
  name: string;
  requirements: {
    min_hp_percent?: number;
    max_hp_percent?: number;
    required_tags?: string[];
    required_realm_tier?: number;
  };
  action_id: string;
}

export class ChoiceGenerator {
  /**
   * Filters a master list of choices down to what is currently valid for the character.
   */
  static generateValidChoices(char: Character, currentStats: any, allChoices: ChoiceRule[]): ChoiceRule[] {
    const currentHpPercent = currentStats.hp / currentStats.max_hp;

    return allChoices.filter(choice => {
      const reqs = choice.requirements;
      
      // Check HP constraints (e.g., desperation moves)
      if (reqs.min_hp_percent !== undefined && currentHpPercent < reqs.min_hp_percent) return false;
      if (reqs.max_hp_percent !== undefined && currentHpPercent > reqs.max_hp_percent) return false;
      
      // Check required tags (e.g., requires 'sword_domain' or 'bleeding')
      if (reqs.required_tags) {
        const hasTags = reqs.required_tags.every(tag => char.tags.includes(tag));
        if (!hasTags) return false;
      }

      if (reqs.required_realm_tier !== undefined && char.realm_tier < reqs.required_realm_tier) return false;
      
      return true;
    });
  }
}
