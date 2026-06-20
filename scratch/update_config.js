const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/combat-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 1. Add Qi Refinement multiplier to cultivation system
if (!config.cultivation_system) {
  config.cultivation_system = {};
}
config.cultivation_system.qi_refinement_layer_multiplier = 1.3;

const mult = 1.3;
const b1 = Math.round((10 * Math.pow(mult, 3) - 0.01) * 100) / 100; // 21.96
const b2 = Math.round((10 * Math.pow(mult, 6) - 0.01) * 100) / 100; // 48.26
const b3 = Math.round((10 * Math.pow(mult, 9) - 0.01) * 100) / 100; // 106.04

// 2. Update bottlenecks in JSON
config.cultivation_system.bottlenecks = [
  {
    "realm_from": "Qi Refinement",
    "realm_to": "Qi Refinement",
    "threshold": b1,
    "pill_item_id": null,
    "success_rate_no_pill": 0.5,
    "next_cult": b1 + 0.01,
    "label": "Luyện Khí Tầng 4"
  },
  {
    "realm_from": "Qi Refinement",
    "realm_to": "Qi Refinement",
    "threshold": b2,
    "pill_item_id": null,
    "success_rate_no_pill": 0.4,
    "next_cult": b2 + 0.01,
    "label": "Luyện Khí Tầng 7"
  },
  {
    "realm_from": "Qi Refinement",
    "realm_to": "Foundation Establishment",
    "threshold": b3,
    "pill_item_id": "item_truc_co_dan",
    "success_rate_no_pill": 0.01,
    "backlash_cultivation_loss": 3.0,
    "next_cult": 0.0,
    "label": "Trúc Cơ"
  },
  {
    "realm_from": "Foundation Establishment",
    "realm_to": "Golden Core",
    "threshold": 19.99,
    "pill_item_id": "item_kim_dan_dan",
    "success_rate_no_pill": 0.01,
    "backlash_cultivation_loss": 5.0,
    "next_cult": 0.0,
    "label": "Kim Đan"
  },
  {
    "realm_from": "Golden Core",
    "realm_to": "Nascent Soul",
    "threshold": 39.99,
    "pill_item_id": "item_nguyen_anh_dan",
    "success_rate_no_pill": 0.01,
    "backlash_cultivation_loss": 10.0,
    "next_cult": 0.0,
    "label": "Nguyên Anh"
  }
];

// 3. Update manual tiers max levels
if (config.cultivation_system.manual_tiers) {
  config.cultivation_system.manual_tiers.forEach(t => {
    if (t.tier === 'hoàng') t.max_level_no_pill = b3;
    else if (t.tier === 'huyền') t.max_level_no_pill = 19.99;
    else if (t.tier === 'địa') t.max_level_no_pill = 39.99;
    else if (t.tier === 'thiên') t.max_level_no_pill = 999.0;
  });
}

// 4. Update basic manuals description and max_cultivation_level
if (config.techniques) {
  config.techniques.forEach(tech => {
    if (tech.type === 'tâm_pháp') {
      if (tech.is_basic_manual) {
        tech.max_cultivation_level = b3;
        tech.description = tech.description.replace('Luyện Khí Tầng 12 (Viên Mãn)', 'Luyện Khí Tầng 9 (Viên Mãn)');
      } else {
        // y% increase for better manuals
        let costIncrease = 10; // default 10%
        if (tech.tier === 'địa') costIncrease = 20;
        else if (tech.tier === 'thiên') costIncrease = 30;
        
        tech.breakthrough_cost_increase_pct = costIncrease;
        if (!tech.description.includes('đột phá')) {
          tech.description = tech.description + ` (Đột phá tiêu hao +${costIncrease}% Tu vi)`;
        }
      }
    }
  });
}

// 5. Update items description for breakthrough pills to match the new local caps
if (config.items) {
  config.items.forEach(item => {
    if (item.id === 'item_truc_co_dan') {
      item.description = `Đan dược đột phá cảnh giới dùng khi đạt Luyện Khí Tầng 9 Viên Mãn (${b3} tu vi) để tiến nhập Trúc Cơ Kỳ.`;
    } else if (item.id === 'item_kim_dan_dan') {
      item.description = `Đan dược đột phá cảnh giới dùng khi đạt Trúc Cơ Hậu Kỳ (19.99 tu vi) để tiến nhập Kim Đan Kỳ.`;
    } else if (item.id === 'item_nguyen_anh_dan') {
      item.description = `Đan dược đột phá cảnh giới dùng khi đạt Kim Đan Viên Mãn (39.99 tu vi) để tiến nhập Nguyên Anh Kỳ.`;
    }
  });
}

fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
console.log('Successfully updated combat-config.json!');
