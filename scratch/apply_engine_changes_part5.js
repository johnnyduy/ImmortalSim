const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\r\n/g, '\n');

// 1. Replace nextActiveQuest passive gain logic
const passiveQuestTarget = `  if (nextActiveQuest) {
    let passiveGain = 0;
    if (!nextActiveQuest.quest.id.startsWith('quest_be_quan_')) {
      passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);
      nextStats.cultivation = Math.min(cap, Math.round((nextStats.cultivation + passiveGain) * 100) / 100);
      const hitCapThisTurn2 = state.stats.cultivation < cap && nextStats.cultivation >= cap;
      if (hitCapThisTurn2) {
        nextStats.cultivation = cap;
        const breakthroughEvent = generateBreakthroughEvent(state, nextStats, activeConfig, language);
        if (breakthroughEvent) {
          return {
            ...state,
            age: nextAge,
            month: nextMonth,
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
    }


    return {
      ...state,
      age: nextAge,
      month: nextMonth,
      monthlyLog: nextMonthlyLog,
      activeQuest: nextActiveQuest,
      questsCompletedThisYear: nextQuestsCompletedThisYear,
      stats: nextStats,
      log: newLog,
      lastMessage
    };
  }`;

const passiveQuestReplacement = `  if (nextActiveQuest) {
    let passiveGain = 0;
    if (!nextActiveQuest.quest.id.startsWith('quest_be_quan_')) {
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
  }`;

if (content.includes(passiveQuestTarget)) {
  console.log('Found passiveQuestTarget!');
  content = content.replace(passiveQuestTarget, passiveQuestReplacement);
} else {
  console.log('passiveQuestTarget NOT found!');
}

// 2. Replace regular passive gain logic at the end of tickMonth
const regularPassiveTarget = `  let passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);
  nextStats.cultivation = Math.min(cap, Math.round((nextStats.cultivation + passiveGain) * 100) / 100);
  const hitCapThisTurn3 = state.stats.cultivation < cap && nextStats.cultivation >= cap;
  if (hitCapThisTurn3) {
    nextStats.cultivation = cap;
    const breakthroughEvent = generateBreakthroughEvent(state, nextStats, activeConfig, language);
    if (breakthroughEvent) {
      return {
        ...state,
        age: nextAge,
        month: nextMonth,
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

  return {
    ...state,
    age: nextAge,
    month: nextMonth,
    monthlyLog: nextMonthlyLog,
    worldState: nextWorldState,
    log: [...newLog, ...worldNewsLog, ...voiceLogEntries],
    stats: nextStats,
    lastMessage
  };`;

const regularPassiveReplacement = `  let passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);
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
    age: nextAge,
    month: nextMonth,
    monthlyLog: nextMonthlyLog,
    worldState: nextWorldState,
    log: [...newLog, ...worldNewsLog, ...voiceLogEntries],
    stats: nextStats,
    realm: nextRealm,
    subStageIndex: nextSubStageIndex,
    lastMessage
  };`;

if (content.includes(regularPassiveTarget)) {
  console.log('Found regularPassiveTarget!');
  content = content.replace(regularPassiveTarget, regularPassiveReplacement);
} else {
  console.log('regularPassiveTarget NOT found!');
}

// 3. Replace the other tickMonth returns
// 3a. triggerPunishment return
const punishmentTarget = `    return {
      ...state,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: SectPunishmentEvent,
      monthlyLog: nextMonthlyLog,
      activeQuest: null,
      log: [...state.log, punishmentLog],
      lastMessage: punishmentLog.message,
      questsCompletedThisYear: 0
    };`;

const punishmentReplacement = `    return {
      ...state,
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
    };`;

if (content.includes(punishmentTarget)) {
  console.log('Found punishmentTarget!');
  content = content.replace(punishmentTarget, punishmentReplacement);
} else {
  console.log('punishmentTarget NOT found!');
}

// 3b. Outer Tournament December trigger return
const tourTarget = `    return {
      ...state,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: TournamentAnnualStartEvent,
      monthlyLog: nextMonthlyLog,
      questsCompletedThisYear: nextQuestsCompletedThisYear,
      log: [...state.log, tourLog],
      lastMessage: tourLog.message
    };`;

const tourReplacement = `    return {
      ...state,
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
    };`;

if (content.includes(tourTarget)) {
  console.log('Found tourTarget!');
  content = content.replace(tourTarget, tourReplacement);
} else {
  console.log('tourTarget NOT found!');
}

// 3c. Quest completed trigger return
const questTarget = `    return {
      ...state,
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
      realm: newRealm
    };`;

const questReplacement = `    return {
      ...state,
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
    };`;

if (content.includes(questTarget)) {
  console.log('Found questTarget!');
  content = content.replace(questTarget, questReplacement);
} else {
  console.log('questTarget NOT found!');
}

// 3d. Random event return
const randomEventTarget = `    return {
      ...state,
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: event,
      monthlyLog: nextMonthlyLog,
      worldState: nextWorldState,
      log: [...newLog, ...worldNewsLog, ...voiceLogEntries, triggerLog],
      lastMessage: triggerLog.message,
      stats: nextStats
    };`;

const randomEventReplacement = `    return {
      ...state,
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
    };`;

if (content.includes(randomEventTarget)) {
  console.log('Found randomEventTarget!');
  content = content.replace(randomEventTarget, randomEventReplacement);
} else {
  console.log('randomEventTarget NOT found!');
}

// 3e. Death check return inside tickMonth (if !alive)
const deadStateTarget = `  if (!alive) {
    return {
      ...state,
      age: nextAge,
      month: nextMonth,
      alive: false,
      stats: nextStats,
      currentEvent: null,
      isTicking: false,
      deathCause,
      lastMessage,
      log: newLog,
      questsCompletedThisYear: nextQuestsCompletedThisYear
    };
  }`;

const deadStateReplacement = `  if (!alive) {
    return {
      ...state,
      age: nextAge,
      month: nextMonth,
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
    };
  }`;

if (content.includes(deadStateTarget)) {
  console.log('Found deadStateTarget!');
  content = content.replace(deadStateTarget, deadStateReplacement);
} else {
  console.log('deadStateTarget NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed part 5 of engine changes.');
