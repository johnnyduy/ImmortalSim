'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Lang } from '../types';
import { uiText } from '../lib/i18n';

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

interface MountainExplorationProps {
  language: Lang;
  onReturn: () => void;
  onEventResult: (effect: any) => void;
  onCombat: (type: 'beast_herb' | 'npc_ta_tieu') => void;
  onTimePass: (days: number) => void;
  travelCostStones: number;
  travelCostHp: number;
}

type MinigameId = 
  | 'MemoryHerb' | 'WhackAMole' | 'TimingBar' | 'Minesweeper' | 'SwipeDirection' | 'CatchDrops' // Group 1
  | 'BulletHell' | 'SpamClick' | 'RedLightGreenLight' | 'QuickReaction' | 'Mastermind' | 'Tracking' // Group 2
  | 'BalanceYinYang' | 'SimonSays' | 'TypingMantra' | 'LockPicking' | 'WordScramble' | 'FlappySword'; // Group 3

type EventLog = {
  id: string;
  month: number;
  text: string;
  type: 'info' | 'reward' | 'danger' | 'minigame';
  minigameId?: MinigameId;
  minigameGroup?: 1 | 2 | 3;
  isCompleted?: boolean;
};

const GATHERING_MINIGAMES = [
  { id: 'MemoryHerb', hint: 'Phát hiện một khóm linh thảo mọc lẫn với độc thảo, phải căng mắt nhìn kỹ mới phân biệt được.' },
  { id: 'WhackAMole', hint: 'Bắt gặp Đan Sâm vạn năm đã có linh tính, rất giỏi độn thổ chạy trốn. Nhanh tay bắt lấy!' },
  { id: 'TimingBar', hint: 'Nhìn thấy Tuyết Liên mọc ở nơi cương phong dữ dội, cần chớp đúng thời cơ mới hái được nguyên vẹn.' },
  { id: 'Minesweeper', hint: 'Tìm thấy mạch khoáng chứa linh thạch nhưng lại xen kẽ nhiều luồng bạo loạn linh khí nguy hiểm.' },
  { id: 'SwipeDirection', hint: 'Phát hiện thân cây Mộc Tinh cứng như sắt, phải chặt nương theo từng đường vân rẽ nhánh liên tục.' },
  { id: 'CatchDrops', hint: 'Bắt gặp luồng linh tuyền bị hòa lẫn với bùn độc, cần khéo léo chắt lọc lấy tinh hoa.' }
];

const COMBAT_MINIGAMES = [
  { id: 'BulletHell', hint: 'Bất ngờ bị Tà tu tập kích! Hắn phóng ra vô vàn ám khí độc châm, cần lách qua để áp sát!' },
  { id: 'SpamClick', hint: 'Rơi vào trận Đấu Pháp giằng co với một cao thủ. Phải liên tục dồn chân khí để đẩy lùi hắc khí của hắn!' },
  { id: 'RedLightGreenLight', hint: 'Vô tình đi vào khu vực rà soát của một lão quái. Phải lẩn trốn, tuyệt đối không cử động khi hắn quét thần thức!' },
  { id: 'QuickReaction', hint: 'Trời đất tối sầm, sát khí bao trùm... Một tên sát thủ đang rình rập, chuẩn bị phản kích chớp nhoáng!' },
  { id: 'Mastermind', hint: 'Bị mắc kẹt vào Ngũ Hành Trận do tà tu giăng sẵn. Phải giải mã vị trí các viên ngọc ngũ hành để thoát ra!' },
  { id: 'Tracking', hint: 'Đả thương một tên Tà tu, hắn dùng huyết độn bỏ chạy để lại tàn dư khói mù. Lập tức truy tung diệt tận!' }
];

const MYSTERY_MINIGAMES = [
  { id: 'BalanceYinYang', hint: 'Phát hiện một khe nứt âm dương bất ổn. Phải điều hòa nội tức, giữ thăng bằng linh lực cơ thể mới mong vượt qua.' },
  { id: 'SimonSays', hint: 'Tìm thấy một trận pháp cổ xưa bị phong ấn. Cần ghi nhớ trình tự phát sáng của Ngũ Hành để khai mở!' },
  { id: 'TypingMantra', hint: 'Gặp phải một cấm chế tự động tấn công thần thức! Phải tụng niệm đúng khẩu quyết để khởi động bùa chú bảo vệ.' },
  { id: 'LockPicking', hint: 'Tiến vào một khu mật thất bị khóa bằng cơ quan tinh vi. Cần tìm ra điểm yếu của cấm chế và đánh mạnh vào đó.' },
  { id: 'WordScramble', hint: 'Phát hiện một cuốn cổ tịch bị rách nát. Các ký tự bên trong nhảy múa hỗn loạn, phải ghép lại mới đọc được.' },
  { id: 'FlappySword', hint: 'Lạc vào một khu vực bão từ trường và sấm sét. Chỉ có cách ngự phi kiếm luồn lách qua các khe hẹp mới sống sót!' }
];

export default function MountainExploration({
  language,
  onReturn,
  onEventResult,
  onCombat,
  onTimePass,
}: MountainExplorationProps) {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMinigame, setActiveMinigame] = useState<MinigameId | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isTyping]);

  const addLog = (log: Omit<EventLog, 'id' | 'month'>) => {
    const newLog: EventLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      month: currentMonth
    };
    setLogs(prev => [...prev, newLog]);
  };

  const generateEvent = () => {
    setIsTyping(true);
    onTimePass(30); // 1 month = 30 days
    
    // Simulate thinking/typing
    setTimeout(() => {
      const rand = Math.random();
      
      if (rand < 0.2) {
        // Nothing happens
        addLog({ text: 'Một tháng trôi qua bình yên. Ngươi dạo bước trong sơn mạch, hít thở linh khí nhưng không thu hoạch được gì đáng kể.', type: 'info' });
      } else if (rand < 0.35) {
        // Safe reward
        const stones = 50 + Math.floor(Math.random() * 50);
        addLog({ text: `Vô tình nhặt được một túi trữ vật của tu sĩ tản tu rơi lại. Thu được ${stones} linh thạch!`, type: 'reward' });
        onEventResult({ spiritStones: stones });
      } else if (rand < 0.55) {
        // Group 1 Minigame (Gathering)
        const mg = GATHERING_MINIGAMES[Math.floor(Math.random() * GATHERING_MINIGAMES.length)];
        addLog({ 
            text: mg.hint, 
            type: 'minigame', 
            minigameId: mg.id as MinigameId,
            minigameGroup: 1,
            isCompleted: false
        });
      } else if (rand < 0.8) {
        // Group 2 Minigame (Combat/Escape)
        const mg = COMBAT_MINIGAMES[Math.floor(Math.random() * COMBAT_MINIGAMES.length)];
        addLog({ 
            text: mg.hint, 
            type: 'minigame', 
            minigameId: mg.id as MinigameId,
            minigameGroup: 2,
            isCompleted: false
        });
      } else {
        // Group 3 Minigame (Mystery/Puzzle)
        const mg = MYSTERY_MINIGAMES[Math.floor(Math.random() * MYSTERY_MINIGAMES.length)];
        addLog({ 
            text: mg.hint, 
            type: 'minigame', 
            minigameId: mg.id as MinigameId,
            minigameGroup: 3,
            isCompleted: false
        });
      }
      
      setCurrentMonth(m => m + 1);
      setIsTyping(false);
    }, 1000);
  };

  const startMinigame = (id: MinigameId) => {
    setActiveMinigame(id);
  };

  const handleMinigameComplete = (score: 'perfect' | 'good' | 'fail', group: 1 | 2 | 3) => {
    setActiveMinigame(null);
    
    // Mark log as completed
    setLogs(prev => {
        const newLogs = [...prev];
        const lastLog = newLogs[newLogs.length - 1];
        if (lastLog && lastLog.type === 'minigame') {
            lastLog.isCompleted = true;
        }
        return newLogs;
    });

    // Handle reward based on group and score
    setTimeout(() => {
        if (group === 1) { // Gathering
            if (score === 'perfect') {
                addLog({ text: '[ KẾT QUẢ ] Thu hoạch hoàn mỹ! Nhận được lượng lớn linh thạch và tài nguyên.', type: 'reward' });
                onEventResult({ spiritStones: 100 + currentMonth * 10, cultivation: 5 });
            } else if (score === 'good') {
                addLog({ text: '[ KẾT QUẢ ] Thu hoạch thành công. Nhận được một ít linh thạch.', type: 'reward' });
                onEventResult({ spiritStones: 50 + currentMonth * 5 });
            } else {
                addLog({ text: '[ KẾT QUẢ ] Thất bại! Không thu được gì, lại còn trúng một chút độc khí.', type: 'danger' });
                onEventResult({ hp: -10 });
            }
        } else if (group === 2) { // Combat/Stealth
            if (score === 'perfect') {
                addLog({ text: '[ KẾT QUẢ ] Xuất sắc! Kẻ địch bỏ mạng, đoạt được toàn bộ gia tài của hắn!', type: 'reward' });
                onEventResult({ spiritStones: 200 + currentMonth * 20, luck: 1, daoHeart: 2 });
            } else if (score === 'good') {
                addLog({ text: '[ KẾT QUẢ ] Thành công đánh đuổi kẻ địch, nhặt được một vài món đồ hắn đánh rơi.', type: 'reward' });
                onEventResult({ spiritStones: 80 + currentMonth * 10 });
            } else {
                addLog({ text: '[ KẾT QUẢ ] Thất bại thảm hại! Chịu trọng thương và phải chật vật tẩu thoát.', type: 'danger' });
                onEventResult({ hp: -30, daoHeart: -2 });
            }
        } else { // Group 3: Mystery/Puzzle
            if (score === 'perfect') {
                addLog({ text: '[ KẾT QUẢ ] Thấu triệt huyền cơ! Không chỉ bình yên vượt qua mà Đạo Tâm còn thêm phần viên mãn.', type: 'reward' });
                onEventResult({ daoHeart: 3, cultivation: 10 + currentMonth * 5 });
            } else if (score === 'good') {
                addLog({ text: '[ KẾT QUẢ ] Miễn cưỡng vượt qua, tuy có chút chật vật nhưng vẫn an toàn.', type: 'info' });
                onEventResult({ cultivation: 5 });
            } else {
                addLog({ text: '[ KẾT QUẢ ] Thất bại! Cấm chế phản phệ khiến thần hồn chấn động, nội tức rối loạn.', type: 'danger' });
                onEventResult({ hp: -20, daoHeart: -1 });
            }
        }
    }, 500);
  };

  const handleMinigameCancel = () => {
    setActiveMinigame(null);
  };

  // Initial greeting
  useEffect(() => {
    if (logs.length === 0) {
      addLog({ text: 'Ngươi đã tiến vào vùng ven của Vạn Thú Sơn Mạch. Sương mù dày đặc che khuất tầm nhìn, thỉnh thoảng có tiếng gầm gừ vọng lại từ sâu thẳm. Hãy cẩn thận từng bước đi...', type: 'info' });
    }
  }, []);

  return (
    <div className="w-full h-full bg-[#0c1015] flex flex-col relative overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#c2964a]/30 bg-[#151b23] shrink-0">
          <div>
            <h2 className="text-[#c2964a] text-xl font-bold uppercase tracking-wider">VẠN THÚ SƠN MẠCH - KÝ SỰ</h2>
            <p className="text-gray-500 text-xs mt-1">Sơn mạch hung hiểm, cơ duyên và tử vong cùng tồn tại.</p>
          </div>
          <button 
            onClick={onReturn}
            className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded text-sm"
          >
            [ RỜI KHỎI ]
          </button>
        </div>

        {/* Logs Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {logs.map((log) => (
            <div key={log.id} className="animate-fade-in-up">
              <div className="text-[#c2964a]/60 text-xs mb-1">--- THÁNG THỨ {log.month} ---</div>
              
              <div className={`p-4 rounded-lg border-l-4 ${
                log.type === 'reward' ? 'border-[#34d399] bg-[#34d399]/5 text-[#34d399]' :
                log.type === 'danger' ? 'border-red-500 bg-red-500/5 text-red-400' :
                log.type === 'minigame' ? 'border-[#818cf8] bg-[#818cf8]/5 text-[#818cf8]' :
                'border-gray-500 bg-gray-500/5 text-gray-300'
              }`}>
                {log.text}
                
                {log.type === 'minigame' && log.minigameId && !log.isCompleted && (
                  <div className="mt-4">
                    <button
                      onClick={() => startMinigame(log.minigameId!)}
                      className="px-6 py-2 bg-[#818cf8]/20 border border-[#818cf8] text-[#818cf8] hover:bg-[#818cf8] hover:text-white transition-colors font-bold rounded shadow-[0_0_15px_rgba(129,140,248,0.3)] animate-pulse"
                    >
                      [ THAM GIA THỬ THÁCH ]
                    </button>
                  </div>
                )}
                {log.type === 'minigame' && log.isCompleted && (
                  <div className="mt-4 opacity-50 text-xs italic">
                    [ Đã vượt qua thử thách ]
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="animate-pulse flex items-center gap-2 text-gray-500 p-4">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-2 text-sm italic">Đang tiến về phía trước...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#c2964a]/30 bg-[#151b23] flex justify-center">
          <button
            onClick={generateEvent}
            disabled={isTyping || (logs.length > 0 && logs[logs.length - 1].type === 'minigame' && !logs[logs.length - 1].isCompleted)}
            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-[#c2964a]/20 to-[#8b6932]/20 border border-[#c2964a] text-[#f5e6cd] font-bold text-lg hover:from-[#c2964a] hover:to-[#8b6932] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-[0_0_20px_rgba(194,150,74,0.2)]"
          >
            [ TIẾP TỤC THÁM HIỂM (Qua 1 Tháng) ]
          </button>
        </div>

      {/* MINIGAME OVERLAYS */}
      {activeMinigame === 'MemoryHerb' && <MemoryHerbGame onComplete={(s) => handleMinigameComplete(s, 1)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'WhackAMole' && <WhackAMoleGame onComplete={(s) => handleMinigameComplete(s, 1)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'TimingBar' && <TimingBarGame onComplete={(s) => handleMinigameComplete(s, 1)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'Minesweeper' && <MinesweeperLiteGame onComplete={(s) => handleMinigameComplete(s, 1)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'SwipeDirection' && <SwipeDirectionGame onComplete={(s) => handleMinigameComplete(s, 1)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'CatchDrops' && <CatchDropsGame onComplete={(s) => handleMinigameComplete(s, 1)} onCancel={handleMinigameCancel} />}

      {activeMinigame === 'BulletHell' && <BulletHellGame onComplete={(s) => handleMinigameComplete(s, 2)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'SpamClick' && <SpamClickGame onComplete={(s) => handleMinigameComplete(s, 2)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'RedLightGreenLight' && <RedLightGreenLightGame onComplete={(s) => handleMinigameComplete(s, 2)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'QuickReaction' && <QuickReactionGame onComplete={(s) => handleMinigameComplete(s, 2)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'Mastermind' && <MastermindGame onComplete={(s) => handleMinigameComplete(s, 2)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'Tracking' && <TrackingGame onComplete={(s) => handleMinigameComplete(s, 2)} onCancel={handleMinigameCancel} />}

      {/* Group 3 */}
      {activeMinigame === 'BalanceYinYang' && <BalanceYinYangGame onComplete={(s) => handleMinigameComplete(s, 3)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'SimonSays' && <SimonSaysGame onComplete={(s) => handleMinigameComplete(s, 3)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'TypingMantra' && <TypingMantraGame onComplete={(s) => handleMinigameComplete(s, 3)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'LockPicking' && <LockPickingGame onComplete={(s) => handleMinigameComplete(s, 3)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'WordScramble' && <WordScrambleGame onComplete={(s) => handleMinigameComplete(s, 3)} onCancel={handleMinigameCancel} />}
      {activeMinigame === 'FlappySword' && <FlappySwordGame onComplete={(s) => handleMinigameComplete(s, 3)} onCancel={handleMinigameCancel} />}
    </div>
  );
}
