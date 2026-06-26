const fs = require('fs');
const path = require('path');

const locales = {
  en: {
    ageCaps: "AGE",
    entityCultivator: "ENTITY: CULTIVATOR",
    sectCaps: "SECT",
    karmaCaps: "KARMA",
    statusEffects: "STATUS EFFECTS",
    enlightened: "[ENLIGHTENED]",
    coreEssence: "CORE ESSENCE",
    sync: "SYNC",
    qiCaps: "QI",
    soulCaps: "SOUL",
    bodyCaps: "BODY",
    luckCaps: "LUCK",
    eventLogCaps: "EVENT LOG",
    waitingForEvent: "Waiting for event...",
    statBalanceHex: "STAT BALANCE HEX",
    nextBreakthrough: "NEXT BREAKTHROUGH",
    cultivationText: "Cultivation",
    initiateAscension: "INITIATE ASCENSION",
    exploreCaps: "EXPLORE",
    inventoryCaps: "INVENTORY"
  },
  vi: {
    ageCaps: "TUỔI",
    entityCultivator: "THỰC THỂ: TU SĨ",
    sectCaps: "TÔNG MÔN",
    karmaCaps: "NGHIỆP",
    statusEffects: "TRẠNG THÁI HIỆU ỨNG",
    enlightened: "[ĐẠI NGỘ]",
    coreEssence: "BẢN NGUYÊN",
    sync: "ĐỒNG BỘ",
    qiCaps: "KHÍ",
    soulCaps: "HỒN",
    bodyCaps: "THỂ",
    luckCaps: "VẬN",
    eventLogCaps: "NHẬT KÝ SỰ KIỆN",
    waitingForEvent: "Đang chờ sự kiện...",
    statBalanceHex: "CÂN BẰNG THUỘC TÍNH",
    nextBreakthrough: "ĐỘT PHÁ TIẾP THEO",
    cultivationText: "Tu vi",
    initiateAscension: "TIẾN HÀNH PHI THĂNG",
    exploreCaps: "THÁM HIỂM",
    inventoryCaps: "HÀNH TRANG"
  },
  zh: {
    ageCaps: "年龄",
    entityCultivator: "实体: 修士",
    sectCaps: "宗门",
    karmaCaps: "业力",
    statusEffects: "状态效果",
    enlightened: "[顿悟]",
    coreEssence: "本源精华",
    sync: "同步",
    qiCaps: "气",
    soulCaps: "魂",
    bodyCaps: "体",
    luckCaps: "运",
    eventLogCaps: "事件日志",
    waitingForEvent: "等待事件中...",
    statBalanceHex: "属性平衡阵",
    nextBreakthrough: "下次突破",
    cultivationText: "修为",
    initiateAscension: "开始飞升",
    exploreCaps: "探索",
    inventoryCaps: "物品栏"
  }
};

for (const lang of ['en', 'vi', 'zh']) {
  const p = path.join(__dirname, 'locales', lang, 'ui.json');
  let data = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [k, v] of Object.entries(locales[lang])) {
    data[k] = v;
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

const file = path.join(__dirname, 'components/TerminalUI.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { uiText }")) {
  content = content.replace(
    "import { getLocalizedText } from '../lib/i18n';",
    "import { getLocalizedText, uiText } from '../lib/i18n';"
  );
}

const replacements = [
  ['AGE: {game.age}', '{uiText[language]?.ageCaps || "AGE"}: {game.age}'],
  ['ENTITY: CULTIVATOR', '{uiText[language]?.entityCultivator || "ENTITY: CULTIVATOR"}'],
  ['>SECT<', '>{uiText[language]?.sectCaps || "SECT"}<'],
  ['>KARMA<', '>{uiText[language]?.karmaCaps || "KARMA"}<'],
  ['>STATUS EFFECTS<', '>{uiText[language]?.statusEffects || "STATUS EFFECTS"}<'],
  ['>[ENLIGHTENED]<', '>{uiText[language]?.enlightened || "[ENLIGHTENED]"}<'],
  ['> CORE ESSENCE', '> {uiText[language]?.coreEssence || "CORE ESSENCE"}'],
  ['SYNC: {', '{uiText[language]?.sync || "SYNC"}: {'],
  ['>QI<', '>{uiText[language]?.qiCaps || "QI"}<'],
  ['>SOUL<', '>{uiText[language]?.soulCaps || "SOUL"}<'],
  ['>BODY<', '>{uiText[language]?.bodyCaps || "BODY"}<'],
  ['>LUCK<', '>{uiText[language]?.luckCaps || "LUCK"}<'],
  ['> EVENT LOG', '> {uiText[language]?.eventLogCaps || "EVENT LOG"}'],
  ['Waiting for event...', '{uiText[language]?.waitingForEvent || "Waiting for event..."}'],
  ['>STAT BALANCE HEX<', '>{uiText[language]?.statBalanceHex || "STAT BALANCE HEX"}<'],
  ['>NEXT BREAKTHROUGH<', '>{uiText[language]?.nextBreakthrough || "NEXT BREAKTHROUGH"}<'],
  ['>Cultivation {', '>{uiText[language]?.cultivationText || "Cultivation"} {'],
  ['>QI<', '>{uiText[language]?.qiCaps || "QI"}<'],
  ['>BODY<', '>{uiText[language]?.bodyCaps || "BODY"}<'],
  ['>SOUL<', '>{uiText[language]?.soulCaps || "SOUL"}<'],
  ['>LUCK<', '>{uiText[language]?.luckCaps || "LUCK"}<'],
  ['INITIATE ASCENSION', '{uiText[language]?.initiateAscension || "INITIATE ASCENSION"}'],
  ['>EXPLORE<', '>{uiText[language]?.exploreCaps || "EXPLORE"}<'],
  ['>INVENTORY<', '>{uiText[language]?.inventoryCaps || "INVENTORY"}<'],
];

for (const [t, r] of replacements) {
  content = content.replaceAll(t, r);
}

fs.writeFileSync(file, content, 'utf8');
