'use client';

import React from 'react';
import type { WorldState, Lang } from '../types';

export type NewsRule = {
  id: string;
  category: 'anomaly' | 'conflict' | 'market';
  icon: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  check: (w: WorldState) => boolean;
};

// Dynamic news rules that map world variables to story events
export const NEWS_RULES: NewsRule[] = [
  {
    id: 'dao_fluctuation',
    category: 'anomaly',
    icon: '✨',
    title: { vi: 'THIÊN ĐẠO CHẤN ĐỘNG', en: 'DAO FLUCTUATION' },
    description: {
      vi: 'Năng lượng thiêng liêng ở mức báo động! Cơ duyên phi thường đang đến gần. Bí cảnh có thể khai mở!',
      en: 'Divine energy at critical level! Extraordinary opportunities approach. Secret realms may open!'
    },
    check: (w) => w.global?.daoFluctuation > 65
  },
  {
    id: 'demonic_activity',
    category: 'anomaly',
    icon: '💀',
    title: { vi: 'MA TU HOẠT ĐỘNG MẠNH', en: 'DEMONIC ACTIVITY' },
    description: {
      vi: 'Tà tu xuất hiện tại trấn! Người chơi tránh đi xa. Thị trường an ninh giảm.',
      en: 'Evil cultivators spotted in town! Travel with caution. Market security reduced.'
    },
    check: (w) => w.demonic?.activity > 60
  },
  {
    id: 'beast_surge',
    category: 'anomaly',
    icon: '🐾',
    title: { vi: 'THÚ TRIỀU DÂNG CAO', en: 'BEAST SURGE' },
    description: {
      vi: 'Yêu thú bộc phát dữ dội tại Sơn mạch! Nguy hiểm sơn mạch gia tăng, tránh đi thám hiểm dã ngoại.',
      en: 'Beast activity surging in the Mountains! Mountain danger elevated, avoid wilderness exploration.'
    },
    check: (w) => w.mountain?.beastActivity > 75
  },
  {
    id: 'sect_war',
    category: 'conflict',
    icon: '💥',
    title: { vi: 'CHIẾN TRANH TÔNG MÔN BÙNG NỔ', en: 'SECT WARFARE BURSTS' },
    description: {
      vi: 'Vạn Tiên Giáo chính thức tuyên chiến với Thiên Đạo Tông! Mọi đệ tử phải sẵn sàng tinh thần ra trận.',
      en: 'Wanxian Cult officially declares war on Tiandao Sect! All disciples must prepare for combat.'
    },
    check: (w) => w.sect?.warLevel >= 75
  },
  {
    id: 'sect_instability',
    category: 'conflict',
    icon: '⚡',
    title: { vi: 'NỘI BỘ BẤT ỔN', en: 'INTERNAL INSTABILITY' },
    description: {
      vi: 'Chấp sự tông môn bị ám sát, đấu đá phe phái! Nguy hiểm tông môn, rủi ro cao.',
      en: 'Sect deacons assassinated, faction wars! Internal danger and risks elevated.'
    },
    check: (w) => w.sect?.stability < 30
  },
  {
    id: 'price_inflation',
    category: 'market',
    icon: '📈',
    title: { vi: 'GIÁ LINH DƯỢC LEO THANG', en: 'INFLATED PRICES' },
    description: {
      vi: 'Khan hiếm hàng hóa! Người chơi có thể cân nhắc đầu cơ giá linh thảo.',
      en: 'Scarcity of goods! Players should consider speculating on spiritual herb prices.'
    },
    check: (w) => w.city?.priceIndex > 140
  },
  {
    id: 'city_prosperity',
    category: 'market',
    icon: '🌸',
    title: { vi: 'THÀNH THỊ PHỒN HOA', en: 'CITY PROSPERITY' },
    description: {
      vi: 'Thành thị phồn hoa hội tụ, cơ hội kinh doanh tốt. Đấu giá hội đặc biệt đang mở.',
      en: 'City prosperity booming, trading opportunities arise. Special auction house open.'
    },
    check: (w) => w.city?.prosperity > 80
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  worldState?: WorldState;
  gameMonth: number;
  realm: string;
  language?: Lang;
};

export default function WorldNewsPanel({
  isOpen,
  onClose,
  worldState,
  gameMonth,
  realm,
  language = 'vi'
}: Props) {
  if (!isOpen) return null;

  const isVi = language === 'vi';

  // Fallback to default world state values if undefined
  const ws: WorldState = worldState || {
    sect: { reputation: 50, resources: 50, stability: 80, warLevel: 10 },
    city: { prosperity: 50, security: 80, priceIndex: 100, morale: 80 },
    mountain: { beastActivity: 20, resources: 50, danger: 15 },
    demonic: { infiltration: 10, activity: 10 },
    global: { spiritualQi: 50, daoFluctuation: 10, demonicEnergy: 10 }
  };

  // Run dynamic rule check to distribute active news events
  const activeNews = NEWS_RULES.filter(rule => rule.check(ws));

  const anomalies = activeNews.filter(n => n.category === 'anomaly');
  const conflicts = activeNews.filter(n => n.category === 'conflict');
  const markets = activeNews.filter(n => n.category === 'market');

  // Gauge calculation helpers
  const getReputationPercent = () => Math.min(100, Math.max(0, ws.sect?.reputation ?? 50));
  const getQiPercent = () => Math.min(100, Math.max(0, ws.global?.spiritualQi ?? 50));
  const getStabilityPercent = () => Math.min(100, Math.max(0, ws.sect?.stability ?? 85));
  const getWarPercent = () => Math.min(100, Math.max(0, ws.sect?.warLevel ?? 10));
  const getProsperityPercent = () => Math.min(100, Math.max(0, ws.city?.prosperity ?? 50));
  const getPricePercent = () => {
    const rawVal = ws.city?.priceIndex ?? 100;
    // Map price index (range 50 - 300) to 0 - 100 % width
    return Math.min(100, Math.max(0, Math.round(((rawVal - 50) / 250) * 100)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop click */}
      <button 
        type="button" 
        className="absolute inset-0 cursor-default focus:outline-none" 
        onClick={onClose} 
        aria-label="Close panel"
      />

      {/* Main Board Container */}
      <div 
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e241e] via-[#091713] to-[#0a1b16] border-4 border-double border-[#b89f65] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_3px_rgba(255,255,255,0.15)] flex flex-col p-6 sm:p-8 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-[#173a30] scrollbar-track-black/40"
        style={{ outline: '1px solid rgba(229, 193, 123, 0.3)', outlineOffset: '-6px' }}
      >
        {/* Ancient Chinese-style decorative cloud corners */}
        <div className="absolute top-2 left-2 text-[#b89f65]/40 text-xl pointer-events-none">🔸</div>
        <div className="absolute top-2 right-2 text-[#b89f65]/40 text-xl pointer-events-none">🔸</div>
        <div className="absolute bottom-2 left-2 text-[#b89f65]/40 text-xl pointer-events-none">🔸</div>
        <div className="absolute bottom-2 right-2 text-[#b89f65]/40 text-xl pointer-events-none">🔸</div>

        {/* Title Banner */}
        <div className="bg-gradient-to-r from-[#173a30] via-[#225547] to-[#173a30] border-2 border-[#b89f65] rounded-lg py-3 px-6 shadow-md text-center border-double">
          <h2 className="font-serif text-[18px] sm:text-[22px] font-bold text-[#e5c17b] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {isVi ? 'THẾ GIỚI TIÊN HIỆP — THÔNG BÁO THẾ GIỚI & TÔNG MÔN' : 'IMMORTAL WORLD — WORLD & SECT NEWS'}
          </h2>
        </div>

        {/* Sub-Header: Month & Realm */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-serif font-bold text-[#e5c17b] tracking-widest bg-[#132c25]/60 border border-[#b89f65]/30 rounded px-4 py-1.5 mx-auto max-w-sm">
          <span>📜</span>
          <span>
            {isVi 
              ? `Cập nhật tháng: ${String(gameMonth).padStart(2, '0')} (${realm})` 
              : `Month update: ${String(gameMonth).padStart(2, '0')} (${realm})`}
          </span>
          <span>📜</span>
        </div>

        {/* Main 3-Column News Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 flex-1 min-h-[300px]">
          {/* Column 1: World Anomalies */}
          <div className="bg-[#0b1713]/60 border border-[#b89f65]/20 rounded-md p-4 flex flex-col gap-4">
            <h3 className="font-serif text-sm font-bold text-[#e5c17b] border-b border-[#b89f65]/35 pb-2 uppercase flex items-center gap-2">
              <span>🌍</span> {isVi ? 'Thế Giới Dị Động' : 'World Anomalies'}
            </h3>
            <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[320px] scrollbar-thin">
              {anomalies.length > 0 ? (
                anomalies.map(news => (
                  <div key={news.id} className="p-3 bg-[#173a30]/30 border border-[#c5a059]/30 rounded-sm space-y-1.5 animate-fade-in hover:bg-[#173a30]/40 transition-colors duration-300">
                    <h4 className="font-serif text-xs font-bold text-[#fbe3b5] flex items-center gap-1.5">
                      <span>{news.icon}</span> {isVi ? news.title.vi : news.title.en}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed text-justify">
                      {isVi ? news.description.vi : news.description.en}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-text-tertiary gap-2">
                  <span className="text-3xl opacity-40">🌅</span>
                  <p className="text-[10px] sm:text-xs italic font-serif leading-relaxed">
                    {isVi 
                      ? 'Thiên địa linh khí lưu chuyển ôn hòa, không có dị biến đặc biệt.' 
                      : 'Spiritual Qi flows peacefully, no notable world anomalies.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Sect Conflicts */}
          <div className="bg-[#0b1713]/60 border border-[#b89f65]/20 rounded-md p-4 flex flex-col gap-4">
            <h3 className="font-serif text-sm font-bold text-[#e5c17b] border-b border-[#b89f65]/35 pb-2 uppercase flex items-center gap-2">
              <span>⚔️</span> {isVi ? 'Tông Môn Chiến Sự' : 'Sect Conflicts'}
            </h3>
            <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[320px] scrollbar-thin">
              {conflicts.length > 0 ? (
                conflicts.map(news => (
                  <div key={news.id} className="p-3 bg-[#3e1915]/30 border border-red-900/40 rounded-sm space-y-1.5 animate-fade-in hover:bg-[#3e1915]/40 transition-colors duration-300">
                    <h4 className="font-serif text-xs font-bold text-red-300 flex items-center gap-1.5">
                      <span>{news.icon}</span> {isVi ? news.title.vi : news.title.en}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed text-justify">
                      {isVi ? news.description.vi : news.description.en}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-text-tertiary gap-2">
                  <span className="text-3xl opacity-40">☯</span>
                  <p className="text-[10px] sm:text-xs italic font-serif leading-relaxed">
                    {isVi 
                      ? 'Tông môn yên bình, các đệ tử hòa khí cần cù tu tập.' 
                      : 'Sect is peaceful, disciples train diligently in harmony.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Market & Cities */}
          <div className="bg-[#0b1713]/60 border border-[#b89f65]/20 rounded-md p-4 flex flex-col gap-4">
            <h3 className="font-serif text-sm font-bold text-[#e5c17b] border-b border-[#b89f65]/35 pb-2 uppercase flex items-center gap-2">
              <span>📊</span> {isVi ? 'Thị Trường & Thành Thị' : 'Market & Cities'}
            </h3>
            <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[320px] scrollbar-thin">
              {markets.length > 0 ? (
                markets.map(news => (
                  <div key={news.id} className="p-3 bg-[#322c15]/30 border border-[#c5a059]/30 rounded-sm space-y-1.5 animate-fade-in hover:bg-[#322c15]/40 transition-colors duration-300">
                    <h4 className="font-serif text-xs font-bold text-[#e5c17b] flex items-center gap-1.5">
                      <span>{news.icon}</span> {isVi ? news.title.vi : news.title.en}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed text-justify">
                      {isVi ? news.description.vi : news.description.en}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-text-tertiary gap-2">
                  <span className="text-3xl opacity-40">📈</span>
                  <p className="text-[10px] sm:text-xs italic font-serif leading-relaxed">
                    {isVi 
                      ? 'Thị trường ổn định, thông thương buôn bán ôn hòa.' 
                      : 'Market is stable, commerce is peaceful.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Variable Status Panel */}
        <div className="mt-8 border-t border-[#b89f65]/30 pt-6">
          <div className="text-center font-serif text-xs font-bold text-[#e5c17b] uppercase tracking-[0.2em] mb-4 bg-[#0a1512] py-1 border border-[#b89f65]/20 rounded max-w-[200px] mx-auto">
            {isVi ? 'Bảng Trạng Thái' : 'Status Variables'}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* Reputation Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-secondary font-bold">
                <span className="truncate">{isVi ? 'Reputation' : 'Reputation'}</span>
                <span className="text-[#e5c17b]">{Math.round(ws.sect?.reputation ?? 50)}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-[#b89f65]/35">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-700 to-cyan-400" 
                  style={{ width: `${getReputationPercent()}%` }}
                />
              </div>
            </div>

            {/* SpiritualQi Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-secondary font-bold">
                <span className="truncate">{isVi ? 'spiritualQi' : 'spiritualQi'}</span>
                <span className="text-[#e5c17b]">{Math.round(ws.global?.spiritualQi ?? 50)}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-[#b89f65]/35">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-400" 
                  style={{ width: `${getQiPercent()}%` }}
                />
              </div>
            </div>

            {/* Stability Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-secondary font-bold">
                <span className="truncate">{isVi ? 'stability' : 'stability'}</span>
                <span className="text-[#e5c17b]">{Math.round(ws.sect?.stability ?? 80)}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-[#b89f65]/35">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-green-700 to-emerald-400" 
                  style={{ width: `${getStabilityPercent()}%` }}
                />
              </div>
            </div>

            {/* WarLevel Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-secondary font-bold">
                <span className="truncate">{isVi ? 'warLevel' : 'warLevel'}</span>
                <span className="text-[#e5c17b]">{Math.round(ws.sect?.warLevel ?? 10)}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-[#b89f65]/35">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600" 
                  style={{ width: `${getWarPercent()}%` }}
                />
              </div>
            </div>

            {/* Prosperity Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-secondary font-bold">
                <span className="truncate">{isVi ? 'prosperity' : 'prosperity'}</span>
                <span className="text-[#e5c17b]">{Math.round(ws.city?.prosperity ?? 50)}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-[#b89f65]/35">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-[#e5c17b]" 
                  style={{ width: `${getProsperityPercent()}%` }}
                />
              </div>
            </div>

            {/* PriceIndex Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-secondary font-bold">
                <span className="truncate">{isVi ? 'priceIndex' : 'priceIndex'}</span>
                <span className="text-[#e5c17b]">{Math.round(ws.city?.priceIndex ?? 100)}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-[#b89f65]/35">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-purple-700 to-pink-500" 
                  style={{ width: `${getPricePercent()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Exit Button at Bottom */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="group px-8 py-2.5 rounded border border-[#b89f65] hover:border-[#e5c17b] bg-gradient-to-r from-[#173a30] to-[#0e241e] hover:from-[#205244] hover:to-[#173a30] text-[#e5c17b] hover:text-white font-serif font-bold text-sm tracking-widest shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer uppercase border-double"
          >
            {isVi ? 'Lui Ra' : 'Close Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
