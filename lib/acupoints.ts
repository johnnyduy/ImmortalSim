export interface Acupoint {
  id: string;
  name: string;
}

export const ACUPOINTS: Acupoint[] = [
  { id: "dantian", name: "Đan Điền" },
  { id: "qihai", name: "Khí Hải" },
  { id: "mingmen", name: "Mệnh Môn" },
  { id: "lingtai", name: "Linh Đài" },
  { id: "zifu", name: "Tử Phủ" },
  { id: "baihui", name: "Bách Hội" },
  { id: "shenque", name: "Thần Khuyết" },
  { id: "yongquan", name: "Dũng Tuyền" },
  { id: "laogong", name: "Lao Cung" },
  { id: "tianchuang", name: "Thiên Song" },
  { id: "jianjing", name: "Kiên Tỉnh" },
  { id: "shenmen", name: "Thần Môn" },
  { id: "qimen", name: "Kỳ Môn" },
  { id: "taichong", name: "Thái Xung" },
  { id: "zusanli", name: "Túc Tam Lý" }
];

// Simple deterministic hash based on a string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Pseudo-random generator (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function generateCultivationPath(tier: string, seed: string): Acupoint[] {
  const rng = mulberry32(hashCode(seed + "path_seed_v1"));
  
  const tierRanges: Record<string, [number, number]> = {
    'hoàng': [3, 4],
    'huyền': [5, 6],
    'địa': [7, 9],
    'thiên': [10, 12],
    'thánh': [12, 15],
    'tiên': [12, 15],
    'đế': [12, 15],
    'đạo': [12, 15],
  };

  const range = tierRanges[tier.toLowerCase()] || [3, 4];
  const deterministicCount = range[0] + Math.floor(rng() * (range[1] - range[0] + 1));

  const available = [...ACUPOINTS];
  const result: Acupoint[] = [];

  for (let i = 0; i < deterministicCount; i++) {
    if (available.length === 0) break;
    const index = Math.floor(rng() * available.length);
    result.push(available[index]);
    // Optionally remove if we don't want duplicate acupoints in a path
    available.splice(index, 1);
  }

  return result;
}
