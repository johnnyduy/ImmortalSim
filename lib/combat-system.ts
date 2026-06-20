import { GameState, CombatState, CombatEnemy, GameEffect } from '../types';
import { getPlayerStat } from './engine';

type CombatAction = 'brute_force' | 'tactical' | 'stall' | 'demonic' | 'escape';

export const generateBattleLog = (enemy: CombatEnemy, state: GameState): string[] => {
  const log: string[] = [];
  
  // Ngoại hình và Tốc độ
  if (enemy.speed < 20) {
    log.push("Kẻ địch có thân hình đồ sộ, bước chân nặng nề, dường như phòng thủ cực cao nhưng hành động chậm chạp.");
  } else if (enemy.speed > 50) {
    log.push("Thân pháp kẻ địch quỷ mị, thoắt ẩn thoắt hiện, sát khí tỏa ra lạnh lẽo, cực kỳ nguy hiểm nếu để hắn áp sát.");
  } else {
    log.push("Kẻ địch thủ thế vững vàng, động tác linh hoạt, dường như không có nhược điểm rõ ràng.");
  }

  // Khí huyết / Sức mạnh
  if (enemy.maxHp > 300) {
    log.push("Sinh lực dồi dào cuồn cuộn như sông lớn, không thể hạ gục trong một sớm một chiều.");
  }

  // Tương tác Mạch máu thế giới
  if (state.worldState && state.worldState.demonic.activity > 60) {
    log.push("⚠️ Ma khí ngập trời, kẻ địch dường như đang được cuồng hóa bởi tà khí môi trường! Sức mạnh tăng vọt.");
  }
  
  if (state.worldState && state.worldState.global.spiritualQi > 80) {
    log.push("Linh khí nồng đậm xung quanh giúp bạn cảm thấy việc thi triển pháp thuật dễ dàng hơn.");
  }

  return log;
};

export const startCombat = (state: GameState, enemy: CombatEnemy): GameState => {
  const battleLog = generateBattleLog(enemy, state);
  const combatState: CombatState = {
    enemy,
    log: battleLog,
    isFinished: false,
    onWinEffects: {
      sectContribution: 10,
      spiritStones: 20,
      cultivation: 5,
    },
    onLossEffects: {
      health: -9999, // Death
    }
  };

  return {
    ...state,
    activeCombat: combatState
  };
};

export const resolveCombatAction = (state: GameState, action: CombatAction): GameState => {
  if (!state.activeCombat || state.activeCombat.isFinished) return state;

  const combat = state.activeCombat;
  const enemy = combat.enemy;
  let newLog = [...combat.log];
  let isFinished = false;
  let result: 'win' | 'loss' | 'escape' = 'loss';
  
  const playerCP = getPlayerStat(state, 'combatPower');
  const playerSpeed = getPlayerStat(state, 'speed') || state.stats.speed || 10;
  const playerComp = getPlayerStat(state, 'comprehension');
  
  // Dummy enemy CP
  const enemyCP = enemy.attack * 3 + enemy.maxHp * 0.5 + enemy.speed * 2;

  let effectOverrides: GameEffect = {};

  switch (action) {
    case 'brute_force':
      newLog.push("Bạn chọn Lấy Cứng Chọi Cứng! Vận hết tu vi lao vào chém giết trực diện.");
      if (playerCP >= enemyCP * 0.8) {
        newLog.push("Sức mạnh áp đảo! Bạn chém đứt đầu đối thủ, nhưng bản thân cũng chịu nội thương.");
        isFinished = true;
        result = 'win';
        effectOverrides = { health: -Math.floor(enemy.attack * 1.5) };
      } else {
        newLog.push("Kẻ địch quá mạnh! Bạn bị đánh bật lại, trọng thương thổ huyết.");
        isFinished = true;
        result = 'loss';
        effectOverrides = { health: -Math.floor(enemy.attack * 3) };
      }
      break;

    case 'tactical':
      newLog.push("Bạn chọn Bày Trận / Dùng Trí! Vứt ra hàng loạt trận kỳ, dụ địch vào bẫy.");
      const hasItem = state.inventory?.some(i => i.id === 'item_pha_tran_chuy' && i.quantity > 0);
      if (playerComp > 15 || hasItem) {
        if (enemy.speed < 40) {
          newLog.push("Trận pháp kích hoạt! Kẻ địch chậm chạp bị nhốt chặt và tiêu diệt mà bạn không hề xây xát.");
          isFinished = true;
          result = 'win';
          if (hasItem) {
             // In a real implementation, we would consume the item here
             newLog.push("(Đã sử dụng Phá Trận Chùy hỗ trợ)");
          }
        } else {
          newLog.push("Kẻ địch quá nhanh, dễ dàng né tránh sát trận của bạn và phản công!");
          isFinished = true;
          result = 'loss';
          effectOverrides = { health: -Math.floor(enemy.attack * 2) };
        }
      } else {
        newLog.push("Ngộ tính không đủ để bày trận phức tạp, bạn bị địch nhìn thấu và phá giải!");
        isFinished = true;
        result = 'loss';
        effectOverrides = { health: -Math.floor(enemy.attack * 2) };
      }
      break;

    case 'stall':
      newLog.push("Bạn chọn Tiêu Hao Tật Lê! Vận khinh công né tránh, liên tục cắn thuốc.");
      if (playerSpeed > enemy.speed) {
        newLog.push("Thân pháp quỷ mị của bạn khiến địch không thể chạm vào và dần kiệt sức.");
        isFinished = true;
        result = 'win';
        effectOverrides = { toxicity: 20 }; // Tăng Đan độc
        newLog.push("Bạn thắng lợi nhưng cảm thấy kinh mạch đau đớn do Đan Độc tích tụ.");
      } else {
        newLog.push("Tốc độ kẻ địch áp đảo! Thả diều thất bại, bạn bị đánh trọng thương.");
        isFinished = true;
        result = 'loss';
        effectOverrides = { health: -Math.floor(enemy.attack * 2.5), toxicity: 10 };
      }
      break;

    case 'demonic':
      newLog.push("Bạn chọn Tà Đạo Huyết Tế! Cắn nát đầu lưỡi, thiêu đốt sinh mệnh để đổi lấy sức mạnh bạo phát.");
      newLog.push("Sức mạnh kinh khủng xé nát kẻ địch thành bã tịt!");
      isFinished = true;
      result = 'win';
      effectOverrides = { karma: -30, lifespan: -5, health: -30 };
      break;

    case 'escape':
      newLog.push("Tu tiên là biết tiến thoái. Bạn tung Độn Thổ Phù và dốc toàn lực bỏ chạy!");
      const hasEscapeItem = state.inventory?.some(i => i.id === 'item_don_tho_phu' && i.quantity > 0);
      if (hasEscapeItem || Math.random() < 0.5) {
        newLog.push("Trốn thoát thành công!");
        isFinished = true;
        result = 'escape';
        effectOverrides = { daoMind: -10 };
      } else {
        newLog.push("Trốn thoát thất bại! Bị địch tóm được.");
        isFinished = true;
        result = 'loss';
        effectOverrides = { health: -Math.floor(enemy.attack * 3) };
      }
      break;
  }

  return {
    ...state,
    activeCombat: {
      ...combat,
      log: newLog,
      isFinished,
      result,
      onWinEffects: { ...combat.onWinEffects, ...effectOverrides },
      onLossEffects: { ...combat.onLossEffects, ...effectOverrides }
    }
  };
};

export const finishCombat = (state: GameState): GameState => {
  if (!state.activeCombat) return state;
  const combat = state.activeCombat;
  const effects = combat.result === 'win' ? combat.onWinEffects : (combat.result === 'loss' ? combat.onLossEffects : {});
  
  const nextStats = { ...state.stats };
  if (effects) {
    nextStats.health = Math.max(0, nextStats.health + (effects.health || 0));
    nextStats.speed = Math.max(0, (nextStats.speed || 10) + (effects.speed || 0));
    nextStats.toxicity = Math.max(0, (nextStats.toxicity || 0) + (effects.toxicity || 0));
    nextStats.karma = nextStats.karma + (effects.karma || 0);
    nextStats.lifespan = Math.max(10, nextStats.lifespan + (effects.lifespan || 0));
    nextStats.daoHeart = Math.max(0, Math.min(100, nextStats.daoHeart + (effects.daoMind || effects.daoHeart || 0)));
    nextStats.cultivation = Math.max(0, nextStats.cultivation + (effects.cultivation || 0));
  }

  const nextStones = Math.max(0, (state.spiritStones || 0) + (effects?.spiritStones || 0));
  const nextContrib = Math.max(0, (state.sectContribution || 0) + (effects?.sectContribution || 0));

  let alive = state.alive;
  if (nextStats.health <= 0) alive = false;

  return {
    ...state,
    stats: nextStats,
    spiritStones: nextStones,
    sectContribution: nextContrib,
    alive,
    activeCombat: undefined
  };
};
