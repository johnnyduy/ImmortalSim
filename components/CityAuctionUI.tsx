'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';
import { getLocalizedText } from '../lib/i18n';
import { addItem } from '../lib/engine';

interface CityAuctionUIProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

type AuctionItem = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: string;
  amount: number;
};

type NPC = {
  id: string;
  name: string;
  budget: number;
  aggressiveness: number; // 0 to 1, chance to bid if under budget
};

const AUCTION_ITEMS: AuctionItem[] = [
  { id: 'item_truc_co_dan', name: 'Trúc Cơ Đan (Thượng phẩm)', description: 'Tăng mạnh tỷ lệ đột phá Trúc Cơ.', basePrice: 200, icon: '💊', amount: 1 },
  { id: 'item_the_than_phu', name: 'Thế Thân Phù', description: 'Bảo mệnh 1 lần.', basePrice: 150, icon: '🎴', amount: 1 },
  { id: 'item_kiem_khi_ngoc_gian', name: 'Kiếm Khí Ngọc Giản', description: 'Chứa 1 đòn đánh cường đại của Trúc Cơ sơ kỳ.', basePrice: 100, icon: '🗡️', amount: 1 },
];

export default function CityAuctionUI({ game, setGame, onClose }: CityAuctionUIProps) {
  const [items] = useState<AuctionItem[]>(AUCTION_ITEMS);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  const [npcs] = useState<NPC[]>([
    { id: 'npc1', name: 'Thiếu gia Gia tộc', budget: 400 + Math.random() * 200, aggressiveness: 0.8 },
    { id: 'npc2', name: 'Tán tu thần bí', budget: 300 + Math.random() * 150, aggressiveness: 0.5 },
    { id: 'npc3', name: 'Đệ tử tinh anh', budget: 350 + Math.random() * 150, aggressiveness: 0.6 }
  ]);

  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Chào mừng đến với Đại Đấu Giá Hội!']);
  const [phase, setPhase] = useState<'intro' | 'bidding' | 'sold' | 'finished' | 'drama'>('intro');
  const [countdown, setCountdown] = useState(0); // For "Bán lần 1... lần 2..."
  const [dramaTriggered, setDramaTriggered] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (phase === 'intro') {
      const item = items[currentItemIndex];
      setCurrentBid(item.basePrice);
      setHighestBidder(null);
      setLogs(prev => [...prev, `Vật phẩm tiếp theo: ${item.name} - Giá khởi điểm: ${item.basePrice} Linh thạch!`]);
      setPhase('bidding');
    }
  }, [phase, currentItemIndex, items]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const processNPCBids = (currentPrice: number, currentLeader: string | null) => {
    let newBid = currentPrice;
    let newLeader = currentLeader;
    let didBid = false;

    // Shuffle NPCs to randomize bid order
    const shuffled = [...npcs].sort(() => Math.random() - 0.5);
    
    for (const npc of shuffled) {
      if (newLeader === npc.id) continue;
      
      const maxWillingToPay = npc.budget;
      if (newBid < maxWillingToPay && Math.random() < npc.aggressiveness) {
        // NPC decides to bid
        const increment = Math.random() > 0.7 ? 50 : 10;
        newBid += increment;
        newLeader = npc.id;
        didBid = true;
        addLog(`>> ${npc.name} ra giá ${newBid} Linh thạch!`);
        break; // Only one NPC bids per evaluation tick to make it readable
      }
    }

    return { didBid, newBid, newLeader };
  };

  const handlePlayerBid = (amount: number) => {
    if (phase !== 'bidding') return;
    const newBid = currentBid + amount;
    if ((game.spiritStones || 0) < newBid) {
      addLog('Bạn không đủ Linh thạch để ra giá!');
      return;
    }
    
    setCurrentBid(newBid);
    setHighestBidder('player');
    setCountdown(0);
    addLog(`>> Bạn ra giá ${newBid} Linh thạch!`);

    // NPCs react immediately
    setTimeout(() => {
      evaluateState(newBid, 'player');
    }, 800);
  };

  const handlePass = () => {
    if (phase !== 'bidding') return;
    addLog('Bạn đã bỏ qua lượt ra giá.');
    evaluateState(currentBid, highestBidder);
  };

  const evaluateState = (price: number, leader: string | null) => {
    const { didBid, newBid, newLeader } = processNPCBids(price, leader);
    
    if (didBid) {
      setCurrentBid(newBid);
      setHighestBidder(newLeader);
      setCountdown(0);
    } else {
      // No one bid, increment countdown
      setCountdown(prev => {
        const next = prev + 1;
        if (next === 1) addLog(`Bán lần 1... cho giá ${price}!`);
        if (next === 2) addLog(`Bán lần 2... cho giá ${price}!`);
        if (next === 3) {
          addLog(`Thành giao! ${leader === 'player' ? 'Bạn' : (npcs.find(n => n.id === leader)?.name || 'Không ai')} đã mua được vật phẩm!`);
          handleSold(leader, price);
        }
        return next;
      });
    }
  };

  const handleSold = (leader: string | null, price: number) => {
    setPhase('sold');
    const item = items[currentItemIndex];
    
    if (leader === 'player') {
      setGame(prev => {
        if (!prev) return prev;
        let nextStones = (prev.spiritStones || 0) - price;
        const result = addItem(prev.inventory || [], item.id, item.amount, prev.age);
        
        return {
          ...prev,
          spiritStones: nextStones,
          inventory: result.inventory,
        } as any; 
      });

      // Drama check (30% chance)
      if (Math.random() < 0.3) {
        setDramaTriggered(true);
      }
    }

    setTimeout(() => {
      if (currentItemIndex + 1 < items.length) {
        setCurrentItemIndex(prev => prev + 1);
        setPhase('intro');
      } else {
        if (dramaTriggered) {
           setPhase('drama');
           addLog('Bạn cảm thấy có sát khí nhắm vào mình khi Đấu Giá Hội vừa kết thúc...');
        } else {
           setPhase('finished');
           addLog('Đấu Giá Hội đã kết thúc! Cảm ơn các vị đạo hữu.');
        }
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-4 font-mono text-amber-100 animate-fade-in">
      <div className="text-center border-b border-amber-500/30 pb-2 mb-4 shrink-0">
        <h2 className="text-xl font-bold text-amber-400">🏛️ Vạn Thông Đấu Giá Hội</h2>
        <p className="text-xs text-zinc-400">Chỉ dành cho Luyện Khí Kỳ</p>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left: Item Info & Bidding */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-zinc-900 border border-amber-900/50 p-4 rounded text-center flex-1 flex flex-col justify-center">
            {phase !== 'finished' && phase !== 'drama' ? (
              <>
                <div className="text-6xl mb-4 drop-shadow-md">{items[currentItemIndex].icon}</div>
                <h3 className="text-lg font-bold text-emerald-400">{items[currentItemIndex].name}</h3>
                <p className="text-sm text-zinc-300 mb-6">{items[currentItemIndex].description}</p>
                <div className="text-2xl font-bold text-amber-500">
                  Giá hiện tại: {currentBid} LT
                </div>
                {highestBidder && (
                  <div className="text-sm text-amber-200/60 mt-1">
                    (Người ra giá cao nhất: {highestBidder === 'player' ? 'BẠN' : npcs.find(n => n.id === highestBidder)?.name})
                  </div>
                )}
              </>
            ) : phase === 'drama' ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <span className="text-6xl">🥷</span>
                <span className="text-xl text-red-400 font-bold">KẺ CƯỚP ĐƯỜNG!</span>
                <p className="text-zinc-300 px-4">
                  Một tên Hắc Y Nhân chặn đường bạn: "Nhãi ranh Luyện Khí Kỳ mà dám nuốt bảo vật, nôn ra đây!"
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-xl text-zinc-500">Đấu giá kết thúc.</span>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-amber-900/50 p-4 rounded flex flex-col gap-3 shrink-0">
            <div className="text-sm text-zinc-400 flex justify-between mb-2">
              <span>Linh thạch của bạn:</span>
              <span className="text-amber-400 font-bold">{game.spiritStones || 0}</span>
            </div>
            
            {phase === 'bidding' && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handlePlayerBid(10)}
                  disabled={(game.spiritStones || 0) < currentBid + 10}
                  className="bg-amber-900/40 hover:bg-amber-700/60 border border-amber-700/50 p-2 rounded disabled:opacity-30 transition-colors"
                >
                  +10 LT
                </button>
                <button 
                  onClick={() => handlePlayerBid(50)}
                  disabled={(game.spiritStones || 0) < currentBid + 50}
                  className="bg-amber-900/40 hover:bg-amber-700/60 border border-amber-700/50 p-2 rounded disabled:opacity-30 transition-colors"
                >
                  +50 LT
                </button>
                <button 
                  onClick={() => handlePlayerBid(100)}
                  disabled={(game.spiritStones || 0) < currentBid + 100}
                  className="bg-amber-900/40 hover:bg-amber-700/60 border border-amber-700/50 p-2 rounded disabled:opacity-30 transition-colors"
                >
                  +100 LT
                </button>
                <button 
                  onClick={handlePass}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 p-2 rounded transition-colors"
                >
                  Bỏ qua
                </button>
              </div>
            )}

            {phase === 'drama' && (
              <div className="flex flex-col gap-2 mt-auto">
                <button 
                  onClick={() => {
                    addLog('Bạn nộp 50 Linh thạch để được tha mạng...');
                    setGame(prev => prev ? ({ ...prev, spiritStones: Math.max(0, (prev.spiritStones || 0) - 50) }) as any : prev);
                    setPhase('finished');
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 p-2 rounded transition-colors"
                >
                  Nộp 50 Linh thạch cầu xin tha mạng
                </button>
                <button 
                  onClick={() => {
                    addLog('Bạn liều mạng phá vây trốn thoát nhưng bị thương nặng!');
                    setGame(prev => prev ? ({ ...prev, stats: { ...prev.stats, health: Math.max(1, prev.stats.health - 30) } }) as any : prev);
                    setPhase('finished');
                  }}
                  className="w-full bg-red-900/40 hover:bg-red-700/60 border border-red-700/50 p-2 rounded transition-colors text-red-200"
                >
                  Liều mạng chạy trốn (Trừ 30 Máu)
                </button>
              </div>
            )}

            {phase === 'finished' && (
              <button 
                onClick={onClose}
                className="w-full bg-emerald-900/40 hover:bg-emerald-700/60 border border-emerald-700/50 p-3 rounded font-bold transition-colors mt-auto"
              >
                Rời khỏi Đấu Giá Hội
              </button>
            )}
          </div>
        </div>

        {/* Right: Logs */}
        <div className="w-1/2 bg-black border border-zinc-800 rounded p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          {logs.map((log, idx) => (
            <div key={idx} className={`text-sm ${log.includes('Bạn ra giá') ? 'text-emerald-400' : log.includes('Thành giao') ? 'text-amber-400 font-bold' : 'text-zinc-300'}`}>
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
