'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import AtmosphereBackground from '../components/AtmosphereBackground';
import AudioControls from '../components/AudioControls';
import ChoiceButtons from '../components/ChoiceButtons';
import StatsPanel from '../components/StatsPanel';
import TestCombatPanel from '../components/TestCombatPanel';
import AdminPanel from '../components/AdminPanel';
import SettingsModal from '../components/SettingsModal';
import TerminalUI from '../components/TerminalUI';
import ReincarnationUI from '../components/ReincarnationUI';
import { applyChoiceToState, createNewGame, getInitialInheritance, reincarnate, useItemInState, equipItemInState, getPlayerStat, getRandomEvent, addItem, getMenuEvent, addFragment, SectPunishmentEvent, changeLocation, setDynamicEvents, completeTechniqueLearning } from '../lib/engine';
import { tickMonth } from '../lib/game-controller';
import { getRealmSubStage } from '../lib/cultivation-states';
import { getLocalizedText, uiText, translatedRealms } from '../lib/i18n';
import { useAtmosphere } from '../hooks/useAtmosphere';
import TimeGearPanel from '../components/TimeGearPanel';
import OutcomeTransition from '../components/OutcomeTransition';
import type { GameState, Inheritance, Lang, LocalizedText, SectQuest, EventDefinition, TechniqueInstance } from '../types';
import SectMissionsPanel from '../components/SectMissionsPanel';
import { audioManager } from '../styles/AudioManager';
import TypewriterText from '../components/TypewriterText';
import CombatPanel from '../components/CombatPanel';
import LevelRewardAnimation, { type LevelRewardAnimationPayload } from '../components/LevelRewardAnimation';
import SubStageBreakthrough from '../components/SubStageBreakthrough';
import MajorBreakthrough from '../components/MajorBreakthrough';
import MountainExploration from '../components/MountainExploration';
import combatConfig from '../data/combat-config.json';
import type { Character, CombatEnvironment, StatSnapshot } from '../docs/CombatState';
import CultivationMinigame from '../components/CultivationMinigame';
import CombatModal from '../components/CombatModal';
import AlchemyModal from '../components/AlchemyModal';
import BlackMarketModal from '../components/BlackMarketModal';
import SectShopModal from '../components/SectShopModal';
import { resolveCombatAction, finishCombat } from '../lib/combat-system';

// Fallback image helper component for event backgrounds (thiết kế hình tròn viền ngọc bích mảnh)
function EventIllustration({ id, sect }: { id: string; sect?: string }) {
  const [src, setSrc] = useState(`/images/events/${id}.png`);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (id === 'sect_entry_welfare' && sect) {
      const sectIdMap: Record<string, string> = {
        'Kiếm Tông': 'kiem_tong',
        'Ma Đạo': 'ma_dao',
        'Huyết Tông': 'huyet_tong',
        'Đan Tông': 'dan_tong'
      };
      const sId = sectIdMap[sect] || 'kiem_tong';
      setSrc(`/images/sects/${sId}_far.png`);
    } else {
      setSrc(`/images/events/${id}.png`);
    }
  }, [id, sect]);

  useEffect(() => {
    const isMeditation = id === 'monthly_plan' || id.includes('tinh_tu') || id.includes('be_quan') || id.includes('meditation') || id === 'quiet_reflection';
    if (!isMeditation) return;

    const animInterval = setInterval(() => {
      setFrame((f) => (f + 1) % 8);
    }, 200);
    return () => clearInterval(animInterval);
  }, [id]);

  const isMeditation = id === 'monthly_plan' || id.includes('tinh_tu') || id.includes('be_quan') || id.includes('meditation') || id === 'quiet_reflection';
  const col = frame % 4;
  const row = Math.floor(frame / 4);

  return (
    <div 
      className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-[6px] border-[#133529] shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(37,107,83,0.5)] flex-shrink-0 mx-auto transition-transform duration-300 hover:scale-105"
      style={{ outline: '2px solid #10b981', outlineOffset: '-4px' }}
    >
      {isMeditation ? (
        <div
          style={{
            backgroundImage: "url('/images/meditation_spritesheet.png')",
            backgroundSize: '400% 200%',
            backgroundPosition: `${(col * 100) / 3}% ${(row * 100) / 1}%`,
            backgroundRepeat: 'no-repeat'}}
          className="w-full h-full bg-zinc-950"
        />
      ) : (
        <img
          src={src}
          alt={id}
          className="w-full h-full object-cover select-none transition-all duration-700"
          onError={() => {
            setSrc('/images/events/quiet_reflection.png');
          }}
        />
      )}
      {/* Lớp bóng nhẹ kính mờ */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#132c25]/10 via-transparent to-white/10 pointer-events-none" />
    </div>
  );
}

const BGM_PATHS: Record<string, string> = {
  start_menu: '/audio/start_game.mp3',
  mortal_village: '/audio/background_music.mp3',
  mountain_wandering: '/audio/mountain.mp3',
  sect_hall: '/audio/sect.mp3',
  meditation: '/audio/meditation.mp3',
  mystery: '/audio/mystery.mp3',
  death: '/audio/death.mp3',
  reincarnation: '/audio/reincarnation.mp3',
  forbidden: '/audio/forbidden.mp3',
  story_1: '/audio/background_music.mp3',
  story_2: '/audio/mystery.mp3',
  story_3: '/audio/forbidden.mp3',
  story_4: '/audio/meditation.mp3',
  story_5: '/audio/mountain.mp3'};

const formatSignedGain = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

const getInventoryCounts = (inventory: GameState['inventory'] = []) => {
  const counts = new Map<string, { name: string; quantity: number }>();
  inventory.forEach((item) => {
    const current = counts.get(item.id);
    counts.set(item.id, {
      name: item.name,
      quantity: (current?.quantity ?? 0) + item.quantity});
  });
  return counts;
};

const buildLevelRewardPayload = (
  previous: GameState | null,
  next: GameState,
  language: Lang,
  id: number
): LevelRewardAnimationPayload | null => {
  if (!previous || !previous.alive || !next.alive) return null;

  const prevStage = getRealmSubStage(previous.stats.cultivation, previous.realm, previous.subStageIndex);
  const nextStage = getRealmSubStage(next.stats.cultivation, next.realm, next.subStageIndex);
  const leveledUp =
    nextStage.majorRealm !== prevStage.majorRealm ||
    nextStage.subStageIndex > prevStage.subStageIndex;

  const rewards: string[] = [];
  const labels = language === 'vi'
    ? {
        levelTitle: 'Đột Phá Cảnh Giới',
        rewardTitle: 'Nhận Thưởng',
        levelSubtitle: `Tiến vào ${nextStage.subStageName.vi}`,
        rewardSubtitle: 'Cơ duyên vừa nhập túi',
        cultivation: 'Tu vi',
        spiritStones: 'Linh thạch',
        contribution: 'Cống hiến tông môn',
        prestige: 'Uy vọng tông môn',
        lifespan: 'Thọ nguyên',
        daoHeart: 'Đạo tâm',
        comprehension: 'Ngộ tính',
        luck: 'Khí vận',
        health: 'Khí huyết',
        item: 'Vật phẩm',
        technique: 'Công pháp',
        fragment: 'Mảnh công pháp',
        activated: 'Kích hoạt'}
    : {
        levelTitle: 'Realm Breakthrough',
        rewardTitle: 'Reward Claimed',
        levelSubtitle: `Advanced to ${nextStage.subStageName.en}`,
        rewardSubtitle: 'A new gain enters your pouch',
        cultivation: 'Cultivation',
        spiritStones: 'Spirit Stones',
        contribution: 'Sect Contribution',
        prestige: 'Sect Prestige',
        lifespan: 'Lifespan',
        daoHeart: 'Dao Heart',
        comprehension: 'Comprehension',
        luck: 'Luck',
        health: 'Health',
        item: 'Item',
        technique: 'Technique',
        fragment: 'Technique Shard',
        activated: 'Activated'};

  const cultivationGain = next.stats.cultivation - previous.stats.cultivation;
  // Bỏ đi phần thưởng Tu vi khi đột phá theo yêu cầu
  // if (cultivationGain > 0 && leveledUp) {
  //   rewards.push(`${labels.cultivation} +${formatSignedGain(cultivationGain)}`);
  // }

  const statDiffs: Array<[keyof Pick<GameState['stats'], 'health' | 'luck' | 'comprehension' | 'lifespan' | 'daoHeart'>, string]> = [
    ['health', labels.health],
    ['luck', labels.luck],
    ['comprehension', labels.comprehension],
    ['lifespan', labels.lifespan],
    ['daoHeart', labels.daoHeart],
  ];
  statDiffs.forEach(([key, label]) => {
    const gain = (next.stats[key] ?? 0) - (previous.stats[key] ?? 0);
    if (gain > 0) rewards.push(`${label} ${formatSignedGain(gain)}`);
  });

  const resourceDiffs: Array<[number, number, string]> = [
    [previous.spiritStones ?? 0, next.spiritStones ?? 0, labels.spiritStones],
    [previous.sectContribution ?? 0, next.sectContribution ?? 0, labels.contribution],
    [previous.sectPrestige ?? 0, next.sectPrestige ?? 0, labels.prestige],
  ];
  resourceDiffs.forEach(([prevValue, nextValue, label]) => {
    const gain = nextValue - prevValue;
    if (gain > 0) rewards.push(`${label} ${formatSignedGain(gain)}`);
  });

  const prevItems = getInventoryCounts(previous.inventory);
  const nextItems = getInventoryCounts(next.inventory);
  nextItems.forEach((item, itemId) => {
    const gain = item.quantity - (prevItems.get(itemId)?.quantity ?? 0);
    if (gain > 0) rewards.push(`${labels.item}: ${item.name} x${gain}`);
  });

  const prevTechniques = new Map((previous.techniques || []).map((tech) => [tech.id, tech]));
  (next.techniques || []).forEach((tech) => {
    const prevTech = prevTechniques.get(tech.id);
    if (!prevTech) {
      rewards.push(`${labels.technique}: ${tech.name}`);
      return;
    }

    const fragmentGain = tech.fragmentsCollected - prevTech.fragmentsCollected;
    if (fragmentGain > 0) rewards.push(`${labels.fragment}: ${tech.name} x${fragmentGain}`);
    if (!prevTech.isActive && tech.isActive) rewards.push(`${labels.activated}: ${tech.name}`);
  });

  if (!leveledUp && rewards.length === 0) return null;

  return {
    id,
    kind: leveledUp ? 'level' : 'reward',
    title: leveledUp ? labels.levelTitle : labels.rewardTitle,
    subtitle: leveledUp ? labels.levelSubtitle : labels.rewardSubtitle,
    rewards};
};

export default function HomePage() {
  const [language, setLanguage] = useState<Lang>('vi');
  const [inheritance, setInheritance] = useState<Inheritance>(getInitialInheritance());
  const [game, setGame] = useState<GameState | null>(null);
  const [previousGame, setPreviousGame] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Đang kết nối thần thức thiên địa...');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.3);
  const [showTestCombat, setShowTestCombat] = useState(false);
  const [mountainExploreDays, setMountainExploreDays] = useState(0);
  
  // Dynamic config from Admin Panel
  const [activeCombatConfig, setActiveCombatConfig] = useState<any>(null);
  const totalTime = activeCombatConfig?.time_gear?.tick_interval_seconds ?? 10;
  const [timeLeft, setTimeLeft] = useState<number>(totalTime);
  
  // Admin Panel states
  const [isAdminPortalVisible, setIsAdminPortalVisible] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Settings states
  const [theme, setTheme] = useState<'dark' | 'obsidian' | 'parchment'>('dark');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const listEndRef = useRef<HTMLDivElement>(null);
  const prevMonthRef = useRef<number | undefined>(undefined);

  // Audio narration refs for the starting stories
  const spokenStoryRef = useRef<string | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Character Creation states
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [creationGender, setCreationGender] = useState<'nam' | 'nữ'>('nam');
  const [creationRoot, setCreationRoot] = useState<string>('Kim Linh Căn');
  const [creationSect, setCreationSect] = useState<string>('Kiếm Tông');
  const [isReincarnationFlow, setIsReincarnationFlow] = useState<boolean>(false);
  const [isIntroTextFinished, setIsIntroTextFinished] = useState(false);
  const [showSectMissions, setShowSectMissions] = useState(false);
  const [showSectShop, setShowSectShop] = useState(false);
  const [showBlackMarket, setShowBlackMarket] = useState(false);
  const [showAlchemy, setShowAlchemy] = useState(false);
  const [activeCombat, setActiveCombat] = useState<{
    player: Character;
    enemy: Character;
    env: CombatEnvironment;
    type: 'beast_herb' | 'beast_hunt' | 'demonic' | 'tournament_1' | 'tournament_2' | 'tournament_3' | 'tournament_ngao_thien' | 'npc_ta_tieu' | 'npc_khau_vo_ky';
  } | null>(null);
  const [showAudioPaths, setShowAudioPaths] = useState<boolean>(false);
  const [lastAudioTriggered, setLastAudioTriggered] = useState<string>('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
    type: 'manual' | 'currency' | 'elixir';
    title: string;
    description: string;
    details?: string[];
    image?: string;
    icon?: string;
  } | null>(null);
  const [learningTechnique, setLearningTechnique] = useState<TechniqueInstance | null>(null);
  const [isFatalMinigame, setIsFatalMinigame] = useState(false);
  const [levelRewardAnimation, setLevelRewardAnimation] = useState<LevelRewardAnimationPayload | null>(null);
  const rewardAnimationIdRef = useRef(0);
  const lastRewardGameRef = useRef<GameState | null>(null);

  const [breakthroughData, setBreakthroughData] = useState<{
    oldStageName: string;
    newStageName: string;
    majorRealm: string;
    isMajor?: boolean;
  } | null>(null);
  const lastSubStageRef = useRef<number | null>(null);

  // Transition outcome state for Xianxia choice animations
  const [transitionOutcome, setTransitionOutcome] = useState<{
    type: 'ink_fade' | 'karma_good' | 'karma_bad' | 'destiny_win' | 'destiny_lose' | 'combat_win' | 'combat_lose' | 'combat_start';
    action: () => void;
  } | null>(null);

  // Dynamic max HP calculation for actions
  const subStageInfo = game ? getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex) : null;
  const equipHpBonus = game ? (game.inventory || [])
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.maxHp ?? 0), 0) : 0;
  const maxHp = game ? (20 + Math.max(0, Math.floor(game.inheritance.blessing / 2)) + (subStageInfo?.bonus.max_hp ?? 0) + equipHpBonus) : 100;

  const handleIntroTextComplete = useCallback(() => {
    setIsIntroTextFinished(true);
  }, []);

  useEffect(() => {
    setIsIntroTextFinished(false);
  }, [game?.currentEvent?.id]);

  const { currentMode, setMasterVolume, mute, unmute } = useAtmosphere(game, {
    enableAudio: audioEnabled,
    masterVolume: audioVolume});

  const playSfxWithPath = useCallback((path: string, volume: number = 0.7) => {
    setLastAudioTriggered(path);
    audioManager.playSFX(path, volume);
  }, []);

  useEffect(() => {
    if (!game || !game.alive) {
      lastSubStageRef.current = null;
      return;
    }
    const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
    const currentIdx = currentSubStage.subStageIndex;
    
    // Nếu đang Bế Quan (auto-ticking), không hiển thị popup đột phá tiểu cảnh giới để tránh spam.
    // Giữ nguyên lastSubStageRef.current để so sánh toàn bộ tiến trình sau khi hoàn thành bế quan.
    // Nếu lastSubStageRef.current chưa được khởi tạo (khi F5 trang), gán bằng cảnh giới hiện tại.
    if (game.isTicking) {
      if (lastSubStageRef.current === null) {
        lastSubStageRef.current = currentIdx;
      }
      return;
    }

    if (lastSubStageRef.current !== null && currentIdx > lastSubStageRef.current) {
      const getSubStageNameByIndex = (idx: number) => {
        if (idx === 0) return { vi: 'Phàm Nhân', en: 'Mortal'};
        if (idx <= 9) {
          const layer = idx;
          const labelVi = layer === 9 ? 'Luyện Khí Tầng 9 (Viên Mãn)' : `Luyện Khí Tầng ${layer}`;
          const labelEn = layer === 9 ? 'Qi Refinement Layer 9 (Consummate)' : `Qi Refinement Layer ${layer}`;
          return { vi: labelVi, en: labelEn};
        }
        if (idx <= 12) {
          const subIdx = idx - 10;
          const namesVi = ['Trúc Cơ Sơ Kỳ', 'Trúc Cơ Trung Kỳ', 'Trúc Cơ Hậu Kỳ'];
          const namesEn = ['Foundation Establishment Early', 'Foundation Establishment Middle', 'Foundation Establishment Late'];
          return { vi: namesVi[subIdx], en: namesEn[subIdx]};
        }
        if (idx <= 16) {
          const subIdx = idx - 13;
          const namesVi = ['Kim Đan Sơ Kỳ', 'Kim Đan Trung Kỳ', 'Kim Đan Hậu Kỳ', 'Kim Đan Viên Mãn'];
          const namesEn = ['Golden Core Early', 'Golden Core Middle', 'Golden Core Late', 'Golden Core Consummate'];
          return { vi: namesVi[subIdx], en: namesEn[subIdx]};
        }
        const subIdx = idx - 17;
        const namesVi = ['Nguyên Anh Sơ Kỳ', 'Nguyên Anh Trung Kỳ', 'Nguyên Anh Hậu Kỳ', 'Nguyên Anh Viên Mãn'];
        const namesEn = ['Nascent Soul Early', 'Nascent Soul Middle', 'Nascent Soul Late', 'Nascent Soul Consummate'];
        return { vi: namesVi[subIdx], en: namesEn[subIdx]};
      };

      const oldStageName = getSubStageNameByIndex(lastSubStageRef.current);
      const newStageName = currentSubStage.subStageName;
      const oldSubStageInfo = getRealmSubStage(0, undefined, lastSubStageRef.current);
      const isMajor = oldSubStageInfo.majorRealm !== currentSubStage.majorRealm;

      setBreakthroughData({
        oldStageName: (oldStageName as any)[language],
        newStageName: (newStageName as any)[language],
        majorRealm: currentSubStage.majorRealm,
        isMajor});

      // Play custom audio breakthrough SFX
      playSfxWithPath('/audio/crystal-bowl.mp3', 0.9);
      setTimeout(() => {
        audioManager.playSFX('/audio/start_game.mp3', 0.5);
      }, 2000);
    }
    lastSubStageRef.current = currentIdx;
  }, [game?.stats?.cultivation, game?.alive, game?.isTicking, language, playSfxWithPath]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        setLastAudioTriggered('/audio/crystal-bowl.mp3 (Click)');
        audioManager.playClick();
      }
    };
    document.addEventListener('click', handleGlobalClick);

    const storedInheritance = window.localStorage.getItem('immortalSimInheritance');
    const storedLanguage = window.localStorage.getItem('immortalSimLanguage');
    const storedAudioEnabled = window.localStorage.getItem('immortalSimAudioEnabled');
    const storedAudioMuted = window.localStorage.getItem('immortalSimAudioMuted');
    const storedAudioVolume = window.localStorage.getItem('immortalSimAudioVolume');
    const storedShowAudioPaths = window.localStorage.getItem('immortalSimShowAudioPaths');

    if (storedInheritance) {
      try {
        setInheritance(JSON.parse(storedInheritance) as Inheritance);
      } catch {
        setInheritance(getInitialInheritance());
      }
    }

    if (storedLanguage === 'vi') {
      setLanguage(language as any); //'vi');
    }

    const storedTheme = window.localStorage.getItem('immortalSimTheme');
    const storedFontSize = window.localStorage.getItem('immortalSimFontSize');

    if (storedTheme === 'obsidian' || storedTheme === 'parchment' || storedTheme === 'dark') {
      setTheme(storedTheme as any);
    }
    if (storedFontSize === 'sm' || storedFontSize === 'md' || storedFontSize === 'lg' || storedFontSize === 'xl') {
      setFontSize(storedFontSize as any);
    }

    if (storedAudioEnabled === 'false') {
      setAudioEnabled(false);
    }
    if (storedAudioMuted === 'true') {
      setAudioMuted(true);
    }
    if (storedAudioVolume) {
      const parsedVolume = Number(storedAudioVolume);
      if (!Number.isNaN(parsedVolume)) {
        setAudioVolume(Math.max(0, Math.min(1, parsedVolume)));
      }
    }
    if (storedShowAudioPaths === 'true') {
      setShowAudioPaths(true);
    }

    const initializeDatabase = async () => {
      // Step 1: Connecting (0% -> 20%)
      setLoadingProgress(15);
      setLoadingText(languageRef.current === 'vi' ? 'Đang kết nối thần thức thiên địa...' : 'Connecting heaven and earth consciousness...');
      await new Promise(r => setTimeout(r, 450));
      
      // Step 2: Fetching config (20% -> 50%)
      setLoadingProgress(40);
      setLoadingText(languageRef.current === 'vi' ? 'Đang khai mở linh mạch thế giới...' : 'Opening world spiritual veins...');
      try {
        const configRes = await fetch('/api/admin/config');
        const configData = await configRes.json();
        if (configData.success && configData.combatConfig) {
          setActiveCombatConfig(configData.combatConfig);
        }
      } catch (err) {
        console.warn('Failed to load dynamic config:', err);
      }
      await new Promise(r => setTimeout(r, 350));
      
      // Step 3: Fetching events (50% -> 80%)
      setLoadingProgress(70);
      setLoadingText(languageRef.current === 'vi' ? 'Đang nạp cơ sở dữ liệu sự kiện thế gian...' : 'Loading world event databases...');
      try {
        const eventsRes = await fetch('/api/events');
        const eventsData = await eventsRes.json();
        if (eventsData.events) {
          setDynamicEvents(eventsData.events);
        }
      } catch (err) {
        console.error('Failed to load dynamic events:', err);
      }
      await new Promise(r => setTimeout(r, 450));
      
      // Step 4: Finishing (80% -> 100%)
      setLoadingProgress(95);
      setLoadingText(languageRef.current === 'vi' ? 'Đang tụ khí quy nguyên, hoàn tất tải nhập...' : 'Gathering Qi to origin, loading complete...');
      await new Promise(r => setTimeout(r, 350));
      
      setLoadingProgress(100);
      await new Promise(r => setTimeout(r, 200));
      setLoaded(true);
      setEventsLoading(false);
    };
    initializeDatabase();

    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Create refs to avoid restarting the timer on irrelevant state updates and prevent double-ticking
  const languageRef = useRef(language);
  const activeCombatConfigRef = useRef(activeCombatConfig);
  const timeLeftRef = useRef(timeLeft);
  const gameRef = useRef(game);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    activeCombatConfigRef.current = activeCombatConfig;
  }, [activeCombatConfig]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!game) {
      lastRewardGameRef.current = null;
      return;
    }

    const previous = lastRewardGameRef.current;
    lastRewardGameRef.current = game;
    
    // Bỏ qua hiển thị animation phần thưởng/lên cấp nếu đang Bế Quan (auto-ticking)
    if (game.isTicking) return;

    const payload = buildLevelRewardPayload(previous, game, language, rewardAnimationIdRef.current + 1);
    if (!payload) return;

    rewardAnimationIdRef.current = payload.id;
    setLevelRewardAnimation(payload);
    playSfxWithPath(payload.kind === 'level' ? '/audio/reincarnation.mp3' : '/audio/crystal-bowl.mp3', payload.kind === 'level' ? 0.78 : 0.56);
  }, [
    game,
    language,
    playSfxWithPath,
  ]);

  // Time Gear ticking timer
  useEffect(() => {
    if (!game || !game.alive || !game.isTicking) {
      setTimeLeft(totalTime);
      return;
    }

    const interval = setInterval(() => {
      // Safety guard: stop immediately if game state is no longer ticking/alive/present
      if (!gameRef.current || !gameRef.current.isTicking || !gameRef.current.alive) {
        return;
      }
      const currentVal = timeLeftRef.current;
      if (currentVal <= 0.11) {
        // Ticking the month is side-effect heavy, run it directly in the interval (never inside a state updater function)
        setGame((g) => {
          if (!g || !g.isTicking || !g.alive) return g;
          return tickMonth(g, languageRef.current, activeCombatConfigRef.current);
        });
        setTimeLeft(totalTime);
      } else {
        setTimeLeft(Math.round((currentVal - 0.1) * 10) / 10);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [!!game, game?.alive, game?.isTicking, totalTime]);

  // Dynamically sync narration audio volume and mute status
  useEffect(() => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.volume = audioMuted || !audioEnabled ? 0 : audioVolume * 0.9;
    }
  }, [audioVolume, audioMuted, audioEnabled]);

  // AI Voice narration player for the birth story
  useEffect(() => {
    // If not in the birth story event, stop any playing narration
    if (!game || !game.currentEvent || game.currentEvent.id !== 'birth_and_recruitment' || !game.startingStoryId) {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
        narrationAudioRef.current = null;
      }
      return;
    }

    // Play only if audio is enabled and not muted
    if (!audioEnabled || audioMuted) {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
      }
      return;
    }

    const audioPath = `/audio/story_${game.startingStoryId}_${language}.mp3`;

    // Avoid restarting the same narration file if it's already playing/played
    if (spokenStoryRef.current === audioPath) {
      // If paused due to mute/unmute toggle, resume it
      if (narrationAudioRef.current && narrationAudioRef.current.paused) {
        setLastAudioTriggered(audioPath);
        narrationAudioRef.current.play().catch(e => console.warn('Resuming narration failed:', e));
      }
      return;
    }

    // Clean up previous narration
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
    }

    // Create and play new audio
    const audio = new Audio(audioPath);
    audio.volume = audioVolume * 0.9;
    setLastAudioTriggered(audioPath);
    audio.play().catch(e => console.warn('Narration playback failed:', e));

    narrationAudioRef.current = audio;
    spokenStoryRef.current = audioPath;

    return () => {
      // Pause narration when leaving component or event
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause();
      }
    };
  }, [game?.currentEvent?.id, game?.startingStoryId, language, audioEnabled, audioMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setIsAdminPortalVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem('immortalSimInheritance', JSON.stringify(inheritance));
    window.localStorage.setItem('immortalSimLanguage', language);
    window.localStorage.setItem('immortalSimAudioEnabled', String(audioEnabled));
    window.localStorage.setItem('immortalSimAudioMuted', String(audioMuted));
    window.localStorage.setItem('immortalSimAudioVolume', String(audioVolume));
    window.localStorage.setItem('immortalSimTheme', theme);
    window.localStorage.setItem('immortalSimFontSize', fontSize);
    window.localStorage.setItem('immortalSimShowAudioPaths', String(showAudioPaths));
  }, [inheritance, language, audioEnabled, audioMuted, audioVolume, theme, fontSize, showAudioPaths, loaded]);

  // Synchronize theme and font size classes on the document root element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-obsidian', 'theme-parchment');
    root.classList.add(`theme-${theme}`);
    
    root.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl');
    root.classList.add(`font-size-${fontSize}`);
  }, [theme, fontSize]);

  // Audio cues on monthly time gear ticks or event triggers
  useEffect(() => {
    if (!game) {
      prevMonthRef.current = undefined;
      return;
    }

    if (game.alive) {
      // If the month changed
      if (prevMonthRef.current !== undefined && prevMonthRef.current !== game.month) {
        if (game.currentEvent) {
          // Play rich gong/swell sound when a new event triggers
          playSfxWithPath('/audio/reincarnation.mp3', 0.85);
        } else if (game.isTicking) {
          // Play soft crystal bowl ring on normal month progression
          playSfxWithPath('/audio/crystal-bowl.mp3', 0.5);
        }
      }
    }

    prevMonthRef.current = game.month;
  }, [game?.month, game?.alive, game?.isTicking, game?.currentEvent?.id]);

  // Smooth scroll to the bottom when history grows or active event changes
  useEffect(() => {
    if (game) {
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [game?.history?.length, game?.alive, game?.currentEvent?.id]);

  const handleStart = () => {
    spokenStoryRef.current = null; // Reset spoken story flag
    setShowTestCombat(false);
    setCreationGender('nam');
    setCreationRoot('Kim Linh Căn');
    setCreationSect('Kiếm Tông');
    setIsReincarnationFlow(false);
    setShowCharacterCreation(true);
  };

  const handleReset = () => {
    spokenStoryRef.current = null; // Reset spoken story flag
    setShowTestCombat(false);
    const freshInheritance = getInitialInheritance();
    setInheritance(freshInheritance);
    setCreationGender('nam');
    setCreationRoot('Kim Linh Căn');
    setCreationSect('Kiếm Tông');
    setIsReincarnationFlow(false);
    setShowCharacterCreation(true);
  };

  const handleStartTestCombat = () => {
    setGame(null);
    setPreviousGame(null);
    setShowTestCombat(true);
  };

  const handleMountainExploreTimePass = useCallback((days: number) => {
    setMountainExploreDays(prev => {
      const nextDays = prev + days;
      if (nextDays >= 30) {
        setGame(g => {
          if (!g) return g;
          // Deduct travel cost HP and Stones
          const newHp = Math.max(0, g.stats.health - (activeCombatConfigRef.current?.time_gear?.travel_cost_hp ?? 2));
          const newStones = Math.max(0, (g.spiritStones ?? 0) - (activeCombatConfigRef.current?.time_gear?.travel_cost_stones ?? 10));
          const nextGame = { ...g, stats: { ...g.stats, health: newHp }, spiritStones: newStones };
          return tickMonth(nextGame, languageRef.current, activeCombatConfigRef.current);
        });
        return nextDays - 30;
      }
      return nextDays;
    });
  }, []);

  const handleMountainExploreEventResult = useCallback((effect: any) => {
    setGame(g => {
      if (!g) return g;
      const nextGame = { ...g, stats: { ...g.stats } };
      if (effect.spiritStones) nextGame.spiritStones = (nextGame.spiritStones ?? 0) + effect.spiritStones;
      if (effect.luck) nextGame.stats.luck += effect.luck;
      if (effect.cultivation) nextGame.stats.cultivation += effect.cultivation;
      if (effect.comprehension) nextGame.stats.comprehension += effect.comprehension;
      if (effect.daoHeart) nextGame.stats.daoHeart = Math.min(100, nextGame.stats.daoHeart + effect.daoHeart);
      return nextGame;
    });
  }, []);

  const handleMountainExploreCombat = useCallback((type: 'beast_herb' | 'npc_ta_tieu') => {
    if (!gameRef.current) return;
    
    // Setup combat
    let env: CombatEnvironment = { id: 'forest', name: 'Vạn Thú Sơn Mạch', innate_auras: [], unlocked_choices: [] };
    let enemyChar: Character;
    
    if (type === 'beast_herb') {
      enemyChar = {
        id: 'beast_herb',
        name: 'Dã Linh Hổ (Spirit Tiger)',
        realm_tier: 1,
        base_stats: { hp: 110, max_hp: 110, qi: 40, max_qi: 40, speed: 12, attack: 24, qi_control: 8, comprehension: 5 },
        tags: ['iron_body'],
        buffs: [],
        ai_rules: [{ condition: 'always', action_id: 'act_enemy_claw', weight: 10 }]
      };
    } else {
      enemyChar = {
        id: 'npc_ta_tieu',
        name: 'Tà Tu (Evil Cultivator)',
        realm_tier: 1,
        base_stats: { hp: 150, max_hp: 150, qi: 80, max_qi: 80, speed: 15, attack: 30, qi_control: 20, comprehension: 10 },
        tags: ['demonic_aura'],
        buffs: [],
        ai_rules: [{ condition: 'always', action_id: 'act_enemy_claw', weight: 10 }]
      };
    }

    const playerChar: Character = {
      id: 'player',
      name: 'Player',
      realm_tier: 1,
      base_stats: {
        hp: gameRef.current.stats.health,
        max_hp: 100,
        qi: 100,
        max_qi: 100,
        speed: 10,
        attack: 20,
        qi_control: 10,
        comprehension: gameRef.current.stats.comprehension
      },
      tags: [],
      buffs: [],
      ai_rules: []
    };

    setActiveCombat({
      player: playerChar,
      enemy: enemyChar,
      env,
      type
    });
  }, []);

  const handleConfirmCharacter = () => {
    setShowCharacterCreation(false);
    if (isReincarnationFlow) {
      if (!game) return;
      setPreviousGame(game);
      const next = reincarnate(game, language, {
        gender: creationGender,
        spiritualRoot: creationRoot,
        sect: creationSect});
      setInheritance(next.inheritance);
      setGame(next);
    } else {
      setShowTestCombat(false);
      const nextGame = createNewGame(inheritance, game?.run ?? 0, language, {
        gender: creationGender,
        spiritualRoot: creationRoot,
        sect: creationSect});
      setGame(nextGame);
    }
  };

  const handleToggleAudioEnabled = () => {
    setAudioEnabled((prev) => !prev);
  };

  const handleToggleMute = () => {
    setAudioMuted((prev) => !prev);
  };

  const handleAudioVolumeChange = (volume: number) => {
    setAudioVolume(volume);
    setMasterVolume(volume);
  };

  const beastHerbChar: Character = {
    id: 'beast_herb',
    name: 'Dã Linh Hổ (Spirit Tiger)',
    realm_tier: 1,
    base_stats: {
      hp: 110,
      max_hp: 110,
      qi: 40,
      max_qi: 40,
      speed: 12,
      attack: 24,
      qi_control: 8,
      comprehension: 5
    },
    tags: ['iron_body'],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_claw', weight: 10 }
    ]
  };

  const beastHuntChar: Character = {
    id: 'beast_hunt',
    name: 'Lôi Tê Yêu Thú (Thunder Rhino)',
    realm_tier: 1,
    base_stats: {
      hp: 140,
      max_hp: 140,
      qi: 50,
      max_qi: 50,
      speed: 8,
      attack: 26,
      qi_control: 6,
      comprehension: 4
    },
    tags: ['iron_body'],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_claw', weight: 10 }
    ]
  };

  const demonicChar: Character = {
    id: 'demonic_cult',
    name: 'Ma Tu Cướp Đường (Demonic Cultivator)',
    realm_tier: 1,
    base_stats: {
      hp: 100,
      max_hp: 100,
      qi: 70,
      max_qi: 70,
      speed: 14,
      attack: 22,
      qi_control: 12,
      comprehension: 9
    },
    tags: ['demonic_state'],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_curse', weight: 10 }
    ]
  };

  const tournament1Char: Character = {
    id: 't1_lam_phong',
    name: 'Lâm Phong (Outer Disciple)',
    realm_tier: 1,
    base_stats: {
      hp: 90,
      max_hp: 90,
      qi: 60,
      max_qi: 60,
      speed: 10,
      attack: 18,
      qi_control: 9,
      comprehension: 8
    },
    tags: [],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_claw', weight: 10 }
    ]
  };

  const tournament2Char: Character = {
    id: 't2_diep_pham',
    name: 'Diệp Phàm (Outer Disciple)',
    realm_tier: 1,
    base_stats: {
      hp: 110,
      max_hp: 110,
      qi: 65,
      max_qi: 65,
      speed: 12,
      attack: 22,
      qi_control: 10,
      comprehension: 10
    },
    tags: [],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_claw', weight: 10 }
    ]
  };

  const tournament3Char: Character = {
    id: 't3_so_hao',
    name: 'Sở Hạo (Outer Disciple)',
    realm_tier: 1,
    base_stats: {
      hp: 130,
      max_hp: 130,
      qi: 80,
      max_qi: 80,
      speed: 13,
      attack: 26,
      qi_control: 12,
      comprehension: 11
    },
    tags: [],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_curse', weight: 10 }
    ]
  };

  const ngaoThienChar: Character = {
    id: 'enemy_ngao_thien',
    name: 'Long Ngạo Thiên (天驕天才)',
    realm_tier: 1,
    base_stats: {
      hp: 180,
      max_hp: 180,
      qi: 120,
      max_qi: 120,
      speed: 18,
      attack: 35,
      qi_control: 20,
      comprehension: 15
    },
    tags: ['spirit_root'],
    buffs: [],
    ai_rules: [
      { condition: 'always', action_id: 'act_enemy_curse', weight: 6 },
      { condition: 'always', action_id: 'act_enemy_claw', weight: 4 }
    ]
  };

  const beastEnv: CombatEnvironment = {
    id: 'beast_mountain',
    name: 'Vạn Thú Sơn Mạch (Beast Mountains)',
    innate_auras: [],
    unlocked_choices: []
  };

  const tournamentEnv: CombatEnvironment = {
    id: 'sect_arena',
    name: 'Sơn Môn Quyết Đấu Đài (Sect Arena)',
    innate_auras: [],
    unlocked_choices: []
  };

  const buildPlayerCharacter = (game: GameState): Character => {
    const subStageInfo = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
    const inventory = game.inventory || [];
    
    const equipHpBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.maxHp ?? 0), 0);
    const maxHp = 20 + Math.max(0, Math.floor(game.inheritance.blessing / 2)) + subStageInfo.bonus.max_hp + equipHpBonus;

    const equipQiBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.maxQi ?? 0), 0);
    const maxQi = 60 + subStageInfo.bonus.max_qi + equipQiBonus;

    const equipAtkBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.attack ?? 0), 0);
    const attack = 15 + Math.floor(game.stats.cultivation * 0.4) + subStageInfo.bonus.attack + equipAtkBonus;

    const equipSpdBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.speed ?? 0), 0);
    const speed = 10 + Math.floor(game.stats.luck * 0.2) + equipSpdBonus;

    const equipDefBonus = inventory
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.defense ?? 0), 0);
    const qiControl = 10 + Math.floor(game.stats.daoHeart * 0.15) + equipDefBonus;

    const base_stats: StatSnapshot = {
      hp: game.stats.health,
      max_hp: maxHp,
      qi: maxQi,
      max_qi: maxQi,
      speed,
      attack,
      qi_control: qiControl,
      comprehension: game.stats.comprehension
    };

    const activeTechs = (game.techniques || []).filter(t => t.isActive).map(t => t.id);

    return {
      id: 'player',
      name: 'Bản Tôn (Tu Sĩ)',
      realm_tier: game.realm === 'Mortal' ? 0 : game.realm === 'Qi Refinement' ? 1 : game.realm === 'Foundation Establishment' ? 2 : 3,
      base_stats,
      tags: activeTechs,
      buffs: []
    };
  };

  const handleCombatFinished = (winner: 'player' | 'enemy' | 'escaped', type: string, logs: string[]) => {
    setActiveCombat(null);
    if (!game) return;
    setPreviousGame(game);

    let nextStats = { ...game.stats };
    let nextInventory = game.inventory ? [...game.inventory] : [];
    let nextSpiritStones = game.spiritStones ?? 0;
    let nextSectContribution = game.sectContribution ?? 0;
    let nextLog = [...game.log];
    let nextEvent = game.currentEvent;
    let customDeathCause: LocalizedText | undefined = undefined;
    
    let nextNpcFavorability = game.npcFavorability ? { ...game.npcFavorability } : {
      npc_kiem_tong_chap_su: 0,
      npc_kiem_tong_ta_tieu: 0,
      npc_dan_tong_chap_su: 0,
      npc_ma_dao_chap_su: 0,
      npc_huyet_tong_chap_su: 0};
    
    const combatOutcomeLog = (isWin: boolean, descVi: string, descEn: string) => {
      nextLog.push({
        type: 'info',
        age: game.age,
        message: { vi: descVi, en: descEn}
      });
    };

    if (winner === 'escaped') {
      const subStageInfo = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
      const equipHpBonus = nextInventory
        .filter(item => item.category === 'equipment' && item.equipped)
        .reduce((sum, item) => sum + (item.combatStats?.maxHp ?? 0), 0);
      const maxHp = 20 + Math.max(0, Math.floor(game.inheritance.blessing / 2)) + subStageInfo.bonus.max_hp + equipHpBonus;

      const hpCost = Math.round(maxHp * 0.4);
      nextStats.health = Math.max(1, nextStats.health - hpCost);

      combatOutcomeLog(false, 
        `🏃 Thoát chạy thành công: Bạn thi triển cấm thuật trốn chạy khỏi chiến trường, hao tổn 40% sinh mạng (-${hpCost} HP).`, 
        `🏃 Escape successful: You cast a forbidden escape spell to flee the battlefield, losing 40% HP (-${hpCost} HP).`
      );
      nextEvent = getMenuEvent('menu_monthly_plan', { ...game, stats: nextStats }, language);
    } 
    else if (winner === 'player') {
      if (type === 'beast_herb') {
        const isLien = Math.random() < 0.25;
        const itemId = isLien ? 'item_tuyet_lien' : 'item_linh_thao';
        const qty = isLien ? 1 : (Math.random() < 0.5 ? 1 : 2);
        
        const result = addItem(nextInventory, itemId, qty, game.age);
        nextInventory = result.inventory;
        nextLog = [...nextLog, ...result.logs];

        combatOutcomeLog(true,
          `🎉 Chiến thắng Yêu thú! Bạn thu hoạch được ${qty}x ${isLien ? 'Tuyết Liên' : 'Linh Thảo'} quý giá.`,
          `🎉 Slew Guardian beast! Harvested ${qty}x ${isLien ? 'Tuyết Liên' : 'Linh Thảo'}.`
        );
      } 
      else if (type === 'beast_hunt') {
        const qty = Math.random() < 0.5 ? 1 : 2;
        const result = addItem(nextInventory, 'item_linh_quang', qty, game.age);
        
        let boneLog = '';
        if (Math.random() < 0.4) {
          const boneRes = addItem(result.inventory, 'item_than_cot', 1, game.age);
          nextInventory = boneRes.inventory;
          nextLog = [...nextLog, ...boneRes.logs];
          boneLog = ' và 1x Linh Thú Thần Cốt';
        } else {
          nextInventory = result.inventory;
        }

        nextLog = [...nextLog, ...result.logs];
        combatOutcomeLog(true,
          `🎉 Săn bắn thành công! Nhận được ${qty}x Linh Quặng${boneLog}.`,
          `🎉 Hunt successful! Acquired ${qty}x Spirit Ore${boneLog ? ' and 1x Beast Shard' : ''}.`
        );
      } 
      else if (type === 'demonic') {
        nextSpiritStones += 50;
        nextSectContribution += 40;
        
        const techResult = addFragment(game.techniques || [], 'liet_duong_hoa', 1, game.age, language);
        nextLog = [...nextLog, ...techResult.logs];

        combatOutcomeLog(true,
          `🎉 Trảm sát Ma Tu cướp đường! Bạn thu giữ tài sản của hắn (+50 Linh thạch, +40 Cống hiến) và ngộ ra mảnh tàn quyển Kiếm pháp.`,
          `🎉 Defeated Demonic Cultivator! Claimed his belongings (+50 Spirit Stones, +40 Sect Contribution) and recovered a Sword manual fragment.`
        );
      }
      else if (type === 'npc_ta_tieu') {
        nextSpiritStones += 10;
        const oldVal = nextNpcFavorability['npc_kiem_tong_ta_tieu'] ?? 0;
        nextNpcFavorability['npc_kiem_tong_ta_tieu'] = Math.max(-100, Math.min(100, oldVal - 20));
        
        const chapsuOld = nextNpcFavorability['npc_kiem_tong_chap_su'] ?? 0;
        nextNpcFavorability['npc_kiem_tong_chap_su'] = Math.max(-100, Math.min(100, chapsuOld + Math.round(-20 * 0.6)));

        combatOutcomeLog(true,
          `🎉 Dạy dỗ Tạ Tiêu thành công! Bạn đánh bại hắn, tịch thu 10 Linh thạch ăn chơi của hắn (Tạ Tiêu hảo cảm -20, Chấp sự Tạ Trần hảo cảm -12).`,
          `🎉 Defeated Tạ Tiêu! Confiscated 10 of his Stones (Tạ Tiêu favor -20, Tạ Trần favor -12).`
        );
      }
      else if (type === 'npc_khau_vo_ky') {
        nextSpiritStones += 50;
        const result = addItem(nextInventory, 'item_huyen_nguyen_dan', 1, game.age);
        nextInventory = result.inventory;
        nextLog = [...nextLog, ...result.logs];

        const oldVal = nextNpcFavorability['npc_ma_dao_chap_su'] ?? 0;
        nextNpcFavorability['npc_ma_dao_chap_su'] = Math.max(-100, Math.min(100, oldVal - 30));

        combatOutcomeLog(true,
          `🎉 Đánh bại Ma Đạo Chấp sự Khấu Vô Kỵ! Bạn trảm phá ma khí của hắn, tịch thu túi trữ vật chứa 50 Linh thạch và 1x Huyền Nguyên Đan (Khấu Vô Kỵ hảo cảm -30).`,
          `🎉 Defeated Ma Đạo Chấp Sự Khấu Vô Kỵ! Confiscated his belongings (+50 Spirit Stones, +1x Elixir, favor -30).`
        );
      }
      else if (type === 'tournament_1') {
        const nextRoundEvent: EventDefinition = {
          id: 'combat_encounter_tournament_2',
          title: { vi: '🏟️ Đại Hội Tỷ Thí Ngoại Môn (Vòng Bán Kết)', en: '🏟️ Outer Sect Tournament (Semi-finals)'},
          description: { vi: 'Chiến thắng Lâm Phong thuyết phục! Vòng bán kết tiếp tục: Đối thủ tiếp theo của bạn là Diệp Phàm (Luyện Khí tầng 3). Hãy tập trung linh hỏa giao chiến!', en: 'Slew Lâm Phong decisively! Semi-finals match: Next opponent is Diệp Phàm (Qi Refinement Layer 3). Gather your Qi!'},
          minRealm: 'Mortal',
          
          weight: 1,
          choices: [
            { id: 'start_combat_tournament_2', text: { vi: '⚔️ Bước Vào Trận Đấu', en: '⚔️ Step onto the Ring'}, effects: {} },
            { id: 'action_back', text: { vi: '↩️ Rút lui bảo toàn thực lực (Nhận giải Top 4)', en: '↩️ Withdraw (Claim Top 4 rewards)'}, effects: {} }
          ]
        };
        setGame({
          ...game,
          stats: nextStats,
          currentEvent: nextRoundEvent,
          inventory: nextInventory,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          log: nextLog
        });
        return;
      }
      else if (type === 'tournament_2') {
        const nextRoundEvent: EventDefinition = {
          id: 'combat_encounter_tournament_3',
          title: { vi: '🏟️ Đại Hội Tỷ Thí Ngoại Môn (Trận Chung Kết)', en: '🏟️ Outer Sect Tournament (Championship Finals)'},
          description: { vi: 'Đại chiến chấn động đài tỷ võ! Bạn bước vào trận Chung kết tranh đoạt chức Quán Quân: Đối thủ tối thượng là Sở Hạo (Luyện Khí tầng 4). Trận đấu quyết định vinh quang!', en: 'Stunning victory! You enter the Championship Finals: The final opponent is Sở Hạo (Qi Refinement Layer 4). The ultimate clash!'},
          minRealm: 'Mortal',
          
          weight: 1,
          choices: [
            { id: 'start_combat_tournament_3', text: { vi: '⚔️ Đại Chiến Tranh Quán Quân', en: '⚔️ Fight for the Championship'}, effects: {} },
            { id: 'action_back', text: { vi: '↩️ Xin chịu thua đầu hàng (Nhận giải Á Quân)', en: '↩️ Withdraw (Claim Runner-up rewards)'}, effects: {} }
          ]
        };
        setGame({
          ...game,
          stats: nextStats,
          currentEvent: nextRoundEvent,
          inventory: nextInventory,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          log: nextLog
        });
        return;
      }
      else if (type === 'tournament_3') {
        nextSectContribution += 200;
        nextSpiritStones += 100;
        
        const result = addItem(nextInventory, 'item_huyen_nguyen_dan', 2, game.age);
        nextInventory = result.inventory;
        nextLog = [...nextLog, ...result.logs];

        const oldRank = game.sectRank ?? 'ngoại_môn';
        let newRank = oldRank;
        if (oldRank === 'ngoại_môn') {
          newRank = 'nội_môn';
        }

        combatOutcomeLog(true,
          `🏆 QUÁN QUÂN ĐẠI HỘI TỶ THÍ NGOẠI MÔN! Bạn vô địch đại hội tỷ võ (+200 Cống hiến, +100 Linh thạch, +2 Huyền Nguyên Đan). Trưởng lão nội môn đặc cách thăng cấp bạn thành [Đệ Tử Nội Môn] sớm!`,
          `🏆 OUT OUTER SECT TOURNAMENT CHAMPION! You won the championship (+200 Contrib, +100 Spirit Stones, +2 Elixirs). The Sect Elders promote you to [Inner Disciple] early!`
        );

        if (newRank !== oldRank) {
          nextLog.push({
            type: 'info',
            age: game.age,
            message: { vi: `Chúc mừng! Bạn đã thăng cấp thân phận tông môn thành [Đệ Tử Nội Môn] nhờ danh hiệu Quán Quân!`, en: `Congratulations! Your rank has been promoted to [Inner Disciple] as the Champion!`}
          });
        }

        setGame({
          ...game,
          stats: nextStats,
          currentEvent: getMenuEvent('menu_monthly_plan', { ...game, stats: nextStats, sectRank: newRank }, language),
          inventory: nextInventory,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          sectRank: newRank,
          log: nextLog
        });
        return;
      }
      else if (type === 'tournament_ngao_thien') {
        // Player WINS vs Ngao Thien → Top 10!
        const result = addItem(nextInventory, 'item_truc_co_dan', 1, game.age);
        nextInventory = result.inventory;
        nextLog = [...nextLog, ...result.logs];
        nextSectContribution += 150;
        nextSpiritStones += 50;

        combatOutcomeLog(true,
          `🏆 Kỳ tích! Bạn đánh bại Long Ngạo Thiên trước sự kinh ngạc của toàn bộ sơn môn! Trưởng lão đích thân tặng 1x Trúc Cơ Đan + 150 Cống hiến + 50 Linh thạch!`,
          `🏆 Miracle! You defeated Long Ngao Thien to the shock of the entire sect! An Elder personally awards 1x Foundation Pill + 150 Contribution + 50 Spirit Stones!`
        );
        setGame({
          ...game,
          stats: nextStats,
          currentEvent: getMenuEvent('menu_monthly_plan', { ...game, stats: nextStats }, language),
          inventory: nextInventory,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          log: nextLog
        });
        return;
      }

      nextEvent = getMenuEvent('menu_monthly_plan', { ...game, stats: nextStats }, language);
    } 
    else {
      if (type !== 'tournament_ngao_thien') nextStats.health = 0;
      let deathMsgVi = '';
      let deathMsgEn = '';
      
      if (type.startsWith('tournament_')) {
        let roundNameVi = 'Vòng loại';
        let roundNameEn = 'Quarter-finals';

        if (type === 'tournament_2') {
          roundNameVi = 'Bán kết';
          roundNameEn = 'Semi-finals';
        } else if (type === 'tournament_3') {
          roundNameVi = 'Chung kết';
          roundNameEn = 'Championship Finals';
        }

        deathMsgVi = `Tử chiến đấu đài: Bạn đã kiệt lực và bị đánh bại hoàn toàn tại vòng ${roundNameVi} ngoại môn tỷ thí, tổn thương kinh mạch chí mạng dẫn đến tử vong.`;
        deathMsgEn = `Defeated in the ${roundNameEn} tournament: You sustained fatal injuries on the stage and succumbed to death.`;
      } 
      else if (type === 'npc_ta_tieu') {
        const stonesLost = Math.min(nextSpiritStones, 10);
        nextSpiritStones -= stonesLost;
        
        const oldVal = nextNpcFavorability['npc_kiem_tong_ta_tieu'] ?? 0;
        nextNpcFavorability['npc_kiem_tong_ta_tieu'] = Math.max(-100, Math.min(100, oldVal - 10));
        
        const chapsuOld = nextNpcFavorability['npc_kiem_tong_chap_su'] ?? 0;
        nextNpcFavorability['npc_kiem_tong_chap_su'] = Math.max(-100, Math.min(100, chapsuOld + Math.round(-10 * 0.6)));

        deathMsgVi = `Bị Tạ Tiêu đánh bại và cướp mất ${stonesLost} Linh thạch. Do chấn thương quá nặng, bạn đã tử vong sau trận chiến.`;
        deathMsgEn = `Defeated by Tạ Tiêu and looted of ${stonesLost} Stones. You died from severe injuries.`;
      }
      else if (type === 'tournament_ngao_thien') {
        // Player LOSES vs Ngao Thien → heavy injury but not necessarily dead
        const hpPenalty = 50;
        nextStats.health = Math.max(0, nextStats.health - hpPenalty);
        if (nextStats.health > 0) {
          // Survived - just heavily injured, return to monthly plan
          nextLog.push({
            type: 'info',
            age: game.age,
            message: { vi: `❌ Thất bại trước Long Ngạo Thiên! Hắn dừng tay trước khi bạn hấp hối. Tuy thua nhưng bạn vẫn nhận được ghi nhận của tông môn. Chấn thương kiên mạch: -${hpPenalty} HP.`, en: `❌ Defeated by Long Ngao Thien! He stayed his hand before you fell. Despite losing, the sect acknowledged your courage. Meridian injury: -${hpPenalty} HP.`
            }
          });
          setGame({
            ...game,
            stats: nextStats,
            currentEvent: getMenuEvent('menu_monthly_plan', { ...game, stats: nextStats }, language),
            inventory: nextInventory,
            spiritStones: nextSpiritStones,
            sectContribution: nextSectContribution,
            log: nextLog
          });
          return;
        }
        // HP reached 0 → death
        deathMsgVi = `Tử thương trên lôi đài: Long Ngạo Thiên tung đòn tiệt diệt khính vong kiên mạch của bạn. Kí huyết suy kiệt, chỉ còn một hơi thở cuối cùng.`;
        deathMsgEn = `Fatal wounds on the arena: Long Ngao Thien\'s final strike shattered your meridians. Qi exhausted, only one last breath remains.`;
      }
      else if (type === 'npc_khau_vo_ky') {
        const stonesLost = Math.min(nextSpiritStones, 30);
        nextSpiritStones -= stonesLost;

        const oldVal = nextNpcFavorability['npc_ma_dao_chap_su'] ?? 0;
        nextNpcFavorability['npc_ma_dao_chap_su'] = Math.max(-100, Math.min(100, oldVal - 15));

        deathMsgVi = `Bị Ma Đạo Chấp sự Khấu Vô Kỵ đánh bại và luyện hóa linh hồn (Mất ${stonesLost} Linh thạch). Linh hồn và thể xác của bạn tiêu tán hoàn toàn.`;
        deathMsgEn = `Defeated by Khấu Vô Kỵ and had your soul refined (Lost ${stonesLost} Stones). Your body and soul were completely destroyed.`;
      }
      else {
        const stonesLost = Math.min(nextSpiritStones, 15);
        nextSpiritStones -= stonesLost;

        deathMsgVi = `Bại trận dã ngoại! Yêu thú/Ma Tu đánh bại và cướp đoạt tài vật của bạn (Mất ${stonesLost} Linh thạch), tổn thương phủ tạng dẫn đến tử vong.`;
        deathMsgEn = `Defeated in the wilderness! Suffer critical wounds and were looted (Lost ${stonesLost} Spirit Stones). You perished from your injuries.`;
      }

      customDeathCause = { vi: deathMsgVi, en: deathMsgEn};
      
      nextLog.push({
        type: 'death',
        age: game.age,
        message: customDeathCause
      });
    }

    let finalRank = game.sectRank ?? 'ngoại_môn';
    if (finalRank === 'ngoại_môn' && nextSectContribution >= 300) {
      finalRank = 'nội_môn';
      nextLog.push({
        type: 'info',
        age: game.age,
        message: {
          vi: `Chúc mừng! Tích lũy đóng góp tông môn vượt 300 điểm, bạn được đặc cách thăng cấp thành [Đệ Tử Nội Môn]!`,
          en: `Congratulations! Your sect contribution has exceeded 300. You are promoted to [Inner Disciple]!`
        }
      });
    }

    const isAlive = nextStats.health > 0 && nextStats.karma > -11;

    setGame({
      ...game,
      alive: isAlive,
      stats: nextStats,
      currentEvent: isAlive ? nextEvent : null,
      inventory: nextInventory,
      spiritStones: nextSpiritStones,
      sectContribution: nextSectContribution,
      sectRank: finalRank,
      log: nextLog,
      npcFavorability: nextNpcFavorability,
      deathCause: isAlive ? undefined : (customDeathCause || { vi: 'Thất bại chiến đấu tổn thương kinh mạch chí mạng dẫn đến tử vong.', en: 'Suffered fatal meridian damage in combat and deceased.'})
    });
  };

  const buildNpcFromTemplate = (npcId: string, fallback: Character): Character => {
    const template = combatConfig.npcs.find((n: any) => n.id === npcId);
    if (!template) return fallback;

    const BASE_STATS: StatSnapshot = {
      hp: 100,
      max_hp: 100,
      qi: 60,
      max_qi: 60,
      speed: 10,
      comprehension: 8,
      attack: 18,
      qi_control: 10};

    const realms = combatConfig.realms as any[];
    const physiques = combatConfig.physiques as any[];
    
    const realm = realms.find(r => r.id === template.realm) || { tier: 1.0, bonus: {} };
    const physique = physiques.find(p => p.id === template.physique) || { bonus: {}, tags: [] };

    const addStats = (base: StatSnapshot, bonus: Partial<StatSnapshot>): StatSnapshot => {
      const next = { ...base };
      for (const [key, value] of Object.entries(bonus)) {
        (next as any)[key] = Math.max(key === 'hp' || key === 'max_hp' ? 1 : 0, ((next as any)[key] ?? 0) + (Number(value) ?? 0));
      }
      return next;
    };

    const applyTactic = (stats: StatSnapshot, tacticId: string): StatSnapshot => {
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

    const stats = applyTactic(addStats(addStats(BASE_STATS, realm.bonus), physique.bonus), template.tactic);
    const enemyArts = combatConfig.enemy_arts as any[];
    const techniques = combatConfig.techniques as any[];
    
    const art = enemyArts.find(a => a.id === template.technique) || techniques.find(t => t.id === template.technique);
    const actionId = art ? art.action.id : 'act_enemy_claw';

    return {
      id: npcId,
      name: template.name,
      realm_tier: realm.tier,
      base_stats: {
        hp: stats.hp,
        max_hp: stats.max_hp,
        qi: stats.qi,
        max_qi: stats.max_qi,
        speed: stats.speed,
        attack: stats.attack,
        qi_control: stats.qi_control,
        comprehension: stats.comprehension
      },
      tags: [...(physique.tags || []), template.tactic],
      buffs: [],
      ai_rules: [
        { condition: 'always', action_id: actionId, weight: 10 }
      ]
    };
  };

  const handleChoice = (choiceId: string) => {
    if (!game || !game.alive) return;
    setPreviousGame(game);

    if (choiceId === 'action_mortal_breakthrough_minigame') {
      const manual = game.techniques?.find(t => !t.isActive);
      if (manual) {
        setLearningTechnique(manual);
        setIsFatalMinigame(true);
      }
      return;
    }

    if (choiceId === 'goto_menu_sect_shop') {
      setShowSectShop(true);
      return;
    }

    if (choiceId === 'start_combat_npc_ta_tieu') {
      const player = buildPlayerCharacter(game);
      const fallback: Character = {
        id: 'enemy_ta_tieu',
        name: 'Tạ Tiêu',
        realm_tier: 1.12,
        base_stats: {
          hp: 80,
          max_hp: 80,
          qi: 45,
          max_qi: 45,
          speed: 12,
          attack: 16,
          qi_control: 8,
          comprehension: 5
        },
        tags: ['shadow_step'],
        buffs: [],
        ai_rules: [
          { condition: 'always', action_id: 'act_enemy_claw', weight: 10 }
        ]
      };
      const enemy = buildNpcFromTemplate('enemy_ta_tieu', fallback);
      const env = tournamentEnv;
      setActiveCombat({ player, enemy, env, type: 'npc_ta_tieu' });
      return;
    }
    if (choiceId === 'start_combat_npc_khau_vo_ky') {
      const player = buildPlayerCharacter(game);
      const fallback: Character = {
        id: 'enemy_khau_vo_ky',
        name: 'Khấu Vô Kỵ',
        realm_tier: 2.01,
        base_stats: {
          hp: 130,
          max_hp: 130,
          qi: 85,
          max_qi: 85,
          speed: 14,
          attack: 28,
          qi_control: 15,
          comprehension: 10
        },
        tags: ['spirit_root'],
        buffs: [],
        ai_rules: [
          { condition: 'always', action_id: 'act_enemy_curse', weight: 10 }
        ]
      };
      const enemy = buildNpcFromTemplate('enemy_khau_vo_ky', fallback);
      const env = tournamentEnv;
      setActiveCombat({ player, enemy, env, type: 'npc_khau_vo_ky' });
      return;
    }

    if (choiceId === 'start_combat_beast_herb') {
      const player = buildPlayerCharacter(game);
      const enemy = beastHerbChar;
      const env = beastEnv;
      setActiveCombat({ player, enemy, env, type: 'beast_herb' });
      return;
    }
    if (choiceId === 'start_combat_beast_hunt') {
      const player = buildPlayerCharacter(game);
      const enemy = beastHuntChar;
      const env = beastEnv;
      setActiveCombat({ player, enemy, env, type: 'beast_hunt' });
      return;
    }
    if (choiceId === 'start_combat_demonic') {
      const player = buildPlayerCharacter(game);
      const enemy = demonicChar;
      const env = beastEnv;
      setActiveCombat({ player, enemy, env, type: 'demonic' });
      return;
    }
    if (choiceId === 'start_combat_tournament_1') {
      const player = buildPlayerCharacter(game);
      const enemy = tournament1Char;
      const env = tournamentEnv;
      setActiveCombat({ player, enemy, env, type: 'tournament_1' });
      return;
    }
    if (choiceId === 'start_combat_tournament_2') {
      const player = buildPlayerCharacter(game);
      const enemy = tournament2Char;
      const env = tournamentEnv;
      setActiveCombat({ player, enemy, env, type: 'tournament_2' });
      return;
    }
    if (choiceId === 'start_combat_tournament_3') {
      const player = buildPlayerCharacter(game);
      const enemy = tournament3Char;
      const env = tournamentEnv;
      setActiveCombat({ player, enemy, env, type: 'tournament_3' });
      return;
    }
    if (choiceId === 'start_combat_tournament_ngao_thien') {
      const player = buildPlayerCharacter(game);
      const enemy = ngaoThienChar;
      const env = tournamentEnv;
      setActiveCombat({ player, enemy, env, type: 'tournament_ngao_thien' });
      return;
    }

    const next = applyChoiceToState(game, choiceId, language);
    setGame(next);

    const choice = game.currentEvent?.choices.find(c => c.id === choiceId);
    if (choice?.effects?.openAlchemy) {
      setShowAlchemy(true);
    }
  };

  const handleReincarnate = () => {
    spokenStoryRef.current = null; // Reset spoken story flag
    if (!game) return;
    setCreationGender('nam');
    setCreationRoot('Kim Linh Căn');
    setCreationSect('Kiếm Tông');
    setIsReincarnationFlow(true);
    setShowCharacterCreation(true);
  };

  const handleCombatModalAction = (action: 'brute_force' | 'tactical' | 'stall' | 'demonic' | 'escape') => {
    if (!game) return;
    setGame(resolveCombatAction(game, action));
  };

  const handleCombatModalClose = () => {
    if (!game) return;
    setGame(finishCombat(game));
  };

  const handleUseItem = (itemIndex: number) => {
    if (!game || !game.alive) return;
    setPreviousGame(game);
    const next = useItemInState(game, itemIndex);
    setGame(next);
  };

  const handleEquipItem = (itemIndex: number) => {
    if (!game || !game.alive) return;
    setPreviousGame(game);
    const next = equipItemInState(game, itemIndex);
    setGame(next);
  };

  const handleAcceptQuest = (quest: SectQuest, isParty: boolean) => {
    if (!game || !game.alive) return;
    setPreviousGame(game);
    setGame({
      ...game,
      activeQuest: {
        quest,
        monthsRemaining: quest.durationMonths,
        progressLogs: [],
        isParty
      },
      isTicking: true
    });
    setShowSectMissions(false);
    playSfxWithPath('/audio/crystal-bowl.mp3', 0.6);
  };

  const handleHeal = () => {
    if (!game || !game.alive) return;
    setPreviousGame(game);

    // Calculate max HP
    const subStageInfo = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
    const equipHpBonus = (game.inventory || [])
      .filter(item => item.category === 'equipment' && item.equipped)
      .reduce((sum, item) => sum + (item.combatStats?.maxHp ?? 0), 0);
    const maxHp = 20 + Math.max(0, Math.floor(game.inheritance.blessing / 2)) + subStageInfo.bonus.max_hp + equipHpBonus;

    if (game.stats.health >= maxHp) return;

    let nextMonth = game.month + 1;
    let nextAge = game.age;
    let triggerPunishment = false;
    let nextQuestsCompletedThisYear = game.questsCompletedThisYear ?? 0;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextAge += 1;
      if (game.realm === 'Qi Refinement' && nextQuestsCompletedThisYear === 0) {
        triggerPunishment = true;
      }
      nextQuestsCompletedThisYear = 0;
    }

    const healedHealth = Math.min(maxHp, game.stats.health + Math.round(maxHp * 0.5));
    
    // Check if age exceeds lifespan
    let alive: boolean = game.alive;
    let deathCause = game.deathCause;
    let lastMessage = game.lastMessage;
    const newLog = [...(game.log || [])];

    if (nextAge >= game.stats.lifespan) {
      alive = false;
      const deathText = language === 'vi' 
        ? { vi: `Lão hóa tự nhiên: Bạn đã cạn kiệt thọ nguyên ở tuổi ${nextAge} khi đang bế quan trị thương.`, en: `Natural aging: You ran out of lifespan at age ${nextAge} during closed-door healing.` }
        : { vi: `Natural aging: You ran out of lifespan at age ${nextAge} during closed-door healing.`, en: `Natural aging: You ran out of lifespan at age ${nextAge} during closed-door healing.` };
      deathCause = deathText;
      lastMessage = deathText;
      newLog.push({
        type: 'death',
        age: nextAge,
        message: deathText});
    }

    const months = ["🐀", "🐂", "🐅", "🐈", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
    const monthLabel = months[nextMonth - 1] || `Month ${nextMonth}`;
    const logDesc = (uiText[language]?.['youEnterCloseddoorMe'] || 'You enter closed-door meditation to heal, restoring vitality (+50% HP).');
    const logLine = `[${monthLabel} - Tuổi ${nextAge}]: ${logDesc}`;
    const nextMonthlyLog = [...(game.monthlyLog || []), logLine].slice(-5);

    if (!alive) {
      setGame({
        ...game,
        age: nextAge,
        month: nextMonth,
        alive: false,
        stats: {
          ...game.stats,
          health: 0
        },
        currentEvent: null,
        isTicking: false,
        deathCause,
        lastMessage,
        log: newLog,
        questsCompletedThisYear: nextQuestsCompletedThisYear
      });
      return;
    }

    if (triggerPunishment) {
      const punishmentLog: any = {
        type: 'info',
        age: nextAge,
        message: {
          vi: `⚠️ Trừng phạt hàng năm: Do lười biếng không làm nhiệm vụ tông môn nào, Chấp Pháp Đường giáng lâm trừng phạt!`,
          en: `⚠️ Annual Punishment: Having completed no sect quests, the Law Enforcement Hall inflicts punishment!`
        }
      };
      setGame({
        ...game,
        age: nextAge,
        month: nextMonth,
        isTicking: false,
        currentEvent: SectPunishmentEvent,
        log: [...game.log, punishmentLog],
        lastMessage: punishmentLog.message,
        questsCompletedThisYear: 0
      });
      return;
    }

    const healLogEntry: any = {
      type: 'info',
      age: nextAge,
      message: { vi: `Bế quan dưỡng thương vào ${monthLabel}: Khí huyết hồi phục từ ${game.stats.health} lên ${healedHealth}.`, en: `Healed injuries in ${monthLabel}: HP restored from ${game.stats.health} to ${healedHealth}.`
      }
    };

    setGame({
      ...game,
      age: nextAge,
      month: nextMonth,
      stats: {
        ...game.stats,
        health: healedHealth
      },
      monthlyLog: nextMonthlyLog,
      log: [...game.log, healLogEntry],
      lastMessage: healLogEntry.message,
      questsCompletedThisYear: nextQuestsCompletedThisYear
    });
    playSfxWithPath('/audio/crystal-bowl.mp3', 0.6);
  };

  const handleLeaveSectForEvent = (actionType: 'black_market' | 'auction' | 'explore_mountain' | 'hunt_beast' | 'general_travel' = 'general_travel') => {
    if (!game || !game.alive) return;
    setPreviousGame(game);

    let nextMonth = game.month + 1;
    let nextAge = game.age;
    let triggerPunishment = false;
    let nextQuestsCompletedThisYear = game.questsCompletedThisYear ?? 0;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextAge += 1;
      if (game.realm === 'Qi Refinement' && nextQuestsCompletedThisYear === 0) {
        triggerPunishment = true;
      }
      nextQuestsCompletedThisYear = 0;
    }

    // Check if age exceeds lifespan
    let alive: boolean = game.alive;
    let deathCause = game.deathCause;
    let lastMessage = game.lastMessage;
    const newLog = [...(game.log || [])];

    if (nextAge >= game.stats.lifespan) {
      alive = false;
      const deathText = language === 'vi'
        ? { vi: `Lão hóa tự nhiên: Bạn đã cạn kiệt thọ nguyên ở tuổi ${nextAge} khi đang phiêu bạt giang hồ.`, en: `Natural aging: You ran out of lifespan at age ${nextAge} during travels.` }
        : { vi: `Natural aging: You ran out of lifespan at age ${nextAge} during travels.`, en: `Natural aging: You ran out of lifespan at age ${nextAge} during travels.` };
      deathCause = deathText;
      lastMessage = deathText;
      newLog.push({
        type: 'death',
        age: nextAge,
        message: deathText});
      
      setGame({
        ...game,
        age: nextAge,
        month: nextMonth,
        alive: false,
        currentEvent: null,
        isTicking: false,
        deathCause,
        lastMessage,
        log: newLog,
        questsCompletedThisYear: nextQuestsCompletedThisYear
      });
      return;
    }

    if (triggerPunishment) {
      const punishmentLog: any = {
        type: 'info',
        age: nextAge,
        message: {
          vi: `⚠️ Trừng phạt hàng năm: Do lười biếng không làm nhiệm vụ tông môn nào, Chấp Pháp Đường giáng lâm trừng phạt!`,
          en: `⚠️ Annual Punishment: Having completed no sect quests, the Law Enforcement Hall inflicts punishment!`
        }
      };
      setGame({
        ...game,
        age: nextAge,
        month: nextMonth,
        isTicking: false,
        currentEvent: SectPunishmentEvent,
        log: [...game.log, punishmentLog],
        lastMessage: punishmentLog.message,
        questsCompletedThisYear: 0
      });
      return;
    }

    const event = getRandomEvent({ ...game, age: nextAge }, language);
    const months = ["🐀", "🐂", "🐅", "🐈", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
    const monthLabel = months[nextMonth - 1] || `Month ${nextMonth}`;

    let logDesc = '';
    let triggerLogMessageVi = '';
    let triggerLogMessageEn = '';

    if (actionType === 'black_market') {
      logDesc = (uiText[language]?.['youWanderTheBlackMar'] || 'You wander the Black Market seeking opportunity.');
      triggerLogMessageVi = `Dạo quanh Chợ Đen, gặp phải kỳ ngộ vào ${monthLabel}: [${getLocalizedText(event.title, 'vi')}]`;
      triggerLogMessageEn = `Wandered the Black Market and triggered an event in ${monthLabel}: [${getLocalizedText(event.title, 'en')}]`;
    } else if (actionType === 'auction') {
      logDesc = (uiText[language]?.['youAttendAnAuctionSe'] || 'You attend an Auction seeking treasures.');
      triggerLogMessageVi = `Tham gia Đấu Giá, gặp phải kỳ ngộ vào ${monthLabel}: [${getLocalizedText(event.title, 'vi')}]`;
      triggerLogMessageEn = `Attended an Auction and triggered an event in ${monthLabel}: [${getLocalizedText(event.title, 'en')}]`;
    } else if (actionType === 'explore_mountain') {
      logDesc = (uiText[language]?.['youVentureDeepIntoTh'] || 'You venture deep into the Beast Mountain Range to explore.');
      triggerLogMessageVi = `Tiến sâu vào Sơn Mạch, gặp phải kỳ ngộ vào ${monthLabel}: [${getLocalizedText(event.title, 'vi')}]`;
      triggerLogMessageEn = `Ventured into the Mountain Range and triggered an event in ${monthLabel}: [${getLocalizedText(event.title, 'en')}]`;
    } else if (actionType === 'hunt_beast') {
      logDesc = (uiText[language]?.['youHuntBeastsAndGath'] || 'You hunt beasts and gather herbs in the Beast Mountain Range.');
      triggerLogMessageVi = `Săn thú & hái thuốc, gặp phải kỳ ngộ vào ${monthLabel}: [${getLocalizedText(event.title, 'vi')}]`;
      triggerLogMessageEn = `Hunted and gathered herbs, triggering an event in ${monthLabel}: [${getLocalizedText(event.title, 'en')}]`;
    } else {
      logDesc = (uiText[language]?.['youLeaveTheSectToTra'] || 'You leave the sect to travel the outside world seeking serendipity.');
      triggerLogMessageVi = `Xuống núi chu du, gặp phải kỳ ngộ vào ${monthLabel}: [${getLocalizedText(event.title, 'vi')}]`;
      triggerLogMessageEn = `Traveled outside and triggered an event in ${monthLabel}: [${getLocalizedText(event.title, 'en')}]`;
    }

    const triggerLog: any = {
      type: 'info',
      age: nextAge,
      message: { en: triggerLogMessageEn, vi: triggerLogMessageVi}
    };

    const logLine = `[${monthLabel} - Tuổi ${nextAge}]: ${logDesc}`;
    const nextMonthlyLog = [...(game.monthlyLog || []), logLine].slice(-5);

    setGame({
      ...game,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: event,
      monthlyLog: nextMonthlyLog,
      log: [...game.log, triggerLog],
      lastMessage: triggerLog.message,
      questsCompletedThisYear: nextQuestsCompletedThisYear
    });
    playSfxWithPath('/audio/reincarnation.mp3', 0.85);
  };

  const handleChoiceWithTransition = (choiceId: string) => {
    if (!game || !game.alive) return;

    let transitionType: 'ink_fade' | 'karma_good' | 'karma_bad' | 'destiny_win' | 'destiny_lose' | 'combat_win' | 'combat_lose' | 'combat_start' = 'ink_fade';
    
    if (choiceId === 'action_mortal_breakthrough_minigame') {
      handleChoice(choiceId);
      return;
    }

    if (choiceId.startsWith('start_combat_')) {
      transitionType = 'combat_start';
    } else {
      const next = applyChoiceToState(game, choiceId, language);
      const choice = game.currentEvent?.choices.find(c => c.id === choiceId);
      const choiceTextVi = choice ? getLocalizedText(choice.text, 'vi').toLowerCase() : '';
      const choiceTextEn = choice ? getLocalizedText(choice.text, 'en').toLowerCase() : '';
      const choiceText = `${choiceTextVi} ${choiceTextEn}`;
      
      const karmaDiff = next.stats.karma - game.stats.karma;
      const cultDiff = next.stats.cultivation - game.stats.cultivation;
      const hpDiff = next.stats.health - game.stats.health;
      
      const isBreakthrough = choiceId.includes('breakthrough') || choiceId.includes('dot_pha') || choiceText.includes('đột phá') || choiceText.includes('breakthrough') || choiceText.includes('uống') || choiceText.includes('dan');
      const isDestiny = game.currentEvent?.tags?.includes('secret_realm') || game.currentEvent?.tags?.includes('opportunity') || choiceId.includes('realm') || choiceId.includes('ruin') || choiceText.includes('kỳ ngộ') || choiceText.includes('di tích') || choiceText.includes('bí cảnh');

      if (isBreakthrough) {
        const success = cultDiff > 0 && hpDiff >= 0;
        transitionType = success ? 'combat_win' : 'combat_lose';
      } else if (isDestiny) {
        const success = hpDiff >= 0 && next.stats.health > 1;
        transitionType = success ? 'destiny_win' : 'destiny_lose';
      } else if (karmaDiff > 0) {
        transitionType = 'karma_good';
      } else if (karmaDiff < 0) {
        transitionType = 'karma_bad';
      } else {
        transitionType = 'ink_fade';
      }
    }

    setTransitionOutcome({
      type: transitionType,
      action: () => handleChoice(choiceId)
    });
  };

  const handleHealWithTransition = () => {
    setTransitionOutcome({
      type: 'ink_fade',
      action: () => handleHeal()
    });
  };

  const handleLeaveSectForEventWithTransition = (actionType: 'black_market' | 'auction' | 'explore_mountain' | 'hunt_beast' | 'general_travel' = 'general_travel') => {
    setTransitionOutcome({
      type: 'destiny_win',
      action: () => handleLeaveSectForEvent(actionType)
    });
  };

  const handleMoveLocationWithTransition = (newLocation: 'sect' | 'mountain' | 'city' | 'secret_realm') => {
    setTransitionOutcome({
      type: 'ink_fade',
      action: () => {
        if (!game) return;
        setPreviousGame(game);
        const next = changeLocation(game, newLocation, language, activeCombatConfig);
        setGame(next);
        playSfxWithPath('/audio/crystal-bowl.mp3', 0.6);
      }
    });
  };

  const getCityBadge = () => {
    if (!game || !game.worldState) return null;
    const city = game.worldState.city;
    const demonic = game.worldState.demonic;
    if (city.security < 40 || demonic.activity > 60) {
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs animate-pulse shadow-md shadow-red-950/40 z-10" title="Khu vực nguy hiểm / Danger">
          ⚠️
        </span>
      );
    }
    if (city.prosperity > 80) {
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs animate-pulse shadow-md shadow-amber-950/40 z-10" title="Thành thị phồn hoa / Prosperous">
          💰
        </span>
      );
    }
    return null;
  };

  const getMountainBadge = () => {
    if (!game || !game.worldState) return null;
    const mountain = game.worldState.mountain;
    if (mountain.beastActivity > 75) {
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs animate-pulse shadow-md shadow-red-950/40 z-10" title="Yêu thú hoạt động mạnh / High beast activity">
          🐾
        </span>
      );
    }
    if (mountain.danger > 60) {
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs animate-pulse shadow-md shadow-red-950/40 z-10" title="Khu vực cực kỳ nguy hiểm / High danger">
          💀
        </span>
      );
    }
    return null;
  };

  const getSectBadge = () => {
    if (!game || !game.worldState) return null;
    const sect = game.worldState.sect;
    if (sect.warLevel > 60 || sect.stability < 30) {
      return (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs animate-pulse shadow-md shadow-red-950/40 z-10" title="Tông môn chiến sự bất ổn / War or low stability">
          ⚔️
        </span>
      );
    }
    return null;
  };

  const copy = uiText[language];

  useEffect(() => {
    if (!loaded || !audioEnabled) return;
    if (audioMuted) {
      mute();
    } else {
      unmute();
    }
  }, [audioEnabled, audioMuted, mute, unmute, loaded]);

  if (!loaded || eventsLoading) {
    return (
      <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background text-primary font-mono-data">
        <div className="absolute inset-0 pointer-events-none scanlines opacity-30" />
        
        <div className="relative z-10 w-full max-w-md px-6 space-y-8">
          {/* Header */}
          <div className="space-y-2 border-l-2 border-primary pl-4">
            <h1 className="text-2xl font-bold tracking-[0.2em] uppercase">
              {(uiText[language]?.['immortalSimSys'] || 'IMMORTAL SIM // SYS')}
            </h1>
            <p className="text-xs tracking-[0.3em] uppercase text-on-surface-variant font-semibold">
              {(uiText[language]?.['initializingWorldOri'] || 'INITIALIZING WORLD ORIGIN')}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="relative h-4 w-full bg-surface-container border border-outline-variant overflow-hidden p-[2px]">
              <div 
                style={{ width: `${loadingProgress}%` }}
                className="h-full bg-primary transition-all duration-300"
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-on-surface tracking-widest uppercase mt-1">
              <span>{`[ SYNC: ${loadingProgress}% ]`}</span>
              <span>DATA: {(loadingProgress * 15.6).toFixed(0)} / 1560 KB</span>
            </div>
          </div>
          
          {/* Logs */}
          <div className="border border-outline-variant/30 bg-surface-container/50 p-4 h-24 overflow-hidden relative">
            <p className="text-xs font-mono tracking-wide text-primary/80 animate-pulse">
              &gt; {loadingText}
            </p>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-container/50 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  let activeOverlayNode: React.ReactNode = null;
  if (learningTechnique && game) {
    activeOverlayNode = (
      <CultivationMinigame
        language={language}
        technique={learningTechnique}
        onFail={(severity) => {
          const nextState = { ...game };
          let gotComprehension = false;
          let compAmount = 0;
          let tierChance = 30; // default hoàng
          if (learningTechnique.tier === 'huyền') tierChance = 40;
          else if (learningTechnique.tier === 'địa') tierChance = 50;
          else if (learningTechnique.tier === 'thiên') tierChance = 60;

          let msg = '';
          let msgEn = '';

          if (severity === 'severe') {
            nextState.stats.innerDemons = (nextState.stats.innerDemons || 0) + 1;
            msg = `[Nhập môn thất bại thảm hại] Hoàn toàn sai lệch. Trong bóng tối thức hải, Tâm Ma bắt đầu thì thầm... Tâm ma +1.`;
            msgEn = `[Severe Failure] Completely misguided. In the dark corners of your mind sea, Inner Demons begin to whisper... Inner Demons +1.`;
          } else if (severity === 'heavy') {
            nextState.stats.health = Math.max(1, Math.floor(nextState.stats.health * 0.7)); // lose 30% hp
            nextState.stats.meridianDamage = (nextState.stats.meridianDamage || 0) + 10;
            msg = `[Nhập môn thất bại nặng] Khí Hải rạn nứt! Kinh mạch tổn thương, linh lực tối đa giảm 10%. Mất 30% HP.`;
            msgEn = `[Heavy Failure] Qi Sea cracked! Meridians damaged, max Qi reduced by 10%. Lost 30% HP.`;
            if (Math.random() * 100 < tierChance * 1.5) {
              gotComprehension = true;
              compAmount = 2;
            }
          } else { // mild
            nextState.stats.health = Math.max(1, Math.floor(nextState.stats.health * 0.8)); // lose 20% hp
            msg = `[Nhập môn thất bại] Linh khí nghịch lưu, kinh mạch rung chuyển. Tẩu hỏa nhập ma nhẹ, mất 20% HP.`;
            msgEn = `[Mild Failure] Qi reversed, meridians shaken. Mild Qi deviation, lost 20% HP.`;
            if (Math.random() * 100 < tierChance) {
              gotComprehension = true;
              compAmount = 1;
            }
          }

          if (gotComprehension) {
            nextState.stats.comprehension = (nextState.stats.comprehension || 0) + compAmount;
            msg += ` Tuy nhiên, ngươi đã hiểu được cốt lõi công pháp. Ngộ tính +${compAmount}.`;
            msgEn += ` However, you grasped the core concept. Comprehension +${compAmount}.`;
          }

          nextState.log = [...nextState.log, { type: 'info', message: { vi: msg, en: msgEn } }];

          setGame(nextState);
          setLearningTechnique(null);
          setIsFatalMinigame(false);
        }}
        onSuccess={(perfect) => {
          let newState = completeTechniqueLearning(game, learningTechnique.id, perfect, language);
          if (newState.realm === 'Mortal') {
            const nextStats = { ...newState.stats, cultivation: 0, lifespan: newState.stats.lifespan + 40 };
            const newRealm = 'Qi Refinement';
            const logEntry = {
              type: 'technique_breakthrough' as const,
              age: newState.age,
              message: { vi: `🌟 Chúc mừng! Bạn đã đột phá từ Phàm Nhân thành công bước vào Luyện Khí Tầng 1! Thọ nguyên gia tăng +40 năm.`, en: `🌟 Congratulations! You broke through from Mortal to Qi Refinement Layer 1! Lifespan increased by +40 years.`}
            };
            newState = { ...newState, stats: nextStats, realm: newRealm, subStageIndex: 1, log: [...newState.log, logEntry] };
          }
          if (newState.currentEvent?.id.startsWith('menu_')) {
            newState.currentEvent = getMenuEvent(newState.currentEvent.id, newState, language) || newState.currentEvent;
          }
          setGame(newState);
          setLearningTechnique(null);
          setIsFatalMinigame(false);
        }}
        onCancel={() => {
          setLearningTechnique(null);
          setIsFatalMinigame(false);
        }}
      />
    );
  } else if (breakthroughData) {
    activeOverlayNode = breakthroughData.isMajor ? (
      <MajorBreakthrough
        oldStageName={breakthroughData.oldStageName}
        newStageName={breakthroughData.newStageName}
        majorRealm={breakthroughData.majorRealm}
        language={language as "vi" | "en"}
        onClose={() => setBreakthroughData(null)}
      />
    ) : (
      <SubStageBreakthrough
        oldStageName={breakthroughData.oldStageName}
        newStageName={breakthroughData.newStageName}
        majorRealm={breakthroughData.majorRealm}
        language={language as "vi" | "en"}
        onClose={() => setBreakthroughData(null)}
      />
    );
  }

  return (
    <>
      <AtmosphereBackground gameState={game} previousGameState={previousGame} />
      
      {/* If Game is Active, render new UI */}
      {game && game.alive && !showCharacterCreation && !showTestCombat && (
        <TerminalUI 
          game={game} 
          setGame={setGame} 
          language={language as "vi" | "en"}
          onChoice={handleChoice}
          levelRewardAnimation={levelRewardAnimation}
          onRewardDone={() => setLevelRewardAnimation(null)}
          activeOverlayNode={activeOverlayNode}
          centerPanelOverride={game?.currentLocation === 'mountain' && !activeCombat ? (
            <MountainExploration
              language={languageRef.current}
              onReturn={() => handleMoveLocationWithTransition('sect')}
              onEventResult={handleMountainExploreEventResult}
              onCombat={handleMountainExploreCombat}
              onTimePass={handleMountainExploreTimePass}
              travelCostStones={activeCombatConfigRef.current?.time_gear?.travel_cost_stones ?? 10}
              travelCostHp={activeCombatConfigRef.current?.time_gear?.travel_cost_hp ?? 2}
            />
          ) : undefined}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
          onAscension={() => {
            const subStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);
            if (game.stats.cultivation >= 500) {
              setGame(prev => prev ? {
                ...prev,
                stats: { ...prev.stats, cultivation: prev.stats.cultivation - 500 },
                subStageIndex: prev.subStageIndex + 1
              } : prev);
            }
          }}
        />
      )}

      {game && !game.alive && !showCharacterCreation && !showTestCombat && (
        <ReincarnationUI 
          game={game} 
          setGame={setGame} 
          inheritance={inheritance} 
          setInheritance={setInheritance} 
          language={language as "vi" | "en"}
          onReincarnate={() => {
            handleReset();
          }}
        />
      )}

      {/* Fallback to original UI for character creation, test combat, etc. */}
      {/* Removed outer wrapper */}
      <div className={`relative flex min-h-[100dvh] flex-col antialiased ${!game || !game.alive ? 'overflow-auto' : 'overflow-hidden max-h-[100dvh]'}`}>
      {game?.activeCombat && (
        <CombatModal state={game} onAction={handleCombatModalAction} onClose={handleCombatModalClose} />
      )}
      {game && showAlchemy && (
        <AlchemyModal 
          state={game} 
          onFinished={(res) => {
            if (!game) return;
            const nextState = { ...game };
            nextState.log = [...nextState.log, { type: 'info', message: { vi: "Kết thúc luyện đan.", en: "Finished alchemy."} }];
            
            if (res.healthLost) {
              nextState.stats.health = Math.max(0, nextState.stats.health - res.healthLost);
              if (nextState.stats.health <= 0) nextState.alive = false;
            }
            if (res.outputItem) {
              nextState.inventory = [...(nextState.inventory || []), res.outputItem];
            }
            setGame(nextState);
            setShowAlchemy(false);
          }}
          onClose={() => setShowAlchemy(false)}
        />
      )}
      {game && showBlackMarket && (
        <BlackMarketModal 
          state={game} 
          onUpdateState={setGame}
          onClose={() => setShowBlackMarket(false)}
        />
      )}
      
      {/* Floating Settings Gear Button (visible on all screens) */}
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-xl bg-surface-container-high/60 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center hover:scale-105 hover:bg-primary/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 group"
        aria-label="Cài đặt"
      >
        <span className="material-symbols-outlined text-primary text-2xl group-hover:rotate-90 transition-transform duration-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
          settings
        </span>
      </button>
      
      {(!game || showCharacterCreation || showTestCombat || !game?.alive) && (
      <>
      {/* Conditionally render header HUD only if simulation is running */}
      {game && !showTestCombat && !activeCombat && (
        <StatsPanel
          stats={game.stats}
          realm={getLocalizedText(translatedRealms[game.realm] || game.realm, language)}
          rawRealm={game.realm}
          subStageIndex={game.subStageIndex}
          inheritance={game.inheritance}
          age={game.age}
          life={game.life}
          run={game.run}
          techniques={game.techniques || []}
          language={language as "vi" | "en"}
          inventory={game.inventory || []}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
          month={game.month}
          sect={game.sect}
          sectContribution={game.sectContribution}
          spiritStones={game.spiritStones}
          sectRank={game.sectRank}
          sectPrestige={game.sectPrestige}
          onViewDetail={setSelectedDetailItem}
          onLearnTechnique={setLearningTechnique}
          npcFavorability={game.npcFavorability}
          worldState={game.worldState}
          currentLocation={game.currentLocation}
          labels={{
            life: copy.lifeLabel,
            run: copy.runLabel,
            age: copy.ageLabel,
            realm: copy.realmLabel,
            health: copy.healthLabel,
            luck: copy.luckLabel,
            comprehension: copy.comprehensionLabel,
            karma: copy.karmaLabel,
            cultivation: copy.cultivationLabel,
            legacy: copy.legacyTitle,
            legacyPower: copy.legacyPower,
            ancestralMemory: copy.ancestralMemory,
            blessing: copy.blessing,
            lifespan: copy.lifespanLabel,
            daoHeart: copy.daoHeartLabel,
            spiritualRoot: copy.spiritualRootLabel}}
        />
      )}

      <main className="max-w-md mx-auto min-h-[100dvh] flex flex-col relative bg-zinc-950 text-zinc-100 overflow-hidden shadow-2xl">
        <div className={`mx-auto flex w-full flex-col gap-0 flex-1 justify-between transition-all duration-500 ${game && !showTestCombat && !activeCombat ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {activeCombat ? (
          <div className="py-6 flex justify-center items-center flex-1 w-full relative z-20">
            <CombatPanel
              playerChar={activeCombat.player}
              enemyChar={activeCombat.enemy}
              env={activeCombat.env}
              onFinished={(winner, logs) => handleCombatFinished(winner, activeCombat.type, logs)}
            />
          </div>
        ) : showTestCombat ? (
          <div className="py-12">
            <TestCombatPanel onExit={() => setShowTestCombat(false)} />
          </div>
        ) : showCharacterCreation ? (
          <div className="py-6 w-full flex-1 flex flex-col justify-center items-center animate-fade-in relative z-20">
            <div className="adventure-card w-full max-w-xl p-5 sm:p-6 space-y-6 animate-slide-up relative bg-surface-container-lowest/90 border border-outline-variant/30 shadow-2xl backdrop-blur-sm">
              <div className="text-center space-y-1 pb-4 border-b border-zinc-800/50">
                <span className="font-label-caps text-label-caps text-secondary-fixed opacity-60 mb-2 block">Khởi Đầu Tiên Lộ</span>
                <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest ">Thiết Lập Bản Thể</h2>
              </div>

              {/* Giới Tính */}
              <div className="space-y-2">
                <h3 className="font-label-caps text-label-caps text-secondary-fixed opacity-80 uppercase tracking-widest">1. Chọn Giới Tính (Gender)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['nam', 'nữ'].map((g) => {
                    const isSelected = creationGender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCreationGender(g as 'nam' | 'nữ')}
                        className={`py-3 text-center font-serif text-sm font-semibold rounded-sm border transition-all duration-300 ${
                          isSelected
                            ? 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(255,176,0,0.2)]'
                            : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-secondary'
                        }`}
                      >
                        {g === 'nam' ? '♂ Nam (Male)' : '♀ Nữ (Female)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linh Căn */}
              <div className="space-y-2">
                <h3 className="font-label-caps text-label-caps text-secondary-fixed opacity-80 uppercase tracking-widest">2. Chọn Thiên Phú Linh Căn (Spiritual Root)</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Kim Linh Căn', icon: '⚔️' },
                    { name: 'Mộc Linh Căn', icon: '🌳' },
                    { name: 'Thủy Linh Căn', icon: '💧' },
                    { name: 'Hỏa Linh Căn', icon: '🔥' },
                    { name: 'Thổ Linh Căn', icon: '🪨' },
                    { name: 'Lôi Linh Căn', icon: '⚡' },
                    { name: 'Băng Linh Căn', icon: '❄️' },
                    { name: 'Phong Linh Căn', icon: '🌪️' }
                  ].map((r) => {
                    const isSelected = creationRoot === r.name;
                    return (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => setCreationRoot(r.name)}
                        className={`p-2.5 rounded-sm border flex flex-col items-center gap-1.5 transition-all duration-300 ${
                          isSelected
                            ? 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(255,176,0,0.2)]'
                            : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-secondary'
                        }`}
                      >
                        <span className="text-base">{r.icon}</span>
                        <span className="text-[9px]  truncate w-full text-center font-serif leading-none">{r.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Môn Phái */}
              <div className="space-y-2">
                <h3 className="font-label-caps text-label-caps text-secondary-fixed opacity-80 uppercase tracking-widest">3. Chọn Môn Phái & Xuất Thân Làng Xã</h3>
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    {
                      name: 'Kiếm Tông',
                      village: 'Làng Tàn Kiếm',
                      bonus: '+2 Ngộ Tính, +5 Đạo Tâm',
                      item: 'Nhận mảnh tàn quyển Kiếm Pháp',
                      desc: 'Luyện kiếm đắc đạo, dùng kiếm khí trảm tẫn thiên ma.',
                      icon: '🗡️'
                    },
                    {
                      name: 'Ma Đạo',
                      village: 'Làng Hắc Thạch',
                      bonus: '+3 Vận May, -4 Nghiệp Lực',
                      item: 'Nhận Nhiên Huyết Đan cấm kỵ',
                      desc: 'Tu ma nghịch tiên, đoạt thiên địa hóa sinh, hành sự tùy ý.',
                      icon: '🔮'
                    },
                    {
                      name: 'Huyết Tông',
                      village: 'Làng Xích Huyết',
                      bonus: '+10 Máu khởi đầu, +10 Tuổi thọ',
                      item: 'Nhận Thọ Nguyên Đan huyết ngưng',
                      desc: 'Luyện máu dưỡng thần, nuốt huyết khí tăng sinh lực vô biên.',
                      icon: '🩸'
                    },
                    {
                      name: 'Đan Tông',
                      village: 'Làng Bách Thảo',
                      bonus: '+3 Ngộ Tính sơ khởi',
                      item: 'Nhận Huyền Nguyên Đan bổ tu vi',
                      desc: 'Dùng đan nhập đạo, thấu hiểu quy tắc sinh dưỡng thảo mộc.',
                      icon: '🧪'
                    }
                  ].map((s) => {
                    const isSelected = creationSect === s.name;
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setCreationSect(s.name)}
                        className={`p-3 text-left rounded-sm border transition-all duration-300 flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-secondary bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(255,176,0,0.2)]'
                            : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-secondary/40 hover:text-secondary'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-serif text-sm font-bold text-secondary flex items-center gap-1.5">
                            <span>{s.icon}</span>
                            {s.name}
                          </span>
                          <span className="text-[8px] uppercase px-1.5 py-0.5 rounded-sm bg-black/50 text-text-tertiary font-serif">{s.village}</span>
                        </div>
                        <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-2">{s.desc}</p>
                        <div className="text-[8px] uppercase tracking-wide text-amber-500/80 font-serif leading-none mt-1">
                          💪 {s.bonus}
                        </div>
                        <div className="text-[8px] uppercase tracking-wide text-secondary font-serif leading-none">
                          🎁 {s.item}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bắt Đầu Hành Trình */}
              <div className="pt-4 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={handleConfirmCharacter}
                  className="w-full py-4 text-center font-headline-sm text-headline-sm font-bold border transition-all duration-300 uppercase tracking-widest border-secondary/40 text-secondary hover:border-secondary hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(255,176,0,0.2)] hover:-translate-y-0.5 cursor-pointer bg-surface-container-low/80"
                >
                  Bắt Đầu Hành Trình Nghịch Thiên
                </button>
              </div>
            </div>
          </div>
        ) : game ? (
          <div className="flex flex-col gap-6 py-6 w-full flex-1 justify-center items-center">
            {/* Paginated Single Card View - Thiết kế lại kiểu Cuộn Sớ Tu Tiên */}
            <div className="w-full flex-1 flex flex-col md:flex-row justify-center items-center gap-8 max-w-4xl mx-auto py-4">
              
              {/* Cột trái: Tranh tròn minh họa sự kiện */}
              {game.alive && game.currentEvent && (
                <div className="flex-shrink-0 flex items-center justify-center md:my-auto">
                  <EventIllustration id={game.currentEvent.id} sect={game.sect} />
                </div>
              )}

              {/* Cột phải: Cuộn sớ cổ trang trúc lục bảo viền vàng kim */}
              {game.alive && game.currentEvent && (
                <article 
                  className="relative flex flex-col w-full max-w-md bg-surface-container-lowest text-on-surface rounded-sm py-8 px-7 sm:px-9 border-x-2 border-outline-variant/30 animate-portal-entry shadow-[0_15px_35px_rgba(0,0,0,0.65)] mt-8 md:mt-10"
                  style={{
                    backgroundImage: "radial-gradient(circle, #fcfaf2 20%, #f3ead0 100%)",
                    boxShadow: "inset 0 0 40px rgba(130, 95, 45, 0.2), 0 15px 35px rgba(0,0,0,0.65)"
                  }}
                >
                  {/* Floating badges on top-right of scroll container */}
                  <div className="absolute top-3 right-4 sm:top-4 sm:right-6 flex flex-row gap-3 z-30">
                    {game.sect && (game.sectRank === 'ngoại_môn' || game.sectRank === undefined) && (
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-[16px] sm:text-[18px] font-bold font-serif shadow-md ${
                        game.month === 12 
                          ? 'border-yellow-600/60 bg-yellow-500/20 text-yellow-800 animate-pulse' 
                          : 'border-red-950/40 bg-red-900/10 text-red-900'
                      }`}>
                        <span>
                          ⚔️ {game.month === 12 
                            ? ((uiText[language]?.['tournamentActive'] || 'Tournament: Active!')) 
                            : ((uiText[language]?.['tournament12Gamemont'] || 'Tournament: ${12 - game.month}mo'))}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-emerald-950/40 bg-emerald-900/10 text-[16px] sm:text-[18px] font-bold text-emerald-900 font-serif shadow-md">
                      <span>
                        ⚖️ {(uiText[language]?.['auction10Gameage10yr'] || 'Auction: ${10 - (game.age % 10)}yr')}
                      </span>
                    </div>
                  </div>

                  {/* Thanh tre cuộn tròn ở trên */}
                  <div className="absolute -top-3.5 left-[-16px] right-[-16px] h-5 bamboo-horizontal rounded-full z-20">
                    <div className="absolute -left-2.5 top-1/2 transform -translate-y-1/2 w-2.5 h-6 gold-cap rounded-l-sm" />
                    <div className="absolute -right-2.5 top-1/2 transform -translate-y-1/2 w-2.5 h-6 gold-cap rounded-r-sm" />
                    <div className="absolute left-[20%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute left-[40%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute left-[60%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute left-[80%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                  </div>

                  {/* Thanh tre cuộn tròn ở dưới */}
                  <div className="absolute -bottom-3.5 left-[-16px] right-[-16px] h-5 bamboo-horizontal rounded-full z-20">
                    <div className="absolute -left-2.5 top-1/2 transform -translate-y-1/2 w-2.5 h-6 gold-cap rounded-l-sm" />
                    <div className="absolute -right-2.5 top-1/2 transform -translate-y-1/2 w-2.5 h-6 gold-cap rounded-r-sm" />
                    <div className="absolute left-[20%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute left-[40%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute left-[60%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute left-[80%] top-0 bottom-0 w-[1.5px] bg-[#102a1a]/50" />
                  </div>

                  {/* Thân trúc dọc bên trái */}
                  <div className="absolute top-[-4px] bottom-[-4px] -left-2 w-3.5 bamboo-vertical z-10 rounded-full">
                    <div className="absolute top-[25%] left-0 right-0 h-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute top-[50%] left-0 right-0 h-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute top-[75%] left-0 right-0 h-[1.5px] bg-[#102a1a]/50" />
                  </div>

                  {/* Thân trúc dọc bên phải */}
                  <div className="absolute top-[-4px] bottom-[-4px] -right-2 w-3.5 bamboo-vertical z-10 rounded-full">
                    <div className="absolute top-[25%] left-0 right-0 h-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute top-[50%] left-0 right-0 h-[1.5px] bg-[#102a1a]/50" />
                    <div className="absolute top-[75%] left-0 right-0 h-[1.5px] bg-[#102a1a]/50" />
                  </div>

                  {/* Nội dung chính cuộn sớ */}
                  <div className="space-y-4 my-auto relative z-10">
                    <div className="flex items-center justify-between text-[11px]  text-neutral-600 font-bold border-b border-neutral-700/10 pb-1 font-serif">
                      <span>Kiếp {game.life}</span>
                    </div>

                    <h2 className="font-serif text-on-surface text-2xl sm:text-3xl font-bold tracking-wide drop-shadow-sm flex items-center gap-1.5 justify-center text-center">
                      {getLocalizedText(game.currentEvent.title, language)}
                    </h2>

                    {/* Dải phân cách trang trí vàng kim */}
                    <div className="flex items-center justify-center my-1 opacity-60">
                      <svg className="w-24 h-2 text-secondary fill-current" viewBox="0 0 100 10">
                        <path d="M0 5 h40 l5 -3 l5 3 l-5 3 l-5 -3 h-40 Z M100 5 h-40 l-5 -3 l-5 3 l5 3 l5 -3 h40 Z" />
                        <circle cx="50" cy="5" r="2.5" className="fill-[#10b981]" />
                      </svg>
                    </div>
                    
                    <p className="font-serif text-neutral-700 text-base sm:text-lg leading-relaxed text-justify py-1 bg-white/5 px-2 rounded-sm italic">
                      {game.currentEvent.id.startsWith('menu_') || game.currentEvent.id === 'monthly_plan' ? (
                        getLocalizedText(game.currentEvent.description, language)
                      ) : (
                        <TypewriterText 
                          text={getLocalizedText(game.currentEvent.description, language)} 
                          onComplete={handleIntroTextComplete}
                        />
                      )}
                    </p>

                    {game.currentEvent.id === 'sect_entry_welfare' && (
                      <div className="flex flex-wrap justify-center gap-6 py-4 px-4 border border-zinc-800/45 bg-zinc-950/80 rounded-sm">
                        {/* Render Manual Book Icon */}
                        {(() => {
                          const sectIdMap: Record<string, string> = {
                            'Kiếm Tông': 'kiem_tong',
                            'Ma Đạo': 'ma_dao',
                            'Huyết Tông': 'huyet_tong',
                            'Đan Tông': 'dan_tong'
                          };
                          const rootIdMap: Record<string, string> = {
                            'Kim': 'kim',
                            'Mộc': 'moc',
                            'Thủy': 'thuy',
                            'Hỏa': 'hoa',
                            'Thổ': 'tho',
                            'Lôi': 'loi',
                            'Băng': 'bang',
                            'Phong': 'phong'
                          };
                          const rootName = (game.stats.spiritualRoot || '').split(' ')[0] || 'Kim';
                          const sId = sectIdMap[game.sect || 'Kiếm Tông'] || 'kiem_tong';
                          const rId = rootIdMap[rootName] || 'kim';
                          const targetManualId = `manual_${sId}_${rId}`;
                          const configTech = (combatConfig.techniques || []).find((t: any) => t.id === targetManualId);
                          
                          if (!configTech) return null;

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                playSfxWithPath('/audio/crystal-bowl.mp3', 0.5);
                                setSelectedDetailItem({
                                  type: 'manual',
                                  title: configTech.label,
                                  description: configTech.description,
                                  image: configTech.image,
                                  details: [
                                    `${(uiText[language]?.['grade'] || 'Grade')}: ${configTech.tier.toUpperCase()}`,
                                    `${(uiText[language]?.['cultivationCap'] || 'Cultivation Cap')}: Qi Refinement Layer 12 (Cap: 26.0)`,
                                    `${(uiText[language]?.['spiritualRoot'] || 'Spiritual Root')}: ${configTech.spiritual_root}`,
                                    `${(uiText[language]?.['sect'] || 'Sect')}: ${configTech.sect}`
                                  ]
                                });
                              }}
                              className="group flex flex-col items-center p-3 border border-zinc-800/70 hover:border-secondary bg-zinc-950/80 rounded shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer max-w-[120px] text-center"
                            >
                              <div className="relative w-16 h-20 bg-cover bg-center border border-secondary/40 rounded-sm overflow-hidden mb-2 group-hover:scale-105 transition-transform duration-300 shadow-lg flex items-center justify-center">
                                {configTech.image ? (
                                  <img src={configTech.image} alt={configTech.label} className="w-full h-full object-cover select-none" />
                                ) : (
                                  <span className="text-2xl">📖</span>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-center pb-1">
                                  <span className="text-[8px] text-secondary tracking-widest font-serif font-bold uppercase">{configTech.spiritual_root}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono-data text-secondary group-hover:text-white font-semibold line-clamp-1">{configTech.label}</span>
                              <span className="text-[8px] text-text-tertiary  mt-0.5">{(uiText[language]?.['viewInfo'] || 'View Info')}</span>
                            </button>
                          );
                        })()}

                        {/* Render Spirit Stones Icon */}
                        {(() => {
                          const activeConfig = combatConfig as any;
                          const startingStones = activeConfig.time_gear?.starting_spirit_stones ?? 10;
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                playSfxWithPath('/audio/crystal-bowl.mp3', 0.5);
                                setSelectedDetailItem({
                                  type: 'currency',
                                  title: (uiText[language]?.['lowgradeSpiritStones'] || 'Low-Grade Spirit Stones'),
                                  description: (uiText[language]?.['aLowgradeStoneContai1'] || 'A low-grade stone containing pure ambient spiritual energy. It serves as standard currency and resource for cultivation burning in the cultivation realm.'),
                                  icon: '💎',
                                  details: [
                                    `${(uiText[language]?.['quantity'] || 'Quantity')}: ${startingStones}x`,
                                    `${(uiText[language]?.['category'] || 'Category')}: ${(uiText[language]?.['currencyResource'] || 'Currency / Resource')}`
                                  ]
                                });
                              }}
                              className="group flex flex-col items-center p-3 border border-zinc-800/70 hover:border-secondary bg-zinc-950/80 rounded shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer max-w-[120px] text-center"
                            >
                              <div className="w-16 h-20 bg-zinc-950 border border-secondary/40 rounded-sm flex flex-col items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300 shadow-lg relative overflow-hidden">
                                <span className="text-3xl animate-bounce duration-1000">💎</span>
                                <div className="absolute bottom-1 bg-yellow-950/40 border border-yellow-800/40 px-1 rounded-sm">
                                  <span className="text-[10px] text-secondary font-serif font-bold">x{startingStones}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono-data text-secondary group-hover:text-white font-semibold line-clamp-1">{(uiText[language]?.['spiritStones1'] || 'Spirit Stones')}</span>
                              <span className="text-[8px] text-text-tertiary  mt-0.5">{(uiText[language]?.['viewInfo'] || 'View Info')}</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                    
                    {(!game.currentEvent.id.includes('birth_and_recruitment') || isIntroTextFinished || game.currentEvent.id.startsWith('menu_') || game.currentEvent.id === 'monthly_plan') && (
                      <div className="pt-2">
                        <ChoiceButtons
                          eventId={game.currentEvent.id}
                          choices={game.currentEvent.choices}
                          onSelect={handleChoiceWithTransition}
                          language={language as "vi" | "en"}
                        />
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Tĩnh tọa xoay bánh răng thời gian */}
              {game.alive && game.isTicking && !game.currentEvent && (
                <div className="w-full max-w-md mx-auto">
                  <TimeGearPanel
                    month={game.month}
                    timeLeft={timeLeft}
                    totalTime={totalTime}
                    monthlyLog={game.monthlyLog || []}
                    language={language as 'vi' | 'en'}
                    worldState={game.worldState}
                  />
                </div>
              )}

              {game.alive && !game.isTicking && !game.currentEvent && !game.activeQuest && (
                <div className="adventure-card p-5 sm:p-6 w-full space-y-5 animate-slide-up bg-surface-container-lowest/90 border border-outline-variant/30 shadow-2xl backdrop-blur-sm">
                  <div className="text-center space-y-1 pb-4 border-b border-zinc-800/50">
                    <span className="font-label-caps text-label-caps text-secondary-fixed opacity-60 mb-2 block">
                      {(uiText[language]?.['meditationChamber'] || 'Meditation Chamber')}
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary uppercase tracking-widest ">
                      {(uiText[language]?.['chooseAction'] || 'Choose Action')}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    {/* HÀNH ĐỘNG TẠI TÔNG MÔN (SECT) */}
                    {(game.currentLocation === 'sect' || !game.currentLocation) && (
                      <>
                        {/* Option 1: Nhận nhiệm vụ tông môn */}
                        <button
                          type="button"
                          onClick={() => setShowSectMissions(true)}
                          className="group p-3.5 text-left rounded-sm border border-secondary/40 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-[#34d399] text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-[#10b981]/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">☯</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['sectQuestHall'] || 'Sect Quest Hall')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['acceptSectQuestsToEa'] || 'Accept sect quests to earn Contribution and Spirit Stones for rank promotion.')}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowSectShop(true)}
                          className="group p-3.5 text-left rounded-sm border border-secondary/40 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-[#34d399] text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-[#10b981]/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">📜</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['sectVault1'] || 'Sect Vault')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['exchangeContribution'] || 'Exchange Contribution points for artifacts, pills, and techniques.')}
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Tu luyện */}
                        <button
                          type="button"
                          onClick={() => {
                            setGame({ ...game, isTicking: true });
                            playSfxWithPath('/audio/crystal-bowl.mp3', 0.5);
                          }}
                          className="group p-3.5 text-left rounded-sm border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-950/80 hover:border-zinc-600 text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🧘</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['silentCultivation'] || 'Silent Cultivation')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['meditateToAbsorbSpir'] || 'Meditate to absorb spiritual energy and breakthrough cultivation. Time will start flowing.')}
                            </p>
                          </div>
                        </button>

                        {/* Option 3: Dưỡng thương */}
                        <button
                          type="button"
                          disabled={game.stats.health >= maxHp}
                          onClick={handleHealWithTransition}
                          className={`group p-3.5 text-left rounded-sm border transition-all duration-300 flex items-center gap-3.5 ${
                            game.stats.health >= maxHp
                              ? 'opacity-40 cursor-not-allowed border-zinc-800/40 bg-black/10'
                              : 'border-red-950/40 bg-red-950/10 hover:bg-red-950/20 hover:border-red-500/60 cursor-pointer'
                          }`}
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🩹</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['closeddoorHealing'] || 'Closed-door Healing')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {language === 'vi' 
                                ? `Dành 1 tháng trị thương, hồi phục 50% Khí Huyết. ${game.stats.health >= maxHp ? '(Khí huyết xung mãn)' : `(Hiện tại: ${game.stats.health}/${maxHp})`}` 
                                : `Spend 1 month regulating breath, restoring 50% HP. ${game.stats.health >= maxHp ? '(HP is full)' : `(Current: ${game.stats.health}/${maxHp})`}`}
                            </p>
                          </div>
                        </button>

                        {/* Option 4: Đi Thanh Dương Thành */}
                        <button
                          type="button"
                          onClick={() => handleMoveLocationWithTransition('city')}
                          className="group relative p-3.5 text-left rounded-sm border border-emerald-950/40 bg-emerald-950/10 hover:bg-[#1a382b]/35 hover:border-secondary/60 text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          {getCityBadge()}
                          <span className="text-2xl w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏘️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['travelToThanhDuongCi'] || 'Travel to Thanh Duong City')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['travelToTheBustlingC'] || 'Travel to the bustling city (Costs ${activeCombatConfig?.time_gear?.travel_cost_hp ?? 2} HP, ${activeCombatConfig?.time_gear?.travel_cost_stones ?? 10} Spirit Stones, 1 month).')}
                            </p>
                          </div>
                        </button>

                        {/* Option 5: Luyện Đan */}
                        <button
                          type="button"
                          onClick={() => setShowAlchemy(true)}
                          className="group p-3.5 text-left rounded-sm border border-secondary/40 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-[#34d399] text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-[#10b981]/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">⚗️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['alchemyArray'] || 'Alchemy Array')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['refineHerbsAndSeizeC'] || 'Refine herbs and seize creation, but beware of furnace explosion.')}
                            </p>
                          </div>
                        </button>

                        {/* Option 5: Thám hiểm Sơn Mạch */}
                        <button
                          type="button"
                          onClick={() => handleMoveLocationWithTransition('mountain')}
                          className="group relative p-3.5 text-left rounded-sm border border-emerald-950/40 bg-emerald-950/10 hover:bg-[#1a382b]/35 hover:border-secondary/60 text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          {getMountainBadge()}
                          <span className="text-2xl w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏔️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['exploreBeastMountain'] || 'Explore Beast Mountain Range')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['travelToTheDangerous'] || 'Travel to the dangerous beast mountain range (Costs ${activeCombatConfig?.time_gear?.travel_cost_hp ?? 2} HP, ${activeCombatConfig?.time_gear?.travel_cost_stones ?? 10} Spirit Stones, 1 month).')}
                            </p>
                          </div>
                        </button>
                      </>
                    )}

                    {/* HÀNH ĐỘNG TẠI THÀNH THỊ (CITY) */}
                    {game.currentLocation === 'city' && (
                      <>
                        {/* Option 1: Dạo Chợ Đen */}
                        <button
                          type="button"
                          onClick={() => setShowBlackMarket(true)}
                          className="group p-3.5 text-left rounded-sm border border-secondary/40 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-[#34d399] text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-[#10b981]/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏪</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['wanderBlackMarket'] || 'Wander Black Market')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['lookForHiddenStallsT'] || 'Look for hidden stalls to buy stones and legacy ruins (Costs 1 month).')}
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Tham Gia Đấu Giá */}
                        <button
                          type="button"
                          onClick={() => handleLeaveSectForEventWithTransition('auction')}
                          className="group p-3.5 text-left rounded-sm border border-secondary/40 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-[#34d399] text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-[#10b981]/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">⚖️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['attendAuction'] || 'Attend Auction')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['joinTheAuctionHouseT'] || 'Join the auction house to bid on rare unique treasures (Costs 1 month).')}
                            </p>
                          </div>
                        </button>

                        {/* Option 3: Về Tông Môn */}
                        <button
                          type="button"
                          onClick={() => handleMoveLocationWithTransition('sect')}
                          className="group relative p-3.5 text-left rounded-sm border border-emerald-950/40 bg-emerald-950/10 hover:bg-[#1a382b]/35 hover:border-secondary/60 text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          {getSectBadge()}
                          <span className="text-2xl w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏵️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['returnToSect'] || 'Return to Sect')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['returnSafelyUnderThe'] || 'Return safely under the protection of the sect array (Costs ${activeCombatConfig?.time_gear?.travel_cost_hp ?? 2} HP, ${activeCombatConfig?.time_gear?.travel_cost_stones ?? 10} Spirit Stones, 1 month).')}
                            </p>
                          </div>
                        </button>

                        {/* Option 4: Đến Thành Thị */}
                        <button
                          type="button"
                          onClick={() => handleMoveLocationWithTransition('city')}
                          className="group relative p-3.5 text-left rounded-sm border border-emerald-950/40 bg-emerald-950/10 hover:bg-[#1a382b]/35 hover:border-secondary/60 text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          {getCityBadge()}
                          <span className="text-2xl w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏙️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['goToThanhDuongCity'] || 'Go to Thanh Duong City')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['goToTheMortalWorldFo'] || 'Go to the mortal world for trade and auctioning (Costs ${activeCombatConfig?.time_gear?.travel_cost_hp ?? 2} HP, ${activeCombatConfig?.time_gear?.travel_cost_stones ?? 10} Spirit Stones, 1 month).')}
                            </p>
                          </div>
                        </button>
                      </>
                    )}

                    {/* HÀNH ĐỘNG TẠI BÍ CẢNH (SECRET REALM) */}
                    {game.currentLocation === 'secret_realm' && (
                      <>
                        {/* Option 1: Thám Hiểm Bí Cảnh */}
                        <button
                          type="button"
                          onClick={() => handleLeaveSectForEventWithTransition('general_travel')}
                          className="group p-3.5 text-left rounded-sm border border-secondary/40 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-[#34d399] text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          <span className="text-2xl w-10 h-10 rounded-full bg-[#10b981]/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏺</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['decryptAncientArray'] || 'Decrypt Ancient Array')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['breakAncientArraysTo'] || 'Break ancient arrays to harvest ancient inheritances (Costs 1 month).')}
                            </p>
                          </div>
                        </button>

                        {/* Option 2: Về Tông Môn */}
                        <button
                          type="button"
                          onClick={() => handleMoveLocationWithTransition('sect')}
                          className="group relative p-3.5 text-left rounded-sm border border-emerald-950/40 bg-emerald-950/10 hover:bg-[#1a382b]/35 hover:border-secondary/60 text-text-primary transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
                        >
                          {getSectBadge()}
                          <span className="text-2xl w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">🏵️</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm font-bold text-secondary group-hover:text-white transition-colors">
                              {(uiText[language]?.['exitRealmReturnToSec'] || 'Exit Realm • Return to Sect')}
                            </h4>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                              {(uiText[language]?.['returnSafelyUnderThe'] || 'Return safely under the protection of the sect array (Costs ${activeCombatConfig?.time_gear?.travel_cost_hp ?? 2} HP, ${activeCombatConfig?.time_gear?.travel_cost_stones ?? 10} Spirit Stones, 1 month).')}
                            </p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Death Event Card */}
              {!game.alive && (
                <article className="adventure-card border-red-950/65 shadow-red-950/10 animate-slide-up">
                  <EventIllustration id="grave_storm" />
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs  text-red-500/70">
                      <span>Kiếp {game.life} • Tuổi {game.age}</span>
                      <span className="font-bold">+ Đã Tịch Diệt</span>
                    </div>

                    <h2 className="narrative-large text-red-400 text-2xl">
                      {copy.deathTitle}
                    </h2>
                    
                    <p className="narrative text-text-secondary leading-relaxed text-justify">
                      {game.deathCause ? getLocalizedText(game.deathCause, language) : ''}
                    </p>
                    
                    <div className="pt-6 border-t border-red-900/30 grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={handleReincarnate}
                        className="px-4 py-3 text-sm font-serif font-semibold text-center rounded-sm border border-[#5c7f55]/40 bg-[#5c7f55]/10 text-[#5c7f55] transition hover:bg-[#5c7f55]/20 hover:border-[#5c7f55]/60 focus:outline-none"
                      >
                        {copy.reincarnate}
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-3 text-sm font-serif font-semibold text-center rounded-sm border border-zinc-800 bg-surface-container-lowest/80 text-text-secondary transition hover:bg-black/60 hover:text-white focus:outline-none"
                      >
                        {copy.newSimulation}
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Anchor for auto-scrolling */}
              <div ref={listEndRef} />
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════
             START SCREEN - Trường Sinh Lộ
             ═══════════════════════════════════════ */
          <div className="relative flex flex-col items-center justify-center flex-1 min-h-[100dvh] bg-surface-container-lowest text-on-surface p-6 font-mono-data overflow-hidden">
            
            {/* Terminal Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-surface-container-lowest to-surface-container-lowest" />
              <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />
            </div>

            {/* Title Block */}
            <div className="relative z-20 text-center w-full max-w-md border border-outline-variant/30 bg-surface-container-low/50 p-8 shadow-[0_0_30px_rgba(255,176,0,0.05)] backdrop-blur-md animate-fade-in">
              <div className="text-secondary/60 text-[10px] tracking-widest mb-4 font-headline-sm uppercase">{uiText[language]?.['systemInitialization'] || '<System Initialization>'}</div>
              <h1 className="font-headline-lg text-4xl text-primary font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,176,0,0.3)]">
                {(uiText[language]?.['immortalSim'] || 'Immortal Sim')}
              </h1>
              <div className="h-[1px] w-3/4 mx-auto bg-gradient-to-r from-transparent via-secondary/30 to-transparent my-6" />
              <p className="text-xs text-on-surface-variant tracking-wide leading-relaxed">
                {(uiText[language]?.['loadingDataDestinyIs'] || 'Loading data... Destiny is being recompiled. Are you ready to reconnect to the reincarnation network?')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="relative z-20 w-full max-w-md mt-8 space-y-4">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-4 px-6 text-center font-headline-sm text-sm uppercase tracking-widest border transition-all duration-300 border-secondary/40 text-secondary hover:border-secondary hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(255,176,0,0.2)] hover:-translate-y-0.5 cursor-pointer bg-surface-container-low/80"
              >
                {copy.startNew || ((uiText[language]?.['executeNewProcess'] || 'Execute New Process'))}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-4 px-6 text-center font-headline-sm text-sm uppercase tracking-widest border transition-all duration-300 border-error/40 text-error hover:border-error hover:bg-error/10 hover:shadow-[0_0_15px_rgba(255,100,100,0.2)] hover:-translate-y-0.5 cursor-pointer bg-surface-container-low/80"
              >
                {copy.resetLegacy || ((uiText[language]?.['wipeLegacyCache'] || 'Wipe Legacy Cache'))}
              </button>
            </div>

            {/* Settings & Legacy Data */}
            <div className="relative z-20 w-full max-w-md mt-8 grid grid-cols-2 gap-4">
              {/* Audio/Language Settings Panel */}
              <div className="border border-outline-variant/30 bg-surface-container-low/40 p-4 flex flex-col gap-4">
                <div className="text-[10px] text-secondary/60 uppercase tracking-wider mb-2">{uiText[language]?.['settingsTitleStart'] || '// SETTINGS'}</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-on-surface-variant">{(uiText[language]?.['language1'] || 'Language:')}</span>
                  <div className="flex gap-1.5 w-16">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Lang)}
                      className="w-full text-[9px] px-2 py-1 uppercase border border-outline-variant/50 bg-transparent text-on-surface hover:border-secondary focus:border-secondary outline-none transition-colors cursor-pointer"
                    >
                      <option value="vi" className="bg-[#1a1512]">VI</option>
                      <option value="en" className="bg-[#1a1512]">EN</option>
                      <option value="zh" className="bg-[#1a1512]">ZH</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-on-surface-variant">{(uiText[language]?.['audio1'] || 'Audio:')}</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleAudioEnabled}
                      className={`text-[9px] px-2 py-1 uppercase border transition-colors ${
                        audioEnabled ? 'border-secondary text-secondary bg-secondary/10' : 'border-outline-variant/50 text-on-surface-variant hover:text-white hover:border-outline-variant'
                      }`}
                    >
                      {audioEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      disabled={!audioEnabled}
                      className={`text-[9px] px-2 py-1 uppercase border transition-colors disabled:opacity-30 ${
                        (!audioMuted && audioEnabled) ? 'border-secondary text-secondary bg-secondary/10' : 'border-outline-variant/50 text-on-surface-variant hover:text-white hover:border-outline-variant'
                      }`}
                    >
                      {audioMuted ? 'MUTE' : 'PLAY'}
                    </button>
                  </div>
                </div>

                {audioEnabled && (
                  <div className="pt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(audioVolume * 100)}
                      onChange={(e) => handleAudioVolumeChange(parseInt(e.target.value) / 100)}
                      disabled={!audioEnabled || audioMuted}
                      className="w-full h-1 bg-surface-container appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-secondary"
                    />
                  </div>
                )}
              </div>

              {/* Legacy Data Panel */}
              <div className="border border-outline-variant/30 bg-surface-container-low/40 p-4 flex flex-col gap-3">
                <div className="text-[10px] text-secondary/60 uppercase tracking-wider mb-1">{uiText[language]?.['legacyDataStart'] || '// LEGACY DATA'}</div>
                
                {[
                  { label: copy.legacyPower || ((uiText[language]?.['power'] || 'Power')), value: inheritance.legacyPower },
                  { label: copy.ancestralMemory || ((uiText[language]?.['memory'] || 'Memory')), value: inheritance.ancestralMemory },
                  { label: copy.blessing || ((uiText[language]?.['blessing'] || 'Blessing')), value: inheritance.blessing },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[9px] text-on-surface-variant uppercase">{item.label}</span>
                    <span className="text-[11px] font-headline-sm text-secondary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}
        </div>
      </main>
      </>
      )}

      {isAdminPortalVisible && (
        <button
          type="button"
          onClick={() => setIsAdminPanelOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full border border-secondary bg-zinc-900 text-secondary font-serif text-xs  shadow-2xl hover:bg-zinc-800 hover:text-white transition-all duration-300 animate-pulse hover:animate-none"
        >
          ☯ Thái Cổ Thần Điện
        </button>
      )}

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        showAudioPaths={showAudioPaths}
        onToggleAudioPaths={setShowAudioPaths}
        onStartTestCombat={() => {
          setIsAdminPanelOpen(false);
          setShowTestCombat(true);
        }}
        game={game}
        onChangeGame={setGame}
      />

      {showAudioPaths && (
        <div className="fixed bottom-6 left-6 z-50 p-4 border border-secondary/40 bg-zinc-950/90 backdrop-blur-md font-mono text-[11px] text-secondary rounded shadow-2xl max-w-xs space-y-2 select-all">
          <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 font-serif font-bold  text-[10px]">
            <span>🎵 Audio Paths Debug</span>
          </div>
          <div>
            <span className="text-text-tertiary block text-[9px] ">Active BGM:</span>
            <span className="break-all font-semibold">
              {(!audioEnabled || audioMuted) 
                ? `${BGM_PATHS[currentMode] || '/audio/mortal_village.mp3'} (Muted/Disabled)` 
                : (BGM_PATHS[currentMode] || '/audio/mortal_village.mp3')}
            </span>
          </div>
          <div>
            <span className="text-text-tertiary block text-[9px] ">Last SFX/Voice:</span>
            <span className="break-all font-semibold">{lastAudioTriggered || 'None'}</span>
          </div>
        </div>
      )}

      {showSectMissions && game && (
        <SectMissionsPanel
          currentRank={game.sectRank ?? 'ngoại_môn'}
          playerStats={{
            combatPower: getPlayerStat(game, 'combatPower'),
            luck: getPlayerStat(game, 'luck'),
            comprehension: getPlayerStat(game, 'comprehension'),
            daoHeart: getPlayerStat(game, 'daoHeart')}}
          hasActiveQuest={!!game.activeQuest}
          onAcceptQuest={handleAcceptQuest}
          onClose={() => setShowSectMissions(false)}
          language={language as "vi" | "en"}
          warLevel={game.worldState?.sect?.warLevel ?? 0}
        />
      )}

      {showSectShop && game && (
        <SectShopModal
          state={game}
          onUpdateState={setGame}
          onClose={() => setShowSectShop(false)}
          language={language as "vi" | "en"}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        language={language as "vi" | "en"}
        setLanguage={setLanguage}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        audioMuted={audioMuted}
        setAudioMuted={setAudioMuted}
        audioVolume={audioVolume}
        setAudioVolume={handleAudioVolumeChange}
      />

      {selectedDetailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <button type="button" className="absolute inset-0 cursor-default focus:outline-none" onClick={() => setSelectedDetailItem(null)} />
          <div className="adventure-card w-full max-w-sm p-6 relative z-10 animate-slide-up bg-zinc-950 border-2 border-secondary/60 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                playSfxWithPath('/audio/crystal-bowl.mp3', 0.5);
                setSelectedDetailItem(null);
              }}
              className="absolute top-3 right-3 text-text-secondary hover:text-white text-lg focus:outline-none"
            >
              ✕
            </button>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded border border-secondary/40 bg-zinc-950 shadow-lg flex items-center justify-center overflow-hidden">
                {selectedDetailItem.image ? (
                  <img src={selectedDetailItem.image} alt={selectedDetailItem.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{selectedDetailItem.icon || '📖'}</span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[8px]  text-zinc-400 font-bold font-serif">
                  {selectedDetailItem.type === 'manual' ? ((uiText[language]?.['mindManual'] || 'Mind Manual')) : 
                   selectedDetailItem.type === 'currency' ? ((uiText[language]?.['resource'] || 'Resource')) :
                   ((uiText[language]?.['elixir'] || 'Elixir'))}
                </span>
                <h3 className="font-serif text-lg text-secondary tracking-wider uppercase font-bold">{selectedDetailItem.title}</h3>
              </div>
              
              <p className="text-xs text-text-secondary leading-relaxed bg-zinc-950/80 p-3 border border-zinc-800/50 rounded-sm text-justify">
                {selectedDetailItem.description}
              </p>

              {selectedDetailItem.details && selectedDetailItem.details.length > 0 && (
                <div className="text-left bg-black/35 p-2.5 rounded border border-zinc-800/30 space-y-1">
                  {selectedDetailItem.details.map((detail, dIdx) => (
                    <div key={dIdx} className="text-[10px] text-text-tertiary flex justify-between">
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      

      {transitionOutcome && (
        <OutcomeTransition
          type={transitionOutcome.type}
          onComplete={() => {
            transitionOutcome.action();
            setTransitionOutcome(null);
          }}
          language={language as 'vi' | 'en'}
        />
      )}

      </div>
    </>
  );
}