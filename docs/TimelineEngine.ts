export interface TimelineEvent {
  tick: number;
  sourceId: string;
  type: 'action' | 'buff_expiry' | 'environment_tick';
  execute: () => void;
}

export class TimelineEngine {
  public currentTick: number = 0;
  private events: TimelineEvent[] = [];

  scheduleEvent(delayTicks: number, event: Omit<TimelineEvent, 'tick'>) {
    this.events.push({
      ...event,
      tick: this.currentTick + delayTicks
    });
    
    // Keep timeline sorted so the earliest tick is always first
    this.events.sort((a, b) => a.tick - b.tick);
  }

  advanceToNextEvent(): TimelineEvent | null {
    if (this.events.length === 0) return null;
    
    const nextEvent = this.events.shift()!;
    this.currentTick = nextEvent.tick;
    
    nextEvent.execute();
    return nextEvent;
  }
}