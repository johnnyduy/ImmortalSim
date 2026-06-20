export type Lang = 'vi' | 'en';

export type LocalizedText = {
  vi: string;
  en: string;
};

export type TextResource = string | LocalizedText;

export type Realm =
  | 'Mortal'
  | 'Qi Refinement'
  | 'Foundation Establishment'
  | 'Golden Core'
  | 'Nascent Soul'
  | 'Soul Formation'
  | 'Void Amalgamation'
  | 'Body Integration'
  | 'Mahayana'
  | 'Tribulation'
  | 'True Immortal';

export type Stats = {
  health: number; // HP max/hiện tại
  cultivation: number; // Tu vi cảnh giới
  luck: number; // Vận may, cơ duyên
  comprehension: number; // Ngộ tính (quan trọng cho luyện công)
  karma: number; // Nghiệp lực (- là ác, + là thiện)
  lifespan: number; // Thọ nguyên (hết tuổi thọ là chết)
  daoHeart: number; // Đạo tâm (quyết tâm tu luyện)
  speed: number; // Tốc độ (thân pháp)
  toxicity: number; // Đan độc (tích tụ khi dùng thuốc)
  spiritualRoot?: string; // Linh căn (chỉ định phẩm chất)
  alchemyLevel?: number; // Cấp độ/Tiến trình luyện đan
};

export type TechniqueCompleteness = 'tàn_quyển' | 'khuyết_thiên' | 'hoàn_chỉnh' | 'viên_mãn';

export interface TechniqueInstance {
  id: string;
  name: string;
  type: 'tâm_pháp' | 'vũ_kỹ' | 'thân_pháp' | 'thần_thông';
  tier: 'hoàng' | 'huyền' | 'địa' | 'thiên' | 'thánh' | 'tiên' | 'đế' | 'đạo';
  completeness: TechniqueCompleteness;
  isActive: boolean;
  fragmentsCollected: number;
  fragmentsRequired: number;
}

export interface ItemInstance {
  id: string;
  name: string;
  description: string;
  category: 'consumable' | 'equipment' | 'material' | 'relic';
  type: 'elixir' | 'secret_medicine' | 'weapon' | 'armor' | 'herb' | 'relic';
  tier: 'hoàng' | 'huyền' | 'địa' | 'thiên' | 'thánh' | 'tiên' | 'đế' | 'đạo';
  quantity: number;
  quality?: 'phàm_phẩm' | 'tinh_phẩm' | 'cực_phẩm' | 'tiên_phẩm'; // Phẩm chất đan dược
  toxicity?: number; // Lượng đan độc chứa trong đan dược
  basePrice?: number; // Giá trị gốc của vật phẩm (để chợ đêm/thành thị định giá)
  combatStats?: {
    attack?: number;
    defense?: number;
    speed?: number;
    maxHp?: number;
    maxQi?: number;
  };
  equipped?: boolean;
  soulbound?: boolean;
  sealLevel?: Realm;
  effects?: GameEffect;
}

export interface AlchemyRecipe {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  ingredients: { itemId: string; quantity: number }[];
  resultItemId: string;
  baseSuccessRate: number; // 0.0 - 1.0
  baseToxicity: number; // Đan độc cơ bản
}

export type FireMethod = 'văn_hỏa' | 'vũ_hỏa' | 'thiên_lôi' | 'huyết_luyện';

export type Inheritance = {
  legacyPower: number; // Sức mạnh di sản thừa kế truyền từ kiếp trước
  ancestralMemory: number; // Ký ức tổ tiên giúp truyền lại trí tuệ/công pháp
  blessing: number; // Phúc trạch ban phước từ tổ tiên/kiếp trước giúp tăng tài sản ban đầu
  unlockedTechniques?: Record<string, TechniqueCompleteness>; // Công pháp đã học truyền kiếp
  unlockedItems?: ItemInstance[]; // Vật phẩm đã mở khóa truyền kiếp
  npc_grudges?: Record<string, number>; // Ký ức luân hồi về mối thù NPC
};

export interface SectQuest {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  difficulty: string;
  durationMonths: number;
  minRank: 'ngoại_môn' | 'nội_môn' | 'chân_truyền' | 'trưởng_lão';
  checkStat?: 'combatPower' | 'luck' | 'comprehension' | 'daoHeart';
  checkValue?: number;
  rewards: {
    contribution: number;
    gold?: number;
    health?: number;
    comprehension?: number;
    cultivation?: number;
    daoHeart?: number;
    item?: { itemId: string; quantity: number };
  };
  progressLogs: {
    vi: string[];
    en: string[];
  };
}

export type GameEffect = Partial<Stats> & {
  age?: number;
  daoMind?: number;
  money?: number;
  speed?: number;
  toxicity?: number;
  gainFragment?: {
    techniqueId: string;
    amount: number;
  };
  gainItem?: {
    itemId: string;
    quantity: number;
  };
  sectContribution?: number;
  spiritStones?: number;
  sectPrestige?: number;
  npcFavorability?: Record<string, number>;
  npcGrudges?: Record<string, number>;
  worldState?: {
    sect?: Partial<Record<keyof SectWorldVars, number>>;
    city?: Partial<Record<keyof CityWorldVars, number>>;
    mountain?: Partial<Record<keyof MountainWorldVars, number>>;
    demonic?: Partial<Record<keyof DemonicWorldVars, number>>;
    global?: Partial<Record<keyof GlobalWorldVars, number>>;
  };
};

export type NpcDefinition = {
  id: string;
  name: string;
  archetype: string;
  spiritualRoot: string;
  karma: number;
  meta_memory_id: string;
  description: string;
  sect?: string;
  role?: { vi: string; en: string };
  avatar?: string;
};

export type EventChoice = {
  id: string;
  text: TextResource;
  effects: GameEffect;
  metadata?: {
    source?: 'ai' | 'author';
    model?: string;
    [key: string]: unknown;
  };
};

export type EventDefinition = {
  id: string;
  title: TextResource;
  description: TextResource;
  minRealm: Realm;
  maxRealm?: Realm;
  weight: number;
  choices: EventChoice[];
  tags?: string[];
  metadata?: {
    source?: 'ai' | 'author';
    model?: string;
    [key: string]: unknown;
  };
};

export type LogEntry = {
  type: 'info' | 'choice' | 'death' | 'reincarnation' | 'technique_breakthrough' | 'technique_fragment' | 'item_gain' | 'item_use' | 'item_equip';
  age?: number;
  eventTitle?: TextResource;
  choiceText?: TextResource;
  message: LocalizedText;
};

export type CombatEnemy = {
  id: string;
  name: string;
  avatar: string;
  maxHp: number;
  currentHp: number;
  speed: number;
  attack: number;
  defense: number;
  description: string;
};

export type CombatState = {
  enemy: CombatEnemy;
  log: string[]; // Battle Log
  isFinished: boolean;
  result?: 'win' | 'loss' | 'escape';
  onWinEffects?: GameEffect;
  onLossEffects?: GameEffect;
};

export type GameState = {
  run: number;
  life: number;
  age: number;
  alive: boolean;
  realm: Realm;
  subStageIndex: number;
  stats: Stats;
  inheritance: Inheritance;
  log: LogEntry[];
  currentEvent: EventDefinition | null;
  lastMessage: LocalizedText;
  deathCause?: LocalizedText;
  techniques?: TechniqueInstance[]; // Công pháp nhân vật đang sở hữu
  inventory?: ItemInstance[]; // Túi đồ nhân vật đang sở hữu
  history?: Array<{
    event: EventDefinition;
    selectedChoiceId: string;
  }>;
  month: number; // Tháng hiện tại (1 - 12)
  isTicking: boolean; // Trạng thái bánh răng đang xoay
  monthlyLog?: string[]; // Nhật ký tu luyện tháng tĩnh lặng
  gender?: 'nam' | 'nữ'; // Giới tính nhân vật
  sect?: string; // Môn phái đã gia nhập
  startingStoryId?: number | null; // Cốt truyện xuất sinh đã random
  sectContribution?: number; // Điểm cống hiến tông môn
  spiritStones?: number; // Điểm linh thạch hiện có
  sectRank?: 'ngoại_môn' | 'nội_môn' | 'chân_truyền' | 'trưởng_lão'; // Cấp bậc đệ tử
  sectPrestige?: number; // Uy vọng tông môn của đệ tử
  activeQuest?: {
    quest: SectQuest;
    monthsRemaining: number;
    progressLogs: string[];
    isParty: boolean;
    accumulatedCultivation?: number;
  } | null;
  ambition?: 'truong_sinh' | 'ba_chu' | 'dan_dao' | 'kiem_tien' | 'phu_quoc' | 'ma_dao';
  menuStack?: string[];
  questsCompletedThisYear?: number;
  npcFavorability?: Record<string, number>;
  worldState?: WorldState;
  currentLocation: 'sect' | 'mountain' | 'city' | 'secret_realm';
  activeCombat?: CombatState;
};

// ════════════════════════════════════════════════════════════
//  HỆ THỐNG MẠCH MÁU THẾ GIỚI — 18 biến trạng thái cốt lõi
// ════════════════════════════════════════════════════════════

/** Tông môn (Sect) — 4 biến */
export type SectWorldVars = {
  reputation: number;
  resources: number;
  stability: number;
  warLevel: number;
};

/** Thành thị / Thế Tục (City/Mortal) — 4 biến */
export type CityWorldVars = {
  prosperity: number;
  security: number;
  priceIndex: number;
  morale: number;
};

/** Yêu Thú Sơn Mạch (Monster Mountain) — 3 biến */
export type MountainWorldVars = {
  beastActivity: number;
  resources: number;
  danger: number;
};

/** Ma Đạo / Tà Tu (Demonic) — 2 biến */
export type DemonicWorldVars = {
  infiltration: number;
  activity: number;
};

/** Cấp vĩ mô / Thiên Đạo (Global / Dao) — 3 biến */
export type GlobalWorldVars = {
  spiritualQi: number;
  daoFluctuation: number;
  demonicEnergy: number;
};

/**
 * Trạng thái Thế giới (World State)
 * Đại diện cho hệ sinh thái biến số của toàn bộ thế giới game
 */
export type WorldState = {
  sect: SectWorldVars;
  city: CityWorldVars;
  mountain: MountainWorldVars;
  demonic: DemonicWorldVars;
  global: GlobalWorldVars;
  /** Lịch sử snapshot 12 tháng để vẽ sparkline trong Admin Panel */
  history?: Array<{
    month: number;
    age: number;
    snapshot: Omit<WorldState, 'history'>;
  }>;
};
