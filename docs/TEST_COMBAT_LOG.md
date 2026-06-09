# Test Combat Log

File nay tach rieng combat log cua man `Test Combat` de review nhanh cac cau narrative dang duoc dung trong prototype.

Nguon code hien tai:

- `components/TestCombatPanel.tsx`
- `docs/useCombatEngine.ts`
- `docs/SkillProcessor.ts`

## 1. Opening log

Duoc tao trong `startCombat()` cua `docs/useCombatEngine.ts`.

```text
You have encountered {enemy.name} in the {env.name}! Realm suppression active.
```

Voi Test Combat hien tai:

```text
You have encountered Ao anh Tam Ma in the Tam Ma Ao Canh! Realm suppression active.
```

## 2. Player choice log

Duoc tao khi nguoi choi click choice.

```text
You chose to: {choice.name}
```

Choice hien co trong Test Combat:

```text
You chose to: Van kiem khi, chem thang vao doi thu.
You chose to: Dot linh luc, phong ra xich viem.
You chose to: Thu tam thanh tinh, vua thu vua phan cong.
You chose to: Tinh tam dieu tuc, hoi phuc sinh luc.
You chose to: [Phan kich] Muon dau don danh nguoc.
```

## 3. Player technique logs

### Thanh lien kiem quyet

Action cast:

```text
{source.name} dan khi vao mui kiem, anh sang xanh quet qua {env.name}.
```

Cost:

```text
{source.name} consumed 8 QI.
```

Damage:

```text
Kiem quang chem trung {target.name}, gay {amount} sat thuong.
```

Tension:

```text
Kiem y vang len, sat khi trong {env.name} day them {amount} phan.
```

Example compiled:

```text
Tu si dan khi vao mui kiem, anh sang xanh quet qua Tam Ma Ao Canh.
Tu si consumed 8 QI.
Kiem quang chem trung Ao anh Tam Ma, gay 38 sat thuong.
Kiem y vang len, sat khi trong Tam Ma Ao Canh day them 4 phan.
```

### Xich viem chan cong

Action cast:

```text
{source.name} ket an, hoa khi cuon len thanh bien lua.
```

Cost:

```text
{source.name} consumed 14 QI.
```

Damage:

```text
Xich viem nuot lay {target.name}, gay {amount} sat thuong.
```

Tension:

```text
Bien lua bung len, the tran cang nhu day dan.
```

Example compiled:

```text
Tu si ket an, hoa khi cuon len thanh bien lua.
Tu si consumed 14 QI.
Xich viem nuot lay Ao anh Tam Ma, gay 58 sat thuong.
Bien lua bung len, the tran cang nhu day dan.
```

### Tinh lien tam phap

Action cast:

```text
{source.name} giu tam nhu mat nuoc, linh quang hoa thanh canh sen.
```

Cost:

```text
{source.name} consumed 6 QI.
```

Heal:

```text
{target.name} hoi phuc {amount} sinh luc.
```

Damage:

```text
Canh sen sac nhu dao cat vao {target.name}, gay {amount} sat thuong.
```

Restore Qi:

```text
{target.name} dieu hoa khi mach, hoi phuc {amount} {stat}.
```

Example compiled:

```text
Tu si giu tam nhu mat nuoc, linh quang hoa thanh canh sen.
Tu si consumed 6 QI.
Tu si hoi phuc 24 sinh luc.
Canh sen sac nhu dao cat vao Ao anh Tam Ma, gay 29 sat thuong.
Tu si dieu hoa khi mach, hoi phuc 8 QI.
```

## 4. Shared player actions

### Tinh Tam

Action cast:

```text
{source.name} khep mat, giu linh dai giua bien y niem hon loan.
```

Heal:

```text
{target.name} hoi phuc {amount} sinh luc.
```

Restore Qi:

```text
{target.name} bat duoc mot tia minh ngo, hoi phuc {amount} {stat}.
```

Example compiled:

```text
Tu si khep mat, giu linh dai giua bien y niem hon loan.
Tu si hoi phuc 34 sinh luc.
Tu si bat duoc mot tia minh ngo, hoi phuc 9 QI.
```

### Phan Kich

Action cast:

```text
{source.name} nuot dau don, phan kich trong mot hoi tho.
```

Damage:

```text
Don phan kich giang vao {target.name}, gay {amount} sat thuong.
```

Tension:

```text
Khoanh khac sinh tu day sat khi len dinh diem.
```

Example compiled:

```text
Tu si nuot dau don, phan kich trong mot hoi tho.
Don phan kich giang vao Ao anh Tam Ma, gay 39 sat thuong.
Khoanh khac sinh tu day sat khi len dinh diem.
```

## 5. Enemy technique logs

### Ma trao doat hon

Action cast:

```text
{source.name} lao toi bang ma trao mo ao.
```

Damage:

```text
Ma trao xe qua than hon {target.name}, gay {amount} sat thuong.
```

Tension:

```text
Am phong rit len, tam ma ep sat hon.
```

Example compiled:

```text
Ao anh Tam Ma lao toi bang ma trao mo ao.
Ma trao xe qua than hon Tu si, gay 40 sat thuong.
Am phong rit len, tam ma ep sat hon.
```

### Tam ma chu an

Action cast:

```text
{source.name} doc chu, am anh bam vao linh dai doi phuong.
```

Damage:

```text
Chu an danh vao {target.name}, gay {amount} sat thuong.
```

Tension:

```text
Chu an lam linh dai dao dong, tran chien them bat dinh.
```

Example compiled:

```text
Ao anh Tam Ma doc chu, am anh bam vao linh dai doi phuong.
Chu an danh vao Tu si, gay 34 sat thuong.
Chu an lam linh dai dao dong, tran chien them bat dinh.
```

### Huyet sat ma cong

Action cast:

```text
{source.name} dot huyet khi, khi tuc do tham tran ra.
```

Damage:

```text
Huyet khi danh vao {target.name}, gay {amount} sat thuong.
```

Heal:

```text
{target.name} hut lai huyet khi, hoi phuc {amount} sinh luc.
```

Tension:

```text
Mui huyet khi khien chien truong nang nhu thiet.
```

Example compiled:

```text
Ao anh Tam Ma dot huyet khi, khi tuc do tham tran ra.
Huyet khi danh vao Tu si, gay 32 sat thuong.
Ao anh Tam Ma hut lai huyet khi, hoi phuc 11 sinh luc.
Mui huyet khi khien chien truong nang nhu thiet.
```

## 6. Insufficient resource log

Neu actor khong du cost de cast action:

```text
{source.name} tried to form {action.name}, but their inner reserves faltered.
```

Example:

```text
Tu si tried to form Xich Viem, but their inner reserves faltered.
```

## 7. Trigger log

Trigger hien tai:

```ts
{
  event: 'on_take_damage',
  condition: 'context.amount >= 10',
  choice_id: 'choice_counterattack'
}
```

Trigger nay khong co log rieng luc kich hoat. No chi them choice:

```text
[Phan kich] Muon dau don danh nguoc.
```

De review tot hon, nen them log rieng trong tuong lai:

```text
Pain sharpens Tu si's intent. A counterattack window opens.
```

## 8. Combat end logs

Neu player thang:

```text
{enemy.name} collapses. The chapter closes in your favor.
```

Example:

```text
Ao anh Tam Ma collapses. The chapter closes in your favor.
```

Neu enemy thang:

```text
{player.name} falls as the battlefield goes silent.
```

Example:

```text
Tu si falls as the battlefield goes silent.
```

## 9. Review notes

Nhung log dang co van con lai tieng Anh o mot so cho:

- `You have encountered...`
- `Realm suppression active.`
- `You chose to...`
- `consumed`
- `tried to form...`
- `collapses...`
- `falls...`

Neu muon dong bo phong cach tien hiep tieng Viet, nen doi thanh:

```text
Tam Ma hien than trong Tam Ma Ao Canh. Uy ap canh gioi bat dau de nang len than hon.
Nguoi choi lua chon: Van kiem khi, chem thang vao doi thu.
Tu si tieu hao 8 QI.
Tu si muon ket an Xich Viem, nhung linh luc trong kinh mach da can.
Ao anh Tam Ma tan ra. Mot chuong chien dau khep lai trong chien thang.
Tu si guc xuong, Tam Ma Ao Canh chim vao tinh lang.
```

## 10. Suggested structured version

De sau nay review/replay de hon, Test Combat log nen doi tu string sang object:

```ts
type TestCombatLogEntry = {
  tick: number;
  type: 'opening' | 'choice' | 'cast' | 'cost' | 'damage' | 'heal' | 'resource' | 'tension' | 'trigger' | 'result';
  actor: 'player' | 'enemy' | 'system';
  text: string;
  amount?: number;
  tension?: number;
  actionId?: string;
};
```

Luc do co the export mot tran test combat thanh JSON de review balance.
