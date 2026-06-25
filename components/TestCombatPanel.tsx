'use client';

import { useState } from 'react';
import combatConfig from '../data/combat-config.json';
import CombatModal from './CombatModal';
import { GameState, CombatEnemy, CombatState } from '../types';
import { startCombat, resolveCombatAction, finishCombat } from '../lib/combat-system';

type FighterConfig = {
  realm: string;
  physique: string;
};

const REALMS: any[] = combatConfig.realms as any;
const PHYSIQUES: any[] = combatConfig.physiques as any;
const NPC_TEMPLATES = combatConfig.npcs;

const DEFAULT_PLAYER: FighterConfig = {
  realm: 'qi_1',
  physique: 'spirit_root',
};

const DEFAULT_ENEMY: FighterConfig = {
  realm: 'qi_1',
  physique: 'iron_body',
};

type Props = {
  onExit: () => void;
};

export default function TestCombatPanel({ onExit }: Props) {
  const [phase, setPhase] = useState<'setup' | 'combat'>('setup');
  const [playerConfig, setPlayerConfig] = useState<FighterConfig>(DEFAULT_PLAYER);
  const [enemyConfig, setEnemyConfig] = useState<FighterConfig>(DEFAULT_ENEMY);
  const [npcName, setNpcName] = useState('Áo Ảnh Tâm Ma');
  
  const [dummyGameState, setDummyGameState] = useState<GameState | null>(null);

  const updateConfig = (side: 'player' | 'enemy', key: keyof FighterConfig, value: string) => {
    const setter = side === 'player' ? setPlayerConfig : setEnemyConfig;
    setter((current) => ({ ...current, [key]: value }));
  };

  const getStats = (config: FighterConfig) => {
    const realm = REALMS.find(r => r.id === config.realm) || REALMS[0];
    const physique = PHYSIQUES.find(p => p.id === config.physique) || PHYSIQUES[0];
    
    return {
      hp: 100 + (realm.bonus?.max_hp || 0) + (physique.bonus?.max_hp || 0),
      attack: 15 + (realm.bonus?.attack || 0) + (physique.bonus?.attack || 0),
      speed: 10 + (realm.bonus?.speed || 0) + (physique.bonus?.speed || 0),
      defense: 10 + (realm.bonus?.defense || 0) + (physique.bonus?.defense || 0),
      luck: 5,
      comprehension: 8
    };
  };

  const handleStart = () => {
    const pStats = getStats(playerConfig);
    const eStats = getStats(enemyConfig);

    const enemy: CombatEnemy = {
      id: 'test_enemy',
      name: npcName,
      avatar: '',
      maxHp: eStats.hp,
      currentHp: eStats.hp,
      speed: eStats.speed,
      attack: eStats.attack,
      defense: eStats.defense,
      description: 'Test Enemy'
    };

    const dummyState: GameState = {
      run: 1,
      life: 1,
      age: 20,
      alive: true,
      realm: 'Qi Refinement', // Approx
      subStageIndex: 1,
      stats: {
        health: pStats.hp,
        luck: pStats.luck,
        comprehension: pStats.comprehension,
        karma: 0,
        cultivation: 100,
        lifespan: 100,
        daoHeart: 50,
        speed: pStats.speed,
        toxicity: 0,
        spiritualRoot: 'Thiên Linh Căn'
      },
      inheritance: { blessing: 0, ancestralMemory: 0, legacyPower: 0 },
      log: [],
      currentEvent: null,
      lastMessage: { vi: '', en: '' },
      month: 1,
      isTicking: false,
      currentLocation: 'mountain',
    };

    setDummyGameState(startCombat(dummyState, enemy));
    setPhase('combat');
  };

  if (phase === 'combat' && dummyGameState?.activeCombat) {
    return (
      <div className="fixed inset-0 z-[100]">
        <CombatModal 
          state={dummyGameState} 
          onAction={(action) => setDummyGameState(resolveCombatAction(dummyGameState, action))}
          onClose={() => {
            const finalState = finishCombat(dummyGameState);
            // reset to setup
            setDummyGameState(null);
            setPhase('setup');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface/90 backdrop-blur border border-accent rounded-lg shadow-lg flex flex-col overflow-hidden text-lunar font-serif p-6 max-w-4xl mx-auto my-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-accent/30">
        <h2 className="text-2xl font-bold text-accent tracking-widest">THỬ NGHIỆM CHIẾN ĐẤU (NEW ENGINE)</h2>
        <button 
          onClick={onExit}
          className="px-4 py-2 text-sm font-medium rounded border border-lunar/25 hover:border-lunar hover:bg-lunar/10 transition"
        >
          Trở Về
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Player Setup */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-400">NHÂN VẬT</h3>
          <div>
            <label className="block text-sm text-lunar/70 mb-1">Cảnh Giới</label>
            <select 
              value={playerConfig.realm}
              onChange={(e) => updateConfig('player', 'realm', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-lunar"
            >
              {REALMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-lunar/70 mb-1">Thể Chất</label>
            <select 
              value={playerConfig.physique}
              onChange={(e) => updateConfig('player', 'physique', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-lunar"
            >
              {PHYSIQUES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Enemy Setup */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-red-400">KẺ ĐỊCH</h3>
          <div>
            <label className="block text-sm text-lunar/70 mb-1">Tên Kẻ Địch</label>
            <input 
              type="text"
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-lunar"
            />
          </div>
          <div>
            <label className="block text-sm text-lunar/70 mb-1">Cảnh Giới</label>
            <select 
              value={enemyConfig.realm}
              onChange={(e) => updateConfig('enemy', 'realm', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-lunar"
            >
              {REALMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-lunar/70 mb-1">Thể Chất</label>
            <select 
              value={enemyConfig.physique}
              onChange={(e) => updateConfig('enemy', 'physique', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-lunar"
            >
              {PHYSIQUES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-auto pt-8 border-t border-accent/20">
        <button 
          onClick={handleStart}
          className="px-12 py-4 bg-red-900 hover:bg-red-800 text-white font-bold rounded shadow-[0_0_15px_rgba(220,38,38,0.5)] transition text-lg tracking-widest"
        >
          BẮT ĐẦU CHIẾN ĐẤU
        </button>
      </div>
    </div>
  );
}
