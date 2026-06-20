'use client';

import { useState } from 'react';
import { GameState, ItemInstance } from '../types';
import itemsData from '../data/items.json';
import { getItemPrice } from '../lib/engine';

interface BlackMarketModalProps {
  state: GameState;
  onUpdateState: (newState: GameState) => void;
  onClose: () => void;
}

export default function BlackMarketModal({ state, onUpdateState, onClose }: BlackMarketModalProps) {
  // Dummy black market items for sale
  const [marketItems] = useState<ItemInstance[]>(() => {
    return (itemsData as ItemInstance[])
      .filter(i => i.tier === 'địa' || i.tier === 'thiên' || i.category === 'relic')
      .slice(0, 5)
      .map(i => ({ ...i, id: `${i.id}_market_${Math.random()}`, quantity: 1 }));
  });

  const handleBuy = (item: ItemInstance) => {
    // Giá chợ đen chém x3 giá trị
    const price = getItemPrice(item, state.worldState, true) * 3;
    if ((state.spiritStones || 0) >= price) {
      const nextState = { ...state };
      nextState.spiritStones = (nextState.spiritStones || 0) - price;
      nextState.inventory = [...(nextState.inventory || []), { ...item }];
      nextState.log = [...nextState.log, { type: 'info', message: { vi: `Bạn đã mua ${item.name} tại Chợ Đen với giá ${price} Linh thạch.`, en: `Bought ${item.name} at Black Market for ${price} Spirit Stones.` } }];
      onUpdateState(nextState);
    } else {
      alert("Không đủ Linh thạch!");
    }
  };

  const handleSell = (itemIndex: number) => {
    const item = state.inventory?.[itemIndex];
    if (!item) return;

    // Chợ đen thu mua Tạp đan, phế phẩm hoặc tà đạo giá cao, các thứ khác giá bèo
    let price = getItemPrice(item, state.worldState, false);
    if (item.name === 'Tạp Đan' || item.name.includes('Oán') || item.name.includes('Huyết')) {
      price *= 4; // Mua giá cao
    }

    const nextState = { ...state };
    nextState.spiritStones = (nextState.spiritStones || 0) + price;
    
    // Xóa item
    const nextInv = [...(nextState.inventory || [])];
    nextInv.splice(itemIndex, 1);
    nextState.inventory = nextInv;

    nextState.log = [...nextState.log, { type: 'info', message: { vi: `Bạn đã bán ${item.name} tại Chợ Đen thu về ${price} Linh thạch.`, en: `Sold ${item.name} at Black Market for ${price} Spirit Stones.` } }];
    onUpdateState(nextState);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="bg-[#110e0c] border border-red-900/50 rounded-xl w-full max-w-4xl flex flex-col overflow-hidden text-lunar shadow-[0_0_40px_rgba(153,27,27,0.15)] relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        
        {/* Header */}
        <div className="p-4 border-b border-red-900/30 flex justify-between items-center bg-gradient-to-r from-red-950/40 to-transparent relative z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-widest text-red-500 flex items-center gap-2">
              <span className="text-xl">🏪</span> HẮC ÁM THỊ TƯỜNG (BLACK MARKET)
            </h2>
            <p className="text-xs text-red-400/50 mt-1">Nơi giao dịch máu, nước mắt và những thứ không thể thấy ánh mặt trời.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm bg-black/50 px-3 py-1.5 rounded border border-[#c5a059]/20">
              <span className="text-[#c5a059]">💎 Linh thạch: </span>
              <span className="font-bold">{state.spiritStones || 0}</span>
            </div>
            <button onClick={onClose} className="text-red-500/50 hover:text-red-400 text-3xl leading-none">&times;</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row p-6 gap-6 h-[60vh] overflow-hidden relative z-10">
          
          {/* MUA HÀNG */}
          <div className="flex-1 flex flex-col border border-red-900/20 bg-black/40 rounded-lg overflow-hidden">
            <div className="bg-red-950/30 p-3 border-b border-red-900/20 text-center font-bold tracking-widest text-red-400">
              HÀNG CẤM
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {marketItems.map((item, idx) => {
                const price = getItemPrice(item, state.worldState, true) * 3;
                return (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded p-3 flex justify-between items-center hover:border-red-900/50 transition-colors">
                    <div>
                      <div className="font-bold text-[#e5c17b]">{item.name}</div>
                      <div className="text-xs text-lunar/50">{item.description}</div>
                    </div>
                    <button 
                      onClick={() => handleBuy(item)}
                      disabled={(state.spiritStones || 0) < price}
                      className="whitespace-nowrap px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded text-sm text-red-400 font-bold transition-colors disabled:opacity-30"
                    >
                      MUA ({price})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BÁN HÀNG */}
          <div className="flex-1 flex flex-col border border-emerald-900/20 bg-black/40 rounded-lg overflow-hidden">
            <div className="bg-emerald-950/30 p-3 border-b border-emerald-900/20 text-center font-bold tracking-widest text-emerald-400">
              TÚI ĐỒ (BÁN TÀ ĐẠO/TẠP ĐAN ĐƯỢC GIÁ)
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(state.inventory || []).length === 0 && (
                <div className="text-center text-lunar/30 text-sm mt-10">Túi đồ trống không...</div>
              )}
              {(state.inventory || []).map((item, idx) => {
                let price = getItemPrice(item, state.worldState, false);
                const isValuable = item.name === 'Tạp Đan' || item.name.includes('Oán') || item.name.includes('Huyết');
                if (isValuable) price *= 4;
                
                return (
                  <div key={idx} className={`bg-zinc-900/50 border ${isValuable ? 'border-emerald-900/50' : 'border-zinc-800'} rounded p-3 flex justify-between items-center hover:bg-zinc-900 transition-colors`}>
                    <div>
                      <div className={`font-bold ${isValuable ? 'text-emerald-400' : 'text-lunar/80'}`}>{item.name} <span className="text-xs font-normal">x{item.quantity}</span></div>
                    </div>
                    <button 
                      onClick={() => handleSell(idx)}
                      className="whitespace-nowrap px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-emerald-400/80 font-bold transition-colors"
                    >
                      BÁN ({price})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
