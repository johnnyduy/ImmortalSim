import { useState } from 'react';
import { GameState, SpiritBeast } from '../types';
import { uiText } from '../lib/i18n';

interface BeastBagViewProps {
  state: GameState;
  onUpdateState: (newState: GameState) => void;
  language: 'vi' | 'en';
}

export default function BeastBagView({ state, onUpdateState, language }: BeastBagViewProps) {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const pets = state.pets || [];
  const activePetId = state.activePetId;

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const handleEquip = (petId: string) => {
    const nextState = { ...state };
    if (nextState.activePetId === petId) {
      nextState.activePetId = undefined;
    } else {
      nextState.activePetId = petId;
    }
    onUpdateState(nextState);
  };

  const handleFeed = () => {
    if (!selectedPet) return;
    
    // Find food
    const foodIndex = (state.inventory || []).findIndex(i => i.id.startsWith('item_thuc_an_linh_thu'));
    if (foodIndex === -1) {
      alert("Không có Thức Ăn Linh Thú trong túi đồ!");
      return;
    }

    const nextState = { ...state };
    const inv = [...(nextState.inventory || [])];
    
    // Consume food
    if (inv[foodIndex].quantity && inv[foodIndex].quantity > 1) {
      inv[foodIndex] = { ...inv[foodIndex], quantity: inv[foodIndex].quantity - 1 };
    } else {
      inv.splice(foodIndex, 1);
    }
    nextState.inventory = inv;

    // Update pet
    const petIndex = pets.findIndex(p => p.id === selectedPet.id);
    if (petIndex >= 0) {
      const nextPets = [...pets];
      nextPets[petIndex] = {
        ...nextPets[petIndex],
        hunger: Math.min(100, nextPets[petIndex].hunger + 30),
        loyalty: Math.min(100, nextPets[petIndex].loyalty + 5)
      };
      nextState.pets = nextPets;
    }

    onUpdateState(nextState);
  };

  const handleInteract = () => {
    if (!selectedPet) return;
    const nextState = { ...state };
    const petIndex = pets.findIndex(p => p.id === selectedPet.id);
    if (petIndex >= 0) {
      const nextPets = [...pets];
      nextPets[petIndex] = {
        ...nextPets[petIndex],
        loyalty: Math.min(100, nextPets[petIndex].loyalty + 2)
      };
      nextState.pets = nextPets;
    }
    onUpdateState(nextState);
  };

  return (
    <div className="flex h-full gap-4 text-code-sm">
      {/* Left: Pet List */}
      <div className="w-1/3 border border-outline flex flex-col">
        <div className="bg-surface-variant p-2 font-bold border-b border-outline">
          DANH SÁCH LINH THÚ ({pets.length})
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {pets.length === 0 ? (
            <div className="text-on-surface-variant italic p-2 text-center mt-10">Túi linh thú trống rỗng.</div>
          ) : (
            pets.map(pet => (
              <div 
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={`p-2 border cursor-pointer hover:bg-primary/20 transition-colors ${
                  selectedPetId === pet.id ? 'border-primary bg-primary/10' : 'border-outline'
                } ${activePetId === pet.id ? 'border-l-4 border-l-secondary' : ''}`}
              >
                <div className="font-bold text-primary flex justify-between">
                  <span>{pet.name}</span>
                  {activePetId === pet.id && <span className="text-secondary text-xs material-symbols-outlined">swords</span>}
                </div>
                <div className="text-xs text-on-surface-variant mt-1 flex justify-between">
                  <span>Hệ: {pet.species}</span>
                  <span>Lv: {pet.level}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Pet Details */}
      <div className="w-2/3 border border-outline flex flex-col p-4 relative">
        {!selectedPet ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant italic">
            Chọn một linh thú để xem chi tiết
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-primary uppercase">{selectedPet.name}</h2>
                <div className="text-on-surface-variant">Linh Thú - Bậc {selectedPet.tier.toUpperCase()} - Hệ {selectedPet.species}</div>
              </div>
              <button 
                onClick={() => handleEquip(selectedPet.id)}
                className={`px-4 py-2 border font-bold flex items-center gap-2 ${
                  activePetId === selectedPet.id 
                    ? 'border-error text-error hover:bg-error/20' 
                    : 'border-secondary text-secondary hover:bg-secondary/20'
                }`}
              >
                <span className="material-symbols-outlined">
                  {activePetId === selectedPet.id ? 'close' : 'swords'}
                </span>
                {activePetId === selectedPet.id ? 'THU HỒI' : 'XUẤT CHIẾN'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-outline p-3 bg-surface-variant/30">
                <div className="text-on-surface-variant mb-1 flex justify-between">
                  <span>Độ No: {selectedPet.hunger}/100</span>
                </div>
                <div className="w-full bg-surface h-2 border border-outline">
                  <div className="bg-amber-500 h-full transition-all" style={{width: `${selectedPet.hunger}%`}}></div>
                </div>
              </div>
              <div className="border border-outline p-3 bg-surface-variant/30">
                <div className="text-on-surface-variant mb-1 flex justify-between">
                  <span>Trung Thành: {selectedPet.loyalty}/100</span>
                </div>
                <div className="w-full bg-surface h-2 border border-outline">
                  <div className="bg-pink-500 h-full transition-all" style={{width: `${selectedPet.loyalty}%`}}></div>
                </div>
              </div>
            </div>

            <div className="mb-6 border border-outline p-4 bg-surface-variant/10">
              <h3 className="font-bold text-primary mb-3">CHỈ SỐ TÁC CHIẾN</h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Sinh lực:</span>
                  <span className="font-bold">{selectedPet.stats.health}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tấn công:</span>
                  <span className="font-bold">{selectedPet.stats.attack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Phòng thủ:</span>
                  <span className="font-bold">{selectedPet.stats.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tốc độ:</span>
                  <span className="font-bold">{selectedPet.stats.speed}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-primary mb-2">KỸ NĂNG</h3>
              <div className="flex gap-2 flex-wrap">
                {selectedPet.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary/10 border border-primary/50 text-primary">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4">
              <button 
                onClick={handleFeed}
                className="py-3 border border-amber-500/50 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center gap-2 font-bold"
              >
                <span className="material-symbols-outlined">restaurant</span>
                CHO ĂN
              </button>
              <button 
                onClick={handleInteract}
                className="py-3 border border-pink-500/50 text-pink-500 hover:bg-pink-500/20 flex items-center justify-center gap-2 font-bold"
              >
                <span className="material-symbols-outlined">favorite</span>
                VUỐT VE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
