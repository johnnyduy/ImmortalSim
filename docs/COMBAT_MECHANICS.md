# Combat Mechanics

Tai lieu nay mo ta co che combat dang co trong code hien tai. Cac file chinh:

- `docs/useCombatEngine.ts`: orchestration combat, timeline, pause/resume UI.
- `docs/CombatState.ts`: schema character, stats, action, effect, trigger, environment.
- `docs/TimelineEngine.ts`: hang doi su kien theo tick.
- `docs/FormulaEvaluator.ts`: evaluator chung cho numeric formula va boolean condition.
- `docs/ChoiceGenerator.ts`: loc lua chon hop le cho nguoi choi.
- `docs/SkillProcessor.ts`: thuc thi cong phap/hanh dong, tru tai nguyen, damage, heal, trigger.
- `docs/AIEngine.ts`: chon hanh dong cho doi thu.
- `docs/ModifierPipeline.ts`: tinh chi so hien tai tu base stats, buff va aura moi truong.
- `docs/TriggerEngine.ts`: kich hoat trigger theo su kien.
- `components/TestCombatPanel.tsx`: man setup test combat va UI combat test.

## 0. Implementation priority status

Trang thai theo roadmap hien tai:

- Phase 1: da co nen tang dynamic stat, combat phase/winner state, va modular effect handlers.
- Phase 2: da co timeline tick, tension battlefield co ban, delay theo speed, va dynamic choices theo HP/tag/realm.
- Phase 3: moi co diem moc qua tension/resource/effect extensibility; enlightenment, heart demons, artifact resonance chua tach thanh subsystem rieng.
- Phase 4: advanced AI, emergent narrative system, complex combat events chua hoan thien; engine da duoc tach module de trien khai tiep.

## 1. Mo hinh du lieu

### StatSnapshot

Moi nhan vat co `base_stats`. Cac chi so bat buoc hien tai:

- `hp`: sinh luc hien tai.
- `max_hp`: sinh luc toi da.
- `qi`: linh luc hien tai.
- `max_qi`: linh luc toi da.
- `speed`: toc do.
- `comprehension`: ngo tinh.

Code cung cho phep mo rong stat tuy y qua index signature, vi du:

- `attack`
- `qi_control`
- `sword_intent`
- `defense`

### Character

Mot combatant gom:

- `id`, `name`
- `realm_tier`: cap canh gioi.
- `base_stats`: chi so goc/hien tai dang bi thay doi truc tiep khi bi damage/heal/cost.
- `tags`: nhan dang dung cho dieu kien choice/trigger.
- `buffs`: buff rieng cua nhan vat.
- `ai_rules`: chi dung cho doi thu AI.
- `triggers`: cac phan ung dac biet khi co su kien.

### CombatAction

Mot hanh dong/cong phap gom:

- `id`
- `name`
- `costs`: chi phi tuy chon, vi du `{ qi: 8 }`.
- `effects`: danh sach effect.
- `narrative_template`: cau log khi bat dau hanh dong.

### CombatEffect

Effect hien tai ho tro:

- `damage`: tru HP cua target.
- `heal`: hoi HP cua target.
- `apply_buff`: hien moi ghi log, chua that su push buff vao character.

Moi effect co:

- `formula`: cong thuc tinh so luong.
- `target`: `self` hoac `enemy`.
- `narrative_template`: cau log rieng cho effect.

### CombatEnvironment

Moi truong gom:

- `id`, `name`
- `innate_auras`: aura ap dung vao pipeline tinh stat.
- `unlocked_choices`: du phong cho choice rieng theo moi truong.

## 2. Timeline va tick

Combat khong chay theo turn co dinh, ma dung hang doi su kien theo tick.

`TimelineEngine` co:

- `currentTick`: tick hien tai.
- `scheduleEvent(delayTicks, event)`: them su kien vao hang doi tai `currentTick + delayTicks`.
- `advanceToNextEvent()`: lay su kien som nhat, nhay den tick do va chay `execute()`.

Moi lan schedule, danh sach event duoc sort tang dan theo `tick`.

## 3. Bat dau combat

`startCombat(player, enemy, env)` lam cac viec:

1. Luu player, enemy, environment vao `ref`.
2. Reset timeline moi.
3. Tao log mo dau:
   - `You have encountered ...`
4. Schedule player evaluation o tick `0`.
5. Schedule enemy evaluation o tick `5`.
6. Goi `advanceTimeline()`.

Player evaluation o tick 0 se tao choices va pause timeline, nen UI cho nguoi choi chon truoc.

## 4. Pause/resume combat

Combat dung co che `isPausedRef`.

- Khi can nguoi choi ra quyet dinh, engine set `isPausedRef.current = true`.
- `advanceTimeline()` chi chay khi khong pause.
- Khi nguoi choi click choice, `handleChoice()` clear choices va set pause ve `false`, sau do timeline tiep tuc.

Pseudo-flow:

```text
startCombat
  schedule player evaluate at +0
  schedule enemy evaluate at +5
  advanceTimeline
    run player evaluate
    generate choices
    pause

player clicks choice
  schedule player action at +10
  unpause
  advanceTimeline
    run enemy events / player events by tick order
```

## 5. Luot nguoi choi

`evaluatePlayerTurn()`:

1. Tinh stat hien tai bang `ModifierPipeline.calculateCurrentStats(player, env)`.
2. Goi `ChoiceGenerator.generateValidChoices(...)`.
3. Set `activeChoices`.
4. Pause timeline.

`handleChoice(choice)`:

1. Ghi log: `You chose to: ...`.
2. Clear `activeChoices`.
3. Unpause.
4. Tim `CombatAction` tu `choice.action_id`.
5. Schedule player action sau `10` tick.
6. Khi action chay:
   - Goi `SkillProcessor.executeAction(...)`.
   - Xu ly triggered actions.
   - Xu ly triggered choices.
   - Update `playerStats`, `enemyStats`.
   - Schedule lan evaluate player tiep theo sau `20` tick.
7. Goi `advanceTimeline()`.

## 6. Luot doi thu AI

`evaluateEnemyTurn()`:

1. Goi `AIEngine.decideNextAction(enemy, player, env, allActions)`.
2. Neu co action:
   - Schedule action cua enemy sau `15` tick.
   - Khi action chay, goi `SkillProcessor.executeAction(...)`.
   - Xu ly triggered actions/choices.
   - Update stats.
   - Schedule enemy evaluation tiep theo sau `15` tick.
3. Neu khong co action:
   - Schedule enemy evaluation tiep theo sau `20` tick.

AI hien tai chon rule co `weight` cao nhat trong cac rule thoa dieu kien.

Dieu kien AI ho tro:

- `always`
- So sanh tren `self.<stat>`
- So sanh tren `target.<stat>`
- Doc field cua `env.<field>`

Vi du:

```ts
{ condition: 'always', action_id: 'act_enemy_claw', weight: 10 }
{ condition: 'self.hp < 45', action_id: 'act_enemy_blood', weight: 20 }
```

## 7. Loc choice

`ChoiceGenerator.generateValidChoices(...)` loc theo:

- `min_hp_percent`
- `max_hp_percent`
- `required_tags`

Schema co `required_realm_tier`, nhung code hien tai chua check dieu kien nay.

Vi du choice chi hien khi HP thap:

```ts
{
  id: 'choice_desperate',
  name: 'Tuyet dia phan kich',
  requirements: { max_hp_percent: 0.3 },
  action_id: 'act_desperate_counter'
}
```

## 8. Tinh stat, buff va aura

`ModifierPipeline.calculateCurrentStats(char, env)`:

1. Clone `char.base_stats`.
2. Lay tat ca buff tu:
   - `char.buffs`
   - `env.innate_auras`
3. Moi buff co `modifiers`, vi du:

```ts
{
  speed: 'base * 1.5',
  attack: 'base + 10'
}
```

4. Thay chu `base` bang gia tri stat hien tai.
5. Dung `eval` de tinh ket qua.

Ghi chu: day la prototype. Neu dua vao production, nen thay `eval` bang parser an toan nhu math parser rieng.

## 9. Xu ly action/cong phap

`SkillProcessor.executeAction(action, source, target, env, addLog)`:

1. Tinh `sourceStats` va `targetStats` qua `ModifierPipeline`.
2. Tao `narrativeData` de compile log.
3. Ghi log `action.narrative_template` neu co.
4. Tru cost:
   - Neu `action.costs = { qi: 8 }`, source bi tru `base_stats.qi -= 8`.
5. Chay tung effect.

### Damage

Damage flow:

1. Tinh `amount` tu formula.
2. Tru HP:

```ts
effectTarget.base_stats.hp = Math.max(0, effectTarget.base_stats.hp - amount)
```

3. Ghi log effect.
4. Goi trigger `on_take_damage` tren nguoi bi danh.

### Heal

Heal flow:

1. Tinh `amount` tu formula.
2. Cong HP nhung khong vuot `max_hp`:

```ts
effectTarget.base_stats.hp = Math.min(effectTarget.base_stats.max_hp, effectTarget.base_stats.hp + amount)
```

3. Ghi log effect.

### Formula

Formula ho tro:

- `self.<stat>`
- `target.<stat>`
- phep toan JS co ban

Vi du:

```ts
self.attack * 1.35 + self.comprehension * 1.2
self.max_hp * 0.14 + self.qi_control
target.max_hp * 0.2
```

## 10. Trigger

Trigger hien co schema:

- `event`: `on_take_damage`, `on_deal_damage`, `on_hp_threshold`
- `condition`
- `chance`
- `choice_id`
- `action_id`

Code hien tai moi goi trigger trong damage effect voi event `on_take_damage`.

Trigger flow:

1. Lay triggers cua nguoi bi damage co dung event.
2. Neu co `chance`, roll `Math.random()`.
3. Evaluate condition.
4. Neu pass:
   - them `choice_id` vao `triggeredChoices`
   - them `action_id` vao `triggeredActions`

Sau do `useCombatEngine`:

- Neu co `triggeredChoices`, them choice vao UI va pause timeline.
- Neu co `triggeredActions`, schedule action trigger sau `1` tick.

Vi du trigger phan kich trong test combat:

```ts
{
  event: 'on_take_damage',
  condition: 'context.amount >= 10',
  choice_id: 'choice_counterattack'
}
```

## 11. Narrative log

`NarrativeCompiler.compile(template, data)` thay placeholder dang `{source.name}`, `{target.name}`, `{amount}`, `{env.name}`.

Vi du template:

```text
{source.name} dan khi vao mui kiem, anh sang xanh quet qua {env.name}.
```

Neu data co:

```ts
source.name = 'Tu si'
env.name = 'Tam Ma Ao Canh'
```

Log se thanh:

```text
Tu si dan khi vao mui kiem, anh sang xanh quet qua Tam Ma Ao Canh.
```

## 12. Man Test Combat hien tai

`components/TestCombatPanel.tsx` co hai phase:

### Setup

Nguoi choi chon cau hinh hai ben qua dropdown:

- `Canh gioi`
- `Thuoc tinh`
- `Cong phap`
- `Chien thuat`

Sau do bam `Vao combat`.

### Combat

UI hien:

- Log moi nhat.
- HP hai ben.
- Choices cua nguoi choi.
- Combat log day du.

## 13. Cau hinh test combat

### Canh gioi

Hien co:

- `Luyen khi`: tier 1, khong bonus.
- `Truc co`: tier 2, bonus HP/Qi/attack.
- `Kim dan`: tier 3, bonus HP/Qi/attack cao hon.

### Thuoc tinh

Hien co:

- `Can bang`: on dinh.
- `Thiet cot than`: nhieu HP, cham hon.
- `Thien linh can`: nhieu Qi, tang `qi_control`, tang `comprehension`.
- `Anh bo than`: nhanh hon, HP thap hon.

### Cong phap nguoi choi

- `Thanh lien kiem quyet`: damage on dinh dua tren `attack` va `comprehension`.
- `Xich viem chan cong`: damage cao dua tren `attack` va `qi_control`, ton nhieu Qi.
- `Tinh lien tam phap`: vua heal vua damage nhe.

### Cong phap doi thu

- `Ma trao doat hon`: damage theo `attack` va `speed`.
- `Tam ma chu an`: damage theo `qi_control` va `comprehension`.
- `Huyet sat ma cong`: damage kem heal.

### Chien thuat

- `Can bang`: khong sua stat.
- `Cuong cong`: tang attack, giam HP.
- `Thu the`: tang HP, giam attack.
- `Toc chien`: tang speed va attack nhe.

## 14. Diem can hoan thien

Co che hien tai chay duoc cho prototype, nhung con cac diem can nang cap:

- Chua co dieu kien ket thuc combat khi HP ve 0.
- `apply_buff` moi ghi log, chua them buff vao character.
- `required_realm_tier` trong choice schema chua duoc check.
- `on_deal_damage` va `on_hp_threshold` co schema nhung chua duoc goi trong processor.
- Cost co the tru Qi xuong am, chua check du tai nguyen truoc khi cast.
- Formula va condition dang dung `eval`, can thay bang parser an toan khi production.
- AI dang chon rule co weight cao nhat, chua random theo weight.
- Enemy va player action dang dung cung target keyword `enemy`; can chuan hoa naming neu mo rong nhieu phe.
- Timeline co tick nhung chua dung `speed` de tinh delay hanh dong.
- Chua co UI win/lose, loot, reward, death/reincarnation sau combat.

## 15. Huong mo rong de nghi

Thu tu nang cap nen lam:

1. Them ket thuc combat: player win, enemy win, draw.
2. Check cost truoc khi hien/cast choice.
3. Lam buff that su co tac dung va het han theo tick.
4. Dua `speed` vao delay: speed cao thi action/evaluation nhanh hon.
5. Them defense/resistance/crit.
6. Thay `eval` bang formula evaluator an toan.
7. Tach data cong phap/canh gioi/thuoc tinh ra JSON hoac DB.
8. Lien ket combat result vao simulation chinh.
