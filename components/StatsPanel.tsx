import { useState } from 'react';
import type { Inheritance, Stats, TechniqueInstance, Lang, ItemInstance, WorldState, Realm } from '../types';
import { getCultivationStatus, getRealmSubStage, calculateCombatPower } from '../lib/cultivation-states';
import combatConfig from '../data/combat-config.json';
import { getNpcFavorabilityLabel, getSubStageMaxCultivation } from '../lib/engine';
import WorldNewsPanel from './WorldNewsPanel';
import { npcs } from '../data/npcs/index';

// LabelSet (Tập hợp nhãn ngôn ngữ đã dịch dùng cho hiển thị giao diện)
type LabelSet = {
  life: string; // Nhãn Kiếp (số lần luân hồi)
  run: string; // Nhãn Lần chơi (số lần bắt đầu mô phỏng lại từ đầu)
  age: string; // Nhãn Tuổi hiện tại
  realm: string; // Nhãn Cảnh giới tu vi
  health: string; // Nhãn Sức khỏe
  luck: string; // Nhãn Vận may
  comprehension: string; // Nhãn Ngộ tính
  karma: string; // Nhãn Nghiệp lực
  cultivation: string; // Nhãn Tu vi
  legacy: string; // Nhãn Tiêu đề Di sản
  legacyPower: string; // Nhãn Sức mạnh di sản thừa kế
  ancestralMemory: string; // Nhãn Ký ức tổ tiên
  blessing: string; // Nhãn Phúc lành
  lifespan: string; // Nhãn Thọ nguyên (Giới hạn tuổi thọ)
  daoHeart: string; // Nhãn Đạo tâm
  spiritualRoot: string; // Nhãn Linh căn
};

type Props = {
  stats: Stats;
  realm: string;
  rawRealm?: Realm;
  subStageIndex?: number;
  inheritance: Inheritance;
  age: number;
  life: number;
  run: number;
  labels: LabelSet;
  techniques?: TechniqueInstance[];
  language?: Lang;
  inventory?: ItemInstance[];
  onUseItem?: (index: number) => void;
  onEquipItem?: (index: number) => void;
  month?: number;
  sect?: string;
  sectContribution?: number;
  spiritStones?: number;
  sectRank?: 'ngoại_môn' | 'nội_môn' | 'chân_truyền' | 'trưởng_lão';
  sectPrestige?: number;
  onViewDetail?: (item: any) => void;
  onLearnTechnique?: (tech: TechniqueInstance) => void;
  npcFavorability?: Record<string, number>;
  worldState?: WorldState;
  currentLocation?: 'sect' | 'mountain' | 'city' | 'secret_realm';
};

export const getSectPrestigeRankName = (points: number, language: string) => {
  if (language === 'vi') {
    if (points < -50) return 'Tông Môn Phản Đồ';
    if (points < 0) return 'Kẻ Gây Họa';
    if (points < 100) return 'Mới Nhập Môn';
    if (points < 300) return 'Tiểu Hữu Danh Khí';
    if (points < 800) return 'Tông Môn Trụ Cột';
    if (points < 1500) return 'Môn Phái Kiệt Xuất';
    if (points < 3000) return 'Danh Chấn Môn Đình';
    return 'Chưởng Môn Kế Thừa';
  } else {
    if (points < -50) return 'Sect Traitor';
    if (points < 0) return 'Troublemaker';
    if (points < 100) return 'Obscure Novice';
    if (points < 300) return 'Known Disciple';
    if (points < 800) return 'Sect Pillar';
    if (points < 1500) return 'Sect Elite';
    if (points < 3000) return 'Sect Pride';
    return 'Sect Successor';
  }
};

export const getLocationName = (loc: string, sectName: string, lang: string) => {
  const labels: Record<string, { vi: string, en: string }> = {
    sect: { 
      vi: sectName ? `Tông Môn (${sectName})` : 'Tông Môn', 
      en: sectName ? `Sect (${sectName})` : 'Sect' 
    },
    city: { vi: 'Thanh Dương Thành', en: 'Thanh Duong City' },
    mountain: { vi: 'Vạn Thú Sơn Mạch', en: 'Beast Mountain Range' },
    secret_realm: { vi: 'Bí Cảnh Cổ Đại', en: 'Ancient Secret Realm' }
  };
  return labels[loc]?.[lang as 'vi' | 'en'] || labels[loc]?.vi || loc;
};

export default function StatsPanel({
  stats,
  realm,
  rawRealm,
  subStageIndex,
  inheritance,
  age,
  life,
  labels,
  techniques = [],
  language = 'vi',
  inventory = [],
  onUseItem,
  onEquipItem,
  month = 1,
  sect = '',
  sectContribution = 0,
  spiritStones = 0,
  sectRank = 'ngoại_môn',
  sectPrestige = 0,
  onViewDetail,
  onLearnTechnique,
  npcFavorability,
  worldState,
  currentLocation = 'sect',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);

  const monthsVi = ["🐀", "🐂", "🐅", "🐈", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
  const monthsEn = ["🐀", "🐂", "🐅", "🐈", "🐉", "🐍", "🐎", "🐐", "🐒", "🐓", "🐕", "🐖"];
  const monthName = language === 'vi' ? monthsVi[month - 1] : monthsEn[month - 1];

  // calculate sub-stage and dynamic combat stats
  const subStageInfo = getRealmSubStage(stats.cultivation, rawRealm, subStageIndex);
  const detailedRealm = language === 'vi' ? subStageInfo.subStageName.vi : subStageInfo.subStageName.en;

  // Calculate cultivation speed multiplier for UI display
  const playerRoot = stats.spiritualRoot || '';
  let cultMultiplier = 1.0;
  
  techniques.forEach((tech) => {
    if (tech.isActive) {
      const configTech = (combatConfig.techniques || []).find((t: any) => t.id === tech.id);
      if (configTech && configTech.type === 'tâm_pháp' && configTech.spiritual_root) {
        if (playerRoot.includes(configTech.spiritual_root)) {
          cultMultiplier += 0.10;
        }
      }
    }
  });

  const maxCultivation = getSubStageMaxCultivation(
    subStageInfo.majorRealm,
    subStageInfo.subStageIndex
  );
  const cultivationPercent = Math.min(100, Math.floor((stats.cultivation / maxCultivation) * 100));

  const equipHpBonus = inventory
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.maxHp ?? 0), 0);
  const maxHp = 20 + Math.max(0, Math.floor(inheritance.blessing / 2)) + subStageInfo.bonus.max_hp + equipHpBonus;

  const equipQiBonus = inventory
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.maxQi ?? 0), 0);
  const maxQi = 60 + subStageInfo.bonus.max_qi + equipQiBonus;

  const equipAtkBonus = inventory
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.attack ?? 0), 0);
  const attack = 15 + Math.floor(stats.cultivation * 0.4) + subStageInfo.bonus.attack + equipAtkBonus;

  const equipSpdBonus = inventory
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.speed ?? 0), 0);
  const speed = 10 + Math.floor(stats.luck * 0.2) + equipSpdBonus;

  const equipDefBonus = inventory
    .filter(item => item.category === 'equipment' && item.equipped)
    .reduce((sum, item) => sum + (item.combatStats?.defense ?? 0), 0);
  const qiControl = 10 + Math.floor(stats.daoHeart * 0.15) + equipDefBonus;

  const combatPower = calculateCombatPower(
    maxHp,
    attack,
    speed,
    qiControl,
    stats.comprehension,
    maxQi,
    subStageInfo.subStageIndex
  );

  const status = getCultivationStatus(
    stats.health,
    maxHp,
    stats.cultivation,
    maxQi,
    qiControl,
    100,
    subStageInfo.majorRealm
  );

  const renderBarDetail = (label: string, value: number, max: number, colorClass: string, icon: React.ReactNode) => {
    const width = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 text-text-secondary">
            {icon}
            {label}
          </span>
          <span className="text-text-primary font-serif">{value} / {max}</span>
        </div>
        <div className="h-2 bg-[#1a1512] border border-[#3e3328] rounded-sm overflow-hidden p-[1px]">
          <div className={`h-full rounded-[1px] ${colorClass} transition-all duration-500`} style={{ width: `${width}%` }} />
        </div>
      </div>
    );
  };

  // SVGs for stats
  const hpIcon = <svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
  const cultIcon = <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24"><path d="M2 21h20v-2H2v2zm10-18C6.48 3 2 7.48 2 13h2c0-4.41 3.59-8 8-8s8 3.59 8 8h2c0-5.52-4.48-10-10-10zm0 4c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4s4 1.79 4 4h2c0-3.31-2.69-6-6-6zm0 4c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"/></svg>;
  const luckIcon = <svg className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192L12 .587z"/></svg>;
  const karmaIcon = <svg className="w-3.5 h-3.5 text-purple-400 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
  const compIcon = <svg className="w-3.5 h-3.5 text-emerald-400 fill-current" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.22 19.58 10.57 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>;
  
  // Icon biểu tượng mới cho Đạo Tâm và Linh Căn
  const daoHeartIcon = <span className="text-[12px] text-indigo-400">☯</span>;
  const rootIcon = <span className="text-[12px] text-amber-500">🌱</span>;

  return (
    <>
      {/* 🌸 Chibi Xianxia Scroll HUD (Stitch Design - Adjusted) */}
      <div className="w-full max-w-3xl mx-auto px-4 py-2 mt-2 select-none relative z-50">
        <div className="relative w-full">
          {/* Top Roller */}
          <div 
            className="mb-[-8px] z-10 mx-2 relative rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
            style={{ 
              height: '18px', 
              background: 'linear-gradient(to right, #735c00, #ffe088, #735c00)'
            }}
          >
            <div className="absolute top-1/2 left-[5%] right-[5%] h-[1px] bg-white/40 -translate-y-1/2" />
          </div>

          {/* Parchment Surface */}
          <div 
            className="w-full rounded shadow-2xl p-4 sm:p-5 border-x-4 border-[#f0e2ba] relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.95), rgba(255, 248, 240, 0.95)), url('https://www.transparenttextures.com/patterns/parchment.png')`
            }}
          >
            <div className="flex gap-4 sm:gap-6 items-center w-full">
              
              {/* Avatar Column */}
              <button 
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative flex flex-col items-center shrink-0 hover:scale-105 transition-transform pb-2"
              >
                {/* Qi Animation Ring */}
                <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#7ed99e]/40 -top-2 animate-[pulse_3s_infinite_ease-in-out] blur-md" />
                
                {/* Avatar Frame */}
                <div 
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#f0e2ba] z-10 border-[3px] border-[#d4af37]"
                  style={{ boxShadow: '0 0 15px #7ed99e, inset 0 0 8px #006d3d' }}
                >
                  <img
                    src="/images/avatar.png"
                    alt="Avatar"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                
                {/* Realm Pill */}
                <div className="absolute -bottom-1 px-3 py-1 bg-gradient-to-r from-[#735c00] to-[#b38f00] text-white rounded-full text-[10px] sm:text-xs shadow-md z-20 whitespace-nowrap font-serif font-bold uppercase tracking-widest border-2 border-[#f0e2ba]">
                  {detailedRealm}
                </div>
              </button>

              {/* Compact Bars & Grid Column */}
              <div className="flex-grow flex flex-col gap-3 justify-center">
                
                {/* Bars Row */}
                <div className="flex flex-col gap-2 mt-1">
                  {/* HP */}
                  <div className="flex items-center gap-3">
                    <span className="text-[#ba1a1a] font-bold text-sm sm:text-base w-6 text-center font-serif drop-shadow-sm">血</span>
                    <div className="flex-grow h-4 sm:h-5 bg-[#e8d9b2] rounded-full border border-[#d4af37]/50 relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ba1a1a] via-[#e53935] to-[#ff968c] transition-all duration-500 shadow-[0_0_8px_rgba(186,26,26,0.5)]"
                        style={{ width: `${Math.min(100, Math.max(0, Math.round((stats.health / maxHp) * 100)))}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-[#383015] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] font-serif tracking-wider">
                        {stats.health} / {maxHp}
                      </div>
                    </div>
                  </div>
                  
                  {/* MP */}
                  <div className="flex items-center gap-3">
                    <span className="text-[#006d3d] font-bold text-sm sm:text-base w-6 text-center font-serif drop-shadow-sm">氣</span>
                    <div className="flex-grow h-4 sm:h-5 bg-[#e8d9b2] rounded-full border border-[#d4af37]/50 relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#006d3d] via-[#2e7d32] to-[#7ed99e] transition-all duration-500 shadow-[0_0_8px_rgba(0,109,61,0.5)]"
                        style={{ width: `${stats.health <= 0 ? 0 : 40}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-[#383015] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] font-serif tracking-wider">
                        {stats.health <= 0 ? 0 : Math.round(maxQi * 0.4)} / {maxQi}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tiny Stats Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#d4af37]/30">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-xs sm:text-sm drop-shadow-sm">⚔️</span>
                    <span className="text-[10px] sm:text-xs font-bold text-[#735c00] font-serif">{combatPower}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 border-l border-[#d4af37]/30">
                    <span className="text-xs sm:text-sm drop-shadow-sm">🌟</span>
                    <span className="text-[10px] sm:text-xs font-bold text-[#006d3d] font-serif">{cultivationPercent}%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 border-l border-[#d4af37]/30">
                    <span className="text-xs sm:text-sm drop-shadow-sm">🌸</span>
                    <span className="text-[10px] sm:text-xs font-bold text-[#b52424] font-serif truncate max-w-[80px]" title={sect || 'Tán Tu'}>
                      {sect ? sect : 'Tán Tu'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 border-l border-[#d4af37]/30">
                    <span className="text-xs sm:text-sm drop-shadow-sm">💰</span>
                    <span className="text-[10px] sm:text-xs font-bold text-[#d4af37] font-serif drop-shadow-sm">{spiritStones}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick News Button */}
            <button
              onClick={() => setIsNewsOpen(true)}
              className="absolute -right-2 -top-2 bg-gradient-to-br from-[#ffe088] to-[#d4af37] text-[#554300] rounded-full w-8 h-8 flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform z-30 border-2 border-[#735c00]"
              title="Tin Tức"
            >
              <span className="text-sm">📜</span>
            </button>
            
          </div>

          {/* Bottom Roller */}
          <div 
            className="mt-[-8px] z-10 mx-2 relative rounded-full shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
            style={{ 
              height: '18px', 
              background: 'linear-gradient(to right, #735c00, #ffe088, #735c00)'
            }}
          >
            <div className="absolute top-1/2 left-[5%] right-[5%] h-[1px] bg-white/40 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Profile Detail Sheet (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Backdrop Click */}
          <button type="button" className="absolute inset-0 cursor-default focus:outline-none" onClick={() => setIsOpen(false)} aria-label="Close modal" />

          {/* Modal Container */}
          <div className="adventure-card w-full max-w-md p-6 relative z-10 animate-slide-up">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white text-xl font-serif focus:outline-none"
            >
              ✕
            </button>

            {/* Profile Content */}
            <div className="text-center space-y-4 mb-6">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-[#c5a059] bg-[#1a1512] shadow-lg">
                <img src="/images/avatar.png" alt="Cultivator Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-text-secondary font-medium">{labels.realm}</p>
                <h3 className="font-serif text-2xl text-[#e5c17b] tracking-wider">{detailedRealm}</h3>
                <div className="flex justify-center items-center gap-1.5 pt-0.5">
                  <span className="text-xs text-text-secondary font-serif">Chiến Lực:</span>
                  <span className="text-sm text-[#e5c17b] font-serif font-bold">{combatPower} CP</span>
                </div>
              </div>
              <div className="inline-flex justify-center gap-6 px-4 py-1.5 border border-[#3e3328] bg-[#14110f]/80 text-xs text-text-secondary rounded-sm">
                <span>{labels.life}: <strong className="text-text-primary font-serif">{life}</strong></span>
                <span>{labels.age}: <strong className="text-text-primary font-serif">{age} ({monthName}) / {stats.lifespan}</strong></span>
              </div>
            </div>

            {/* Core Stats Progress Bars */}
            <div className="space-y-4 mb-6 border-t border-b border-[#3e3328] py-4">
              <h4 className="text-xs uppercase tracking-wider text-[#c5a059] font-semibold mb-3 font-serif">Thuộc Tính Bản Thể</h4>
              <div className="grid grid-cols-1 gap-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      {hpIcon}
                      {status.hpLabel}
                    </span>
                    <span className="text-red-400 font-serif font-medium">{status.hpText}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      {cultIcon}
                      {status.qiLabel}
                    </span>
                    <span className="text-blue-400 font-serif font-medium">{status.qiText}</span>
                  </div>
                </div>
                {renderBarDetail(
                  labels.cultivation,
                  stats.cultivation,
                  maxCultivation,
                  "bg-gradient-to-r from-blue-700 to-blue-400",
                  cultIcon
                )}
                {renderBarDetail(labels.luck, stats.luck, 20, "bg-gradient-to-r from-yellow-700 to-yellow-500", luckIcon)}
                {renderBarDetail(labels.comprehension, stats.comprehension, 20, "bg-gradient-to-r from-emerald-800 to-emerald-600", compIcon)}
                {renderBarDetail(labels.karma, stats.karma + 10, 30, "bg-gradient-to-r from-purple-800 to-purple-500", karmaIcon)}
                {renderBarDetail(labels.daoHeart, stats.daoHeart, 100, "bg-gradient-to-r from-indigo-800 to-indigo-500", daoHeartIcon)}
                
                {/* Dòng hiển thị thông tin Linh Căn */}
                <div className="flex items-center justify-between text-xs font-medium pt-2.5 border-t border-[#3e3328]/45 mt-2.5">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    {rootIcon}
                    {labels.spiritualRoot}
                  </span>
                  <span className="text-[#e5c17b] font-serif font-semibold">{stats.spiritualRoot}</span>
                </div>

                {cultMultiplier > 1.0 && (
                  <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#3e3328]/30">
                    <span className="flex items-center gap-1.5 text-[#e5c17b] font-medium">
                      ⚡ {language === 'vi' ? 'Tốc độ tu luyện:' : 'Cultivation Speed:'}
                    </span>
                    <span className="text-[#38bdf8] font-serif font-bold">
                      +{Math.round((cultMultiplier - 1.0) * 100)}%
                    </span>
                  </div>
                )}

                {/* Dòng hiển thị Vị Trí Hiện Tại */}
                <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#3e3328]/30">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    📍 {language === 'vi' ? 'Vị Trí Hiện Tại' : 'Current Location'}
                  </span>
                  <span className="text-emerald-400 font-serif font-semibold">
                    {getLocationName(currentLocation, sect, language)}
                  </span>
                </div>

                {/* Dòng hiển thị Linh Thạch & Cống Hiến */}
                <button
                  type="button"
                  onClick={() => {
                    if (onViewDetail) {
                      onViewDetail({
                        type: 'currency',
                        title: language === 'vi' ? 'Hạ Phẩm Linh Thạch' : 'Low-Grade Spirit Stones',
                        description: language === 'vi'
                          ? 'Đá linh khí có phẩm cấp thấp, chứa linh khí thiên địa tinh thuần, dùng làm tiền tệ giao dịch và xúc tiến tu luyện.'
                          : 'A low-grade stone containing pure ambient spiritual energy. It serves as standard currency and resource for cultivation burning.',
                        icon: '💎',
                        details: [
                          `${language === 'vi' ? 'Sở hữu' : 'Owned'}: ${spiritStones}x`,
                          `${language === 'vi' ? 'Loại' : 'Category'}: ${language === 'vi' ? 'Tiền tệ / Tài nguyên' : 'Currency / Resource'}`
                        ]
                      });
                    }
                  }}
                  className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#3e3328]/30 w-full text-left transition hover:text-[#e5c17b] cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    💎 {language === 'vi' ? 'Linh Thạch (Xem chi tiết)' : 'Spirit Stones (View Details)'}
                  </span>
                  <span className="text-amber-400 font-serif font-semibold">{spiritStones}</span>
                </button>
                {sect && (
                  <>
                    <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#3e3328]/30">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        ⚔️ {language === 'vi' ? 'Tông Môn' : 'Sect'}
                      </span>
                      <span className="text-purple-400 font-serif font-semibold">
                        {sect}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#3e3328]/30">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        🛡️ {language === 'vi' ? 'Danh Vị & Cống Hiến' : 'Rank & Contribution'}
                      </span>
                      <span className="text-purple-400 font-serif font-semibold">
                        {sectContribution} ({
                          sectRank === 'ngoại_môn' ? (language === 'vi' ? 'Đệ Tử Ngoại Môn' : 'Outer Disciple') :
                          sectRank === 'nội_môn' ? (language === 'vi' ? 'Đệ Tử Nội Môn' : 'Inner Disciple') :
                          sectRank === 'chân_truyền' ? (language === 'vi' ? 'Đệ Tử Chân Truyền' : 'Core Disciple') :
                          (language === 'vi' ? 'Trưởng Lão Tông Môn' : 'Sect Elder')
                        })
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-[#3e3328]/30">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        🏆 {language === 'vi' ? 'Uy Vọng Tông Môn' : 'Sect Prestige'}
                      </span>
                      <span className="text-[#e5c17b] font-serif font-semibold">
                        {getSectPrestigeRankName(sectPrestige, language)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Nhân Mạch Quan Hệ / Relationship Matrix */}
            <div className="space-y-3 mb-6 border-b border-[#3e3328]/45 pb-4">
              <h4 className="text-xs uppercase tracking-wider text-[#c5a059] font-semibold font-serif text-left">
                {language === 'vi' ? 'Nhân Mạch Quan Hệ' : 'Relationship Matrix'}
              </h4>
              
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {[
                  { id: 'npc_kiem_tong_chap_su', name: 'Tạ Trần', sect: 'Kiếm Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '👨‍💼' },
                  { id: 'npc_kiem_tong_ta_tieu', name: 'Tạ Tiêu', sect: 'Kiếm Tông', role: language === 'vi' ? 'Đệ tử (Cháu Chấp sự)' : 'Disciple (Deacon\'s Nephew)', avatar: '🧑‍🎤' },
                  { id: 'npc_dan_tong_chap_su', name: 'Linh Dương', sect: 'Đan Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '👨‍🔬' },
                  { id: 'npc_ma_dao_chap_su', name: 'Khấu Vô Kỵ', sect: 'Ma Đạo', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '😈' },
                  { id: 'npc_huyet_tong_chap_su', name: 'Xích Liệt', sect: 'Huyết Tông', role: language === 'vi' ? 'Chấp sự Ngoại môn' : 'Outer Deacon', avatar: '🧛' },
                  ...npcs.map(n => ({
                    id: n.id,
                    name: n.name,
                    sect: n.sect || '',
                    role: language === 'vi' ? n.role?.vi || '' : n.role?.en || '',
                    avatar: n.avatar || '👤'
                  }))
                ].map((npc) => {
                  const val = npcFavorability?.[npc.id] ?? 0;
                  const grudge = inheritance?.npc_grudges?.[npc.id] ?? 0;
                  const label = getNpcFavorabilityLabel(val);
                  
                  // Progress bar calculation (-100 to 100 map to 0% to 100%)
                  const pct = Math.min(100, Math.max(0, Math.round((val + 100) / 2)));
                  
                  // Harmonious color tags and glow
                  let textColor = 'text-text-secondary';
                  let barColor = 'bg-neutral-600';
                  if (val >= 60) {
                    textColor = 'text-emerald-400';
                    barColor = 'bg-emerald-500';
                  } else if (val >= 20) {
                    textColor = 'text-[#e5c17b]';
                    barColor = 'bg-[#c5a059]';
                  } else if (val <= -60) {
                    textColor = 'text-red-400';
                    barColor = 'bg-red-600';
                  } else if (val <= -20) {
                    textColor = 'text-orange-400';
                    barColor = 'bg-orange-500';
                  }

                  return (
                    <div 
                      key={npc.id} 
                      className="bg-[#14110f]/60 border border-[#3e3328]/60 p-2 rounded-sm flex flex-col gap-1.5 w-full text-left"
                    >
                      <div className="flex items-center justify-between text-xs w-full">
                        <span className="font-serif font-semibold text-text-primary flex items-center gap-1.5">
                          <span className="text-sm">{npc.avatar}</span>
                          <span>{npc.name}</span>
                          <span className="text-[9px] text-text-tertiary font-sans font-normal uppercase tracking-wider">
                            ({npc.sect})
                          </span>
                        </span>
                        
                        <span className={`font-serif text-[11px] font-medium ${textColor}`}>
                          {label} ({val > 0 ? `+${val}` : val})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-text-tertiary w-full">
                        <span>{npc.role}</span>
                        <div className="flex gap-2 text-right">
                          {grudge > 0 && <span className="text-red-500 font-serif">🔥 Thù hận: {grudge}</span>}
                          {npc.id === 'npc_kiem_tong_ta_tieu' && (
                            <span className="text-amber-500/70 font-serif">🔗 Bác cháu liên đới</span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar with center alignment */}
                      <div className="relative h-1.5 bg-[#1a1512] border border-[#3e3328]/50 rounded-full overflow-hidden mt-0.5">
                        {/* Center marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#3e3328] z-10" />
                        {/* Fill bar */}
                        <div 
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Công Pháp Đang Có / Owned Techniques */}
            <div className="space-y-3 mb-6 border-b border-[#3e3328]/45 pb-4">
              <h4 className="text-xs uppercase tracking-wider text-[#c5a059] font-semibold font-serif text-left">
                {language === 'vi' ? 'Công Pháp Đang Có' : 'Owned Techniques'}
              </h4>
              
              {(!techniques || techniques.length === 0) ? (
                <p className="text-xs text-text-tertiary italic text-left">
                  {language === 'vi' ? 'Chưa sở hữu công pháp nào.' : 'No techniques owned yet.'}
                </p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {techniques.map((tech) => {
                    const typeIcon = tech.type === 'tâm_pháp' ? '📖' : tech.type === 'vũ_kỹ' ? '⚔️' : tech.type === 'thân_pháp' ? '⚡' : '🔮';
                    const completenessLabel = tech.completeness.replace('_', ' ');
                    
                    const tierColors: Record<string, string> = {
                      'hoàng': 'text-gray-400 border-gray-400/30',
                      'huyền': 'text-emerald-400 border-emerald-400/30',
                      'địa': 'text-blue-400 border-blue-400/30',
                      'thiên': 'text-purple-400 border-purple-400/30',
                      'thánh': 'text-yellow-500 border-yellow-500/30',
                      'tiên': 'text-cyan-400 border-cyan-400/30',
                      'đế': 'text-red-500 border-red-500/30',
                      'đạo': 'text-indigo-400 border-indigo-400/30'
                    };
                    const tierColor = tierColors[tech.tier] || 'text-text-primary border-text-primary/30';
                    
                    const configTech = (combatConfig.techniques || []).find((t: any) => t.id === tech.id);
                    const reqs = configTech?.learning_requirements;
                    
                    return (
                      <button 
                        type="button"
                        onClick={() => {
                          if (onViewDetail) {
                            onViewDetail({
                              type: 'manual',
                              title: tech.name,
                              description: configTech?.description || tech.name,
                              image: configTech?.image,
                              details: [
                                `${language === 'vi' ? 'Phẩm cấp' : 'Grade'}: ${tech.tier.toUpperCase()}`,
                                `${language === 'vi' ? 'Loại' : 'Type'}: ${tech.type === 'tâm_pháp' ? (language === 'vi' ? 'Tâm Pháp' : 'Mind Manual') : (language === 'vi' ? 'Vũ Kỹ' : 'Martial Skill')}`,
                                `${language === 'vi' ? 'Thuộc tính linh căn' : 'Spiritual Root'}: ${configTech?.spiritual_root || (language === 'vi' ? 'Bản Thể' : 'All')}`,
                                `${language === 'vi' ? 'Trạng thái' : 'Status'}: ${tech.isActive ? (language === 'vi' ? 'Đã kích hoạt' : 'Active') : (language === 'vi' ? 'Chưa kích hoạt' : 'Locked')}`,
                                `${language === 'vi' ? 'Độ hoàn chỉnh' : 'Completeness'}: ${completenessLabel.toUpperCase()}`
                              ]
                            });
                          }
                        }}
                        key={tech.id} 
                        className={`bg-[#14110f]/60 border border-[#3e3328]/60 p-2.5 rounded-sm flex flex-col gap-1 w-full text-left transition hover:border-[#c5a059] cursor-pointer ${!tech.isActive ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between text-xs w-full">
                          <span className="font-serif font-semibold text-[#e5c17b] flex items-center gap-1.5">
                            <span>{typeIcon}</span>
                            {tech.name}
                            <span className={`text-[9px] uppercase font-sans font-normal border px-1 rounded-sm scale-90 ${tierColor}`}>
                              {tech.tier}
                            </span>
                          </span>
                          
                          <span className={`font-serif text-[11px] ${tech.isActive ? 'text-emerald-400' : 'text-amber-500/80 font-bold'}`}>
                            {tech.isActive 
                              ? (language === 'vi' ? 'Đang hoạt động' : 'Active') 
                              : (language === 'vi' ? 'Chưa thức tỉnh' : 'Locked')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-text-secondary w-full">
                          <span className="text-left">
                            {language === 'vi' ? 'Độ hoàn chỉnh: ' : 'Completeness: '}
                            <strong className="text-text-primary font-serif uppercase">{completenessLabel}</strong>
                          </span>
                          {tech.completeness !== 'viên_mãn' && (
                            <span>{tech.fragmentsCollected} / {tech.fragmentsRequired} {language === 'vi' ? 'mảnh' : 'shards'}</span>
                          )}
                        </div>
 
                        {!tech.isActive && (
                          <div className="mt-2 pt-1 border-t border-[#3e3328]/35 w-full">
                            {(() => {
                              const realmTiers: Record<string, number> = { 'Mortal': 0, 'Qi Refinement': 1, 'Foundation Establishment': 2, 'Golden Core': 3, 'Nascent Soul': 4, 'Soul Formation': 5, 'Void Amalgamation': 6, 'Body Integration': 7, 'Mahayana': 8, 'Tribulation': 9, 'True Immortal': 10 };
                              const reqRealmTier = reqs?.realm ? realmTiers[reqs.realm] ?? 0 : 0;
                              const currRealmTier = realmTiers[rawRealm || 'Mortal'] ?? 0;
                              const realmOk = currRealmTier >= reqRealmTier;
                              const compOk = stats.comprehension >= (reqs?.comprehension ?? 0);
                              const ageOk = age >= (reqs?.age ?? 0);

                              if (realmOk && compOk && ageOk) {
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onLearnTechnique && onLearnTechnique(tech); }}
                                    className="w-full px-2 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/40 border border-[#c5a059]/50 text-[#e5c17b] rounded-sm text-xs font-serif uppercase tracking-widest transition"
                                  >
                                    {language === 'vi' ? '⚔️ Tiến Hành Nhập Môn' : '⚔️ Begin Cultivation'}
                                  </button>
                                );
                              }

                              return (
                                <div className="text-[10px] text-amber-500/80 text-left">
                                  {language === 'vi' ? 'Yêu cầu nhập môn: ' : 'Requirements: '}
                                  {reqs?.realm && `${reqs.realm === 'Qi Refinement' ? 'Luyện Khí' : reqs.realm === 'Foundation Establishment' ? 'Trúc Cơ' : reqs.realm === 'Golden Core' ? 'Kim Đan' : 'Phàm Nhân'}`}
                                  {reqs?.comprehension && ` • Ngộ tính ${reqs.comprehension}`}
                                  {reqs?.age && ` • Tuổi ${reqs.age}`}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Túi Trữ Vật / Inventory */}
            <div className="space-y-3 mb-6 border-b border-[#3e3328]/45 pb-4">
              <h4 className="text-xs uppercase tracking-wider text-[#c5a059] font-semibold font-serif text-left">
                {language === 'vi' ? 'Túi Trữ Vật' : 'Inventory Bag'}
              </h4>
              
              {(!inventory || inventory.length === 0) ? (
                <p className="text-xs text-text-tertiary italic text-left">
                  {language === 'vi' ? 'Hành trang trống không.' : 'Your inventory bag is empty.'}
                </p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {inventory.map((item, idx) => {
                    const categoryColors: Record<string, string> = {
                      'hoàng': 'text-gray-400 border-gray-400/20',
                      'huyền': 'text-emerald-400 border-emerald-400/20',
                      'địa': 'text-blue-400 border-blue-400/20',
                      'thiên': 'text-purple-400 border-purple-400/20',
                      'thánh': 'text-yellow-500 border-yellow-500/20',
                      'tiên': 'text-cyan-400 border-cyan-400/20',
                      'đế': 'text-red-500 border-red-500/20',
                      'đạo': 'text-indigo-400 border-indigo-400/20'
                    };
                    const tierColor = categoryColors[item.tier] || 'text-text-primary border-text-primary/20';
                    
                    const isConsumable = ['consumable', 'relic'].includes(item.category);
                    const isEquipment = item.category === 'equipment';

                    let itemIcon = '📦';
                    if (item.type === 'elixir') itemIcon = '🧪';
                    else if (item.type === 'secret_medicine') itemIcon = '☠️';
                    else if (item.type === 'weapon') itemIcon = '⚔️';
                    else if (item.type === 'armor') itemIcon = '🛡️';
                    else if (item.type === 'relic') itemIcon = '🔮';
                    
                    return (
                      <button 
                        type="button"
                        onClick={() => {
                          if (onViewDetail) {
                            onViewDetail({
                              type: 'item',
                              title: item.name,
                              description: item.description,
                              icon: itemIcon,
                              details: [
                                `${language === 'vi' ? 'Phẩm cấp' : 'Grade'}: ${item.tier.toUpperCase()}`,
                                `${language === 'vi' ? 'Phân loại' : 'Category'}: ${item.category.toUpperCase()}`,
                                `${language === 'vi' ? 'Số lượng' : 'Quantity'}: ${item.quantity}`
                              ]
                            });
                          }
                        }}
                        key={`${item.id}-${idx}`} 
                        className="bg-[#14110f]/60 border border-[#3e3328]/60 p-2.5 rounded-sm flex flex-col gap-1.5 w-full text-left transition hover:border-[#c5a059] cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs w-full">
                          <span className="font-serif font-semibold text-[#e5c17b] flex items-center gap-1.5 text-left">
                            <span>{itemIcon}</span>
                            {item.name}
                            {item.quantity > 1 && <span className="text-text-secondary text-[10px]">x{item.quantity}</span>}
                            <span className={`text-[9px] uppercase font-sans font-normal border px-1 rounded-sm scale-90 ${tierColor}`}>
                              {item.tier}
                            </span>
                          </span>
                          
                          <div className="flex gap-2">
                            {isConsumable && onUseItem && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUseItem(idx);
                                }}
                                className="px-2 py-0.5 border border-[#c5a059] bg-[#1e1915] text-[#e5c17b] hover:bg-[#28211b] text-[10px] rounded-sm transition font-serif"
                              >
                                {language === 'vi' ? 'Sử dụng' : 'Use'}
                              </button>
                            )}
                            {isEquipment && onEquipItem && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEquipItem(idx);
                                }}
                                className={`px-2 py-0.5 border text-[10px] rounded-sm transition font-serif ${
                                  item.equipped
                                    ? 'border-[#5c7f55] bg-[#5c7f55]/20 text-[#5c7f55]'
                                    : 'border-[#3e3328] bg-black/40 text-text-secondary hover:text-white'
                                }`}
                              >
                                {item.equipped 
                                  ? (language === 'vi' ? 'Đang trang bị' : 'Equipped') 
                                  : (language === 'vi' ? 'Trang bị' : 'Equip')}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-text-secondary text-left leading-relaxed w-full">
                          {item.description}
                        </p>
                        
                        {item.soulbound && (
                          <div className="text-[8px] text-indigo-400 font-sans tracking-wider uppercase text-left w-full">
                            ✨ {language === 'vi' ? 'Liên Kết Linh Hồn' : 'Soulbound'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legacy & Inheritance */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-[#c5a059] font-semibold font-serif text-left">Di Sản Tích Lũy</h4>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#14110f] border border-[#3e3328] p-2 text-center rounded-sm">
                  <p className="text-[9px] uppercase tracking-wider text-text-secondary truncate">{labels.legacyPower}</p>
                  <p className="font-serif text-base text-[#e5c17b] mt-1">{inheritance.legacyPower}</p>
                </div>
                <div className="bg-[#14110f] border border-[#3e3328] p-2 text-center rounded-sm">
                  <p className="text-[9px] uppercase tracking-wider text-text-secondary truncate">{labels.ancestralMemory}</p>
                  <p className="font-serif text-base text-[#e5c17b] mt-1">{inheritance.ancestralMemory}</p>
                </div>
                <div className="bg-[#14110f] border border-[#3e3328] p-2 text-center rounded-sm">
                  <p className="text-[9px] uppercase tracking-wider text-text-secondary truncate">{labels.blessing}</p>
                  <p className="font-serif text-base text-[#e5c17b] mt-1">{inheritance.blessing}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WorldNewsPanel
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        worldState={worldState}
        gameMonth={month}
        realm={realm}
        language={language}
      />
    </>
  );
}
