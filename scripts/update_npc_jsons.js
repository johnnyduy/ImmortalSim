const fs = require('fs');

const npcsToUpdate = [
  { file: 'data/npcs/thien_kieu_tra_xanh.json', data: { sect: 'Thanh Vân Môn', role: { vi: 'Nội Môn Đệ Tử', en: 'Inner Disciple' }, avatar: '👱‍♀️' } },
  { file: 'data/npcs/hong_nhan_ma_dao.json', data: { sect: 'Huyết Tông', role: { vi: 'Thánh Nữ Ma Đạo', en: 'Demonic Saintess' }, avatar: '🧛‍♀️' } },
  { file: 'data/npcs/ke_sinh_ton.json', data: { sect: 'Tán Tu', role: { vi: 'Tán Tu Lang Thang', en: 'Wandering Cultivator' }, avatar: '🥷' } },
  { file: 'data/npcs/thien_kieu_chan_chinh.json', data: { sect: 'Kiếm Tông', role: { vi: 'Chân Truyền Đệ Tử', en: 'Core Disciple' }, avatar: '🦸‍♂️' } },
  { file: 'data/npcs/thieu_gia.json', data: { sect: 'Gia Tộc', role: { vi: 'Thiếu Chủ Gia Tộc', en: 'Clan Young Master' }, avatar: '🤴' } }
];

npcsToUpdate.forEach(({ file, data }) => {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(content, data);
  fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
});

console.log('Updated NPC JSONs successfully.');
