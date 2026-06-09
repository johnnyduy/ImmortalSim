export type RunStatus = 'alive' | 'dead' | 'ascended';
export type RelationshipStatus = 'neutral' | 'ally' | 'enemy' | 'master' | 'disciple';

export interface Profile {
  id: string; // UUID
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface Legacy {
  id: string;
  profileId: string;
  legacyPower: number;
  karma: number;
  ancestralMemories: string[]; // IDs of unlocked memories/traits
  globalFlags: Record<string, boolean | number | string>; 
  createdAt: string;
  updatedAt: string;
}

export interface Incarnation {
  id: string;
  legacyId: string;
  runNumber: number;
  status: RunStatus;
  startAge: number;
  endAge?: number;
  causeOfDeath?: string;
  timelineCorruption: number;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  incarnationId: string;
  name: string;
  realm: string;
  health: number;
  cultivation: number;
  comprehension: number;
  luck: number;
  hiddenFlags: Record<string, boolean | number | string>;
  createdAt: string;
  updatedAt: string;
}

export interface NPC {
  id: string;
  creatorId?: string;
  name: string;
  description: string;
  isAiGenerated: boolean;
  aiPrompt?: string;
  baseStats: Record<string, number>;
  createdAt: string;
}

export interface Relationship {
  id: string;
  characterId: string;
  npcId: string;
  affinity: number;
  status: RelationshipStatus;
  memoryTags: string[];
  updatedAt: string;
}

export interface EventLog {
  id: string;
  incarnationId: string;
  eventId: string; // e.g., 'waking_dawn'
  age: number;
  choiceId: string; // e.g., 'steady_practice'
  consequences: Record<string, number>;
  corruptionDelta: number;
  createdAt: string;
}