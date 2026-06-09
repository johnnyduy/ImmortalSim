'use client';

import { useMemo, useState } from 'react';
import type { Character, CombatAction, CombatEnvironment, StatSnapshot } from '../docs/CombatState';
import type { ChoiceRule } from '../docs/ChoiceGenerator';
import { getCultivationStatus, calculateCombatPower as calculateCombatPowerUnified } from '../lib/cultivation-states';

type FighterSide = 'player' | 'enemy';
type FighterConfig = {
  realm: string;
  physique: string;
  technique: string;
  tactic: string;
};

type Option<T extends string = string> = {
  id: T;
  label: string;
  description?: string;
};

import combatConfig from '../data/combat-config.json';

const REALMS: Array<Option & { tier: number; bonus: Partial<StatSnapshot> }> = combatConfig.realms as any;
const PHYSIQUES: Array<Option & { bonus: Partial<StatSnapshot>; tags: string[] }> = combatConfig.physiques as any;
const TECHNIQUES: Array<Option & { action: CombatAction; choiceText: string }> = combatConfig.techniques as any;
const ENEMY_ARTS: Array<Option & { action: CombatAction }> = combatConfig.enemy_arts as any;
const TACTICS: Option[] = combatConfig.tactics;
const NPC_TEMPLATES = combatConfig.npcs;

const calculateCombatPower = (stats: StatSnapshot, realmId: string) => {
  const realm = REALMS.find((r) => r.id === realmId) ?? REALMS[0];
  let subStageIndex = 0;
  if (realm.tier >= 4.0) {
    const subIdx = Math.round((realm.tier - 4.0) * 100) - 1;
    subStageIndex = 20 + Math.max(0, subIdx) + 1;
  } else if (realm.tier >= 3.0) {
    const subIdx = Math.round((realm.tier - 3.0) * 100) - 1;
    subStageIndex = 16 + Math.max(0, subIdx) + 1;
  } else if (realm.tier >= 2.0) {
    const subIdx = Math.round((realm.tier - 2.0) * 100) - 1;
    subStageIndex = 12 + Math.max(0, subIdx) + 1;
  } else if (realm.tier >= 1.0) {
    const layer = Math.round((realm.tier - 1.0) * 100);
    subStageIndex = Math.max(1, layer);
  }
  
  return calculateCombatPowerUnified(
    stats.max_hp,
    stats.attack,
    stats.speed,
    stats.qi_control,
    stats.comprehension,
    stats.max_qi,
    subStageIndex
  );
};

const evaluateMatchup = (pCP: number, eCP: number) => {
  if (pCP > eCP * 1.3) {
    return "Bạn cảm nhận được linh áp của đối thủ yếu hơn rõ rệt. Trận chiến này phần thắng nằm chắc trong tay!";
  } else if (eCP > pCP * 1.3) {
    return "Áp lực đè nặng, linh khí của đối phương cuồn cuộn ép tới. Ma nhân có chiến lực vượt trội hơn bạn rất nhiều, thế trận vô cùng nguy hiểm!";
  } else {
    return "Linh lực hai bên va chạm chói tai. Đây là một trận đấu cân sức, kẻ thắng người thua chỉ phân định trong một khoảnh khắc sơ hở.";
  }
};

const BASE_STATS: StatSnapshot = {
  hp: 100,
  max_hp: 100,
  qi: 60,
  max_qi: 60,
  speed: 10,
  comprehension: 8,
  attack: 18,
  qi_control: 10,
};

const DEFAULT_PLAYER: FighterConfig = {
  realm: 'qi_1',
  physique: 'spirit_root',
  technique: 'sword',
  tactic: 'balanced',
};

const DEFAULT_ENEMY: FighterConfig = {
  realm: 'qi_1',
  physique: 'iron_body',
  technique: 'claw',
  tactic: 'aggressive',
};

type Props = {
  onExit: () => void;
};

const getById = <T extends Option>(items: T[], id: string) => items.find((item) => item.id === id) ?? items[0];

const addStats = (base: StatSnapshot, bonus: Partial<StatSnapshot>) => {
  const next = { ...base };
  for (const [key, value] of Object.entries(bonus)) {
    next[key] = Math.max(key === 'hp' || key === 'max_hp' ? 1 : 0, (next[key] ?? 0) + (value ?? 0));
  }
  return next;
};

const applyTactic = (stats: StatSnapshot, tacticId: string) => {
  const next = { ...stats };
  if (tacticId === 'aggressive') {
    next.attack += 8;
    next.hp = Math.max(1, next.hp - 15);
    next.max_hp = Math.max(1, next.max_hp - 15);
  }
  if (tacticId === 'defensive') {
    next.attack = Math.max(1, next.attack - 4);
    next.hp += 35;
    next.max_hp += 35;
  }
  if (tacticId === 'swift') {
    next.speed += 4;
    next.attack += 3;
  }
  return next;
};

const buildStats = (config: FighterConfig) => {
  const realm = getById(REALMS, config.realm);
  const physique = getById(PHYSIQUES, config.physique);
  return applyTactic(addStats(addStats(BASE_STATS, realm.bonus), physique.bonus), config.tactic);
};

const buildPlayerChoices = (config: FighterConfig): ChoiceRule[] => {
  const technique = getById(TECHNIQUES, config.technique);
  return [
    {
      id: 'choice_primary',
      name: technique.choiceText,
      requirements: {},
      action_id: technique.action.id,
    },
    {
      id: 'choice_meditate',
      name: 'Tinh tam dieu tuc, hoi phuc sinh luc.',
      requirements: {},
      action_id: 'act_meditate',
    },
    {
      id: 'choice_counterattack',
      name: '[Phan kich] Muon dau don danh nguoc.',
      requirements: {},
      action_id: 'act_counterattack',
    },
  ];
};

const buildActions = (playerConfig: FighterConfig, enemyConfig: FighterConfig): CombatAction[] => {
  const playerTechnique = getById(TECHNIQUES, playerConfig.technique);
  const enemyArt = getById(ENEMY_ARTS, enemyConfig.technique);
  return [
    playerTechnique.action,
    enemyArt.action,
    {
      id: 'act_meditate',
      name: 'Tinh Tam',
      narrativeTags: ['lotus', 'calm', 'enlightenment'],
      intentType: 'lotus',
      dangerRating: 2,
      narrative_template: '{source.name} khep mat, giu linh dai giua bien y niem hon loan.',
      effects: [
        {
          type: 'heal',
          formula: 'self.max_hp * 0.14 + self.qi_control',
          target: 'self',
          narrative_template: '{target.name} hoi phuc {amount} sinh luc.',
        },
        {
          type: 'restore_resource',
          resource: 'qi',
          formula: 'self.comprehension * 0.8',
          target: 'self',
          narrative_template: '{target.name} bat duoc mot tia minh ngo, hoi phuc {amount} {stat}.',
        },
      ],
    },
    {
      id: 'act_counterattack',
      name: 'Phan Kich',
      narrativeTags: ['sword', 'near_death', 'momentum'],
      intentType: 'sword',
      dangerRating: 8,
      narrative_template: '{source.name} nuot dau don, phan kich trong mot hoi tho.',
      effects: [
        {
          type: 'damage',
          formula: 'self.attack * 1.2 + self.speed',
          target: 'enemy',
          narrative_template: 'Don phan kich giang vao {target.name}, gay {amount} sat thuong.',
        },
        {
          type: 'add_tension',
          formula: '10',
          target: 'self',
          narrative_template: 'Khoanh khac sinh tu day sat khi len dinh diem.',
        },
      ],
    },
  ];
};

const buildCharacter = (
  side: FighterSide,
  config: FighterConfig,
  name: string,
  enemyActionId?: string
): Character => {
  const realm = getById(REALMS, config.realm);
  const physique = getById(PHYSIQUES, config.physique);
  const stats = buildStats(config);

  return {
    id: side === 'player' ? 'p1' : 'e1',
    name: name,
    realm_tier: realm.tier,
    base_stats: stats,
    tags: [...physique.tags, config.tactic],
    buffs: [],
    triggers:
      side === 'player'
        ? [{ event: 'on_take_damage', condition: 'context.amount >= 10', choice_id: 'choice_counterattack' }]
        : [],
    ai_rules:
      side === 'enemy' && enemyActionId
        ? [
            { condition: 'always', action_id: enemyActionId, weight: 10 },
            { condition: 'self.hp < 45', action_id: enemyActionId, weight: 20 },
          ]
        : undefined,
  };
};

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-widest text-text-tertiary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border border-lunar/25 bg-[rgba(15,14,11,0.72)] px-4 py-3 text-sm text-lunar outline-none transition hover:border-lunar/45 focus:border-lunar/60"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-background text-lunar">
            {option.label}
          </option>
        ))}
      </select>
      <span className="block min-h-5 text-xs text-text-tertiary">
        {options.find((option) => option.id === value)?.description}
      </span>
    </label>
  );
}

function StatPreview({ title, config }: { title: string; config: FighterConfig }) {
  const stats = buildStats(config);
  const realm = getById(REALMS, config.realm);

  return (
    <div className="border-l-2 border-accent/40 bg-panel/55 px-4 py-3">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-xs uppercase tracking-widest text-text-tertiary">{title}</p>
        <p className="text-xs uppercase tracking-widest text-text-tertiary">{realm.label}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <span className="text-text-secondary">HP {stats.hp}</span>
        <span className="text-text-secondary">Qi {stats.qi}</span>
        <span className="text-text-secondary">Atk {stats.attack}</span>
        <span className="text-text-secondary">Spd {stats.speed}</span>
        <span className="text-text-secondary">Ctrl {stats.qi_control}</span>
        <span className="text-text-secondary">Comp {stats.comprehension}</span>
      </div>
    </div>
  );
}

export default function TestCombatPanel({ onExit }: Props) {
  const [phase, setPhase] = useState<'setup' | 'combat'>('setup');
  const [playerConfig, setPlayerConfig] = useState<FighterConfig>(DEFAULT_PLAYER);
  const [enemyConfig, setEnemyConfig] = useState<FighterConfig>(DEFAULT_ENEMY);
  const [npcName, setNpcName] = useState('Ao anh Tam Ma');

  // Local state for simplified narrative combat
  const [combatPhase, setCombatPhase] = useState<'setup' | 'active' | 'finished'>('setup');
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [winner, setWinner] = useState<'player' | 'enemy' | 'escaped' | null>(null);
  const [usedSecretTreasure, setUsedSecretTreasure] = useState(false);
  const [playerCurrentHp, setPlayerCurrentHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(100);
  const [enemyMaxHp, setEnemyMaxHp] = useState(100);
  const [playerCP, setPlayerCP] = useState(0);
  const [enemyCP, setEnemyCP] = useState(0);
  const [battlefieldTension, setBattlefieldTension] = useState(0);

  const updateConfig = (side: FighterSide, key: keyof FighterConfig, value: string) => {
    const setter = side === 'player' ? setPlayerConfig : setEnemyConfig;
    setter((current) => ({ ...current, [key]: value }));
  };

  const startConfiguredCombat = () => {
    const pStats = buildStats(playerConfig);
    const eStats = buildStats(enemyConfig);

    setPlayerCurrentHp(pStats.hp);
    setPlayerMaxHp(pStats.max_hp);
    setEnemyCurrentHp(eStats.hp);
    setEnemyMaxHp(eStats.max_hp);

    const calculatedPlayerCP = calculateCombatPower(pStats, playerConfig.realm);
    const calculatedEnemyCP = calculateCombatPower(eStats, enemyConfig.realm);
    setPlayerCP(calculatedPlayerCP);
    setEnemyCP(calculatedEnemyCP);

    setBattlefieldTension(Math.floor(Math.random() * 20) + 10);
    setCombatPhase('active');
    setWinner(null);
    setUsedSecretTreasure(false);
    
    const matchupText = evaluateMatchup(calculatedPlayerCP, calculatedEnemyCP);
    setCombatLogs([
      `Trận đấu thực nghiệm Ma Cảnh bắt đầu! Đối thủ của bạn là: ${npcName}.`,
      `[Thống Kê Chiến Lực] Tu sĩ: ${calculatedPlayerCP} CP vs ${npcName}: ${calculatedEnemyCP} CP.`,
      matchupText
    ]);
    setPhase('combat');
  };

  const handleFight = () => {
    const winChance = playerCP / (playerCP + enemyCP);
    const isVictory = Math.random() < winChance;

    if (isVictory) {
      setWinner('player');
      setEnemyCurrentHp(0);
      setCombatLogs((prev) => [
        ...prev,
        `> Bạn lựa chọn: QUYẾT CHIẾN SINH TỬ.`,
        `Hai bên kịch chiến liên tục. Kinh mạch gầm rú, linh quang va chạm chói lòa chấn động ảo cảnh.`,
        `Tận dụng sơ hở khi đối thủ xoay người ra chiêu, bạn xuất thủ thần tốc, đâm một kiếm chí mạng xuyên đan điền của đối thủ.`,
        `Ảo ảnh ${npcName} gục xuống tan rã. Trận chiến kết thúc trong thắng lợi vẻ vang!`
      ]);
    } else {
      setWinner('enemy');
      setPlayerCurrentHp(0);
      setCombatLogs((prev) => [
        ...prev,
        `> Bạn lựa chọn: QUYẾT CHIẾN SINH TỬ.`,
        `Sức ép ma công quá lớn. Sát chiêu của đối thủ quỷ dị biến ảo khôn lường, ma trảo quỷ mị rít gào trong không trung.`,
        `Hộ thể chân khí của bạn bị ma trảo của đối thủ xé toạc, đòn đánh tàn độc oanh kích trực tiếp vào ngực trái.`,
        `Linh đài của bạn sụp đổ hoàn toàn, bạn bất tỉnh gục xuống trong ma cảnh. Bạn đã bại trận!`
      ]);
    }
    setCombatPhase('finished');
  };

  const handleBurnBlood = () => {
    setWinner('escaped');
    const costHp = Math.round(playerMaxHp * 0.4);
    const newHp = Math.max(1, playerCurrentHp - costHp);
    setPlayerCurrentHp(newHp);

    setCombatLogs((prev) => [
      ...prev,
      `> Bạn lựa chọn: THI TRIỂN "NHIÊN HUYẾT THUẬT" BỎ CHẠY.`,
      `Nhận thấy đối phương quá mạnh, không thể đối địch, bạn quyết định thi triển Nhiên Huyết Thuật.`,
      `Tinh huyết bùng cháy hóa thành một làn sương máu rực rỡ bao phủ cơ thể, tăng vọt tốc độ của bạn lên gấp mười lần.`,
      `Bạn biến thành một vệt huyết quang bay vọt khỏi chiến trường, thoát khỏi ma cảnh thành công.`,
      `Tuy nhiên, việc thi triển cấm thuật khiến chân thể tổn thương nghiêm trọng (Mất đi 40% Sinh lực: -${costHp} HP).`
    ]);
    setCombatPhase('finished');
  };

  const handleUseTreasure = () => {
    setWinner('player');
    setEnemyCurrentHp(0);
    setUsedSecretTreasure(true);

    setCombatLogs((prev) => [
      ...prev,
      `> Bạn lựa chọn: SỬ DỤNG BÍ BẢO MỘT LẦN.`,
      `Bạn lấy ra chiếc ngọc phù cổ xưa mang theo lực lượng hủy thiên diệt địa – món bí bảo hộ mệnh duy nhất của kiếp này.`,
      `Bí bảo vỡ tan, giải phóng lôi kiếp vô tận nhấn chìm và nghiền nát đối thủ thành tro bụi trong tích tắc.`,
      `Đối thủ bị tiêu diệt hoàn toàn. Chiến thắng oanh liệt thuộc về bạn nhờ uy lực bí bảo.`
    ]);
    setCombatPhase('finished');
  };

  const handleExportLogs = () => {
    if (combatLogs.length === 0) return;
    let winnerText = 'Hòa';
    if (winner === 'player') winnerText = 'Tu sĩ Thắng (Chiến thắng)';
    else if (winner === 'enemy') winnerText = 'Tam Ma Thắng (Thất bại)';
    else if (winner === 'escaped') winnerText = 'Thoát chạy (Nhiên Huyết Thuật)';

    const header = `=== IMMORTALSIM COMBAT LOG (NARRATIVE RESOLVE) ===\n` +
      `Tu Si CP: ${playerCP} | ${npcName} CP: ${enemyCP}\n` +
      `Result: ${winnerText}\n` +
      `==================================================\n\n`;
    const content = header + combatLogs.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `combat_log_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const latestLog = combatLogs[combatLogs.length - 1] ?? 'Trận đấu thực nghiệm Ma Cảnh đã sẵn sàng.';

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-10 py-12 px-0 sm:px-8">
        <div className="space-y-4">
          <button
            type="button"
            onClick={onExit}
            className="text-xs uppercase tracking-widest text-text-tertiary transition hover:text-text-secondary"
          >
            Quay lai
          </button>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs uppercase tracking-widest text-text-tertiary">Test Combat</span>
            <span className="text-xs uppercase tracking-widest text-success">Setup</span>
          </div>
          <h2 className="narrative-large text-text-primary">Thiet lap giao chien</h2>
          <p className="narrative text-text-secondary leading-relaxed tracking-wide">
            Tuy chon thuoc tinh, cong phap va chien thuat cua hai ben truoc khi vao Tam Ma Ao Canh.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="space-y-5">
            <h3 className="text-sm uppercase tracking-widest text-lunar">Ben nguoi choi</h3>
            <SelectField
              label="Canh gioi"
              value={playerConfig.realm}
              options={REALMS}
              onChange={(value) => updateConfig('player', 'realm', value)}
            />
            <SelectField
              label="Thuoc tinh"
              value={playerConfig.physique}
              options={PHYSIQUES}
              onChange={(value) => updateConfig('player', 'physique', value)}
            />
            <SelectField
              label="Cong phap"
              value={playerConfig.technique}
              options={TECHNIQUES}
              onChange={(value) => updateConfig('player', 'technique', value)}
            />
            <SelectField
              label="Chien thuat"
              value={playerConfig.tactic}
              options={TACTICS}
              onChange={(value) => updateConfig('player', 'tactic', value)}
            />
            <StatPreview title="Du kien tu si" config={playerConfig} />
          </section>

          <section className="space-y-5">
            <h3 className="text-sm uppercase tracking-widest text-lunar">Ben doi thu</h3>
            <label className="block space-y-2 text-left">
              <span className="text-xs uppercase tracking-widest text-text-tertiary">Chọn Đối Thủ (NPC)</span>
              <select
                onChange={(event) => {
                  const selectedNpc = NPC_TEMPLATES.find((n) => n.id === event.target.value);
                  if (selectedNpc) {
                    setEnemyConfig({
                      realm: selectedNpc.realm,
                      physique: selectedNpc.physique,
                      technique: selectedNpc.technique,
                      tactic: selectedNpc.tactic,
                    });
                    setNpcName(selectedNpc.name);
                  }
                }}
                className="w-full rounded-sm border border-lunar/25 bg-[rgba(15,14,11,0.72)] px-4 py-3 text-sm text-lunar outline-none transition hover:border-lunar/45 focus:border-lunar/60"
              >
                {NPC_TEMPLATES.map((npc) => (
                  <option key={npc.id} value={npc.id} className="bg-background text-lunar">
                    {npc.name} ({npc.description.slice(0, 32)}...)
                  </option>
                ))}
              </select>
            </label>
            <SelectField
              label="Canh gioi"
              value={enemyConfig.realm}
              options={REALMS}
              onChange={(value) => updateConfig('enemy', 'realm', value)}
            />
            <SelectField
              label="Thuoc tinh"
              value={enemyConfig.physique}
              options={PHYSIQUES}
              onChange={(value) => updateConfig('enemy', 'physique', value)}
            />
            <SelectField
              label="Cong phap"
              value={enemyConfig.technique}
              options={ENEMY_ARTS}
              onChange={(value) => updateConfig('enemy', 'technique', value)}
            />
            <SelectField
              label="Chien thuat"
              value={enemyConfig.tactic}
              options={TACTICS}
              onChange={(value) => updateConfig('enemy', 'tactic', value)}
            />
            <StatPreview title="Du kien tam ma" config={enemyConfig} />
          </section>
        </div>

        <div className="flex flex-wrap gap-4 border-t border-accent/15 pt-8">
          <button
            type="button"
            onClick={startConfiguredCombat}
            className="px-8 py-4 text-sm uppercase tracking-wider rounded-sm border border-lunar/35 bg-[rgba(35,30,22,0.78)] text-lunar shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(232,220,192,0.18)] backdrop-blur-sm transition hover:border-lunar/55 hover:bg-[rgba(67,55,35,0.86)] hover:text-white font-semibold"
          >
            Vao combat
          </button>
          <button
            type="button"
            onClick={() => {
              setPlayerConfig(DEFAULT_PLAYER);
              setEnemyConfig(DEFAULT_ENEMY);
            }}
            className="px-8 py-4 text-sm uppercase tracking-wider rounded-sm border border-lunar/25 bg-[rgba(15,14,11,0.58)] text-lunar/85 transition hover:border-lunar/45 hover:bg-[rgba(35,30,22,0.78)]"
          >
            Dat lai cau hinh
          </button>
        </div>
      </div>
    );
  }

  // 1. Resolve player stats for dynamic xianxia statuses
  const currentPlayerHp = playerCurrentHp;
  const maxPlayerHp = playerMaxHp;
  const currentPlayerQi = buildStats(playerConfig).qi;
  const currentPlayerDef = Math.round((currentPlayerHp / maxPlayerHp) * 100);

  const playerCultStatus = getCultivationStatus(
    currentPlayerHp,
    maxPlayerHp,
    currentPlayerQi,
    buildStats(playerConfig).max_qi,
    currentPlayerDef,
    100,
    playerConfig.realm
  );

  // 2. Resolve enemy stats (with perception check)
  const currentEnemyHp = enemyCurrentHp;
  const maxEnemyHp = enemyMaxHp;
  const currentEnemyQi = buildStats(enemyConfig).qi;
  const maxEnemyQi = buildStats(enemyConfig).max_qi;
  const currentEnemyDef = Math.round((currentEnemyHp / maxEnemyHp) * 100);

  const enemyRawStatus = getCultivationStatus(
    currentEnemyHp,
    maxEnemyHp,
    currentEnemyQi,
    maxEnemyQi,
    currentEnemyDef,
    100,
    enemyConfig.realm
  );

  // Perception check based on player's Comprehension
  const playerComp = buildStats(playerConfig).comprehension;
  
  let enemyHpText = "";
  let enemyDefText = "";
  let enemyQiText = "";

  if (playerComp >= 12) {
    // High comprehension: perfect reading
    enemyHpText = `[${enemyRawStatus.hpLabel}]: ${enemyRawStatus.hpText}`;
    enemyDefText = `[${enemyRawStatus.defLabel}]: ${enemyRawStatus.defText}`;
    enemyQiText = `[${enemyRawStatus.qiLabel}]: ${enemyRawStatus.qiText}`;
  } else if (playerComp >= 7) {
    // Medium comprehension: slightly fuzzy
    const hpFuzzy = currentEnemyHp / maxEnemyHp;
    if (hpFuzzy >= 0.9) {
      enemyHpText = "Khí tức đối thủ bình ổn, sinh cơ hoàn hảo.";
    } else if (hpFuzzy >= 0.75) {
      enemyHpText = "Khí tức đối thủ hơi suy giảm nhẹ.";
    } else if (hpFuzzy >= 0.45) {
      enemyHpText = "Khí tức đối thủ chao đảo, dường như đã bị thương.";
    } else if (hpFuzzy >= 0.2) {
      enemyHpText = "Khí tức đối thủ suy bại rõ rệt, hơi thở dồn dập.";
    } else {
      enemyHpText = "Sinh mệnh đối thủ dao động dữ dội, dầu cạn đèn tắt.";
    }
    enemyDefText = "Thần sắc lộ vẻ phòng thủ sơ hở.";
    enemyQiText = "Linh khí quanh thân chập chờn bất ổn.";
  } else {
    // Low comprehension: completely fuzzy
    enemyHpText = "Khí tức đối thủ mờ mịt bất định, khó lòng dò xét.";
    enemyDefText = "Chân khí bảo vệ mông lung, khói sương che khuất.";
    enemyQiText = "Linh quang lúc thịnh lúc suy, thâm sâu khó lường.";
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-5 sm:px-8 bg-[#0c0a09]/95 border-2 border-[#c5a059] shadow-[8px_8px_0px_#000] rounded-sm text-text-primary">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setPhase('setup')}
          className="w-fit text-xs uppercase tracking-widest text-[#e5c17b] hover:text-white border border-[#3e3328] hover:border-[#c5a059] px-3 py-1.5 bg-black/40 transition-all font-serif"
        >
          ← Chỉnh Cấu Hình
        </button>
        <div className="flex items-center justify-between border-b border-[#3e3328]/55 pb-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Ma Cảnh Thực Nghiệm</span>
          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 bg-orange-950/40 border border-orange-800/40 text-orange-400 text-[10px] font-serif uppercase tracking-widest font-bold">
              Sát khí: {Math.round(battlefieldTension)}%
            </span>
            <span className="px-2.5 py-0.5 bg-red-950/40 border border-red-800/40 text-red-400 text-[10px] font-serif uppercase tracking-widest font-bold">
              {combatPhase === 'finished' ? 'Chiến đấu kết thúc' : 'Quyết chiến hoạt kích'}
            </span>
          </div>
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#e5c17b] tracking-wider uppercase" style={{ textShadow: '2px 2px 0px #000' }}>
          {npcName} Ảo Cảnh
        </h2>
        <p className="narrative text-[#e8dcc0] leading-relaxed text-xl sm:text-2xl italic border-l-2 border-[#c5a059] pl-3 py-1">
          {latestLog}
        </p>
        {winner && (
          <div className="pt-2 text-center">
            <span className="inline-block px-6 py-2 bg-yellow-950/30 border-2 border-[#c5a059] text-[#e5c17b] font-serif text-lg font-bold uppercase tracking-widest shadow-[4px_4px_0px_#000] animate-bounce">
              {winner === 'player' && '🎉 Tu sĩ chiến thắng!'}
              {winner === 'enemy' && '💀 Đạo tâm sụp đổ, Thất bại!'}
              {winner === 'escaped' && '💨 Thi triển cấm thuật, Trốn chạy thành công!'}
            </span>
          </div>
        )}
      </div>

      {/* So sánh Chiến lực */}
      <div className="border border-[#3e3328]/55 bg-black/30 px-4 py-3 rounded-sm space-y-2">
        <div className="flex justify-between items-baseline text-xs uppercase tracking-widest text-[#847764] font-serif font-bold">
          <span>Chiến lực Tu Sĩ: <strong className="text-[#e5c17b]">{playerCP}</strong></span>
          <span>Chiến lực Đối Thủ: <strong className="text-red-400">{enemyCP}</strong></span>
        </div>
        <div className="h-2 bg-[#1a1512] rounded-full overflow-hidden flex">
          <div 
            style={{ width: `${(playerCP / (playerCP + enemyCP || 1)) * 100}%` }} 
            className="h-full bg-gradient-to-r from-yellow-600 to-[#e5c17b]" 
          />
          <div 
            style={{ width: `${(enemyCP / (playerCP + enemyCP || 1)) * 100}%` }} 
            className="h-full bg-gradient-to-r from-red-800 to-red-500" 
          />
        </div>
        <p className="text-sm font-serif italic text-[#e8dcc0]">
          {evaluateMatchup(playerCP, enemyCP)}
        </p>
      </div>

      {/* Dynamic Cultivation State displays instead of HP numbers - Flat, column layout without nested boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-[#3e3328]/55 py-4 my-2">
        {/* Player State Column */}
        <div className="space-y-3 md:pr-4">
          <p className="text-base sm:text-lg uppercase tracking-widest text-[#c5a059] font-serif font-bold flex justify-between border-b border-[#3e3328]/35 pb-1">
            <span>Bản tôn (Tu sĩ)</span>
            <span className="text-success text-xs font-sans font-normal">[Hưng Thịnh]</span>
          </p>
          <div className="space-y-2 text-base sm:text-lg font-serif">
            <p className="text-red-400 font-medium">
              <span className="text-text-secondary">[{playerCultStatus.hpLabel}]:</span> {playerCultStatus.hpText}
            </p>
            <p className="text-blue-400 font-medium">
              <span className="text-text-secondary">[{playerCultStatus.qiLabel}]:</span> {playerCultStatus.qiText}
            </p>
            <p className="text-emerald-400 font-medium">
              <span className="text-text-secondary">[{playerCultStatus.defLabel}]:</span> {playerCultStatus.defText}
            </p>
          </div>
        </div>

        {/* Enemy State Column */}
        <div className="space-y-3 md:pl-4 md:border-l border-[#3e3328]/45">
          <p className="text-base sm:text-lg uppercase tracking-widest text-red-400 font-serif font-bold flex justify-between border-b border-[#3e3328]/35 pb-1">
            <span>{npcName}</span>
            <span className="text-danger text-xs font-sans font-normal">[Đối Nghịch]</span>
          </p>
          <div className="space-y-2 text-base sm:text-lg font-serif">
            <p className="text-red-400 font-medium">{enemyHpText}</p>
            <p className="text-blue-400 font-medium">{enemyQiText}</p>
            <p className="text-emerald-400 font-medium">{enemyDefText}</p>
          </div>
        </div>
      </div>

      {/* Action choices buttons - flat clean button rows, font size increased to text-base/text-lg */}
      <section className="space-y-3 py-2">
        <p className="text-xs uppercase tracking-widest text-[#847764] font-serif font-bold">Quyết định của bạn</p>
        <div className="flex flex-col gap-2">
          {combatPhase === 'finished' ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => {
                  setPhase('setup');
                  setCombatPhase('setup');
                }}
                className="flex-1 text-center px-6 py-4 rounded-sm border-2 border-[#c5a059] bg-[#1a1512] text-[#e5c17b] font-serif font-bold uppercase tracking-widest shadow-[4px_4px_0px_#000] hover:bg-[#c5a059] hover:text-black hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
              >
                Thiết lập trận mới
              </button>
              <button
                type="button"
                onClick={handleExportLogs}
                className="flex-1 text-center px-6 py-4 rounded-sm border-2 border-emerald-800 bg-emerald-950/20 text-emerald-400 font-serif font-bold uppercase tracking-widest shadow-[4px_4px_0px_#000] hover:bg-emerald-600 hover:text-black hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
              >
                Xuất Combat Log (Export Log)
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleFight}
                className="block w-full text-left px-5 py-4 rounded-sm border border-[#c5a059] bg-[#1e1915] text-[#e5c17b] font-serif text-lg sm:text-xl font-bold hover:bg-[#c5a059] hover:text-black transition-all duration-150 shadow-[4px_4px_0px_#000]"
              >
                <span className="text-[#847764] mr-2">【 1 】</span>
                Quyết chiến sinh tử (Dựa trên chênh lệch chiến lực)
              </button>
              
              <button
                type="button"
                onClick={handleBurnBlood}
                className="block w-full text-left px-5 py-4 rounded-sm border border-red-800 bg-[#251515] text-red-400 font-serif text-lg sm:text-xl font-bold hover:bg-red-800 hover:text-white transition-all duration-150 shadow-[4px_4px_0px_#000]"
              >
                <span className="text-red-900 mr-2">【 2 】</span>
                Thi triển "Nhiên Huyết Thuật" (Đốt máu thoát thân: Tiêu hao 40% máu tối đa)
              </button>

              <button
                type="button"
                onClick={handleUseTreasure}
                disabled={usedSecretTreasure}
                className="block w-full text-left px-5 py-4 rounded-sm border border-emerald-800 bg-[#152518] text-emerald-400 font-serif text-lg sm:text-xl font-bold hover:bg-emerald-800 hover:text-white transition-all duration-150 disabled:opacity-30 disabled:hover:bg-[#152518] disabled:hover:text-emerald-400 disabled:cursor-not-allowed shadow-[4px_4px_0px_#000]"
              >
                <span className="text-emerald-900 mr-2">【 3 】</span>
                Sử dụng "Bí Bảo 1 lần" (Giải phóng ngọc phù diệt địch lập tức) {usedSecretTreasure && "(Đã sử dụng)"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* High contrast log container - flat layout without border shadow */}
      <div className="space-y-3 pt-4 border-t border-[#3e3328]/55">
        <p className="text-xs font-serif font-bold uppercase tracking-widest text-[#c5a059]">
          Nhật ký chiến sự (Combat Log)
        </p>
        <div className="max-h-60 space-y-3 overflow-y-auto pt-2 scrollbar-thin scrollbar-thumb-[#3e3328] pr-2">
          {combatLogs.map((log, index) => (
            <p 
              key={`${log}-${index}`} 
              className="narrative text-lg sm:text-xl font-serif leading-relaxed text-text-primary"
            >
              {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
