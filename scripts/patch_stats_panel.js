const fs = require('fs');
const file = 'components/StatsPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { npcs } from '../data/npcs/index';")) {
  code = code.replace(
    "import WorldNewsPanel from './WorldNewsPanel';",
    "import WorldNewsPanel from './WorldNewsPanel';\nimport { npcs } from '../data/npcs/index';"
  );
}

const targetArray = `{[
                  { id: 'npc_kiem_tong_chap_su', name: 'Tạ Trần', sect: 'Kiếm Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '👨‍💼' },
                  { id: 'npc_kiem_tong_ta_tieu', name: 'Tạ Tiêu', sect: 'Kiếm Tông', role: language === 'vi' ? 'Đệ tử (Cháu Chấp sự)' : 'Disciple (Deacon\\'s Nephew)', avatar: '🧑‍🎤' },
                  { id: 'npc_dan_tong_chap_su', name: 'Linh Dương', sect: 'Đan Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '👨‍🔬' },
                  { id: 'npc_ma_dao_chap_su', name: 'Khấu Vô Kỵ', sect: 'Ma Đạo', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '😈' },
                  { id: 'npc_huyet_tong_chap_su', name: 'Xích Liệt', sect: 'Huyết Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '🧛' },
                ]`;

const replacementArray = `{[
                  { id: 'npc_kiem_tong_chap_su', name: 'Tạ Trần', sect: 'Kiếm Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '👨‍💼' },
                  { id: 'npc_kiem_tong_ta_tieu', name: 'Tạ Tiêu', sect: 'Kiếm Tông', role: language === 'vi' ? 'Đệ tử (Cháu Chấp sự)' : 'Disciple (Deacon\\'s Nephew)', avatar: '🧑‍🎤' },
                  { id: 'npc_dan_tong_chap_su', name: 'Linh Dương', sect: 'Đan Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '👨‍🔬' },
                  { id: 'npc_ma_dao_chap_su', name: 'Khấu Vô Kỵ', sect: 'Ma Đạo', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '😈' },
                  { id: 'npc_huyet_tong_chap_su', name: 'Xích Liệt', sect: 'Huyết Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '🧛' },
                  ...npcs.map(n => ({
                    id: n.id,
                    name: n.name,
                    sect: n.sect,
                    role: language === 'vi' ? n.role.vi : n.role.en,
                    avatar: n.avatar
                  }))
                ]`;

if (code.includes(targetArray)) {
  code = code.replace(targetArray, replacementArray);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched StatsPanel.tsx successfully.');
} else {
  console.log('Target array not found.');
}
