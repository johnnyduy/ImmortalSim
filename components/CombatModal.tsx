import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';
import { getPlayerStat } from '../lib/engine';

type CombatAction = 'brute_force' | 'tactical' | 'stall' | 'demonic' | 'escape';

interface CombatModalProps {
  state: GameState;
  onAction: (action: CombatAction) => void;
  onClose: () => void;
}

export default function CombatModal({ state, onAction, onClose }: CombatModalProps) {
  const combat = state.activeCombat;
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combat?.log]);

  if (!combat) return null;

  const enemy = combat.enemy;
  const isFinished = combat.isFinished;

  const playerSpeed = getPlayerStat(state, 'speed') || state.stats.speed || 10;
  const playerHP = state.stats.health;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-serif text-amber-50">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-red-900/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Tầng 1: Kẻ địch */}
        <div className="relative h-48 bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden border-b border-red-900/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950"></div>
          {enemy.avatar ? (
            <img src={enemy.avatar} alt={enemy.name} className="w-20 h-20 rounded-full border-2 border-red-800 object-cover z-10 mb-2" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-800 flex items-center justify-center text-3xl z-10 mb-2 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              👹
            </div>
          )}
          <h2 className="text-xl font-bold text-red-500 z-10 tracking-wider">{enemy.name}</h2>
          
          <div className="w-full max-w-xs mt-2 z-10">
            <div className="flex justify-between text-xs text-red-300 mb-1">
              <span>Sinh Lực</span>
              <span>{Math.max(0, enemy.currentHp)} / {enemy.maxHp}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-red-900/50">
              <div 
                className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, (enemy.currentHp / enemy.maxHp) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tầng 2: Trinh sát / Battle Log */}
        <div className="flex-1 p-6 overflow-y-auto bg-[url('/images/ui/paper-texture-dark.png')] bg-zinc-800/90 bg-blend-multiply border-b border-zinc-700/50 shadow-inner">
          <div className="space-y-3">
            {combat.log.map((entry, idx) => (
              <div key={idx} className="text-[15px] leading-relaxed text-amber-100/90 border-l-2 border-amber-700/50 pl-3 py-1">
                {entry}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Tầng 3: Quyết định */}
        <div className="p-4 bg-zinc-950/80">
          {!isFinished ? (
            <>
              {/* Player Status Bar */}
              <div className="flex items-center justify-between px-2 mb-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">HP: {playerHP}</span>
                  <span className="text-blue-400">Tốc độ: {playerSpeed}</span>
                  <span className="text-purple-400">Ngộ tính: {state.stats.comprehension}</span>
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button 
                  onClick={() => onAction('brute_force')}
                  className="p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-red-400 font-semibold group-hover:text-red-300">Lấy Cứng Chọi Cứng</span>
                  <span className="text-xs text-zinc-500">Đọ Lực chiến, chắc chắn tổn hao HP</span>
                </button>
                <button 
                  onClick={() => onAction('tactical')}
                  className="p-3 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/50 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-blue-400 font-semibold group-hover:text-blue-300">Bày Trận / Dùng Trí</span>
                  <span className="text-xs text-zinc-500">Cần Ngộ Tính cao, khắc chế địch chậm</span>
                </button>
                <button 
                  onClick={() => onAction('stall')}
                  className="p-3 bg-green-950/40 hover:bg-green-900/60 border border-green-900/50 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-green-400 font-semibold group-hover:text-green-300">Tiêu Hao Tật Lê</span>
                  <span className="text-xs text-zinc-500">Cần Tốc độ cao, tăng Đan Độc</span>
                </button>
                <button 
                  onClick={() => onAction('demonic')}
                  className="p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-900/50 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-purple-400 font-semibold group-hover:text-purple-300">Tà Đạo Huyết Tế</span>
                  <span className="text-xs text-zinc-500">Thắng tức thì, trừ nặng Nghiệp & Thọ</span>
                </button>
              </div>

              {/* Escape Hatch */}
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => onAction('escape')}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 rounded transition-colors border border-transparent hover:border-zinc-700"
                >
                  Thoát Khỏi Trận Chiến
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <h3 className={`text-2xl font-bold mb-4 ${combat.result === 'win' ? 'text-amber-400' : combat.result === 'escape' ? 'text-blue-400' : 'text-red-500'}`}>
                {combat.result === 'win' ? 'Chiến Thắng!' : combat.result === 'escape' ? 'Đã Tẩu Thoát' : 'Thất Bại!'}
              </h3>
              <button 
                onClick={onClose}
                className="px-8 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-amber-50 font-bold transition-colors"
              >
                Tiếp tục
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
