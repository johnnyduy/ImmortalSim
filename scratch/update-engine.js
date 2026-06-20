const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/ADMIN/Documents/ImmortalSim/lib/engine.ts';
console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF to avoid CRLF mismatch on Windows
content = content.replace(/\r\n/g, '\n');

// 1. Definition of TournamentAnnualStartEvent
const target1 = `export const getMenuEvent = (menuId: string, state: GameState, language: Lang): EventDefinition => {`;
const replacement1 = `export const TournamentAnnualStartEvent: EventDefinition = {
  id: 'tournament_annual_start',
  title: {
    vi: '🏟️ Ngoại Môn Đại Bỉ Khai Mở!',
    en: '🏟️ Outer Sect Tournament Begins!'
  },
  description: {
    vi: 'Tháng 12 hàng năm, Đại Hội Tỷ Thí Ngoại Môn chính thức khai mở! Trống lôi đài vang rền khắp sơn môn, các đệ tử Luyện Khí từ khắp các phong tập hợp. Đây là cơ hội lấy Trúc Cơ Đan phá cảnh và chứng minh thực lực của bản thân trước toàn tông môn!\\n\\n💎 Phần thưởng: Top 10 → 1x Trúc Cơ Đan. Top 50 → 50-100 Điểm cống hiến.\\n⚠️ Lưu ý: Nếu không tham gia, trừ 30 Điểm cống hiến tông môn vì thiếu sự hiện diện.',
    en: 'Every year in December, the Outer Sect Tournament officially opens! War drums echo across the mountain gates as Qi Refinement disciples from every peak gather. This is your chance to claim a Foundation Pill and prove your might before the whole sect!\\n\\n💎 Rewards: Top 10 → 1x Foundation Pill. Top 50 → 50-100 Contribution Points.\\n⚠️ Warning: Skipping the tournament costs 30 Sect Contribution Points for absence.'
  },
  minAge: 0,
  maxAge: 9999,
  weight: 0,
  choices: [
    {
      id: 'action_tournament_participate',
      text: {
        vi: '⚔️ Báo danh thi đấu (Tham gia Đại Bỉ)',
        en: '⚔️ Register to compete (Enter Tournament)'
      },
      effects: {}
    },
    {
      id: 'action_tournament_watch',
      text: {
        vi: '👁️ Tọa sơn quan hổ đấu (Đứng ngoài quan sát)',
        en: '👁️ Observe from the sidelines (Watch & Bet)'
      },
      effects: {}
    },
    {
      id: 'action_tournament_skip',
      text: {
        vi: '🚶 Bỏ qua không tham gia (-30 Cống Hiến)',
        en: '🚶 Skip the tournament (-30 Contribution)'
      },
      effects: {}
    }
  ]
};

export const getMenuEvent = (menuId: string, state: GameState, language: Lang): EventDefinition => {`;

// 2. Intercept menu actions end
const target2 = `      let nextEvent: EventDefinition | null = null;
      if (triggerPunishment) {
        nextEvent = SectPunishmentEvent;
        nextIsTicking = false;
        nextActiveQuest = null;
      } else if (!nextIsTicking) {
        const activeConfig = combatConfig;
        const configDenom = activeConfig?.time_gear?.event_chance_denominator ?? 5;
        const rollEvent = Math.random() < (1 / configDenom);
        if (rollEvent) {
          nextEvent = getRandomEvent({
            ...state,
            age: nextAge,
            stats: nextStats,
            realm: newRealm,
            sectContribution: nextSectContribution,
            spiritStones: nextSpiritStones,
            sectPrestige: nextSectPrestige
          }, language);
        } else {
          nextEvent = getMenuEvent('menu_monthly_plan', { ...state, age: nextAge, month: nextMonth, stats: nextStats }, language);
        }
      }`;

const replacement2 = `      let nextEvent: EventDefinition | null = null;
      if (triggerPunishment) {
        nextEvent = SectPunishmentEvent;
        nextIsTicking = false;
        nextActiveQuest = null;
      } else if (!nextIsTicking) {
        const isEligibleForTournament = 
          nextMonth === 12 &&
          state.realm === 'Qi Refinement' &&
          (state.sectRank === 'ngoại_môn' || state.sectRank === undefined);
        
        if (isEligibleForTournament) {
          nextEvent = TournamentAnnualStartEvent;
          tempLogs.push({
            type: 'info',
            age: nextAge,
            message: {
              vi: '🏟️ Ngoại Môn Đại Bỉ năm nay khai mở! Trống lôi đài vang rền toàn tông môn.',
              en: '🏟️ The annual Outer Sect Tournament has begun! War drums echo across the whole sect.'
            }
          });
        } else {
          const activeConfig = combatConfig;
          const configDenom = activeConfig?.time_gear?.event_chance_denominator ?? 5;
          const rollEvent = Math.random() < (1 / configDenom);
          if (rollEvent) {
            nextEvent = getRandomEvent({
              ...state,
              age: nextAge,
              stats: nextStats,
              realm: newRealm,
              sectContribution: nextSectContribution,
              spiritStones: nextSpiritStones,
              sectPrestige: nextSectPrestige
            }, language);
          } else {
            nextEvent = getMenuEvent('menu_monthly_plan', { ...state, age: nextAge, month: nextMonth, stats: nextStats }, language);
          }
        }
      }`;

// 3. Add choice handlers to generic choice block
const target3 = `  let npcLogEntries: LogEntry[] = [];
  
  if (choiceId === 'slap_young_master') {`;

const replacement3 = `  let npcLogEntries: LogEntry[] = [];
  
  if (choiceId === 'action_tournament_participate') {
    // ── Tham gia Ngoại Môn Đại Bỉ ──
    if (newStats.health < 15) {
      // Too injured – forced to watch
      tempLogs.push({
        type: 'info',
        message: {
          vi: '⚠️ Khí huyết quá thấp (< 15), không đủ sức thi đấu! Buộc chuyển sang quan sát.',
          en: '⚠️ HP too low (< 15) to compete! Forced to observe instead.'
        }
      });
      const bettingEvent: EventDefinition = {
        id: 'tournament_betting',
        title: { vi: '👁️ Quan Sát & Cá Cược Đại Bỉ', en: '👁️ Watch & Bet Tournament' },
        description: {
          vi: 'Bạn ngồi trên khán đài quan sát các cao thủ tỷ thí. Linh khí trên lôi đài giao thoa mãnh liệt, từng thức chiêu đều chứa đựng cơ hội ngộ đạo. Bạn có muốn cá cược không?',
          en: 'You watch from the stands as masters compete. Spiritual energy clashes intensely on the arena – every technique holds enlightenment. Do you want to bet?'
        },
        minAge: 0, maxAge: 9999, weight: 0,
        choices: [
          { id: 'action_bet_tournament_20', text: { vi: '🎲 Đặt cược 20 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 20 Stones (50% x2, 50% mất)' }, effects: {} },
          { id: 'action_bet_tournament_50', text: { vi: '🎲 Đặt cược 50 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 50 Stones (50% x2, 50% mất)' }, effects: {} },
          { id: 'action_bet_tournament_none', text: { vi: '🧘 Không cá cược, chỉ quan sát (+3 Ngộ Tính)', en: '🧘 Just watch (+3 Comprehension)' }, effects: {} }
        ]
      };
      return {
        ...state,
        currentEvent: bettingEvent,
        stats: newStats,
        isTicking: false,
        log: [...state.log, ...tempLogs.map(l => ({ ...l, age: state.age }))]
      };
    }

    // Deduct HP for fighting
    newStats.health = Math.max(1, newStats.health - 15);

    // RNG outcome based on luck and cultivation
    const luck = newStats.luck;
    const cult = newStats.cultivation;
    const roll = Math.random();

    // High realm + high luck → semi-finalist, trigger Vương Tư Thông bribe
    if (cult >= 25 && luck >= 10 && roll < 0.5) {
      const briberEvent: EventDefinition = {
        id: 'tournament_bribe_vuong_thieu_gia',
        title: { vi: '💰 Vương Tư Thông Hối Lộ', en: '💰 Vuong Tu Thong\\\\\\\'s Bribe' },
        description: {
          vi: 'Trước khi vào bán kết, Vương Tư Thông – con trai của Vương trưởng lão – chặn đường bạn trong hành lang tối. Hắn ném túi linh thạch xuống sàn nói lạnh lùng: "500 Linh thạch và ta đảm bảo ngươi được chứng nhận Top 10 mà không cần đánh trận chung kết. Còn không... ngươi đấu với Long Ngạo Thiên mà xem!"',
          en: 'Before the semi-finals, Vuong Tu Thong – son of Elder Wang – intercepts you in a dark corridor. He drops a pouch of stones and says coldly: "500 Spirit Stones and I guarantee you a Top 10 certification without fighting the final. Or face Long Ngao Thien... your choice!"'
        },
        minAge: 0, maxAge: 9999, weight: 0,
        choices: [
          { id: 'action_bribe_accept', text: { vi: '💰 Chấp nhận tiền hối lộ (+500 Linh thạch, +50 Cống hiến, -10 Đạo Tâm)', en: '💰 Accept bribe (+500 Stones, +50 Contribution, -10 Dao Heart)' }, effects: {} },
          { id: 'action_bribe_refuse', text: { vi: '⚔️ Cự tuyệt! Đối mặt Long Ngạo Thiên trong trận chung kết!', en: '⚔️ Refuse! Face Long Ngao Thien in the final!' }, effects: {} }
        ]
      };
      tempLogs.push({
        type: 'info',
        message: { vi: '🏟️ Bạn vượt qua các vòng đầu xuất sắc, tiến vào bán kết! Nhưng trước cổng lôi đài chính...', en: '🏟️ You advanced through the early rounds brilliantly, reaching the semi-finals! But before the main arena gate...' }
      });
      return {
        ...state,
        stats: newStats,
        currentEvent: briberEvent,
        log: [...state.log, ...tempLogs.map(l => ({ ...l, age: state.age }))],
        isTicking: false
      };
    }

    // Low luck/cult → Top 50, contribution reward
    const contribution = 50 + Math.floor(Math.random() * 51); // 50-100
    newSectContribution += contribution;
    tempLogs.push({
      type: 'info',
      message: {
        vi: '🏟️ Tham gia Ngoại Môn Đại Bỉ, lực bất tòng tâm bạn dừng lại ở Top 50. Nhận cống hiến tông môn +' + contribution + '.',
        en: '🏟️ Participated in the Outer Sect Tournament, stopped at Top 50. Received +' + contribution + ' Sect Contribution.'
      }
    });
  }
  else if (choiceId === 'action_tournament_watch') {
    // ── Quan sát & cá cược ──
    const bettingEvent: EventDefinition = {
      id: 'tournament_betting',
      title: { vi: '👁️ Quan Sát & Cá Cược Đại Bỉ', en: '👁️ Watch & Bet Tournament' },
      description: {
        vi: 'Bạn ngồi trên khán đài quan sát các cao thủ tỷ thí. Linh khí trên lôi đài giao thoa mãnh liệt, từng thức chiêu đều chứa đựng cơ hội ngộ đạo. Bạn có muốn cá cược không?',
        en: 'You watch from the stands as masters compete. Spiritual energy clashes intensely on the arena – every technique holds enlightenment. Do you want to bet?'
      },
      minAge: 0, maxAge: 9999, weight: 0,
      choices: [
        { id: 'action_bet_tournament_20', text: { vi: '🎲 Đặt cược 20 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 20 Stones (50% x2, 50% lose)' }, effects: {} },
        { id: 'action_bet_tournament_50', text: { vi: '🎲 Đặt cược 50 Linh thạch (50% x2, 50% mất)', en: '🎲 Bet 50 Stones (50% x2, 50% lose)' }, effects: {} },
        { id: 'action_bet_tournament_none', text: { vi: '🧘 Không cá cược, chỉ quan sát (+3 Ngộ Tính)', en: '🧘 Just watch (+3 Comprehension)' }, effects: {} }
      ]
    };
    return { ...state, currentEvent: bettingEvent, isTicking: false };
  }
  else if (choiceId === 'action_bet_tournament_20' || choiceId === 'action_bet_tournament_50' || choiceId === 'action_bet_tournament_none') {
    // ── Cá cược / quan sát ──
    // Always gain +3 comprehension from watching
    newStats.comprehension += 3;

    if (choiceId === 'action_bet_tournament_none') {
      tempLogs.push({
        type: 'info',
        message: { vi: 'Tọa sơn quan hổ đấu: Tham ngộ chiêu thức của các cao thủ trên đài tỷ võ (+3 Ngộ Tính).', en: 'Observed the tournament masters\\\\\\\'s techniques without betting (+3 Comprehension).' }
      });
    } else {
      const betAmount = choiceId === 'action_bet_tournament_20' ? 20 : 50;
      if (newSpiritStones < betAmount) {
        // Not enough stones – just watch
        tempLogs.push({
          type: 'info',
          message: { vi: 'Không đủ Linh thạch để cá cược! Đành ngồi quan sát tích lũy kinh nghiệm (+3 Ngộ Tính).', en: 'Insufficient Stones to bet! Observed and gained experience instead (+3 Comprehension).' }
        });
      } else {
        newSpiritStones -= betAmount;
        const win = Math.random() < 0.5 + (newStats.luck * 0.01); // luck improves odds slightly
        if (win) {
          newSpiritStones += betAmount * 2;
          tempLogs.push({
            type: 'info',
            message: { vi: 'Cá cược ' + betAmount + ' Linh thạch: Thắng cược! Nhận lại +' + (betAmount * 2) + ' Linh thạch (lời ' + betAmount + '). Quan sát đài tỷ võ (+3 Ngộ Tính).', en: 'Bet ' + betAmount + ' Stones: Won! Received +' + (betAmount * 2) + ' Stones (profit ' + betAmount + '). Observed the arena (+3 Comprehension).' }
          });
        } else {
          tempLogs.push({
            type: 'info',
            message: { vi: 'Cá cược ' + betAmount + ' Linh thạch: Thua cược! Mất trắng ' + betAmount + ' Linh thạch. Quan sát đài tỷ võ (+3 Ngộ Tính).', en: 'Bet ' + betAmount + ' Stones: Lost! Lost ' + betAmount + ' Stones. Observed the arena (+3 Comprehension).' }
          });
        }
      }
    }
  }
  else if (choiceId === 'action_tournament_skip') {
    // ── Bỏ qua đại bỉ ──
    newSectContribution = Math.max(0, newSectContribution - 30);
    tempLogs.push({
      type: 'info',
      message: {
        vi: '⚠️ Bạn vắng mặt Ngoại Môn Đại Bỉ, Chấp Pháp Đường ghi nhận và trừ đi 30 Điểm cống hiến vì thiếu sự hiện diện.',
        en: '⚠️ You were absent from the Outer Sect Tournament. The Law Hall noted your absence and deducted 30 Contribution Points.'
      }
    });
  }
  else if (choiceId === 'action_bribe_accept') {
    // ── Nhận hối lộ từ Vương Tư Thông ──
    newSpiritStones += 500;
    newSectContribution += 50;
    newStats.daoHeart = Math.max(0, newStats.daoHeart - 10);
    tempLogs.push({
      type: 'info',
      message: {
        vi: 'Bạn nuốt tự trọng nhận túi linh thạch của Vương Tư Thông. Hắn cười khinh thường rồi đi. Bạn nhận +500 Linh thạch, +50 Cống hiến nhưng Đạo Tâm suy yếu -10.',
        en: 'Bạn nhận hối lộ từ Vương Tư Thông. Gained +500 Spirit Stones, +50 Contribution but Dao Heart weakened -10.'
      }
    });
  }
  else if (choiceId === 'action_bribe_refuse') {
    // ── Cự tuyệt → chiến đấu Long Ngạo Thiên ──
    const ngaoThienEvent: EventDefinition = {
      id: 'combat_encounter_ngao_thien',
      title: { vi: '⚔️ Trận Chung Kết: Long Ngạo Thiên!', en: '⚔️ Championship Final: Long Ngao Thien!' },
      description: {
        vi: 'Long Ngạo Thiên – Thiên Kiêu đương đại của ngoại môn, Luyện Khí tầng 12 viên mãn. Hắn đứng trên lôi đài áo trắng phất phơ, linh khí bạo động cuộn xoáy. "Ngươi dám đến? Tốt lắm. Ta sẽ không nương tay!"',
        en: 'Long Ngao Thien – the top genius of the outer sect, Qi Refinement Layer 12 Consummate. He stands on the arena in white robes, spiritual energy raging. "You dare come? Very well. I will show no mercy!"'
      },
      minAge: 0, maxAge: 9999, weight: 0,
      choices: [
        { id: 'start_combat_tournament_ngao_thien', text: { vi: '⚔️ Dốc toàn lực quyết chiến!', en: '⚔️ Fight with all your strength!' }, effects: {} }
      ]
    };
    return {
      ...state,
      stats: newStats,
      currentEvent: ngaoThienEvent,
      isTicking: false
    };
  }
  else if (choiceId === 'slap_young_master') {`;

// 4. Trigger tournament in tickMonth() right before questJustCompleted check
const target4 = `  if (questJustCompleted) {`;

const replacement4 = `  // ── Ngoại Môn Đại Bỉ Annual December Trigger ──
  if (
    nextMonth === 12 &&
    !nextActiveQuest &&
    !questJustCompleted &&
    state.realm === 'Qi Refinement' &&
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
      age: nextAge,
      month: nextMonth,
      isTicking: false,
      currentEvent: TournamentAnnualStartEvent,
      monthlyLog: nextMonthlyLog,
      questsCompletedThisYear: nextQuestsCompletedThisYear,
      log: [...state.log, tourLog],
      lastMessage: tourLog.message
    };
  }

  if (questJustCompleted) {`;

// Helper check
function countMatches(str, target) {
  let count = 0;
  let pos = str.indexOf(target);
  while (pos !== -1) {
    count++;
    pos = str.indexOf(target, pos + target.length);
  }
  return count;
}

// Check if targets exist exactly once
if (countMatches(content, target1) !== 1) {
  console.error('ERROR: target1 matched ' + countMatches(content, target1) + ' times (expected 1)');
  process.exit(1);
}
if (countMatches(content, target2) !== 1) {
  console.error('ERROR: target2 matched ' + countMatches(content, target2) + ' times (expected 1)');
  process.exit(1);
}
if (countMatches(content, target3) !== 1) {
  console.error('ERROR: target3 matched ' + countMatches(content, target3) + ' times (expected 1)');
  process.exit(1);
}
if (countMatches(content, target4) !== 1) {
  console.error('ERROR: target4 matched ' + countMatches(content, target4) + ' times (expected 1)');
  process.exit(1);
}

// Perform replacements using function to prevent special character replacements
content = content.replace(target1, () => replacement1);
content = content.replace(target2, () => replacement2);
content = content.replace(target3, () => replacement3);
content = content.replace(target4, () => replacement4);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: All 4 modifications applied successfully!');
