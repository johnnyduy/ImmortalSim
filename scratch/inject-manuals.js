const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'combat-config.json');
console.log('Reading config from:', configPath);

const raw = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(raw);

const sects = ['Kiếm Tông', 'Ma Đạo', 'Huyết Tông', 'Đan Tông'];
const roots = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Lôi', 'Băng', 'Phong'];

const sectIdMap = {
  'Kiếm Tông': 'kiem_tong',
  'Ma Đạo': 'ma_dao',
  'Huyết Tông': 'huyet_tong',
  'Đan Tông': 'dan_tong'
};

const rootIdMap = {
  'Kim': 'kim',
  'Mộc': 'moc',
  'Thủy': 'thuy',
  'Hỏa': 'hoa',
  'Thổ': 'tho',
  'Lôi': 'loi',
  'Băng': 'bang',
  'Phong': 'phong'
};

const rootImgMap = {
  'Kim': 'book_metal',
  'Mộc': 'book_wood',
  'Thủy': 'book_water',
  'Hỏa': 'book_fire',
  'Thổ': 'book_earth',
  'Lôi': 'book_thunder',
  'Băng': 'book_ice',
  'Phong': 'book_wind'
};

// Generate name mapping
const namesMap = {
  'Kiếm Tông': {
    'Kim': 'Canh Kim Kiếm Quyết',
    'Mộc': 'Hương Mộc Kiếm Ca',
    'Thủy': 'Nhược Thủy Kiếm Kinh',
    'Hỏa': 'Ly Hỏa Kiếm Thuật',
    'Thổ': 'Mậu Thổ Kiếm Đồ',
    'Lôi': 'Cửu Thiên Lôi Kiếm',
    'Băng': 'Hàn Băng Kiếm Kính',
    'Phong': 'Ngự Phong Kiếm Hải'
  },
  'Ma Đạo': {
    'Kim': 'Ma Ảnh Kim Thần Luân',
    'Mộc': 'Vạn Độc Thần Ma Công',
    'Thủy': 'Hắc Thủy Ma Sát Phép',
    'Hỏa': 'Ma Hỏa U Minh Thuật',
    'Thổ': 'Hắc Thổ Ma Hoàng Ấn',
    'Lôi': 'Ma Lôi Phá Thiên Đạo',
    'Băng': 'Huyền Băng Ma Tiên Pháp',
    'Phong': 'Ma Phong Vô Ảnh Bộ'
  },
  'Huyết Tông': {
    'Kim': 'Huyết Kim Sát Trận',
    'Mộc': 'Huyết Mộc Cổ Sinh Pháp',
    'Thủy': 'Huyết Hải Triều Sinh Thuật',
    'Hỏa': 'Huyết Hỏa Thiêu Thần Quyết',
    'Thổ': 'Huyết Thổ Quy Nguyên Pháp',
    'Lôi': 'Huyết Lôi Ma Kiếp Điển',
    'Băng': 'Huyết Băng Ngưng Phách Trận',
    'Phong': 'Huyết Phong Ảnh Độn Pháp'
  },
  'Đan Tông': {
    'Kim': 'Kim Đan Luyện Cốt Pháp',
    'Mộc': 'Thanh Mộc Luyện Đan Ca',
    'Thủy': 'Linh Thủy Luyện Dược Kinh',
    'Hỏa': 'Hỏa Phách Luyện Đan Thuật',
    'Thổ': 'Thần Thổ Dưỡng Thảo Quyết',
    'Lôi': 'Lôi Luyện Đan Tâm Quyết',
    'Băng': 'Hàn Đan Ngưng Linh Pháp',
    'Phong': 'Thần Phong Dẫn Dược Quyết'
  }
};

const newTechniques = [];

for (const sect of sects) {
  for (const root of roots) {
    const sId = sectIdMap[sect];
    const rId = rootIdMap[root];
    const techId = `manual_${sId}_${rId}`;
    const name = namesMap[sect][root];
    const img = `/images/sects/${rootImgMap[root]}.png`;

    // Action formula and effect based on root
    let effects = [];
    let actionName = '';
    let actionDesc = '';
    let narrativeTemplate = '';

    if (root === 'Kim') {
      actionName = '⚡ Kim Linh Trảm';
      actionDesc = 'Ngưng tụ kim tính chân khí thành kiếm mang trảm sát đối thủ.';
      narrativeTemplate = '{source.name} tụ canh kim linh lực vào đầu ngón tay, phóng ra một đạo kim mang sắc bén chém về phía {target.name}.';
      effects = [
        {
          type: 'damage',
          formula: 'self.attack * 1.25 + self.comprehension * 0.8',
          target: 'enemy',
          narrative_template: 'Đạo kim mang chém trúng {target.name}, để lại một vết thương sâu hoắm gây {amount} sát thương.'
        }
      ];
    } else if (root === 'Mộc') {
      actionName = '🌱 Mộc Linh Thuật';
      actionDesc = 'Hấp thụ sinh khí mộc hệ để phục hồi khí huyết và linh khí.';
      narrativeTemplate = '{source.name} vận chuyển mộc hệ chân khí thổ nạp sinh mệnh lực của thiên địa hồi sinh.';
      effects = [
        {
          type: 'heal',
          formula: 'self.max_hp * 0.12 + self.qi_control',
          target: 'self',
          narrative_template: 'Linh mạch toàn thân được ôn dưỡng, hồi phục {amount} sinh lực.'
        },
        {
          type: 'restore_resource',
          resource: 'qi',
          formula: 'self.comprehension * 0.6',
          target: 'self',
          narrative_template: 'Chu thiên khí huyết tuần hoàn, hồi phục {amount} linh khí.'
        }
      ];
    } else if (root === 'Thủy') {
      actionName = '💧 Thủy Lưu Chưởng';
      actionDesc = 'Vận chuyển nhu thủy chi lực hồi phục linh mạch và tấn công nhẹ.';
      narrativeTemplate = '{source.name} nhẹ nhàng đẩy ra một chưởng thủy triều nhu hòa chấn kích mục tiêu.';
      effects = [
        {
          type: 'damage',
          formula: 'self.attack * 0.8 + self.qi_control * 0.6',
          target: 'enemy',
          narrative_template: 'Thủy triều oanh kích lên thân thể {target.name}, gây {amount} sát thương.'
        },
        {
          type: 'restore_resource',
          resource: 'qi',
          formula: 'self.comprehension * 0.8',
          target: 'self',
          narrative_template: 'Lực lượng nhu thủy bổ khuyết linh mạch, phục hồi {amount} linh khí.'
        }
      ];
    } else if (root === 'Hỏa') {
      actionName = '🔥 Hỏa Diễm Ba';
      actionDesc = 'Phóng hỏa lực oanh kích thiêu đốt đối thủ dữ dội.';
      narrativeTemplate = '{source.name} kết ấn phóng ra ngọn lửa đỏ rực thiêu đốt đối thủ.';
      effects = [
        {
          type: 'damage',
          formula: 'self.attack * 1.4 + self.qi_control * 0.5',
          target: 'enemy',
          narrative_template: 'Ngọn lửa bao phủ thiêu đốt kinh mạch {target.name}, gây {amount} sát thương chí mạng.'
        }
      ];
    } else if (root === 'Thổ') {
      actionName = '🪨 Thạch Giáp Thuật';
      actionDesc = 'Hóa thổ thạch hộ thể trị thương bản thân và tăng phòng ngự.';
      narrativeTemplate = '{source.name} lẩm nhẩm thần chú, thổ hệ linh lực ngưng kết thành lớp giáp đá vững chãi.';
      effects = [
        {
          type: 'heal',
          formula: 'self.max_hp * 0.15 + self.qi_control * 0.5',
          target: 'self',
          narrative_template: 'Giáp đá bao phủ bảo vệ cơ thể, giúp phục hồi {amount} sinh lực.'
        }
      ];
    } else if (root === 'Lôi') {
      actionName = '⚡ Lôi Đình Oanh';
      actionDesc = 'Oanh kích sấm sét hung mãnh làm gián đoạn đối thủ.';
      narrativeTemplate = '{source.name} chỉ tay lên trời dẫn động một tia lôi điện uốn lượn giáng xuống.';
      effects = [
        {
          type: 'damage',
          formula: 'self.attack * 1.5',
          target: 'enemy',
          narrative_template: 'Tia sét đánh thẳng vào đỉnh đầu {target.name}, gây {amount} sát thương tê dại.'
        },
        {
          type: 'add_tension',
          formula: '6',
          target: 'self',
          narrative_template: 'Sấm sét nổ vang làm tinh thần chấn động, chiến trường thêm {amount}% căng thẳng.'
        }
      ];
    } else if (root === 'Băng') {
      actionName = '❄️ Hàn Băng Kiếp';
      actionDesc = 'Phát ra hàn khí ngưng đóng huyết mạch đối phương.';
      narrativeTemplate = '{source.name} vung tay tạo ra luồng gió tuyết thấu xương cuộn về phía đối thủ.';
      effects = [
        {
          type: 'damage',
          formula: 'self.attack * 1.0 + self.qi_control * 0.8',
          target: 'enemy',
          narrative_template: 'Hàn khí xâm nhập làm {target.name} run rẩy, chịu {amount} sát thương băng hàn.'
        }
      ];
    } else if (root === 'Phong') {
      actionName = '🌪️ Phong Nhận Pháp';
      actionDesc = 'Tạo gió sắc chém nhanh nhẹn hồi phục năng lượng bản thân.';
      narrativeTemplate = '{source.name} triệu hồi luồng cuồng phong hóa thành những lưỡi gió vô hình quét qua.';
      effects = [
        {
          type: 'damage',
          formula: 'self.attack * 1.1 + self.speed * 0.4',
          target: 'enemy',
          narrative_template: 'Lưỡi gió xé rách phòng ngự của {target.name}, gây {amount} sát thương.'
        },
        {
          type: 'restore_resource',
          resource: 'qi',
          formula: 'self.speed * 0.5',
          target: 'self',
          narrative_template: 'Thân pháp nhẹ nhàng như gió giúp hồi phục {amount} linh khí.'
        }
      ];
    }

    newTechniques.push({
      id: techId,
      label: name,
      type: 'tâm_pháp',
      tier: 'hoàng',
      fragments_required: 1,
      learning_requirements: {
        realm: 'Mortal',
        comprehension: 1,
        age: 11
      },
      description: `Tâm pháp sơ cấp của ${sect} dành cho đệ tử có ${root} Linh Căn. Giúp ổn định khí huyết, chỉ hỗ trợ tu luyện tối đa đến Luyện Khí Tầng 12 (Viên Mãn).`,
      choiceText: `Vận chuyển chu thiên ${name} hấp thu thiên địa tinh khí.`,
      is_basic_manual: true,
      sect: sect,
      spiritual_root: root,
      max_cultivation_level: 26.0,
      image: img,
      action: {
        id: `act_player_${techId}`,
        name: actionName,
        narrativeTags: [rootIdMap[root], 'calm'],
        intentType: rootIdMap[root],
        dangerRating: 4,
        costs: { qi: 4 },
        narrative_template: narrativeTemplate,
        effects: effects
      }
    });
  }
}

// Check and merge
const existingIds = new Set((config.techniques || []).map(t => t.id));
let addedCount = 0;

for (const tech of newTechniques) {
  if (!existingIds.has(tech.id)) {
    config.techniques.push(tech);
    addedCount++;
  }
}

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log(`Successfully merged ${addedCount} new basic manuals into techniques list! Total: ${config.techniques.length}`);
