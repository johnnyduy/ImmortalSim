import React, { useState } from 'react';

// Group 1
import MemoryHerbGame from './minigames/MemoryHerbGame';
import WhackAMoleGame from './minigames/WhackAMoleGame';
import TimingBarGame from './minigames/TimingBarGame';
import MinesweeperLiteGame from './minigames/MinesweeperLiteGame';
import SwipeDirectionGame from './minigames/SwipeDirectionGame';
import CatchDropsGame from './minigames/CatchDropsGame';

// Group 2
import BulletHellGame from './minigames/BulletHellGame';
import SpamClickGame from './minigames/SpamClickGame';
import RedLightGreenLightGame from './minigames/RedLightGreenLightGame';
import QuickReactionGame from './minigames/QuickReactionGame';
import MastermindGame from './minigames/MastermindGame';
import TrackingGame from './minigames/TrackingGame';

// Group 3
import BalanceYinYangGame from './minigames/BalanceYinYangGame';
import SimonSaysGame from './minigames/SimonSaysGame';
import TypingMantraGame from './minigames/TypingMantraGame';
import LockPickingGame from './minigames/LockPickingGame';
import WordScrambleGame from './minigames/WordScrambleGame';
import FlappySwordGame from './minigames/FlappySwordGame';

const ALL_MINIGAMES = [
  { id: 'MemoryHerb', name: 'Nhớ Vị Trí Linh Thảo', group: 1 },
  { id: 'WhackAMole', name: 'Đập Nhân Sâm', group: 1 },
  { id: 'TimingBar', name: 'Canh Thanh Thời Gian', group: 1 },
  { id: 'Minesweeper', name: 'Dò Mìn Linh Khí', group: 1 },
  { id: 'SwipeDirection', name: 'Vuốt Theo Hướng', group: 1 },
  { id: 'CatchDrops', name: 'Hứng Linh Dịch', group: 1 },
  { id: 'BulletHell', name: 'Né Ám Khí (Bullet Hell)', group: 2 },
  { id: 'SpamClick', name: 'Ấn Nhanh Đấu Pháp', group: 2 },
  { id: 'RedLightGreenLight', name: 'Đèn Xanh Đèn Đỏ', group: 2 },
  { id: 'QuickReaction', name: 'Phản Xạ Đỡ Đòn', group: 2 },
  { id: 'Mastermind', name: 'Phá Trận Ngũ Hành', group: 2 },
  { id: 'Tracking', name: 'Theo Dấu Huyết Độn', group: 2 },
  { id: 'BalanceYinYang', name: 'Cân Bằng Âm Dương', group: 3 },
  { id: 'SimonSays', name: 'Khai Mở Ngũ Hành (Simon)', group: 3 },
  { id: 'TypingMantra', name: 'Tụng Niệm Khẩu Quyết', group: 3 },
  { id: 'LockPicking', name: 'Phá Giải Trận Khóa', group: 3 },
  { id: 'WordScramble', name: 'Giải Mã Cổ Tịch', group: 3 },
  { id: 'FlappySword', name: 'Ngự Kiếm Vượt Lôi Lưới', group: 3 },
];

export default function MinigamesTab() {
  const [activeMinigame, setActiveMinigame] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ id: string, score: string } | null>(null);

  const handleMinigameComplete = (score: 'perfect' | 'good' | 'fail') => {
    if (activeMinigame) {
        setLastResult({ id: activeMinigame, score });
    }
    setActiveMinigame(null);
  };

  const handleMinigameCancel = () => {
    setActiveMinigame(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Mini-game Tester</h2>
        <p className="text-gray-400">Kiểm tra và chơi thử tất cả các mini-game của Vạn Thú Sơn Mạch.</p>
        
        {lastResult && (
            <div className="mt-4 p-3 bg-zinc-900 border border-emerald-500/30 rounded-lg text-emerald-400">
                Lần test cuối: <strong className="text-white">{ALL_MINIGAMES.find(g => g.id === lastResult.id)?.name}</strong> - Kết quả: <strong className={lastResult.score === 'perfect' ? 'text-yellow-400' : lastResult.score === 'good' ? 'text-emerald-400' : 'text-red-500'}>{lastResult.score.toUpperCase()}</strong>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(group => (
          <div key={group} className="bg-black/40 border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 border-b border-white/10 pb-2">
              Nhóm {group} {group === 1 ? '(Hái thuốc / Thu thập)' : group === 2 ? '(Chiến đấu / Sinh tồn)' : '(Giải đố / Khéo léo)'}
            </h3>
            <div className="flex flex-col gap-2">
              {ALL_MINIGAMES.filter(g => g.group === group).map(game => (
                <button
                  key={game.id}
                  onClick={() => setActiveMinigame(game.id)}
                  className="flex justify-between items-center px-4 py-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-lg transition-colors text-left"
                >
                  <span className="font-medium text-gray-200">{game.name}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Test</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RENDER OVERLAYS */}
      {activeMinigame === 'MemoryHerb' && <MemoryHerbGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'WhackAMole' && <WhackAMoleGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'TimingBar' && <TimingBarGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'Minesweeper' && <MinesweeperLiteGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'SwipeDirection' && <SwipeDirectionGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'CatchDrops' && <CatchDropsGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}

      {activeMinigame === 'BulletHell' && <BulletHellGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'SpamClick' && <SpamClickGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'RedLightGreenLight' && <RedLightGreenLightGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'QuickReaction' && <QuickReactionGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'Mastermind' && <MastermindGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'Tracking' && <TrackingGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}

      {activeMinigame === 'BalanceYinYang' && <BalanceYinYangGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'SimonSays' && <SimonSaysGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'TypingMantra' && <TypingMantraGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'LockPicking' && <LockPickingGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'WordScramble' && <WordScrambleGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'FlappySword' && <FlappySwordGame onComplete={handleMinigameComplete} onCancel={handleMinigameCancel} />}
    </div>
  );
}
