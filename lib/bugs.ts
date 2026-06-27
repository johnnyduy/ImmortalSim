import type { SpiritBugSpecies } from '../types';

export const BUG_SPECIES: SpiritBugSpecies[] = [
  {
    id: 'linh_diep',
    name: 'Linh Điệp',
    description: 'Bướm linh khí bay lượn trong dược viên, cánh phát sáng huyền ảo.',
    element: 'Mộc',
    baseLifespan: 24, // 2 years
    baseComprehension: 15,
    cultivationBonus: 5, // +5% comprehension during cultivation
  },
  {
    id: 'linh_phong',
    name: 'Linh Phong',
    description: 'Ong linh khí chuyên đi thụ phấn linh dược, chăm chỉ và có tổ chức.',
    element: 'Kim',
    baseLifespan: 12,
    baseComprehension: 5,
    herbBonus: 'Tăng tốc độ sinh trưởng linh dược 10%',
    baseProduceInterval: 6,
    producesItemId: 'mat_linh_phong', // item for alchemy
  },
  {
    id: 'kim_tam',
    name: 'Kim Tằm',
    description: 'Tằm ngậm kim hành chi lực, nhả ra tơ vàng vô cùng dẻo dai.',
    element: 'Kim',
    baseLifespan: 36,
    baseComprehension: 2,
    baseProduceInterval: 4,
    producesItemId: 'linh_to_kim_tam',
  },
  {
    id: 'huynh_trung',
    name: 'Huỳnh Trùng',
    description: 'Một loại đom đóm tụ tập lại có thể thắp sáng cả một góc động phủ, giảm tiêu hao linh khí.',
    element: 'Hỏa',
    baseLifespan: 6,
    baseComprehension: 10,
    cultivationBonus: 2, // Reduce qi drain
  },
  {
    id: 'doc_chu',
    name: 'Độc Chu',
    description: 'Nhện kịch độc thường ẩn náu nơi râm mát. Nọc của chúng dùng để luyện độc đan.',
    element: 'Âm',
    baseLifespan: 48,
    baseComprehension: 8,
    baseProduceInterval: 8,
    producesItemId: 'noc_doc_chu',
  },
  {
    id: 'am_minh_trung',
    name: 'Âm Minh Trùng',
    description: 'Sinh ra từ sát khí, cực kỳ nhạy bén với thiên địa bảo tài nơi cấm địa.',
    element: 'Âm',
    baseLifespan: 60,
    baseComprehension: 20,
    explorationBonus: 'Gia tăng 30% tỷ lệ tìm thấy kỳ vật',
  },
  {
    id: 'thiet_giap_trung',
    name: 'Thiết Giáp Trùng',
    description: 'Bọ cánh cứng to bằng nắm tay, lớp vỏ như tinh thiết.',
    element: 'Thổ',
    baseLifespan: 120, // 10 years
    baseComprehension: 1,
    explorationBonus: 'Sống sót cực tốt trong bí cảnh',
  }
];

export const BUG_RARITIES = [
  'Phàm', 'Linh', 'Huyền', 'Địa', 'Thiên', 'Tiên', 'Cổ', 'Thần'
];

export const BUG_STAGES = [
  'Ấu Trùng', 'Trưởng Thành', 'Linh Chủ', 'Trùng Vương', 'Trùng Hoàng', 'Trùng Đế'
];

export const BUG_PERSONALITIES = [
  'Ưa Nước', 'Thích Tĩnh Lặng', 'Tham Linh Khí', 'Khát Máu', 'Lười Biếng', 'Chăm Chỉ'
];
