'use client';

import { useState } from 'react';
import { GameState, AlchemyRecipe, FireMethod } from '../types';
import { processAlchemy, AlchemyResult } from '../lib/alchemy-system';
import recipesData from '../data/recipes.json';
import TypewriterText from './TypewriterText';

interface AlchemyModalProps {
  state: GameState;
  onFinished: (result: AlchemyResult) => void;
  onClose: () => void;
}

export default function AlchemyModal({ state, onFinished, onClose }: AlchemyModalProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipesData[0].id);
  const [furnaceQuality, setFurnaceQuality] = useState<number>(1);
  const [fireMethod, setFireMethod] = useState<FireMethod>('văn_hỏa');
  
  const [result, setResult] = useState<AlchemyResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const selectedRecipe = (recipesData as AlchemyRecipe[]).find(r => r.id === selectedRecipeId);

  const handleKhaiLo = () => {
    if (!selectedRecipe) return;
    setIsAnimating(true);
    setResult(null);
    
    // Simulate some delay for dramatic effect
    setTimeout(() => {
      const res = processAlchemy(state, selectedRecipe, furnaceQuality, fireMethod);
      setResult(res);
      setIsAnimating(false);
    }, 1500);
  };

  const handleClose = () => {
    if (result) {
      onFinished(result);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface/90 border-2 border-accent/60 rounded-xl max-w-3xl w-full flex flex-col overflow-hidden text-lunar font-serif shadow-[0_0_30px_rgba(20,184,166,0.15)] relative">
        
        {/* Header */}
        <div className="bg-zinc-900/80 p-4 border-b border-accent/30 flex justify-between items-center relative z-10">
          <h2 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">LẬP TRẬN LUYỆN ĐAN</h2>
          {!isAnimating && !result && (
            <button onClick={onClose} className="text-lunar/50 hover:text-red-400 text-2xl leading-none">&times;</button>
          )}
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Controls */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm text-accent/70 mb-2 font-bold tracking-widest">ĐAN PHƯƠNG</label>
              <select 
                disabled={isAnimating || result !== null}
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full bg-zinc-900/50 border border-accent/20 rounded p-2 text-lunar hover:border-accent/40 focus:border-accent outline-none"
              >
                {recipesData.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {r.description}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-accent/70 mb-2 font-bold tracking-widest">PHẨM CHẤT ĐAN LÔ</label>
              <select 
                disabled={isAnimating || result !== null}
                value={furnaceQuality}
                onChange={(e) => setFurnaceQuality(Number(e.target.value))}
                className="w-full bg-zinc-900/50 border border-accent/20 rounded p-2 text-lunar hover:border-accent/40 focus:border-accent outline-none"
              >
                <option value={1}>Phàm Phẩm Đan Lô</option>
                <option value={2}>Tinh Phẩm Đan Lô</option>
                <option value={3}>Cực Phẩm Đan Lô</option>
                <option value={4}>Tiên Phẩm Đan Lô</option>
                <option value={5}>Hỗn Độn Tạo Hóa Lô</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-accent/70 mb-2 font-bold tracking-widest">PHƯƠNG THỨC KHỐNG HỎA</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'văn_hỏa', label: 'Văn Hỏa', desc: 'Chậm & An toàn' },
                  { id: 'vũ_hỏa', label: 'Vũ Hỏa', desc: 'Nhanh & Nổ lò' },
                  { id: 'thiên_lôi', label: 'Thiên Lôi', desc: 'Đan Văn & Tử Vong' },
                  { id: 'huyết_luyện', label: 'Huyết Luyện', desc: '100% & Ma tính' }
                ].map(m => (
                  <button
                    key={m.id}
                    disabled={isAnimating || result !== null}
                    onClick={() => setFireMethod(m.id as FireMethod)}
                    className={`p-2 border rounded text-left ${fireMethod === m.id ? 'border-accent bg-accent/10 text-accent' : 'border-zinc-700 bg-zinc-900/30 text-lunar/70'} hover:border-accent/50 transition-colors`}
                  >
                    <div className="font-bold">{m.label}</div>
                    <div className="text-xs opacity-70">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {!result && (
              <button 
                onClick={handleKhaiLo}
                disabled={isAnimating || !selectedRecipe}
                className="w-full py-4 bg-accent/20 hover:bg-accent/40 border border-accent/50 rounded font-bold tracking-widest text-lg transition-all animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:animate-none"
              >
                {isAnimating ? 'ĐANG DỤNG HỎA...' : 'KHAI LÒ'}
              </button>
            )}
          </div>

          {/* Results/Logs */}
          <div className="flex-1 bg-zinc-900/60 border border-accent/10 rounded-lg p-4 flex flex-col h-64 md:h-auto overflow-y-auto">
            {isAnimating && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-accent border-r-orange-500 border-b-red-500 border-l-transparent animate-spin"></div>
              </div>
            )}
            
            {result && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2 text-sm leading-relaxed">
                  {result.log.map((l, i) => (
                    <div key={i} className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" style={{ animationDelay: `${i * 0.5}s` }}>
                      <span className="text-accent/50 mr-2">✦</span>{l}
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-accent/20">
                  {result.type === 'success' && result.outputItem && (
                    <div className="text-center">
                      <div className="text-xl font-bold text-accent mb-1">{result.outputItem.name}</div>
                      <div className="text-sm text-lunar/70">Phẩm chất: <span className="text-amber-400">{result.outputItem.quality?.replace('_', ' ').toUpperCase()}</span></div>
                      <div className="text-sm text-lunar/70">Đan Độc: {result.outputItem.toxicity}</div>
                    </div>
                  )}
                  {result.type === 'failure_explode' && (
                    <div className="text-center text-red-500 font-bold text-xl animate-bounce">
                      - {result.healthLost} HP
                    </div>
                  )}

                  <button 
                    onClick={handleClose}
                    className="mt-6 w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded tracking-widest"
                  >
                    THU ĐAN / RỜI ĐI
                  </button>
                </div>
              </div>
            )}

            {!isAnimating && !result && (
              <div className="flex-1 flex items-center justify-center text-lunar/30 text-sm italic">
                Chờ chỉ lệnh khai lò...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
