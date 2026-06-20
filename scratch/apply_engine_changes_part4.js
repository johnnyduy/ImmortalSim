const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\r\n/g, '\n');

// 1. Declare nextRealm and nextSubStageIndex at the top of tickMonth
const startTarget = `export const tickMonth = (state: GameState, language: Lang, customConfig?: any): GameState => {
  if (!state.alive) return state;

  const activeConfig = customConfig || combatConfig;
  const cap = getCultivationCap(state, activeConfig);
  let nextMonth = state.month + 1;
  let nextAge = state.age;
  let nextStats = { ...state.stats };
  let alive: boolean = state.alive;
  let deathCause = state.deathCause;
  let lastMessage = state.lastMessage;
  const newLog = [...state.log];`;

const startReplacement = `export const tickMonth = (state: GameState, language: Lang, customConfig?: any): GameState => {
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
  const newLog = [...state.log];`;

if (content.includes(startTarget)) {
  console.log('Found tickMonth start!');
  content = content.split(startTarget).join(startReplacement);
} else {
  console.log('tickMonth start NOT found!');
}

// 2. We will replace the closed-door retreat cultivation gain & cap check
const retreatTarget = `      // Cộng trực tiếp vào tu vi mỗi tháng để hiển thị tiến trình tu luyện tăng dần trên giao diện
      nextStats.cultivation = Math.min(cap, Math.round((nextStats.cultivation + gain) * 100) / 100);
    }
    
    if (nextActiveQuest.monthsRemaining === 0) {`;

const retreatReplacement = `      // Cộng trực tiếp vào tu vi mỗi tháng để hiển thị tiến trình tu luyện tăng dần trên giao diện
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
          return {
            ...state,
            age: nextAge,
            month: nextMonth,
            isTicking: false,
            activeQuest: null,
            currentEvent: breakthroughEvent,
            monthlyLog: [...(state.monthlyLog || []), \`[\${language === 'vi' ? getVietnameseMonthName(nextMonth) : getEnglishMonthName(nextMonth)} - Tuổi \${nextAge}]: \${finalDesc}\`].slice(-5),
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
    
    if (nextActiveQuest.monthsRemaining === 0) {`;

// We need to be careful: in the original code, finalDesc is not defined before the quest completed check.
// Wait, is finalDesc referenced in retreatReplacement?
// Yes: `finalDesc` is referenced in the monthlyLog construction.
// Let's check: where is finalDesc declared in tickMonth?
// It is declared on line 5136: `let finalDesc = '';`.
// So finalDesc is NOT defined at line 5021!
// Ah! That is a compilation error if we reference it there!
// Let's construct a monthly log description locally for retreat:
// `const desc = language === 'vi' ? \`Tĩnh tu bế quan (Tu vi +\${gain.toFixed(2)})\` : \`Closed-door retreat (Cultivation +\${gain.toFixed(2)})\`;`
// And use `desc` instead of `finalDesc`! Yes, that is extremely safe.

const retreatReplacementFixed = `      // Cộng trực tiếp vào tu vi mỗi tháng để hiển thị tiến trình tu luyện tăng dần trên giao diện
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
          const desc = language === 'vi' ? \`Tĩnh tu bế quan (Tu vi +\${gain.toFixed(2)})\` : \`Closed-door retreat (Cultivation +\${gain.toFixed(2)})\`;
          return {
            ...state,
            age: nextAge,
            month: nextMonth,
            isTicking: false,
            activeQuest: null,
            currentEvent: breakthroughEvent,
            monthlyLog: [...(state.monthlyLog || []), \`[\${monthLabel} - Tuổi \${nextAge}]: \${desc}\`].slice(-5),
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
    
    if (nextActiveQuest.monthsRemaining === 0) {`;

if (content.includes(retreatTarget)) {
  console.log('Found retreatTarget!');
  content = content.split(retreatTarget).join(retreatReplacementFixed);
} else {
  console.log('retreatTarget NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed part 4 of engine changes.');
