import { NarrativeMemory } from './NarrativeMemory';
import { NarrativeTemplateSelector } from './NarrativeTemplateSelector';
import type {
  NarrativeCombatEvent,
  NarrativeLogEntry,
  NarrativeLogType,
  NarrativeTemplate,
} from './NarrativeCombatTypes';

type CompileData = Record<string, string | number | undefined>;

export class NarrativeCombatEngine {
  private memory = new NarrativeMemory();
  private selector = new NarrativeTemplateSelector();
  private sequence = 0;

  reset() {
    this.memory.reset();
    this.sequence = 0;
  }

  narrate(event: NarrativeCombatEvent): NarrativeLogEntry[] {
    this.memory.update(event);

    const actorMemory = event.actorId ? this.memory.state.memory[event.actorId] : undefined;
    const targetMemory = event.targetId ? this.memory.state.memory[event.targetId] : undefined;
    const layerTypes = this.chooseLayers(event);
    const entries: NarrativeLogEntry[] = [];

    for (const type of layerTypes) {
      const template = this.selector.select(type, event, this.memory.state, actorMemory, targetMemory);
      if (!template) continue;
      entries.push(this.toEntry(template, event));
      this.memory.rememberTemplate(template.id);
    }

    if (entries.length === 0 && event.text) {
      entries.push(this.toEntry({
        id: `fallback_${event.type}`,
        type: event.type,
        weight: 1,
        text: '{text}',
      }, event));
    }

    return entries;
  }

  private chooseLayers(event: NarrativeCombatEvent): NarrativeLogType[] {
    const phase = this.memory.state.phase;
    const layers: NarrativeLogType[] = [event.type];

    if (event.type === 'damage') {
      if ((event.amount ?? 0) >= 25 || (event.targetHpPercent ?? 1) <= 0.45) {
        layers.push((this.memory.state.memory[event.targetId ?? '']?.fear ?? 0) > 45 ? 'fear' : 'reaction');
      }
      if (this.memory.state.tension >= 35) layers.push('suppression');
      if (event.tags.includes('sword')) layers.push('intent_growth');
    }

    if (event.type === 'cast' && this.memory.state.tension >= 25) {
      layers.push('battlefield_pressure');
    }

    if (phase === 'dominance' && !layers.includes('atmosphere_distortion')) {
      layers.push('atmosphere_distortion');
    }

    if (phase === 'climax') {
      layers.push('spiritual_collapse');
      layers.push(event.tags.includes('heart_demon') ? 'heart_demon' : 'enlightenment');
    }

    return Array.from(new Set(layers)).slice(0, phase === 'climax' ? 4 : 3);
  }

  private toEntry(template: NarrativeTemplate, event: NarrativeCombatEvent): NarrativeLogEntry {
    return {
      id: `nlog_${event.tick}_${this.sequence++}`,
      tick: event.tick,
      type: template.type,
      phase: this.memory.state.phase,
      actorId: event.actorId,
      targetId: event.targetId,
      actionId: event.actionId,
      amount: event.amount,
      tags: event.tags,
      intensity: event.tension,
      text: this.compile(template.text, event),
      hidden: {
        templateId: template.id,
      },
    };
  }

  private compile(template: string, event: NarrativeCombatEvent) {
    const data: CompileData = {
      text: event.text,
      actorName: event.actorName,
      targetName: event.targetName,
      actionName: event.actionName,
      choiceText: event.text,
      amount: event.amount?.toFixed(0),
      tension: event.tension.toFixed(0),
      battlefieldName: 'Tam Ma Ao Canh',
    };

    return template.replace(/\{([a-zA-Z_]+)\}/g, (_, key) => String(data[key] ?? ''));
  }
}
