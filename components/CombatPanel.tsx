'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useCombatEngine } from '../docs/useCombatEngine';
import type { Character, CombatAction, CombatEnvironment, StatSnapshot } from '../docs/CombatState';
import type { ChoiceRule } from '../docs/ChoiceGenerator';
import combatConfig from '../data/combat-config.json';

const BASIC_ACTIONS: CombatAction[] = [
  {
    id: 'act_basic_strike',
    name: '⚡ Tấn Công Cơ Bản (Basic Strike)',
    narrativeTags: ['sword'],
    intentType: 'sword',
    dangerRating: 4,
    narrative_template: '{source.name} tụ linh lực vào bàn tay oanh kích thẳng về phía trước.',
    effects: [
      {
        type: 'damage',
        formula: 'self.attack * 1.0',
        target: 'enemy',
        narrative_template: 'Đòn đánh trúng mục tiêu, gây {amount} sát thương lên {target.name}.'
      }
    ]
  },
  {
    id: 'act_meditate',
    name: '🧘 Tịnh Tâm Điều Tức (Meditate & Channel)',
    narrativeTags: ['lotus', 'calm'],
    intentType: 'lotus',
    dangerRating: 2,
    narrative_template: '{source.name} khép hờ mắt, điều hòa chu thiên chân khí để phục hồi bản thể.',
    effects: [
      {
        type: 'heal',
        formula: 'self.max_hp * 0.15 + self.qi_control',
        target: 'self',
        narrative_template: '{target.name} khôi phục {amount} khí huyết.'
      },
      {
        type: 'restore_resource',
        resource: 'qi',
        formula: 'self.comprehension * 1.2',
        target: 'self',
        narrative_template: '{target.name} thổ nạp linh khí, khôi phục {amount} linh dịch.'
      }
    ]
  }
];

type Props = {
  playerChar: Character;
  enemyChar: Character;
  env: CombatEnvironment;
  onFinished: (winner: 'player' | 'enemy' | 'escaped', logs: string[]) => void;
};

export default function CombatPanel({ playerChar, enemyChar, env, onFinished }: Props) {
  const startedCombatKeyRef = useRef<string | null>(null);
  const autoFinishedRef = useRef(false);

  // Extract actions from player active techniques
  const allActions = useMemo(() => {
    const list = [...BASIC_ACTIONS];
    // Add enemy arts to combat actions so AI can decice to cast them
    const enemyArts = (combatConfig.enemy_arts || []).map((art: any) => art.action);
    list.push(...enemyArts);
    
    // Check combatConfig techniques and map to active techniques
    const techniques = combatConfig.techniques || [];
    playerChar.tags.forEach(techId => {
      const configTech = techniques.find((t: any) => t.id === techId);
      if (configTech && configTech.action) {
        list.push({
          ...configTech.action,
          narrativeTags: configTech.action.narrativeTags as any
        } as CombatAction);
      }
    });

    return list;
  }, [playerChar]);

  // Map actions to choice rules
  const allChoices = useMemo(() => {
    return allActions.map(action => ({
      id: `choice_${action.id}`,
      name: action.name,
      requirements: {},
      action_id: action.id
    }));
  }, [allActions]);

  const {
    playerStats,
    enemyStats,
    combatLogs,
    activeChoices,
    combatPhase,
    winner,
    battlefieldTension,
    startCombat,
    handleChoice
  } = useCombatEngine(allChoices, allActions);

  const combatKey = useMemo(
    () => `${playerChar.id}:${enemyChar.id}:${env.id}`,
    [playerChar.id, enemyChar.id, env.id]
  );

  // Auto-start combat when component mounts
  useEffect(() => {
    if (startedCombatKeyRef.current === combatKey) return;
    startedCombatKeyRef.current = combatKey;
    startCombat(playerChar, enemyChar, env);
  }, [combatKey, playerChar, enemyChar, env, startCombat]);

  // Handle escape (Nhiên Huyết Thuật)
  const handleEscape = () => {
    onFinished('escaped', combatLogs);
  };

  // Exit callback when combat completes
  const handleExit = () => {
    onFinished(winner || 'enemy', combatLogs);
  };

  useEffect(() => {
    if (combatPhase !== 'finished' || winner !== 'enemy' || autoFinishedRef.current) return;
    autoFinishedRef.current = true;
    const timer = window.setTimeout(() => {
      onFinished('enemy', combatLogs);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [combatPhase, winner, combatLogs, onFinished]);

  const matchupText = useMemo(() => {
    if (!playerStats || !enemyStats) return '';
    const pCP = playerChar.realm_tier * 100 + playerStats.attack * 5;
    const eCP = enemyChar.realm_tier * 100 + enemyStats.attack * 5;
    if (pCP > eCP * 1.3) return 'Linh áp của bạn lấn lướt hoàn toàn đối thủ. Trận chiến này phần thắng rất cao.';
    if (eCP > pCP * 1.3) return 'Khí tức của đối phương áp đảo dữ dội. Trận chiến này vô cùng nguy hiểm!';
    return 'Linh lực hai bên ngang ngửa, thế cục cân bằng giằng co.';
  }, [playerStats, enemyStats, playerChar, enemyChar]);

  return (
    <div className="flex flex-col gap-6 py-6 px-5 sm:px-8 bg-[#0c0a09]/95 border-2 border-[#c5a059] shadow-[8px_8px_0px_#000] rounded-sm text-text-primary max-w-xl w-full mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#3e3328]/55 pb-2">
          <span className="text-xs uppercase tracking-widest text-[#847764] font-serif">Đấu Pháp Ao Cảnh</span>
          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 bg-orange-950/40 border border-orange-800/40 text-orange-400 text-[10px] font-serif uppercase tracking-widest font-bold">
              Tension: {battlefieldTension}%
            </span>
            <span className="px-2.5 py-0.5 bg-red-950/40 border border-red-800/40 text-red-400 text-[10px] font-serif uppercase tracking-widest font-bold">
              {combatPhase === 'finished' ? 'Kết thúc' : 'Quyết đấu'}
            </span>
          </div>
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#e5c17b] tracking-wider uppercase">
          ⚔️ Đối Đầu: {enemyChar.name}
        </h2>
        <p className="text-sm font-serif italic text-[#e8dcc0] border-l-2 border-[#c5a059] pl-3 py-1">
          {matchupText}
        </p>
      </div>

      {/* HP/Qi Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-[#3e3328]/55 py-4">
        {/* Player Stats */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-[#c5a059] font-serif flex justify-between">
            <span>Bản Tôn (Tu Sĩ)</span>
            <span className="text-xs text-[#847764]">Realm {playerChar.realm_tier}</span>
          </p>
          {playerStats && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>HP: {playerStats.hp} / {playerStats.max_hp}</span>
              </div>
              <div className="h-1.5 w-full bg-red-950 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (playerStats.hp / playerStats.max_hp) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span>Qi: {playerStats.qi} / {playerStats.max_qi}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-950 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (playerStats.qi / playerStats.max_qi) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Enemy Stats */}
        <div className="space-y-2 md:border-l md:border-[#3e3328]/45 md:pl-4">
          <p className="text-sm font-bold text-red-400 font-serif flex justify-between">
            <span>{enemyChar.name}</span>
            <span className="text-xs text-[#847764]">Realm {enemyChar.realm_tier}</span>
          </p>
          {enemyStats && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>HP: {enemyStats.hp} / {enemyStats.max_hp}</span>
              </div>
              <div className="h-1.5 w-full bg-red-950 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-red-800 transition-all duration-300"
                  style={{ width: `${Math.max(0, (enemyStats.hp / enemyStats.max_hp) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span>Qi: {enemyStats.qi} / {enemyStats.max_qi}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-950 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-blue-800 transition-all duration-300"
                  style={{ width: `${Math.max(0, (enemyStats.qi / enemyStats.max_qi) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decisions section */}
      <section className="space-y-3 py-2">
        <p className="text-xs uppercase tracking-widest text-[#847764] font-serif font-bold">Nghi thức ra chiêu</p>
        <div className="flex flex-col gap-2">
          {combatPhase === 'finished' ? (
            <button
              type="button"
              onClick={handleExit}
              className="w-full text-center px-6 py-3 rounded-sm border-2 border-[#c5a059] bg-[#1a1512] text-[#e5c17b] font-serif font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-black transition-all duration-200"
            >
              Thu Liễm Chân Khí (Exit Combat)
            </button>
          ) : combatPhase === 'awaiting_player' ? (
            <div className="flex flex-col gap-2">
              {activeChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleChoice(choice)}
                  className="block w-full text-left px-4 py-3 rounded-sm border border-[#c5a059]/60 bg-[#1e1915]/80 text-[#e5c17b] font-serif text-sm hover:bg-[#c5a059] hover:text-black hover:border-[#c5a059] transition-all duration-150"
                >
                  {choice.name}
                </button>
              ))}
              <button
                type="button"
                onClick={handleEscape}
                className="block w-full text-left px-4 py-3 rounded-sm border border-red-950 bg-red-950/20 text-red-400 font-serif text-sm hover:bg-red-900 hover:text-white transition-all duration-150 mt-2"
              >
                🔥 Nhiên Huyết Thuật (Hao Tổn 40% Sinh Lực Thoát Thân)
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-xs italic text-[#847764] animate-pulse">
              Đang ngưng khí hóa thần... (Resolving turns)
            </div>
          )}
        </div>
      </section>

      {/* Combat Log narrative */}
      <div className="space-y-3 pt-4 border-t border-[#3e3328]/55">
        <p className="text-xs font-serif font-bold uppercase tracking-widest text-[#c5a059]">
          Nhật ký đấu pháp (Battle Log)
        </p>
        <div className="max-h-48 space-y-2 overflow-y-auto pt-1 pr-2 text-xs sm:text-sm font-serif leading-relaxed text-[#e8dcc0] flex flex-col gap-1.5 scrollbar-thin">
          {combatLogs.map((log, index) => (
            <p key={index} className="border-b border-[#3e3328]/15 pb-1 last:border-0 last:text-white font-medium">
              {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
