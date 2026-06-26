const fs = require('fs');
const path = require('path');

const locales = {
  en: {
    systemInitialization: "<SYSTEM INITIALIZATION>",
    settingsTitleStart: "// SETTINGS",
    legacyDataStart: "// LEGACY DATA",
    legacyPowerStart: "LEGACY POWER",
    ancestralMemoryStart: "ANCESTRAL MEMORY",
    blessingStart: "BLESSING"
  },
  vi: {
    systemInitialization: "<KHỞI TẠO HỆ THỐNG>",
    settingsTitleStart: "// CẤU HÌNH",
    legacyDataStart: "// DỮ LIỆU DI SẢN",
    legacyPowerStart: "SỨC MẠNH DI SẢN",
    ancestralMemoryStart: "KÝ ỨC TỔ TIÊN",
    blessingStart: "PHÚC LÀNH"
  },
  zh: {
    systemInitialization: "<系统初始化>",
    settingsTitleStart: "// 设置",
    legacyDataStart: "// 遗产数据",
    legacyPowerStart: "遗产力量",
    ancestralMemoryStart: "祖先记忆",
    blessingStart: "祝福"
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

const file = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ["{'<System Initialization>'}", "{uiText[language]?.['systemInitialization'] || '<System Initialization>'}"],
  ["{'// Cấu Hình'}", "{uiText[language]?.['settingsTitleStart'] || '// SETTINGS'}"],
  ["{'// Dữ Liệu Di Sản'}", "{uiText[language]?.['legacyDataStart'] || '// LEGACY DATA'}"],
  ['>LEGACY POWER<', '>{uiText[language]?.legacyPowerStart || "LEGACY POWER"}<'],
  ['>ANCESTRAL MEMORY<', '>{uiText[language]?.ancestralMemoryStart || "ANCESTRAL MEMORY"}<'],
  ['>BLESSING<', '>{uiText[language]?.blessingStart || "BLESSING"}<']
];

for (const [t, r] of replacements) {
  content = content.replaceAll(t, r);
}

fs.writeFileSync(file, content, 'utf8');
