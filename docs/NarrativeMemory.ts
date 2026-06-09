import type {
  FighterNarrativeMemory,
  NarrativeCombatEvent,
  NarrativeCombatPhase,
  NarrativeCombatState,
} from './NarrativeCombatTypes';

const createFighterMemory = (actorId: string): FighterNarrativeMemory => ({
  actorId,
  repeatedActions: {},
  injuryCount: 0,
  severeInjuryCount: 0,
  consecutiveHitsLanded: 0,
  consecutiveHitsTaken: 0,
  composure: 100,
  fear: 0,
  rage: 0,
  killingIntent: 0,
  swordIntent: 0,
  daoStability: 100,
  heartDemonPressure: 0,
  enlightenmentPressure: 0,
});

export class NarrativeMemory {
  state: NarrativeCombatState = {
    phase: 'probing',
    tick: 0,
    tension: 0,
    danger: 0,
    atmosphereInstability: 0,
    memory: {},
    recentTemplateIds: [],
    rareEventsSeen: {},
  };

  reset() {
    this.state = {
      phase: 'probing',
      tick: 0,
      tension: 0,
      danger: 0,
      atmosphereInstability: 0,
      memory: {},
      recentTemplateIds: [],
      rareEventsSeen: {},
    };
  }

  update(event: NarrativeCombatEvent) {
    this.state.tick = event.tick;
    this.state.tension = Math.max(0, Math.min(100, event.tension));
    this.state.danger = Math.max(this.state.danger, this.deriveDanger(event));
    this.state.atmosphereInstability = Math.max(
      0,
      Math.min(100, this.state.atmosphereInstability + (event.type === 'damage' ? 2 : 0) + (event.tension > 70 ? 1 : 0))
    );

    if (event.actorId) this.ensure(event.actorId);
    if (event.targetId) this.ensure(event.targetId);

    if (event.actorId && event.actionId && (event.type === 'cast' || event.type === 'choice')) {
      const actor = this.ensure(event.actorId);
      actor.repeatedActions[event.actionId] = (actor.repeatedActions[event.actionId] ?? 0) + 1;
      actor.killingIntent = Math.min(100, actor.killingIntent + 4);
      if (event.tags.includes('sword')) actor.swordIntent = Math.min(100, actor.swordIntent + 8);
      if (event.tags.includes('heart_demon')) actor.heartDemonPressure = Math.min(100, actor.heartDemonPressure + 10);
    }

    if (event.type === 'damage' && event.actorId && event.targetId) {
      const actor = this.ensure(event.actorId);
      const target = this.ensure(event.targetId);
      const heavy = (event.amount ?? 0) >= 30 || (event.targetHpPercent ?? 1) <= 0.35;

      actor.consecutiveHitsLanded += 1;
      actor.consecutiveHitsTaken = 0;
      actor.killingIntent = Math.min(100, actor.killingIntent + (heavy ? 9 : 4));

      target.injuryCount += 1;
      target.severeInjuryCount += heavy ? 1 : 0;
      target.consecutiveHitsTaken += 1;
      target.consecutiveHitsLanded = 0;
      target.composure = Math.max(0, target.composure - (heavy ? 16 : 7));
      target.fear = Math.min(100, target.fear + (heavy ? 14 : 5));
      target.rage = Math.min(100, target.rage + 4);
      target.daoStability = Math.max(0, target.daoStability - (heavy ? 12 : 4));

      this.state.momentumOwnerId = actor.actorId;
      if (actor.consecutiveHitsLanded >= 2 || this.state.tension >= 55) {
        this.state.battlefieldControllerId = actor.actorId;
      }
    }

    this.state.phase = this.derivePhase(event);
  }

  rememberTemplate(templateId: string, maxRecent = 6) {
    this.state.recentTemplateIds = [templateId, ...this.state.recentTemplateIds.filter((id) => id !== templateId)].slice(0, maxRecent);
  }

  private ensure(actorId: string) {
    this.state.memory[actorId] ??= createFighterMemory(actorId);
    return this.state.memory[actorId];
  }

  private deriveDanger(event: NarrativeCombatEvent) {
    const lowHpDanger = Math.round((1 - Math.min(event.actorHpPercent ?? 1, event.targetHpPercent ?? 1)) * 100);
    return Math.max(lowHpDanger, event.tension, event.amount ?? 0);
  }

  private derivePhase(event: NarrativeCombatEvent): NarrativeCombatPhase {
    const lowestHp = Math.min(event.actorHpPercent ?? 1, event.targetHpPercent ?? 1);

    if (this.state.tension >= 85 || lowestHp <= 0.18) return 'climax';
    if (lowestHp <= 0.32 || this.state.danger >= 70) return 'desperation';
    if (this.state.battlefieldControllerId && this.state.tension >= 55) return 'dominance';
    if (this.state.tension >= 25) return 'pressure';
    return 'probing';
  }
}
