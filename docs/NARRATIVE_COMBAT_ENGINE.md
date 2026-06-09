# Dynamic Narrative Combat Engine

Design goal: combat logs must read like a dark xianxia battle chapter, not a damage calculator. The system should remember what happened, track pressure and emotion, then narrate the changing battlefield through concise, atmospheric lines.

## 1. Improved Combat Log Architecture

Current logs are `string[]`. Replace with structured entries, then render `entry.text` in UI.

```ts
type CombatLogType =
  | 'opening'
  | 'choice'
  | 'cast'
  | 'damage'
  | 'heal'
  | 'resource'
  | 'buff'
  | 'reaction'
  | 'suppression'
  | 'battlefield_pressure'
  | 'momentum_shift'
  | 'dao_instability'
  | 'intent_growth'
  | 'heart_demon'
  | 'enlightenment'
  | 'fear'
  | 'killing_intent'
  | 'spiritual_collapse'
  | 'atmosphere_distortion'
  | 'rare_event'
  | 'result';

type CombatLogEntry = {
  id: string;
  tick: number;
  type: CombatLogType;
  phase: CombatPhase;
  actorId?: string;
  targetId?: string;
  actionId?: string;
  amount?: number;
  tags: NarrativeTag[];
  intensity: number; // 0-100
  text: string;
  hidden?: {
    templateId?: string;
    roll?: number;
    memoryNotes?: string[];
  };
};
```

Core principle: engine logic emits structured combat events, narrative engine converts them into story text.

```text
Combat Event -> Memory Update -> Phase Update -> Narrative Tags -> Template Selection -> Log Entry
```

## 2. Narrative State Model

Narration needs memory beyond one action.

```ts
type CombatPhase = 'probing' | 'pressure' | 'dominance' | 'desperation' | 'climax';

type NarrativeTag =
  | 'sword'
  | 'flame'
  | 'blood'
  | 'curse'
  | 'lotus'
  | 'demonic'
  | 'calm'
  | 'fear'
  | 'rage'
  | 'suppression'
  | 'dao_pressure'
  | 'heart_demon'
  | 'enlightenment'
  | 'artifact'
  | 'bloodline'
  | 'spatial'
  | 'forbidden'
  | 'near_death'
  | 'momentum'
  | 'instability';

type FighterNarrativeMemory = {
  actorId: string;
  repeatedActions: Record<string, number>;
  damageTakenBySource: Record<string, number>;
  injuryCount: number;
  severeInjuryCount: number;
  consecutiveHitsLanded: number;
  consecutiveHitsTaken: number;
  composure: number; // 0-100
  fear: number; // 0-100
  rage: number; // 0-100
  killingIntent: number; // 0-100
  swordIntent: number; // 0-100
  daoStability: number; // 0-100
  heartDemonPressure: number; // 0-100
  enlightenmentPressure: number; // 0-100
};

type NarrativeCombatState = {
  phase: CombatPhase;
  tick: number;
  tension: number; // 0-100
  momentumOwnerId?: string;
  battlefieldControllerId?: string;
  danger: number; // 0-100
  suppression: Record<string, number>; // targetId -> pressure level
  atmosphereInstability: number; // 0-100
  memory: Record<string, FighterNarrativeMemory>;
  recentTemplateIds: string[];
  rareEventsSeen: Record<string, number>;
};
```

### What Memory Tracks

- repeated actions: avoids identical cast lines.
- momentum: who is dictating the rhythm.
- emotional pressure: fear, rage, composure loss.
- battlefield domination: who controls the atmosphere.
- repeated injuries: wounds accumulate narrative weight.
- escalating danger: battle phase moves toward climax.

## 3. Dynamic Narration System

### Input Event

Combat engine emits mechanical events:

```ts
type CombatEvent = {
  tick: number;
  type: 'choice' | 'cast' | 'damage' | 'heal' | 'resource' | 'buff' | 'trigger' | 'phase_check' | 'result';
  actorId?: string;
  targetId?: string;
  actionId?: string;
  amount?: number;
  hpPercent?: number;
  tags: NarrativeTag[];
  metadata?: Record<string, unknown>;
};
```

### Pipeline

1. Receive combat event.
2. Update fighter memory.
3. Recalculate battlefield state.
4. Determine phase.
5. Generate narrative tags.
6. Choose 0-3 narrative layers:
   - primary action line
   - reaction line
   - battlefield line
7. Select weighted templates.
8. Suppress recently repeated templates.
9. Compile text.
10. Output structured `CombatLogEntry[]`.

Pseudo-code:

```ts
function narrate(event, state) {
  updateMemory(event, state);
  updateMomentum(event, state);
  updatePhase(state);

  const layers = chooseNarrativeLayers(event, state);

  return layers.map((layer) => {
    const template = selectWeightedTemplate(layer, event, state);
    return compileLogEntry(template, event, state);
  });
}
```

## 4. Weighted Template Examples

Template schema:

```ts
type NarrativeTemplate = {
  id: string;
  type: CombatLogType;
  phase?: CombatPhase[];
  tags?: NarrativeTag[];
  weight: number;
  cooldown?: number;
  conditions?: {
    minTension?: number;
    maxTension?: number;
    minDamagePercent?: number;
    actorComposureBelow?: number;
    targetFearAbove?: number;
    repeatedActionAtLeast?: number;
    momentumOwner?: 'actor' | 'target' | 'none';
    rareChance?: number;
  };
  text: string;
};
```

### Cast Variants

```json
[
  {
    "id": "cast_sword_probing_01",
    "type": "cast",
    "phase": ["probing"],
    "tags": ["sword"],
    "weight": 10,
    "text": "{actor.name} thu kiem nhu tham do sau nong cua {target.name}."
  },
  {
    "id": "cast_sword_pressure_01",
    "type": "cast",
    "phase": ["pressure", "dominance"],
    "tags": ["sword", "momentum"],
    "weight": 8,
    "conditions": { "momentumOwner": "actor" },
    "text": "Kiem the cua {actor.name} lien mien khong dut, ep {target.name} lui nua buoc."
  },
  {
    "id": "cast_flame_climax_01",
    "type": "cast",
    "phase": ["climax"],
    "tags": ["flame", "forbidden"],
    "weight": 4,
    "conditions": { "minTension": 80 },
    "text": "{actor.name} dot chay linh mach, xich viem day troi nhu muon thieu rung ca ao canh."
  }
]
```

### Damage Variants

```json
[
  {
    "id": "damage_light_01",
    "type": "damage",
    "weight": 10,
    "conditions": { "minDamagePercent": 0 },
    "text": "Du am cua don danh luot qua ho the chan khi cua {target.name}."
  },
  {
    "id": "damage_heavy_01",
    "type": "damage",
    "weight": 8,
    "conditions": { "minDamagePercent": 18 },
    "text": "{target.name} rung minh, khi huyet dao lon sau mot kich cua {actor.name}."
  },
  {
    "id": "damage_repeated_injury_01",
    "type": "damage",
    "weight": 6,
    "conditions": { "repeatedActionAtLeast": 3 },
    "text": "Vet thuong cu chua khep lai bi cung mot dao y xuyen qua lan nua."
  }
]
```

### Battlefield Reaction Variants

```json
[
  {
    "id": "battlefield_pressure_01",
    "type": "battlefield_pressure",
    "phase": ["pressure"],
    "tags": ["dao_pressure"],
    "weight": 8,
    "text": "Uy ap trong {battlefield.name} dan nang, nhu mot ban tay vo hinh de xuong linh dai."
  },
  {
    "id": "atmosphere_distortion_01",
    "type": "atmosphere_distortion",
    "phase": ["dominance", "climax"],
    "tags": ["spatial"],
    "weight": 4,
    "conditions": { "minTension": 70 },
    "text": "Khong gian quanh hai ben vo nhe thanh nhung duong nut den tham."
  }
]
```

### Emotional Narration Variants

```json
[
  {
    "id": "fear_detection_01",
    "type": "fear",
    "tags": ["fear"],
    "weight": 6,
    "conditions": { "targetFearAbove": 55 },
    "text": "Trong mot sat na, hoi tho cua {target.name} cham mat nua nhip."
  },
  {
    "id": "calm_under_pressure_01",
    "type": "reaction",
    "tags": ["calm", "suppression"],
    "weight": 5,
    "conditions": { "actorComposureBelow": 35 },
    "text": "{actor.name} ep run ray xuong tan day dan dien, anh mat van tinh nhu nuoc sau."
  }
]
```

## 5. Escalation System

Combat phase is derived from tension, HP, momentum, rare triggers, and repeated injuries.

```ts
function derivePhase(state): CombatPhase {
  const lowestHp = minHpPercent();

  if (state.tension >= 85 || lowestHp <= 0.18) return 'climax';
  if (lowestHp <= 0.32 || state.danger >= 70) return 'desperation';
  if (state.battlefieldControllerId && state.tension >= 55) return 'dominance';
  if (state.tension >= 25) return 'pressure';
  return 'probing';
}
```

### Phase Tone

```json
{
  "probing": {
    "tone": ["testing", "measured", "quiet pressure"],
    "lineDensity": 1,
    "rareEventMultiplier": 0.25
  },
  "pressure": {
    "tone": ["tightening", "suppression", "intent collision"],
    "lineDensity": 2,
    "rareEventMultiplier": 0.6
  },
  "dominance": {
    "tone": ["control", "field ownership", "dao pressure"],
    "lineDensity": 2,
    "rareEventMultiplier": 0.8
  },
  "desperation": {
    "tone": ["panic", "forbidden choices", "unstable qi"],
    "lineDensity": 2,
    "rareEventMultiplier": 1.2
  },
  "climax": {
    "tone": ["life and death", "spiritual collapse", "heaven-splitting pressure"],
    "lineDensity": 3,
    "rareEventMultiplier": 1.7
  }
}
```

### Escalation Lines

```json
[
  {
    "id": "phase_pressure_enter_01",
    "type": "battlefield_pressure",
    "phase": ["pressure"],
    "weight": 10,
    "text": "Tam Ma Ao Canh bat dau rung dong duoi sat khi hai ben."
  },
  {
    "id": "phase_dominance_enter_01",
    "type": "suppression",
    "phase": ["dominance"],
    "weight": 8,
    "text": "Uy ap cua {controller.name} dang de nang len linh dai {suppressed.name}."
  },
  {
    "id": "phase_climax_enter_01",
    "type": "spiritual_collapse",
    "phase": ["climax"],
    "weight": 10,
    "text": "Sinh tu chi cach mot niem. Ngay ca linh khi cung khong dam luu dong."
  }
]
```

## 6. Reaction System

Every meaningful attack may create a reaction event.

Reaction input:

```ts
type ReactionContext = {
  actorId: string;
  targetId: string;
  damagePercent: number;
  targetHpPercent: number;
  targetComposure: number;
  targetFear: number;
  tags: NarrativeTag[];
  phase: CombatPhase;
};
```

Reaction categories:

- dodge
- hesitation
- fear
- rage
- calmness
- suppression
- instability
- spiritual collapse

Reaction selection:

```ts
function chooseReaction(ctx) {
  if (ctx.damagePercent <= 5 && hasTag('speed')) return 'dodge';
  if (ctx.targetHpPercent < 25) return 'fear';
  if (ctx.targetComposure < 35) return 'instability';
  if (ctx.phase === 'climax') return 'spiritual_collapse';
  if (ctx.damagePercent > 20) return 'suppression';
  return weighted(['hesitation', 'calmness', 'rage']);
}
```

Templates:

```json
[
  {
    "id": "reaction_dodge_01",
    "type": "reaction",
    "tags": ["calm"],
    "weight": 8,
    "text": "{target.name} nghieng nguoi tranh duoc nua thuc, nhung tay ao van bi kiem khi cat rach."
  },
  {
    "id": "reaction_fear_01",
    "type": "fear",
    "tags": ["fear"],
    "weight": 7,
    "text": "Mot tia so hai lot qua mat {target.name}, rat nhanh, nhung khong thoat khoi sat y cua {actor.name}."
  },
  {
    "id": "reaction_rage_01",
    "type": "reaction",
    "tags": ["rage"],
    "weight": 6,
    "text": "{target.name} khong lui nua, ma cuoi khan nhu ke da bi ep den tan cung."
  },
  {
    "id": "reaction_instability_01",
    "type": "dao_instability",
    "tags": ["instability"],
    "weight": 6,
    "text": "Dao tam cua {target.name} xao dong; mot vet nut vo hinh hien tren linh dai."
  }
]
```

## 7. Rare Event System

Rare events should be memorable and gated by state. They must not spam.

```ts
type RareNarrativeEvent = {
  id: string;
  type:
    | 'sudden_enlightenment'
    | 'heavenly_lightning'
    | 'dao_resonance'
    | 'artifact_awakening'
    | 'bloodline_resonance'
    | 'spatial_distortion'
    | 'heart_demon_outbreak';
  baseChance: number;
  oncePerCombat?: boolean;
  cooldownTicks?: number;
  conditions: {
    minTension?: number;
    phase?: CombatPhase[];
    actorHpBelow?: number;
    actorComprehensionAbove?: number;
    heartDemonPressureAbove?: number;
    tags?: NarrativeTag[];
  };
  effects?: CombatEvent[];
  templates: NarrativeTemplate[];
};
```

Rare event examples:

```json
[
  {
    "id": "rare_enlightenment_sword_01",
    "type": "sudden_enlightenment",
    "baseChance": 0.015,
    "oncePerCombat": true,
    "conditions": {
      "minTension": 60,
      "phase": ["desperation", "climax"],
      "actorComprehensionAbove": 14,
      "tags": ["sword"]
    },
    "templates": [
      {
        "id": "rare_enlightenment_sword_text_01",
        "type": "enlightenment",
        "tags": ["sword", "enlightenment"],
        "weight": 10,
        "text": "Trong khe ho giua sinh va tu, {actor.name} bong nhin thay duong kiem thu hai an trong duong kiem thu nhat."
      }
    ]
  },
  {
    "id": "rare_heart_demon_outbreak_01",
    "type": "heart_demon_outbreak",
    "baseChance": 0.02,
    "oncePerCombat": true,
    "conditions": {
      "minTension": 70,
      "phase": ["desperation", "climax"],
      "heartDemonPressureAbove": 65
    },
    "templates": [
      {
        "id": "rare_heart_demon_text_01",
        "type": "heart_demon",
        "tags": ["heart_demon", "fear"],
        "weight": 10,
        "text": "Sau lung {actor.name}, mot bong den co cung khuon mat cham rai mo mat."
      }
    ]
  },
  {
    "id": "rare_artifact_awakening_01",
    "type": "artifact_awakening",
    "baseChance": 0.01,
    "oncePerCombat": true,
    "conditions": {
      "minTension": 80,
      "phase": ["climax"],
      "tags": ["artifact"]
    },
    "templates": [
      {
        "id": "rare_artifact_text_01",
        "type": "rare_event",
        "tags": ["artifact", "dao_pressure"],
        "weight": 10,
        "text": "Mon co vat im lang tu dau tran chien dot nhien ngan vang, nhu nhan ra mui vi cua sinh tu."
      }
    ]
  }
]
```

## 8. Example Before/After Combat Logs

### Before

```text
You chose to: Van kiem khi, chem thang vao doi thu.
Tu si consumed 8 QI.
Kiem quang chem trung Ao anh Tam Ma, gay 38 sat thuong.
Ao anh Tam Ma lao toi bang ma trao mo ao.
Ma trao xe qua than hon Tu si, gay 40 sat thuong.
```

### After

```text
Tu si khong lap tuc xuat sat chieu; mui kiem chi ve tam anh nhu tham do do sau cua ao canh.
Kiem quang chem trung Ao anh Tam Ma, nhung bong den chi lui nua buoc roi dung lai.
Am phong rit len. Uy ap cua Tam Ma bat dau de nang len linh dai Tu si.
Ao anh Tam Ma lao toi bang ma trao mo ao.
Tu si nghieng nguoi tranh duoc nua thuc, nhung than hon van bi ma trao xet qua mot vet lanh.
Tam Ma Ao Canh rung dong. Tran chien khong con la tham do.
```

### Climax Example

```text
Sinh tu chi cach mot niem. Ngay ca linh khi cung khong dam luu dong.
Tu si dot chay phan linh luc cuoi cung, xich viem cuon len thanh mot duong troi do tham.
Ao anh Tam Ma khong lui. Sau lung no, mot bong den co cung khuon mat cham rai mo mat.
Xich viem nuot lay bong den, nhung tieng cuoi van vang trong linh dai.
Trong khoanh khac dao tam sap vo, Tu si bong nhin thay mot tia kiem y chua tung thuoc ve minh.
```

## 9. JSON Examples

### Template Pool

```json
{
  "poolId": "test_combat_dark_xianxia_v1",
  "templates": [
    {
      "id": "suppression_tam_ma_01",
      "type": "suppression",
      "phase": ["pressure", "dominance"],
      "tags": ["demonic", "suppression"],
      "weight": 9,
      "cooldown": 3,
      "conditions": {
        "minTension": 35,
        "momentumOwner": "actor"
      },
      "text": "Uy ap cua {actor.name} dang de nang len linh dai {target.name}."
    },
    {
      "id": "sword_intent_growth_01",
      "type": "intent_growth",
      "phase": ["pressure", "desperation", "climax"],
      "tags": ["sword"],
      "weight": 7,
      "conditions": {
        "repeatedActionAtLeast": 2
      },
      "text": "Moi duong kiem cua {actor.name} deu nhanh hon truoc."
    },
    {
      "id": "atmosphere_distortion_climax_01",
      "type": "atmosphere_distortion",
      "phase": ["climax"],
      "tags": ["spatial", "dao_pressure"],
      "weight": 5,
      "conditions": {
        "minTension": 85
      },
      "text": "Tam Ma Ao Canh bat dau meo lech, nhu khong chiu noi sat khi hai ben."
    }
  ]
}
```

### Combat Memory Snapshot

```json
{
  "phase": "pressure",
  "tick": 42,
  "tension": 57,
  "momentumOwnerId": "e1",
  "battlefieldControllerId": "e1",
  "danger": 62,
  "atmosphereInstability": 44,
  "memory": {
    "p1": {
      "actorId": "p1",
      "repeatedActions": {
        "act_player_sword": 2
      },
      "injuryCount": 2,
      "severeInjuryCount": 1,
      "consecutiveHitsLanded": 0,
      "consecutiveHitsTaken": 2,
      "composure": 61,
      "fear": 28,
      "rage": 12,
      "killingIntent": 36,
      "swordIntent": 42,
      "daoStability": 73,
      "heartDemonPressure": 25,
      "enlightenmentPressure": 18
    }
  },
  "recentTemplateIds": [
    "suppression_tam_ma_01",
    "reaction_instability_01"
  ],
  "rareEventsSeen": {}
}
```

### Structured Log Entry

```json
{
  "id": "log_0042_01",
  "tick": 42,
  "type": "suppression",
  "phase": "pressure",
  "actorId": "e1",
  "targetId": "p1",
  "actionId": "act_enemy_claw",
  "tags": ["demonic", "suppression"],
  "intensity": 57,
  "text": "Uy ap cua Ao anh Tam Ma dang de nang len linh dai Tu si.",
  "hidden": {
    "templateId": "suppression_tam_ma_01",
    "roll": 0.42,
    "memoryNotes": ["enemy_momentum", "player_taken_2_hits"]
  }
}
```

## 10. Integration Strategy With Combat Engine

### Step 1: Keep mechanical combat unchanged

Do not move damage/heal logic into narration. Combat engine emits events:

```ts
emitCombatEvent({
  tick,
  type: 'damage',
  actorId: source.id,
  targetId: target.id,
  actionId: action.id,
  amount,
  hpPercent,
  tags: action.narrativeTags ?? []
});
```

### Step 2: Add NarrativeCombatEngine

New files:

```text
docs/NarrativeCombatTypes.ts
docs/NarrativeTemplatePool.ts
docs/NarrativeCombatEngine.ts
docs/NarrativeMemory.ts
docs/NarrativeTemplateSelector.ts
```

### Step 3: Replace `addLog(string)` with `addCombatEvent(event)`

Temporary compatibility:

```ts
const addCombatEvent = (event: CombatEvent) => {
  const entries = narrativeEngine.narrate(event);
  setCombatLogs((prev) => [...prev, ...entries]);
};

const addLog = (text: string) => {
  setCombatLogs((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      tick: timeline.currentTick,
      type: 'system',
      phase: narrativeState.phase,
      tags: [],
      intensity: narrativeState.tension,
      text
    }
  ]);
};
```

### Step 4: Render structured logs

UI change:

```tsx
{combatLogs.map((entry) => (
  <p key={entry.id} data-log-type={entry.type}>
    {entry.text}
  </p>
))}
```

### Step 5: Add action narrative metadata

Extend `CombatAction`:

```ts
type CombatAction = {
  id: string;
  name: string;
  narrativeTags?: NarrativeTag[];
  intentType?: 'sword' | 'flame' | 'blood' | 'curse' | 'lotus';
  dangerRating?: number;
  costs?: Record<string, number>;
  effects: CombatEffect[];
};
```

### Step 6: Phase-driven line density

Instead of one log per event:

- probing: 1 line
- pressure: 1-2 lines
- dominance: 2 lines
- desperation: 2 lines, more emotion
- climax: 2-3 lines, rare event checks enabled

### Step 7: Review and balance

Add debug mode:

```ts
showTemplateId: true
showNarrativeState: true
showRareRolls: true
```

This lets balance review see why a line appeared.

## Final Rule

Every combat log should answer at least one of these:

- Who is controlling the battlefield?
- Who is losing composure?
- What pressure is rising?
- What changed since the previous exchange?
- Why will this battle be remembered?

If a line only says damage happened, it is not enough.
