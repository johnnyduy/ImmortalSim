import React, { useState } from 'react';
import type { GameState, Realm } from '../types';
import { getMenuEvent, createNewGame } from '../lib/engine';
import { getRealmSubStage } from '../lib/cultivation-states';

interface Props {
  game: GameState | null | undefined;
  onChangeGame: (game: GameState) => void;
  onClose: () => void;
  combatConfig: any;
  sects: any[];
}

type SectRankType = 'ngoại_môn' | 'nội_môn' | 'chân_truyền' | 'trưởng_lão';
type GenderType = 'nam' | 'nữ';

export default function TestCharacterTab({ game, onChangeGame, onClose, combatConfig, sects }: Props) {
  const [realm, setRealm] = useState<Realm>('Foundation Establishment');
  const [subStageIndex, setSubStageIndex] = useState<number>(11);
  const [spiritStones, setSpiritStones] = useState<number>(500);
  const [sectRank, setSectRank] = useState<SectRankType>('chân_truyền');
  const [selectedSectId, setSelectedSectId] = useState<string>(sects?.[0]?.id || 'huyen_thien_tong');
  const [gender, setGender] = useState<GenderType>('nam');
  const [spiritualRoot, setSpiritualRoot] = useState<string>('thiên_linh_căn');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);

  const realmOptions: { value: string, label: string }[] = [
    { value: 'Mortal|0', label: 'Phàm Nhân' },
    { value: 'Qi Refinement|1', label: 'Luyện Khí Tầng 1' },
    { value: 'Qi Refinement|3', label: 'Luyện Khí Tầng 3' },
    { value: 'Qi Refinement|6', label: 'Luyện Khí Tầng 6' },
    { value: 'Qi Refinement|9', label: 'Luyện Khí Tầng 9' },
    { value: 'Foundation Establishment|10', label: 'Trúc Cơ Sơ Kỳ' },
    { value: 'Foundation Establishment|11', label: 'Trúc Cơ Trung Kỳ' },
    { value: 'Foundation Establishment|12', label: 'Trúc Cơ Hậu Kỳ' },
    { value: 'Golden Core|13', label: 'Kim Đan Sơ Kỳ' },
    { value: 'Golden Core|14', label: 'Kim Đan Trung Kỳ' },
    { value: 'Golden Core|15', label: 'Kim Đan Hậu Kỳ' },
    { value: 'Golden Core|16', label: 'Kim Đan Viên Mãn' },
    { value: 'Nascent Soul|17', label: 'Nguyên Anh Sơ Kỳ' },
    { value: 'Nascent Soul|18', label: 'Nguyên Anh Trung Kỳ' },
    { value: 'Nascent Soul|19', label: 'Nguyên Anh Hậu Kỳ' }
  ];

  const spiritualRootOptions = [
    { value: 'ngũ_hành', label: 'Ngũ Hành (Tạp linh căn)' },
    { value: 'kim', label: 'Kim Linh Căn' },
    { value: 'mộc', label: 'Mộc Linh Căn' },
    { value: 'thủy', label: 'Thủy Linh Căn' },
    { value: 'hỏa', label: 'Hỏa Linh Căn' },
    { value: 'thổ', label: 'Thổ Linh Căn' },
    { value: 'thiên_linh_căn', label: 'Thiên Linh Căn (Tuyệt đỉnh)' }
  ];

  const availableTechniques = combatConfig?.techniques || [];

  const handleToggleTechnique = (id: string) => {
    setSelectedTechniques(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    // 1. Create a deep copy of game state, or initialize a new one if it doesn't exist
    let newState: GameState;
    if (game && game.alive) {
      newState = JSON.parse(JSON.stringify(game));
    } else {
      // Use default start to ensure all base variables, world state, etc. are properly populated
      newState = createNewGame(
        {
          legacyPower: 0,
          ancestralMemory: 0,
          blessing: 0,
          unlockedTechniques: {},
          unlockedItems: [],
        },
        1,
        'vi'
      );
    }

    // 2. Update Demographics
    newState.gender = gender;
    newState.stats.spiritualRoot = spiritualRoot;

    // 3. Update Realm
    newState.realm = realm;
    newState.subStageIndex = subStageIndex;

    // Give some base cultivation to avoid de-leveling
    if (realm === 'Mortal') newState.stats.cultivation = 0;
    else if (realm === 'Qi Refinement') newState.stats.cultivation = subStageIndex * 2;
    else if (realm === 'Foundation Establishment') newState.stats.cultivation = subStageIndex === 10 ? 10 : subStageIndex === 11 ? 16 : 25;
    else if (realm === 'Golden Core') newState.stats.cultivation = subStageIndex === 13 ? 50 : subStageIndex === 14 ? 65 : subStageIndex === 15 ? 80 : 95;
    else if (realm === 'Nascent Soul') newState.stats.cultivation = subStageIndex === 17 ? 120 : subStageIndex === 18 ? 150 : 200;

    // Update base stats (HP) using cultivation-states
    const stageInfo = getRealmSubStage(newState.stats.cultivation, realm, subStageIndex);
    newState.stats.health = 100 + (stageInfo.bonus?.max_hp || 0);

    // 4. Update Spirit Stones
    newState.spiritStones = spiritStones;

    // 5. Update Sect Rank
    newState.sectRank = sectRank;
    newState.currentLocation = 'sect';
    newState.sect = selectedSectId;

    if (!newState.worldState) {
        newState.worldState = { date: 1, lastUpdate: 1, sects: {} } as any; 
    }

    // 6. Update Techniques
    newState.techniques = selectedTechniques.map(id => ({
      id,
      level: 1,
      progress: 100,
      isActive: true,
      fragments: 10
    })) as any[];

    // 7. Set current event to sect menu
    newState.currentEvent = getMenuEvent('menu_monthly_plan', newState, 'vi');

    // Save and close
    onChangeGame(newState);
    onClose();
  };

  return (
    <div className="p-6 bg-[#0a0806] min-h-[50vh] text-text-primary">
      <h2 className="text-2xl font-serif text-emerald-400 mb-6">🛠️ Test Nhân Vật (Debug)</h2>
      <p className="text-sm text-text-tertiary mb-8">
        Thay đổi nhanh các chỉ số của nhân vật và dịch chuyển thẳng vào giao diện Menu Tông Môn.
        (Nếu chưa có save game, nút bên dưới sẽ tự động tạo một thế giới mới).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Giới Tính</label>
            <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-text-primary focus:border-emerald-500 outline-none"
              value={gender}
              onChange={(e) => setGender(e.target.value as GenderType)}
            >
              <option value="nam">Nam</option>
              <option value="nữ">Nữ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Linh Căn</label>
            <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-text-primary focus:border-emerald-500 outline-none"
              value={spiritualRoot}
              onChange={(e) => setSpiritualRoot(e.target.value)}
            >
              {spiritualRootOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Cảnh Giới</label>
            <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-text-primary focus:border-emerald-500 outline-none"
              value={`${realm}|${subStageIndex}`}
              onChange={(e) => {
                const [r, s] = e.target.value.split('|');
                setRealm(r as Realm);
                setSubStageIndex(parseInt(s, 10));
              }}
            >
              {realmOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Linh Thạch</label>
            <input 
              type="number" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-text-primary focus:border-emerald-500 outline-none"
              value={spiritStones}
              onChange={(e) => setSpiritStones(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tông Môn Gia Nhập</label>
            <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-text-primary focus:border-emerald-500 outline-none"
              value={selectedSectId}
              onChange={(e) => setSelectedSectId(e.target.value)}
            >
              {sects && sects.map(s => (
                <option key={s.id} value={s.id}>{s.name?.vi || s.id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Thân Phận Tông Môn</label>
            <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-text-primary focus:border-emerald-500 outline-none"
              value={sectRank}
              onChange={(e) => setSectRank(e.target.value as SectRankType)}
            >
              <option value="ngoại_môn">Ngoại Môn</option>
              <option value="nội_môn">Nội Môn</option>
              <option value="chân_truyền">Chân Truyền</option>
              <option value="trưởng_lão">Trưởng Lão</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Công Pháp & Vũ Kĩ (Chọn để cấp trực tiếp)</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3 h-96 overflow-y-auto space-y-2">
            {availableTechniques.length > 0 ? (
              availableTechniques.map((tech: any) => (
                <label key={tech.id} className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-zinc-800 rounded transition">
                  <input 
                    type="checkbox"
                    className="form-checkbox text-emerald-500 bg-zinc-950 border-zinc-800 focus:ring-0 focus:ring-offset-0 rounded"
                    checked={selectedTechniques.includes(tech.id)}
                    onChange={() => handleToggleTechnique(tech.id)}
                  />
                  <div className="flex flex-col">
                    <span className="text-text-primary group-hover:text-emerald-400 transition">{tech.label}</span>
                    <span className="text-xs text-text-tertiary">{tech.type} - {tech.tier}</span>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-sm text-text-tertiary">Chưa tải được danh sách công pháp.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800 max-w-lg">
        <button 
          type="button"
          onClick={handleApply}
          className="w-full py-3 bg-[#10b981] text-black font-medium hover:bg-[#34d399] rounded transition shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:shadow-[0_0_25px_rgba(229,193,123,0.5)]"
        >
          {game && game.alive ? 'Áp Dụng & Bắt Đầu Test' : 'Khởi Tạo Thế Giới & Bắt Đầu Test'}
        </button>
      </div>
    </div>
  );
}
