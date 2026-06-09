# Combat Log

File nay mo ta combat log hien co trong prototype combat.

## Trang thai hien tai

Combat log da co trong code.

Vi tri chinh:

- `docs/useCombatEngine.ts`
  - State: `combatLogs`
  - Ham ghi log: `addLog(message)`
  - Return ra UI: `combatLogs`
- `docs/SkillProcessor.ts`
  - Ghi log khi cast action.
  - Ghi log khi tru cost.
  - Ghi log khi damage, heal, apply buff, restore resource, add tension.
- `components/TestCombatPanel.tsx`
  - Hien log moi nhat o phan narrative chinh.
  - Hien danh sach day du trong khu vuc `Combat Log`.
- `docs/NarrativeCompiler.ts`
  - Compile template thanh cau log co bien dong.

## Flow ghi log

Combat log hien tai la mang string trong hook combat:

```ts
const [combatLogs, setCombatLogs] = useState<string[]>([]);
```

Moi log moi duoc them bang:

```ts
const addLog = useCallback((message: string) => {
  setCombatLogs((prev) => [...prev, message]);
}, []);
```

## Cac thoi diem tao log

### 1. Bat dau combat

Khi `startCombat(player, enemy, env)` duoc goi:

```text
You have encountered {enemy.name} in the {env.name}! Realm suppression active.
```

### 2. Nguoi choi chon hanh dong

Khi click mot choice:

```text
You chose to: {choice.name}
```

### 3. Cast cong phap/action

Neu action co `narrative_template`, log se duoc compile tu template.

Vi du:

```ts
narrative_template: '{source.name} dan khi vao mui kiem, anh sang xanh quet qua {env.name}.'
```

Thanh:

```text
Tu si dan khi vao mui kiem, anh sang xanh quet qua Tam Ma Ao Canh.
```

### 4. Tru cost

Neu action ton tai nguyen:

```text
{source.name} consumed {cost} {stat}.
```

### 5. Damage

Damage effect ghi log theo `narrative_template` cua effect, neu co.

Vi du:

```text
Kiem quang chem trung Ao anh Tam Ma, gay 36 sat thuong.
```

### 6. Heal

Heal effect ghi log theo template:

```text
Tu si hoi phuc 24 sinh luc.
```

### 7. Restore resource

Effect `restore_resource` ghi log khi hoi Qi/HP resource:

```text
Tu si dieu hoa khi mach, hoi phuc 8 QI.
```

### 8. Battlefield tension

Effect `add_tension` ghi log khi chien truong cang thang hon:

```text
Khoanh khac sinh tu day sat khi len dinh diem.
```

### 9. Ket thuc combat

Khi HP mot ben ve 0:

```text
Ao anh Tam Ma collapses. The chapter closes in your favor.
```

hoac:

```text
Tu si falls as the battlefield goes silent.
```

## Template variables

`NarrativeCompiler` ho tro cac placeholder:

- `{source.name}`
- `{target.name}`
- `{env.name}`
- `{action.name}`
- `{amount}`
- `{stat}`
- `{cost}`
- `{buff_id}`
- `{tension}`

Data duoc lay bang dot-path, nen co the mo rong thanh:

```text
{source.realm_tier}
{target.base_stats.hp}
```

mien la object data co field tuong ung.

## UI hien thi

Trong `components/TestCombatPanel.tsx`:

- `latestLog` lay log moi nhat:

```ts
const latestLog = combatLogs[combatLogs.length - 1] ?? 'Tran test combat da san sang.';
```

- Full log render o cuoi panel:

```tsx
{combatLogs.map((log, index) => (
  <p key={`${log}-${index}`} className="narrative text-sm text-text-secondary">
    {log}
  </p>
))}
```

## Han che hien tai

- Log hien la `string[]`, chua co structured metadata.
- Chua co type log nhu `damage`, `heal`, `choice`, `trigger`, `tension`, `death`.
- Chua co timestamp/tick tren tung log entry.
- Chua co export combat log ra JSON/file runtime.
- Chua co narrator layer de bien log co hoc thanh van phong tieu thuyet tu tien.

## De xuat nang cap tiep theo

Nen doi combat log tu `string[]` sang structured object:

```ts
type CombatLogEntry = {
  id: string;
  tick: number;
  type: 'choice' | 'action' | 'damage' | 'heal' | 'buff' | 'resource' | 'tension' | 'trigger' | 'result';
  actorId?: string;
  targetId?: string;
  amount?: number;
  text: string;
  tension?: number;
};
```

Sau do UI van hien `entry.text`, nhung engine co the:

- filter log theo type
- replay combat
- export JSON
- generate chapter recap
- tao emergent narrative tu chuoi event

## Muc tieu cam xuc

Combat log khong chi de debug. No nen tao cam giac:

- co cang thang tang dan
- co bat ngo tu trigger
- co dau vet cua build nguoi choi
- co khoanh khac cao trao
- co mot cau chuyen ngan sau moi tran

Ly tuong moi combat log doc nhu mot doan trong tieu thuyet tu tien, khong chi la bang so.
