import { GameState, AlchemyRecipe, FireMethod, ItemInstance } from '../types';
import itemsData from '../data/items.json';

export type AlchemyResultType = 'success' | 'failure_trash' | 'failure_explode';

export interface AlchemyResult {
  type: AlchemyResultType;
  log: string[];
  outputItem?: ItemInstance;
  healthLost?: number;
}

export const processAlchemy = (
  state: GameState,
  recipe: AlchemyRecipe,
  furnaceQuality: number, // 1 to 5 (Phàm to Tiên)
  fireMethod: FireMethod
): AlchemyResult => {
  const logs: string[] = [];
  logs.push(`Bạn bắt đầu luyện chế ${recipe.name} bằng ${fireMethod}...`);

  const alchemyLevel = state.stats.alchemyLevel || 1;
  const comprehension = state.stats.comprehension || 10;
  const daoHeart = state.stats.daoHeart || 50;

  // Base success rate
  let successRate = recipe.baseSuccessRate;

  // Modify by stats
  successRate += (alchemyLevel * 0.05);
  successRate += (comprehension * 0.01);

  // Modify by fire method
  let explodeRisk = 0.05; // 5% base risk
  
  switch (fireMethod) {
    case 'văn_hỏa':
      logs.push("Dùng Văn Hỏa đun cháy từ từ, an toàn nhưng tốn nhiều thọ nguyên.");
      successRate += 0.1;
      explodeRisk *= 0.5;
      break;
    case 'vũ_hỏa':
      logs.push("Dùng Vũ Hỏa thiêu đốt dữ dội, dễ ra đan nhưng rất dễ nổ lò!");
      successRate -= 0.1;
      explodeRisk *= 3.0;
      break;
    case 'thiên_lôi':
      logs.push("Dẫn Thiên Lôi rèn đan! Nguy hiểm vạn phần nhưng cơ hội ra đan có Đan Văn rất cao!");
      successRate -= 0.3;
      explodeRisk *= 5.0;
      break;
    case 'huyết_luyện':
      logs.push("Dùng tinh huyết hiến tế! Tỷ lệ thành công cực cao nhưng rước lấy ma tính!");
      successRate = 1.0;
      explodeRisk = 0;
      break;
  }

  // Modify by furnace
  successRate += (furnaceQuality * 0.05);
  explodeRisk = Math.max(0, explodeRisk - (furnaceQuality * 0.02));
  
  // Khống hỏa (daoHeart) reduces explode risk
  explodeRisk = Math.max(0, explodeRisk - (daoHeart * 0.001));

  const roll = Math.random();
  const explodeRoll = Math.random();

  if (explodeRoll < explodeRisk) {
    logs.push("BÙM! Hỏa hầu mất kiểm soát, Đan Lô nổ tung!");
    const healthLost = Math.floor(Math.random() * 30) + 20;
    return {
      type: 'failure_explode',
      log: logs,
      healthLost
    };
  }

  if (roll <= successRate) {
    logs.push("Lò mở ra, dị hương xông mũi! Luyện đan thành công.");
    
    // Calculate Dan Van (Quality)
    let qualityRoll = Math.random() + (comprehension * 0.01) + (furnaceQuality * 0.05);
    if (fireMethod === 'thiên_lôi') qualityRoll += 0.3;

    let quality: 'phàm_phẩm' | 'tinh_phẩm' | 'cực_phẩm' | 'tiên_phẩm' = 'phàm_phẩm';
    let toxicity = recipe.baseToxicity;

    if (qualityRoll > 1.2) {
      quality = 'tiên_phẩm';
      toxicity = 0;
      logs.push("Chín đạo đan văn lượn lờ! Đây là Tiên Phẩm Cửu Văn Đan, hoàn toàn không có Đan Độc!");
    } else if (qualityRoll > 0.9) {
      quality = 'cực_phẩm';
      toxicity = Math.floor(recipe.baseToxicity * 0.2);
      logs.push("Ba đạo đan văn hiện lên! Đây là Cực Phẩm Đan, Đan Độc rất ít.");
    } else if (qualityRoll > 0.6) {
      quality = 'tinh_phẩm';
      toxicity = Math.floor(recipe.baseToxicity * 0.5);
      logs.push("Một đạo đan văn mờ ảo! Đây là Tinh Phẩm Đan, Đan Độc đã được thanh lọc một nửa.");
    } else {
      logs.push("Đan dược xù xì không văn. Đây là Phàm Phẩm Đan, chứa nhiều Đan Độc.");
    }

    if (fireMethod === 'huyết_luyện') {
      logs.push("Đan dược đỏ sẫm mùi máu, chứa đầy sát khí và ma tính.");
    }

    const baseItem = (itemsData as any[]).find(i => i.id === recipe.resultItemId);
    const outputItem: ItemInstance = {
      ...baseItem,
      id: `${baseItem.id}_${Date.now()}`,
      quantity: 1,
      quality,
      toxicity
    };

    return {
      type: 'success',
      log: logs,
      outputItem
    };
  } else {
    logs.push("Linh khí tiêu tán, lò đan bốc mùi khét lẹt. Luyện đan thất bại, thu được một viên Tạp Đan.");
    const trashItem: ItemInstance = {
      id: `item_tap_dan_${Date.now()}`,
      name: "Tạp Đan",
      description: "Sản phẩm lỗi của luyện đan, bán cho chợ đen hoặc tiệm tạp hóa.",
      category: "consumable",
      type: "elixir",
      tier: "hoàng",
      quantity: 1,
      basePrice: 2
    };

    return {
      type: 'failure_trash',
      log: logs,
      outputItem: trashItem
    };
  }
};
