import type { GameState, Lang, EventDefinition, LogEntry, LocalizedText, ItemInstance, WorldState } from '../types';
import { handleDeathProtection } from './engine';
import combatConfig from '../data/combat-config.json';
import { BUG_SPECIES } from './bugs';
import {
  getCultivationCap, getCultivationGainMultiplier, checkAndApplySubStageTransition,
  getBottlenecks, generateBreakthroughEvent, buildQuestCompleteEvent,
  buildQuestFailedEvent, getPlayerStat, determineRealm, tickWorldState,
  createInitialWorldState, worldStateToNews, getWorldEventModifiers,
  generateWorldThresholdEvent, generateNpcEvent, filterEventsForState,
  getLocalizedEvents, getRandomEvent, monthlyNarrativesVi, monthlyNarrativesEn,
  SectPunishmentEvent, TournamentAnnualStartEvent
} from './engine';
import { translateDeathReason, defaultMessages, getLocalizedText, renderLocalizedTemplate } from './i18n';

export function getVietnameseMonthName(m: number): string {
  const names = ["🐀", "🐂", "🐅", "🐈", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
  return names[m - 1] || `Month ${m}`;
}

export function getEnglishMonthName(m: number): string {
  const names = ["🐀", "🐂", "🐅", "🐈", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
  return names[m - 1] || `Month ${m}`;
}


export const tickMonth = (state: GameState, language: Lang, customConfig?: any): GameState => {
  if (!state.alive) return state;

  const activeConfig = customConfig || combatConfig;
  const cap = getCultivationCap(state, activeConfig);
  let nextMonth = state.month + 1;
  let nextAge = state.age;
  let nextStats = { ...state.stats };
  let nextRealm = state.realm;
  let nextSubStageIndex = state.subStageIndex;
  let alive: boolean = state.alive;
  let deathCause = state.deathCause;
  let lastMessage = state.lastMessage;
  const newLog = [...state.log];

  let nextPets = state.pets ? [...state.pets].map(pet => {
    let newHunger = Math.max(0, pet.hunger - 2);
    let newLoyalty = pet.loyalty;
    if (newHunger === 0) {
      newLoyalty = Math.max(0, newLoyalty - 5);
    }
    return { ...pet, hunger: newHunger, loyalty: newLoyalty };
  }) : undefined;

  // =========================================================
  // 1. CHUẨN BỊ BIẾN TOÀN CỤC
  // =========================================================
  let nextQuestsCompletedThisYear = state.questsCompletedThisYear ?? 0;

  let nextActiveHerb = state.activeHerb ? { ...state.activeHerb } : null;
  let nextActiveBuffs = state.activeBuffs ? [...state.activeBuffs] : [];

  if (nextActiveHerb) {
    if (nextActiveHerb.currentNeed) {
      nextActiveHerb.careQuality = Math.max(0, nextActiveHerb.careQuality - 10);
    }
    nextActiveHerb.ageMonths += 1;
    const needs: ('water' | 'weed' | 'array' | 'bug' | 'moon' | 'qi')[] = ['water', 'weed', 'array', 'bug', 'moon', 'qi'];
    if (Math.random() < 0.5) {
      nextActiveHerb.currentNeed = needs[Math.floor(Math.random() * needs.length)];
    } else {
      nextActiveHerb.currentNeed = null;
    }
  }
  
  if (nextActiveBuffs.length > 0) {
    nextActiveBuffs = nextActiveBuffs.map(b => ({ ...b, durationMonths: b.durationMonths - 1 }))
                                     .filter(b => b.durationMonths > 0);
  }

  // =========================================================
  // 1.5. XỬ LÝ HỆ SINH THÁI LINH TRÙNG (BUG ECOSYSTEM)
  // =========================================================
  let nextBugs = state.bugs ? [...state.bugs] : [];
  let nextInventory = state.inventory ? [...state.inventory] : [];
  
  if (nextBugs.length > 0) {
    const survivingBugs = [];
    for (let bug of nextBugs) {
      let b = { ...bug };
      
      // Age increase
      b.age += 1;
      if (b.age > (b.lifespan * 12)) {
        newLog.push({
          type: 'info',
          message: {
            vi: `Linh trùng ${b.name} của bạn đã hết thọ nguyên và hóa thành cát bụi.`,
            en: `Your spirit bug ${b.name} has reached the end of its lifespan and turned to dust.`
          }
        });
        continue;
      }

      // Job Processing
      if (b.job === 'herb_garden' && nextActiveHerb) {
        nextActiveHerb.careQuality = Math.min(100, nextActiveHerb.careQuality + 2);
      } else if (b.job === 'cultivation') {
        nextStats.cultivation += 1 + (b.comprehension * 0.1);
      } else if (b.job === 'exploration') {
        b.exploreProgress = (b.exploreProgress || 0) + 1;
        if (b.exploreProgress >= 12) {
          b.exploreProgress = 0;
          newLog.push({
            type: 'item_gain',
            message: {
              vi: `Linh trùng ${b.name} đi thám hiểm trở về mang theo Linh Thạch!`,
              en: `Your bug ${b.name} returned from exploration with Spirit Stones!`
            }
          });
          state.spiritStones = (state.spiritStones || 0) + 10 + Math.floor(Math.random() * 20);
        }
      } else if (b.job === 'production') {
        b.produceProgress = (b.produceProgress || 0) + 1;
        const species = BUG_SPECIES.find(s => s.id === b.speciesId);
        if (species && species.baseProduceInterval && b.produceProgress >= species.baseProduceInterval) {
          b.produceProgress = 0;
          if (species.producesItemId) {
            newLog.push({
              type: 'item_gain',
              message: {
                vi: `${b.name} đã sản xuất ra ${species.producesItemId}!`,
                en: `${b.name} produced ${species.producesItemId}!`
              }
            });
            const newItem = {
              id: `item_${Date.now()}_${Math.random()}`,
              name: species.producesItemId,
              description: `Vật liệu thu được từ ${species.name}`,
              category: 'material' as const,
              type: 'herb' as const,
              tier: 'hoàng' as const,
              quantity: 1
            };
            const existingItem = nextInventory.find(i => i.name === newItem.name);
            if (existingItem) existingItem.quantity += 1;
            else nextInventory.push(newItem);
          }
        }
      }
      survivingBugs.push(b);
    }
    nextBugs = survivingBugs;
  }  

  // Gắn lại vào state để các return { ...state } ở dưới lấy được dữ liệu cập nhật
  state = { ...state, bugs: nextBugs, inventory: nextInventory };

  // =========================================================
  // 2. XỬ LÝ NHIỆM VỤ (QUESTS) & TĨNH TU BẾ QUAN
  // =========================================================
  // Process quest completion first to increment nextQuestsCompletedThisYear before year rollover check
  let nextActiveQuest = state.activeQuest ? { ...state.activeQuest } : null;
  let questJustCompleted = false;
  let questSuccess = false;
  let questEvent: EventDefinition | null = null;
  let triggerLog: LogEntry | null = null;
  let monthlyCultivationGain = 0;

  if (nextActiveQuest) {
    nextActiveQuest.monthsRemaining -= 1;
    
    // Tĩnh tu bế quan: Cộng tu vi mỗi tháng
    if (nextActiveQuest.quest.id.startsWith('quest_be_quan_')) {
      const mult = getCultivationGainMultiplier(state, customConfig);
      // Giống như tĩnh tu bình thường nhưng hiệu quả cao hơn một chút vì liên tục
      const gain = (0.8 + (nextStats.comprehension * 0.02)) * mult;
      monthlyCultivationGain = gain;
      const currentAccumulated = nextActiveQuest.accumulatedCultivation ?? 0;
      nextActiveQuest.accumulatedCultivation = currentAccumulated + gain;

      // Cộng trực tiếp vào tu vi mỗi tháng để hiển thị tiến trình tu luyện tăng dần trên giao diện
      nextStats.cultivation = Math.round((nextStats.cultivation + gain) * 100) / 100;
      
      const transitionResult = checkAndApplySubStageTransition(
        state,
        nextStats,
        newLog,
        language,
        activeConfig
      );
      nextStats = transitionResult.stats;
      nextRealm = transitionResult.realm;
      nextSubStageIndex = transitionResult.subStageIndex;
      newLog.length = 0;
      newLog.push(...transitionResult.logs);
      
      const bottlenecks = getBottlenecks({ ...state, realm: nextRealm, subStageIndex: nextSubStageIndex }, activeConfig);
      const isBottleneck = bottlenecks.some(b => b.realm_from === nextRealm && b.subStageIndex === nextSubStageIndex);
      const localCap = getCultivationCap({ ...state, realm: nextRealm, subStageIndex: nextSubStageIndex, stats: nextStats }, activeConfig);
      
      if (nextStats.cultivation >= localCap && isBottleneck) {
        nextStats.cultivation = localCap;
        const breakthroughEvent = generateBreakthroughEvent(
          { ...state, realm: nextRealm, subStageIndex: nextSubStageIndex, stats: nextStats },
          nextStats,
          activeConfig,
          language
        );
        if (breakthroughEvent) {
          const monthLabel = language === 'vi' ? getVietnameseMonthName(nextMonth) : getEnglishMonthName(nextMonth);
          const desc = language === 'vi' ? `Tĩnh tu bế quan (Tu vi +${gain.toFixed(2)})` : `Closed-door retreat (Cultivation +${gain.toFixed(2)})`;
          return {
            ...state,
            pets: nextPets,
            age: nextAge,
            month: nextMonth,
            isTicking: false,
            activeQuest: null,
            currentEvent: breakthroughEvent,
            monthlyLog: [...(state.monthlyLog || []), `[${monthLabel} - Tuổi ${nextAge}]: ${desc}`].slice(-5),
            worldState: state.worldState,
            log: [...newLog],
            stats: nextStats,
            realm: nextRealm,
            subStageIndex: nextSubStageIndex,
            lastMessage: breakthroughEvent.description as LocalizedText
          };
        }
      }
    }
    
    if (nextActiveQuest.monthsRemaining === 0) {
      questJustCompleted = true;
      const quest = nextActiveQuest.quest;
      const isParty = nextActiveQuest.isParty;

      let success = true;
      if (quest.checkStat && quest.checkValue) {
        const playerVal = getPlayerStat(state, quest.checkStat);
        const requiredVal = isParty ? quest.checkValue * 0.5 : quest.checkValue;
        success = playerVal >= requiredVal;

        // Custom OR checks for the specific quests
        if (quest.id === 'quest_harvest_herbs') {
          const comp = getPlayerStat(state, 'comprehension');
          const luck = getPlayerStat(state, 'luck');
          success = comp >= 8 || luck >= 8;
        } else if (quest.id === 'quest_beast_care') {
          const dao = getPlayerStat(state, 'daoHeart');
          const luck = getPlayerStat(state, 'luck');
          success = dao >= 10 || luck >= 7;
        } else if (quest.id === 'quest_patrol') {
          const cp = getPlayerStat(state, 'combatPower');
          const comp = getPlayerStat(state, 'comprehension');
          success = cp >= 35 || comp >= 10;
        } else if (quest.id === 'quest_diplomacy') {
          const luck = getPlayerStat(state, 'luck');
          const cp = getPlayerStat(state, 'combatPower');
          success = luck >= 12 || cp >= 50;
        }
      }
      questSuccess = success;
      
      if (questSuccess && !quest.id.startsWith('quest_be_quan_') && !quest.id.startsWith('quest_skip_time_') && quest.id !== 'quest_farm_herbs') {
        nextQuestsCompletedThisYear += 1;
      }

      questEvent = questSuccess 
        ? buildQuestCompleteEvent(quest, language, isParty) 
        : buildQuestFailedEvent(quest, language, isParty);

      triggerLog = {
        type: 'info',
        age: nextAge,
        message: {
          en: questSuccess 
            ? `Completed Sect Quest: [${getLocalizedText(quest.title, 'en')}]` 
            : `Failed Sect Quest: [${getLocalizedText(quest.title, 'en')}]`,
          vi: questSuccess 
            ? `Hoàn thành Nhiệm vụ Tông môn: [${getLocalizedText(quest.title, 'vi')}]` 
            : `Thất bại Nhiệm vụ Tông môn: [${getLocalizedText(quest.title, 'vi')}]`
        }
      };
    }
  }

  
  // =========================================================
  // 3. XỬ LÝ QUA NĂM MỚI & KIỂM TRA THỌ NGUYÊN (AGING & DEATH)
  // =========================================================
  // Handle year rollover and punishment check
  let triggerPunishment = false;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextAge += 1;

    if (state.realm === 'Qi Refinement' && nextQuestsCompletedThisYear === 0) {
      triggerPunishment = true;
    }
    nextQuestsCompletedThisYear = 0; // reset for new year

    // Kiểm tra hết thọ nguyên khi bước sang năm mới
    if (nextAge >= nextStats.lifespan) {
      alive = false;
      const deathText = translateDeathReason({ stats: nextStats, age: nextAge });
      deathCause = deathText;
      lastMessage = deathText;
      newLog.push({
        type: 'death',
        age: nextAge,
        message: renderLocalizedTemplate(defaultMessages.deathAtAge, { age: nextAge })});
    }
  }

  if (!alive) {
    return handleDeathProtection({
      ...state,
      pets: nextPets,
      age: nextAge,
      month: nextMonth,
      activeHerb: nextActiveHerb,
      activeBuffs: nextActiveBuffs,
      alive: false,
      stats: nextStats,
      realm: nextRealm,
      subStageIndex: nextSubStageIndex,
      currentEvent: null,
      isTicking: false,
      deathCause,
      lastMessage,
      log: newLog,
      questsCompletedThisYear: nextQuestsCompletedThisYear
    }, deathCause);
  }

  if (nextActiveQuest) {
    const duration = nextActiveQuest.quest.durationMonths;
    const elapsed = duration - nextActiveQuest.monthsRemaining - 1;
    const langKey = language === 'vi' ? 'vi' : 'en';
    const logs = nextActiveQuest.quest.progressLogs[langKey] || nextActiveQuest.quest.progressLogs.vi;
    const logIdx = Math.max(0, Math.min(elapsed, (logs.length ?? 1) - 1));
    let desc = logs[logIdx] || '';
    if (monthlyCultivationGain > 0) {
      desc += language === 'vi' ? ` (Tu vi +${monthlyCultivationGain.toFixed(2)})` : ` (Cultivation +${monthlyCultivationGain.toFixed(2)})`;
    }
  } else {
    const pool = language === 'vi' ? monthlyNarrativesVi : monthlyNarrativesEn;
    let desc = pool[Math.floor(Math.random() * pool.length)];
  }
  
  // Tránh lỗi khi scope thay đổi, lấy lại desc chung
  let finalDesc = '';
  if (nextActiveQuest) {
    const duration = nextActiveQuest.quest.durationMonths;
    const elapsed = duration - nextActiveQuest.monthsRemaining - 1;
    const langKey = language === 'vi' ? 'vi' : 'en';
    const logs = nextActiveQuest.quest.progressLogs[langKey] || nextActiveQuest.quest.progressLogs.vi;
    const logIdx = Math.max(0, Math.min(elapsed, (logs.length ?? 1) - 1));
    finalDesc = logs[logIdx] || '';
    if (monthlyCultivationGain > 0) {
      finalDesc += language === 'vi' ? ` (Tu vi +${monthlyCultivationGain.toFixed(2)})` : ` (Cultivation +${monthlyCultivationGain.toFixed(2)})`;
    }
  } else {
    const pool = language === 'vi' ? monthlyNarrativesVi : monthlyNarrativesEn;
    finalDesc = pool[Math.floor(Math.random() * pool.length)];
  }

  const monthLabel = language === 'vi' ? getVietnameseMonthName(nextMonth) : getEnglishMonthName(nextMonth);
  const logLine = `[${monthLabel} - Tuổi ${nextAge}]: ${finalDesc}`;
  const nextMonthlyLog = [...(state.monthlyLog || []), logLine].slice(-5);

  // Nếu đụng nóc tu vi, trả về trang Đột Phá
  const hitCapThisTurn = nextStats.cultivation >= cap;
  if (monthlyCultivationGain > 0 && hitCapThisTurn) {
    nextStats.cultivation = cap;
    const breakthroughEvent = generateBreakthroughEvent(state, nextStats, activeConfig, language);
    if (breakthroughEvent) {
      return {
        ...state,
        pets: nextPets,
        age: nextAge,
        month: nextMonth,
        activeHerb: nextActiveHerb,
        activeBuffs: nextActiveBuffs,
        isTicking: false,
        activeQuest: null,
        currentEvent: breakthroughEvent,
        monthlyLog: nextMonthlyLog,
        worldState: state.worldState,
        log: newLog,
        stats: nextStats,
        lastMessage: breakthroughEvent.description as LocalizedText
      };
    }
  }

  
  // =========================================================
  // 4. XỬ LÝ TRỪNG PHẠT MÔN PHÁI
  // =========================================================
  if (triggerPunishment) {
    const punishmentLog: LogEntry = {
      type: 'info',
      age: nextAge,
      message: {
        vi: `⚠️ Trừng phạt hàng năm: Do lười biếng không làm nhiệm vụ tông môn nào, Chấp Pháp Đường giáng lâm trừng phạt!`,
        en: `⚠️ Annual Punishment: Having completed no sect quests, the Law Enforcement Hall inflicts punishment!`
      }
    };
    return {
      ...state,
      pets: nextPets,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: SectPunishmentEvent,
      monthlyLog: nextMonthlyLog,
      activeQuest: null,
      log: [...state.log, punishmentLog],
      lastMessage: punishmentLog.message,
      questsCompletedThisYear: 0,
      realm: nextRealm,
      subStageIndex: nextSubStageIndex,
      stats: nextStats
    };
  }

  
  // =========================================================
  // 5. SỰ KIỆN CỐ ĐỊNH: NGOẠI MÔN ĐẠI BỈ (THÁNG 12)
  // =========================================================
  // ── Ngoại Môn Đại Bỉ Annual December Trigger ──
  if (
    nextMonth === 12 &&
    !nextActiveQuest &&
    !questJustCompleted &&
    state.sect &&
    (state.sectRank === 'ngoại_môn' || state.sectRank === undefined)
  ) {
    const tourLog: LogEntry = {
      type: 'info',
      age: nextAge,
      message: {
        vi: '🏟️ Ngoại Môn Đại Bỉ năm nay khai mở! Trống lôi đài vang rền toàn tông môn.',
        en: '🏟️ The annual Outer Sect Tournament has begun! War drums echo across the whole sect.'
      }
    };

    return {
      ...state,
      pets: nextPets,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: TournamentAnnualStartEvent,
      monthlyLog: nextMonthlyLog,
      questsCompletedThisYear: nextQuestsCompletedThisYear,
      log: [...state.log, tourLog],
      lastMessage: tourLog.message,
      realm: nextRealm,
      subStageIndex: nextSubStageIndex,
      stats: nextStats
    };
  }

  if (questJustCompleted) {
    const oldRealm = state.realm;
    const newRealm = determineRealm(nextStats.cultivation, state.realm);
    if (oldRealm !== newRealm) {
      if (newRealm === 'Qi Refinement') nextStats.lifespan += 40;
      else if (newRealm === 'Foundation Establishment') nextStats.lifespan += 80;
      else if (newRealm === 'Golden Core') nextStats.lifespan += 200;
      else if (newRealm === 'Nascent Soul') nextStats.lifespan += 500;
    }

    return {
      ...state,
      pets: nextPets,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: questEvent,
      monthlyLog: nextMonthlyLog,
      activeQuest: null,
      log: [...state.log, triggerLog!],
      lastMessage: triggerLog!.message,
      questsCompletedThisYear: nextQuestsCompletedThisYear,
      stats: nextStats,
      realm: nextRealm,
      subStageIndex: nextSubStageIndex
    };
  }

  if (nextActiveQuest) {
    let passiveGain = 0;
    if (!nextActiveQuest.quest.id.startsWith('quest_be_quan_') && !nextActiveQuest.quest.id.startsWith('quest_skip_time_')) {
      passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);
      nextStats.cultivation = Math.round((nextStats.cultivation + passiveGain) * 100) / 100;
      
      const transitionResult = checkAndApplySubStageTransition(
        state,
        nextStats,
        newLog,
        language,
        activeConfig
      );
      nextStats = transitionResult.stats;
      nextRealm = transitionResult.realm;
      nextSubStageIndex = transitionResult.subStageIndex;
      newLog.length = 0;
      newLog.push(...transitionResult.logs);
      
      const bottlenecks = getBottlenecks({ ...state, realm: nextRealm, subStageIndex: nextSubStageIndex }, activeConfig);
      const isBottleneck = bottlenecks.some(b => b.realm_from === nextRealm && b.subStageIndex === nextSubStageIndex);
      const localCap = getCultivationCap({ ...state, realm: nextRealm, subStageIndex: nextSubStageIndex, stats: nextStats }, activeConfig);
      
      if (nextStats.cultivation >= localCap && isBottleneck) {
        nextStats.cultivation = localCap;
        const breakthroughEvent = generateBreakthroughEvent(
          { ...state, realm: nextRealm, subStageIndex: nextSubStageIndex, stats: nextStats },
          nextStats,
          activeConfig,
          language
        );
        if (breakthroughEvent) {
          return {
            ...state,
            pets: nextPets,
            age: nextAge,
            month: nextMonth,
            isTicking: false,
            activeQuest: null,
            currentEvent: breakthroughEvent,
            monthlyLog: nextMonthlyLog,
            worldState: state.worldState,
            log: [...newLog],
            stats: nextStats,
            realm: nextRealm,
            subStageIndex: nextSubStageIndex,
            lastMessage: breakthroughEvent.description as LocalizedText
          };
        }
      }
    }


    return {
      ...state,
      pets: nextPets,
      age: nextAge,
      month: nextMonth,
      monthlyLog: nextMonthlyLog,
      activeQuest: nextActiveQuest,
      questsCompletedThisYear: nextQuestsCompletedThisYear,
      stats: nextStats,
      realm: nextRealm,
      subStageIndex: nextSubStageIndex,
      log: newLog,
      lastMessage
    };
  }

  
  // =========================================================
  // 6. CẬP NHẬT TRẠNG THÁI THẾ GIỚI (WORLD STATE) & THÔNG BÁO
  // =========================================================
  // ── Tick WorldState ──
  const nextWorldState = state.worldState
    ? tickWorldState(state.worldState, nextAge, nextMonth)
    : createInitialWorldState(true);

  // Thiên Đạo Truyền Âm (Heavenly Voice)
  const voiceNotifications: Array<{ vi: string, en: string }> = [];
  if (nextWorldState.mountain.beastActivity > 75) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: 🐾 Yêu thú hoạt động mạnh, nguy hiểm sơn mạch tăng cao.',
      en: '[Heavenly Voice]: 🐾 Beast activity is high, danger in the mountain range has risen.'
    });
  }
  if (nextWorldState.city.priceIndex > 140) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: 📈 Giá linh dược leo thang, khan hiếm hàng hóa.',
      en: '[Heavenly Voice]: 📈 Spirit medicine prices are soaring, goods are scarce.'
    });
  }
  if (nextWorldState.city.priceIndex < 70) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: 📉 Thị trường dư thừa, giá hàng giảm mạnh.',
      en: '[Heavenly Voice]: 📉 Market surplus detected, prices dropping significantly.'
    });
  }
  if (nextWorldState.sect.stability < 30) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: ⚡ Nội bộ tông môn bất ổn, đấu đá phe phái.',
      en: '[Heavenly Voice]: ⚡ Sect stability is low, factional fighting intensifies.'
    });
  }
  if (nextWorldState.global.daoFluctuation > 65) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: ✨ Thiên đạo dị động, cơ duyên phi thường có thể xuất hiện.',
      en: '[Heavenly Voice]: ✨ Heavenly dao fluctuations detected, extraordinary opportunities may appear.'
    });
  }
  if (nextWorldState.demonic.activity > 60) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: 💀 Ma tu hoạt động mạnh, đường sá không an toàn.',
      en: '[Heavenly Voice]: 💀 Demonic activity is intense, paths are dangerous.'
    });
  }
  if (nextWorldState.sect.warLevel > 60) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: ⚔️ Tông môn chiến sự leo thang, đại chiến bùng nổ.',
      en: '[Heavenly Voice]: ⚔️ Sect war levels escalating, battles are erupting.'
    });
  }
  if (nextWorldState.city.prosperity > 80) {
    voiceNotifications.push({
      vi: '[Thiên Đạo Truyền Âm]: 🏙️ Thành thị phồn hoa, cơ hội kinh doanh tốt.',
      en: '[Heavenly Voice]: 🏙️ City prosperity is high, business opportunities abound.'
    });
  }

  // Randomly take at most 2-3 notifications to prevent spamming the logs
  const shuffleNotifications = [...voiceNotifications].sort(() => 0.5 - Math.random());
  const maxToPick = Math.min(shuffleNotifications.length, Math.floor(Math.random() * 2) + 2); // 2 or 3
  const pickedNotifications = shuffleNotifications.slice(0, maxToPick);

  const voiceLogEntries: LogEntry[] = pickedNotifications.map(n => ({
    type: 'info',
    age: nextAge,
    message: n
  }));

  // Thu thập tin tức thế giới đáng chú ý
  const worldNews = worldStateToNews(nextWorldState, language);
  const worldNewsLog: LogEntry[] = worldNews.length > 0 ? [{
    type: 'info',
    age: nextAge,
    message: {
      vi: `📰 Tin tức thế giới: ${worldNews.join(' | ')}`,
      en: `📰 World news: ${worldNews.join(' | ')}`
    }
  }] : [];

  
  // =========================================================
  // 7. KIỂM TRA KỲ NGỘ NGẪU NHIÊN (RANDOM MONTHLY EVENTS)
  // =========================================================
  // Roll standard random event (only if NOT on a quest!)
  // activeConfig is already defined above
  const configDenom = activeConfig?.time_gear?.event_chance_denominator ?? 12;
  const rollEvent = Math.random() < (1 / configDenom);

  // World event modifiers cho event pool
  const worldMods = getWorldEventModifiers(nextWorldState);

  if (rollEvent) {
    let event: EventDefinition | null = null;

    // Ưu tiên world threshold events (15% chance khi roll event)
    if (Math.random() < 0.15) {
      event = generateWorldThresholdEvent(nextWorldState, { ...state, age: nextAge }, language);
    }

    // NPC events (40%)
    if (!event && state.sect && Math.random() < 0.40) {
      event = generateNpcEvent({ ...state, age: nextAge, stats: nextStats, npcFavorability: state.npcFavorability }, language);
    }

    // Random event pool với world modifiers
    if (!event) {
      const baseState = { ...state, age: nextAge };
      const available = filterEventsForState(getLocalizedEvents(language), baseState, nextAge);

      if (available.length > 0) {
        const getWeight = (ev: EventDefinition) => {
          let w = ev.weight;
          // Ambition boost
          if (state.ambition && ev.tags && ev.tags.includes(state.ambition)) w *= 3.0;
          // World modifier boost
          if (ev.tags) {
            for (const tag of ev.tags) {
              if (worldMods[tag]) w *= worldMods[tag];
            }
          }
          return w;
        };
        const total = available.reduce((s, ev) => s + getWeight(ev), 0);
        let roll = Math.random() * total;
        for (const ev of available) {
          roll -= getWeight(ev);
          if (roll <= 0) { event = ev; break; }
        }
        if (!event) event = available[0];
      } else {
        event = getRandomEvent(baseState, language);
      }
    }

    const triggerLog: LogEntry = {
      type: 'info',
      age: nextAge,
      message: {
        en: `An event occurs in ${monthLabel}: [${getLocalizedText(event!.title, 'en')}]`,
        vi: `Kỳ ngộ phát sinh vào ${monthLabel}: [${getLocalizedText(event!.title, 'vi')}]`
      }
    };

    return {
      ...state,
      pets: nextPets,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: event,
      monthlyLog: nextMonthlyLog,
      worldState: nextWorldState,
      log: [...newLog, ...worldNewsLog, ...voiceLogEntries, triggerLog],
      lastMessage: triggerLog.message,
      stats: nextStats,
      realm: nextRealm,
      subStageIndex: nextSubStageIndex
    };
  }

  
  // =========================================================
  // 8. TĂNG TU VI THỤ ĐỘNG & KIỂM TRA ĐỘT PHÁ CẢNH GIỚI
  // =========================================================
  let passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);
  nextStats.cultivation = Math.round((nextStats.cultivation + passiveGain) * 100) / 100;
  
  const transitionResult = checkAndApplySubStageTransition(
    state,
    nextStats,
    newLog,
    language,
    activeConfig
  );
  nextStats = transitionResult.stats;
  nextRealm = transitionResult.realm;
  nextSubStageIndex = transitionResult.subStageIndex;
  newLog.length = 0;
  newLog.push(...transitionResult.logs);
  
  const bottlenecks = getBottlenecks({ ...state, realm: nextRealm, subStageIndex: nextSubStageIndex }, activeConfig);
  const isBottleneck = bottlenecks.some(b => b.realm_from === nextRealm && b.subStageIndex === nextSubStageIndex);
  const localCap = getCultivationCap({ ...state, realm: nextRealm, subStageIndex: nextSubStageIndex, stats: nextStats }, activeConfig);
  
  if (nextStats.cultivation >= localCap && isBottleneck) {
    nextStats.cultivation = localCap;
    const breakthroughEvent = generateBreakthroughEvent(
      { ...state, realm: nextRealm, subStageIndex: nextSubStageIndex, stats: nextStats },
      nextStats,
      activeConfig,
      language
    );
    if (breakthroughEvent) {
      return {
        ...state,
        pets: nextPets,
        age: nextAge,
        month: nextMonth,
        isTicking: false,
        activeQuest: null,
        currentEvent: breakthroughEvent,
        monthlyLog: nextMonthlyLog,
        worldState: state.worldState,
        log: [...newLog],
        stats: nextStats,
        realm: nextRealm,
        subStageIndex: nextSubStageIndex,
        lastMessage: breakthroughEvent.description as LocalizedText
      };
    }
  }

  return {
    ...state,
    pets: nextPets,
    age: nextAge,
    month: nextMonth,
    activeHerb: nextActiveHerb,
    activeBuffs: nextActiveBuffs,
    monthlyLog: nextMonthlyLog,
    worldState: nextWorldState,
    log: [...newLog, ...worldNewsLog, ...voiceLogEntries],
    stats: nextStats,
    realm: nextRealm,
    subStageIndex: nextSubStageIndex,
    lastMessage
  };
};

