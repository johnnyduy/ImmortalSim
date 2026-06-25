const fs = require('fs');
const path = require('path');

const gcPath = path.join(__dirname, 'lib', 'game-controller.ts');
let content = fs.readFileSync(gcPath, 'utf8');

// We will replace specific anchor points with comments
const replacements = [
  {
    search: "let nextQuestsCompletedThisYear = state.questsCompletedThisYear ?? 0;",
    replace: "\n  // =========================================================\n  // 1. CHUẨN BỊ BIẾN TOÀN CỤC\n  // =========================================================\n  let nextQuestsCompletedThisYear = state.questsCompletedThisYear ?? 0;"
  },
  {
    search: "// Process quest completion first",
    replace: "\n  // =========================================================\n  // 2. XỬ LÝ NHIỆM VỤ (QUESTS) & TĨNH TU BẾ QUAN\n  // =========================================================\n  // Process quest completion first"
  },
  {
    search: "// Handle year rollover and punishment check",
    replace: "\n  // =========================================================\n  // 3. XỬ LÝ QUA NĂM MỚI & KIỂM TRA THỌ NGUYÊN (AGING & DEATH)\n  // =========================================================\n  // Handle year rollover and punishment check"
  },
  {
    search: "if (triggerPunishment) {",
    replace: "\n  // =========================================================\n  // 4. XỬ LÝ TRỪNG PHẠT MÔN PHÁI\n  // =========================================================\n  if (triggerPunishment) {"
  },
  {
    search: "// ── Ngoại Môn Đại Bỉ Annual December Trigger ──",
    replace: "\n  // =========================================================\n  // 5. SỰ KIỆN CỐ ĐỊNH: NGOẠI MÔN ĐẠI BỈ (THÁNG 12)\n  // =========================================================\n  // ── Ngoại Môn Đại Bỉ Annual December Trigger ──"
  },
  {
    search: "// ── Tick WorldState ──",
    replace: "\n  // =========================================================\n  // 6. CẬP NHẬT TRẠNG THÁI THẾ GIỚI (WORLD STATE) & THÔNG BÁO\n  // =========================================================\n  // ── Tick WorldState ──"
  },
  {
    search: "// Roll standard random event (only if NOT on a quest!)",
    replace: "\n  // =========================================================\n  // 7. KIỂM TRA KỲ NGỘ NGẪU NHIÊN (RANDOM MONTHLY EVENTS)\n  // =========================================================\n  // Roll standard random event (only if NOT on a quest!)"
  },
  {
    search: "let passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);",
    replace: "\n  // =========================================================\n  // 8. TĂNG TU VI THỤ ĐỘNG & KIỂM TRA ĐỘT PHÁ CẢNH GIỚI\n  // =========================================================\n  let passiveGain = 0.02 * getCultivationGainMultiplier(state, customConfig);"
  }
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync(gcPath, content, 'utf8');
console.log('Comments injected.');
