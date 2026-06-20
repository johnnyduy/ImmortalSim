const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/engine.ts');
console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to Unix LF
content = content.replace(/\r\n/g, '\n');

// Helper to count matches
function countMatches(str, target) {
  let count = 0;
  let pos = str.indexOf(target);
  while (pos !== -1) {
    count++;
    pos = str.indexOf(target, pos + target.length);
  }
  return count;
}

// 1. Update determineRealm calls to pass state.realm or 'Mortal'
content = content.replace(/determineRealm\(newStats\.cultivation\)/g, 'determineRealm(newStats.cultivation, state.realm)');
content = content.replace(/determineRealm\(stats\.cultivation\)/g, "determineRealm(stats.cultivation, 'Mortal')");
content = content.replace(/determineRealm\(nextStats\.cultivation\)/g, 'determineRealm(nextStats.cultivation, state.realm)');

// 2. Add nextRealmOverride variable inside final action block
const actionBlockTarget = `    if (choiceId.startsWith('action_')) {
      let nextStats = { ...state.stats };`.replace(/\r\n/g, '\n');
const actionBlockReplacement = `    if (choiceId.startsWith('action_')) {
      let nextStats = { ...state.stats };
      let nextRealmOverride: Realm | null = null;`.replace(/\r\n/g, '\n');

if (countMatches(content, actionBlockTarget) === 1) {
  content = content.replace(actionBlockTarget, actionBlockReplacement);
} else {
  console.error('ERROR: actionBlockTarget matched ' + countMatches(content, actionBlockTarget) + ' times');
  process.exit(1);
}

// 3. Update breakthrough choice handlers using substring search
const startPattern = "else if (choiceId === 'action_breakthrough_natural'";
const endPattern = "else if (choiceId === 'action_breakthrough_wait'";

const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern);

if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
  console.error('ERROR: Could not find breakthrough choice start/end patterns', { startIndex, endIndex });
  process.exit(1);
}

const breakthroughReplacement = `else if (choiceId === 'action_breakthrough_natural' || choiceId === 'action_breakthrough_pill') {
        const bottlenecks = getBottlenecks(state, combatConfig);
        const matching = bottlenecks.find((b: any) => 
          state.realm === b.realm_from && 
          nextStats.cultivation >= b.threshold - 0.005
        );
        
        if (matching) {
          if (choiceId === 'action_breakthrough_pill') {
             const pillIdx = nextInventory.findIndex(i => i.id === matching.pill_item_id);
             if (pillIdx !== -1) {
                const item = nextInventory[pillIdx];
                if (item.quantity > 1) {
                  nextInventory[pillIdx] = { ...item, quantity: item.quantity - 1 };
                } else {
                  nextInventory.splice(pillIdx, 1);
                }
                nextStats.cultivation = matching.next_cult ?? (matching.threshold + 0.01);
                nextRealmOverride = matching.realm_to;
                choiceText = { vi: 'Dùng đan dược đột phá', en: 'Breakthrough with Pill' };
                tempLogs.push({
                  type: 'info',
                  message: { vi: \`✨ Hoàn mỹ! Sử dụng đan dược phá vỡ bình cảnh, tu vi chuyển biến cảnh giới mới!\`, en: \`✨ Perfect! Used pill to break the bottleneck, transitioned to the next realm!\` }
                });
             }
          } else {
            let baseChance = 0;
            if (matching.realm_to === 'Foundation Establishment') baseChance = 8;
            else if (matching.realm_to === 'Golden Core') baseChance = 4;
            else if (matching.realm_to === 'Nascent Soul') baseChance = 1;
            else {
              baseChance = (matching.success_rate_no_pill ?? 0.5) * 100;
            }

            const compMod = nextStats.comprehension * 0.4;
            const luckMod = nextStats.luck * 0.3;
            const daoMod = nextStats.daoHeart * 0.3;
            const karmaMod = nextStats.karma * 0.2;
            const totalChance = Math.max(1, baseChance + compMod + luckMod + daoMod + karmaMod);
            const roll = Math.random() * 100;
            
            if (roll <= totalChance) {
              nextStats.cultivation = matching.next_cult ?? (matching.threshold + 0.01);
              nextRealmOverride = matching.realm_to;
              choiceText = { vi: 'Thuận Thiên Đột Phá', en: 'Natural Breakthrough' };
              tempLogs.push({
                type: 'info',
                message: { vi: \`✨ Thành công! Ngộ ra chân lý đất trời, tự nhiên đột phá bình cảnh \%s!\`, en: \`✨ Success! Grasped worldly truth, naturally broke \%s bottleneck!\` }
              }.replace(/\\%s/g, '\${matching.label}'));
            } else {
              nextStats.health = Math.max(1, nextStats.health - 20); // recoil
              choiceText = { vi: 'Đột phá thất bại', en: 'Breakthrough Failed' };
              tempLogs.push({
                type: 'info',
                message: { vi: \`🔥 Thất bại! Linh lực bạo động cắn trả, tổn thương kinh mạch (-20 HP). Bình cảnh vẫn chưa thể phá vỡ.\`, en: \`🔥 Failed! Spiritual backlash damaged meridians (-20 HP). The bottleneck remains.\` }
              });
            }
          }
        }
      }\n      `.replace(/\r\n/g, '\n');

content = content.substring(0, startIndex) + breakthroughReplacement + content.substring(endIndex);

// 4. Auto-upgrade check and return block updates
const monthlyPlanEndTarget = `      menuStack = [];
      const oldRealm = state.realm;
      const newRealm = determineRealm(nextStats.cultivation, state.realm);
      if (oldRealm !== newRealm) {
        if (newRealm === 'Qi Refinement') nextStats.lifespan += 40;
        else if (newRealm === 'Foundation Establishment') nextStats.lifespan += 80;
        else if (newRealm === 'Golden Core') nextStats.lifespan += 200;
        else if (newRealm === 'Nascent Soul') nextStats.lifespan += 500;
      }
      
      const cap = getCultivationCap(state);
      if (nextStats.cultivation >= cap) {
        nextStats.cultivation = cap;
      }`.replace(/\r\n/g, '\n');

const monthlyPlanEndReplacement = ('      // Auto-upgrade techniques if player has enough fragments and cultivation\n' +
'      let currentTechniques = state.techniques ? [...state.techniques] : [];\n' +
'      let techniquesUpdated = false;\n' +
'      const completenessOrder = ["tàn_quyển", "khuyết_thiên", "hoàn_chỉnh", "viên_mãn"];\n' +
'\n' +
'      currentTechniques = currentTechniques.map((tech) => {\n' +
'        if (tech.completeness === "viên_mãn") return tech;\n' +
'        \n' +
'        const configTech = (combatConfig.techniques || []).find((t) => t.id === tech.id);\n' +
'        if (!configTech) return tech;\n' +
'\n' +
'        let newFragments = tech.fragmentsCollected;\n' +
'        let newCompleteness = tech.completeness;\n' +
'        let currentIdx = completenessOrder.indexOf(tech.completeness);\n' +
'        let upgraded = false;\n' +
'        let totalDeduction = 0;\n' +
'\n' +
'        while (newFragments >= tech.fragmentsRequired && currentIdx < completenessOrder.length - 1) {\n' +
'          const cost = getTechniqueBreakthroughCost(tech.tier, configTech.breakthrough_cost_increase_pct);\n' +
'          if (nextStats.cultivation - totalDeduction >= cost) {\n' +
'            newFragments -= tech.fragmentsRequired;\n' +
'            currentIdx += 1;\n' +
'            newCompleteness = completenessOrder[currentIdx];\n' +
'            totalDeduction += cost;\n' +
'            upgraded = true;\n' +
'          } else {\n' +
'            break;\n' +
'          }\n' +
'        }\n' +
'\n' +
'        if (upgraded) {\n' +
'          nextStats.cultivation = Math.max(0, Math.round((nextStats.cultivation - totalDeduction) * 100) / 100);\n' +
'          techniquesUpdated = true;\n' +
'          tempLogs.push({\n' +
'            type: "technique_breakthrough",\n' +
'            age: state.age,\n' +
'            message: {\n' +
'              en: "Auto Breakthrough! Upgraded [" + tech.name + "] to " + newCompleteness.replace("_", " ") + "! Deducted " + totalDeduction.toFixed(1) + " Cultivation.",\n' +
'              vi: "Tự Động Đột Phá! Đã nâng cấp [" + tech.name + "] lên cảnh giới " + newCompleteness.replace("_", " ") + "! Khấu trừ " + totalDeduction.toFixed(1) + " Tu Vi."\n' +
'            }\n' +
'          });\n' +
'          return {\n' +
'            ...tech,\n' +
'            fragmentsCollected: newFragments,\n' +
'            completeness: newCompleteness\n' +
'          };\n' +
'        }\n' +
'        return tech;\n' +
'      });\n' +
'\n' +
'      menuStack = [];\n' +
'      const oldRealm = state.realm;\n' +
'      const newRealm = nextRealmOverride || determineRealm(nextStats.cultivation, state.realm);\n' +
'      if (oldRealm !== newRealm) {\n' +
'        if (newRealm === "Qi Refinement") nextStats.lifespan += 40;\n' +
'        else if (newRealm === "Foundation Establishment") nextStats.lifespan += 80;\n' +
'        else if (newRealm === "Golden Core") nextStats.lifespan += 200;\n' +
'        else if (newRealm === "Nascent Soul") nextStats.lifespan += 500;\n' +
'      }\n' +
'      \n' +
'      const cap = getCultivationCap(state);\n' +
'      if (nextStats.cultivation >= cap) {\n' +
'        nextStats.cultivation = cap;\n' +
'      }').replace(/\r\n/g, '\n');

if (countMatches(content, monthlyPlanEndTarget) === 1) {
  content = content.replace(monthlyPlanEndTarget, monthlyPlanEndReplacement);
} else {
  console.error('ERROR: monthlyPlanEndTarget matched ' + countMatches(content, monthlyPlanEndTarget) + ' times');
  process.exit(1);
}

// 5. Add techniques to return statements of applyChoiceToStateInternal
const returnAliveTarget = `      if (!alive) {
        return {
          ...state,
          alive: false,
          stats: nextStats,
          realm: newRealm,
          currentEvent: null,
          lastMessage: deathCause ?? { vi: 'Tịch Diệt', en: 'Deceased' },
          log: newLog,
          deathCause,
          isTicking: false,
          activeQuest: null,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          inventory: nextInventory
        };
      }`.replace(/\r\n/g, '\n');
const returnAliveReplacement = `      if (!alive) {
        return {
          ...state,
          alive: false,
          stats: nextStats,
          realm: newRealm,
          currentEvent: null,
          lastMessage: deathCause ?? { vi: 'Tịch Diệt', en: 'Deceased' },
          log: newLog,
          deathCause,
          isTicking: false,
          activeQuest: null,
          spiritStones: nextSpiritStones,
          sectContribution: nextSectContribution,
          inventory: nextInventory,
          techniques: currentTechniques
        };
      }`.replace(/\r\n/g, '\n');

if (countMatches(content, returnAliveTarget) === 1) {
  content = content.replace(returnAliveTarget, returnAliveReplacement);
} else {
  console.error('ERROR: returnAliveTarget matched ' + countMatches(content, returnAliveTarget) + ' times');
  process.exit(1);
}

const finalReturnTarget = `      return {
        ...state,
        stats: nextStats,
        realm: newRealm,
        currentEvent: nextEvent,
        lastMessage: choiceText,
        log: newLog,
        history: [...(state.history || []), { event: state.currentEvent, selectedChoiceId: choiceId }],
        isTicking: nextIsTicking,
        activeQuest: nextActiveQuest,
        spiritStones: nextSpiritStones,
        sectContribution: nextSectContribution,
        sectPrestige: nextSectPrestige,
        inventory: nextInventory,
        age: nextAge,
        month: nextMonth,
        menuStack,
        questsCompletedThisYear: nextQuestsCompletedThisYear
      };`.replace(/\r\n/g, '\n');
const finalReturnReplacement = `      return {
        ...state,
        stats: nextStats,
        realm: newRealm,
        currentEvent: nextEvent,
        lastMessage: choiceText,
        log: newLog,
        history: [...(state.history || []), { event: state.currentEvent, selectedChoiceId: choiceId }],
        isTicking: nextIsTicking,
        activeQuest: nextActiveQuest,
        spiritStones: nextSpiritStones,
        sectContribution: nextSectContribution,
        sectPrestige: nextSectPrestige,
        inventory: nextInventory,
        age: nextAge,
        month: nextMonth,
        menuStack,
        questsCompletedThisYear: nextQuestsCompletedThisYear,
        techniques: currentTechniques
      };`.replace(/\r\n/g, '\n');

if (countMatches(content, finalReturnTarget) === 1) {
  content = content.replace(finalReturnTarget, finalReturnReplacement);
} else {
  console.error('ERROR: finalReturnTarget matched ' + countMatches(content, finalReturnTarget) + ' times');
  process.exit(1);
}

// 6. Fix start of Luyện khí Tầng 1 cultivation value (from 15 to 10)
const qiRef1Target = `    // Tự động đột phá từ phàm nhân thành luyện khí tầng 1 (tu vi 15), tu vi hiện tại của tầng mới khởi đầu bằng 0 (cultivation = 15)
    const oldRealm = state.realm;
    nextStats.cultivation = 15;`.replace(/\r\n/g, '\n');
const qiRef1Replacement = `    // Tự động đột phá từ phàm nhân thành luyện khí tầng 1, tu vi tầng mới khởi đầu bằng 10
    const oldRealm = state.realm;
    nextStats.cultivation = 10;`.replace(/\r\n/g, '\n');

if (countMatches(content, qiRef1Target) === 1) {
  content = content.replace(qiRef1Target, qiRef1Replacement);
} else {
  console.error('ERROR: qiRef1Target matched ' + countMatches(content, qiRef1Target) + ' times');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: All engine cultivation/realm updates applied!');
