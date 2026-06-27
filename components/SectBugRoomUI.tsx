import React, { useState } from 'react';
import type { GameState, SpiritBugInstance, BugJob } from '../types';
import { BUG_SPECIES, BUG_RARITIES } from '../lib/bugs';

interface SectBugRoomUIProps {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  onClose: () => void;
}

export default function SectBugRoomUI({ game, setGame, onClose }: SectBugRoomUIProps) {
  const [activeTab, setActiveTab] = useState<'manage' | 'assign' | 'fusion' | 'collection'>('manage');
  
  const bugs = game.bugs || [];
  const collection = game.bugCollection || {};

  const handleFeed = (bugId: string) => {
    // Basic feeding logic - increases exp and age slightly
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        bugs: (prev.bugs || []).map(b => {
          if (b.id !== bugId) return b;
          return {
            ...b,
            exp: b.exp + 20,
            age: b.age + 1
            // TODO: handle stage up when exp > threshold
          };
        })
      };
    });
  };

  const handleAssignJob = (bugId: string, job: BugJob) => {
    setGame(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        bugs: (prev.bugs || []).map(b => b.id === bugId ? { ...b, job } : b)
      };
    });
  };

  const renderManage = () => {
    if (bugs.length === 0) return <div className="text-on-surface-variant p-4">Trùng thất trống rỗng. Hãy đi Dược Viên bắt linh trùng!</div>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-[500px] overflow-y-auto custom-scrollbar">
        {bugs.map(bug => (
          <div key={bug.id} className="border border-outline-variant p-4 bg-surface-container-low flex flex-col gap-2">
            <div className="flex justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-primary">{bug.name} ({bug.stage})</span>
              <span className="text-xs text-secondary border border-secondary px-1">{bug.element}</span>
            </div>
            <div className="text-sm">
              <div><span className="text-on-surface-variant">Tuổi thọ:</span> {bug.age}/{bug.lifespan} tháng</div>
              <div><span className="text-on-surface-variant">Ngộ tính:</span> {bug.comprehension}</div>
              <div><span className="text-on-surface-variant">Tính cách:</span> {bug.personality}</div>
              <div><span className="text-on-surface-variant">Kinh nghiệm:</span> {bug.exp}/100</div>
            </div>
            <button 
              onClick={() => handleFeed(bug.id)}
              className="mt-auto px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-black transition-colors"
            >
              CHO ĂN (Tốn 1 Linh Thạch)
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderAssign = () => {
    if (bugs.length === 0) return <div className="text-on-surface-variant p-4">Không có linh trùng để phân công.</div>;
    return (
      <div className="p-4 flex flex-col gap-4">
        <p className="text-on-surface-variant text-sm">Giao nhiệm vụ cho Linh Trùng để chúng mang lại lợi ích cho bạn.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bugs.map(bug => (
            <div key={bug.id} className="border border-outline-variant p-4 bg-surface-container-low flex flex-col gap-2">
               <div className="font-bold text-primary border-b border-outline-variant pb-2">{bug.name}</div>
               <div className="text-sm text-secondary mb-2">Trạng thái: {bug.job === 'none' ? 'Đang rảnh rỗi' : bug.job}</div>
               <select 
                 value={bug.job}
                 onChange={(e) => handleAssignJob(bug.id, e.target.value as BugJob)}
                 className="bg-black border border-outline-variant text-primary p-2 outline-none"
               >
                 <option value="none">Nghỉ ngơi</option>
                 <option value="herb_garden">🌿 Trông coi Dược Viên</option>
                 <option value="cultivation">🧘 Hộ đạo Bế Quan</option>
                 <option value="exploration">🗺️ Thám hiểm Sơn Mạch</option>
                 <option value="production">🕸️ Chế tạo Vật Liệu</option>
               </select>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCollection = () => {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[500px] overflow-y-auto custom-scrollbar">
        {BUG_SPECIES.map(species => {
          const unlocked = collection[species.id];
          return (
            <div key={species.id} className={`border p-4 flex flex-col gap-2 transition-all ${unlocked ? 'border-primary bg-surface-container' : 'border-outline-variant/30 opacity-50 grayscale'}`}>
              <div className="font-bold text-lg text-primary">{unlocked ? species.name : '???'}</div>
              <div className="text-sm text-on-surface-variant h-16">{unlocked ? species.description : 'Chưa thu thập...'}</div>
              <div className="text-xs border-t border-outline-variant pt-2 mt-auto">
                Nguyên tố: {unlocked ? species.element : '???'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFusion = () => {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[500px] border border-outline-variant bg-surface-container-low text-on-surface-variant text-center">
        <div className="text-4xl mb-4">🔮</div>
        <h3 className="text-xl text-primary font-bold mb-2">Đỉnh Dung Hợp</h3>
        <p className="max-w-md">Tính năng Đỉnh Dung Hợp đang được xây dựng. Sắp tới bạn sẽ có thể kết hợp 2 Linh Trùng để tạo ra Đột Biến!</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-fade-in p-4">
      <div className="flex justify-between items-end mb-4 border-b border-outline-variant pb-2">
        <h2 className="text-2xl font-bold text-primary tracking-widest">[ TRÙNG THẤT ]</h2>
        <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">[ ĐÓNG ]</button>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 border transition-colors ${activeTab === 'manage' ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>Nuôi Dưỡng</button>
        <button onClick={() => setActiveTab('assign')} className={`px-4 py-2 border transition-colors ${activeTab === 'assign' ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>Bố Trí</button>
        <button onClick={() => setActiveTab('fusion')} className={`px-4 py-2 border transition-colors ${activeTab === 'fusion' ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>Dung Hợp</button>
        <button onClick={() => setActiveTab('collection')} className={`px-4 py-2 border transition-colors ${activeTab === 'collection' ? 'border-primary text-primary bg-primary/10' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>Vạn Trùng Phổ</button>
      </div>

      <div className="flex-1 bg-black border border-outline-variant relative overflow-hidden">
        {activeTab === 'manage' && renderManage()}
        {activeTab === 'assign' && renderAssign()}
        {activeTab === 'fusion' && renderFusion()}
        {activeTab === 'collection' && renderCollection()}
      </div>
    </div>
  );
}
