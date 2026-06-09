import React, { useState, useEffect } from 'react';
import AtmosphericBackground from './AtmosphericBackground';
import EventPanel from './EventPanel';
import ChoiceButton from './ChoiceButton';
import { useCombatEngine } from './useCombatEngine';

// Mock master list of choices that would normally come from your JSON database
const ALL_COMBAT_CHOICES = [
  {
    id: "choice_meditate",
    name: "Meditate on the memories, risking madness.",
    requirements: {},
    action_id: "act_meditate"
  },
  {
    id: "choice_leave",
    name: "Extinguish the candle and leave the temple behind.",
    requirements: {},
    action_id: "act_leave"
  },
  {
    id: "choice_search",
    name: "Search the ruins for the source of the whispering.",
    requirements: {},
    action_id: "act_search"
  },
  {
    id: "choice_counterattack",
    name: "[Trigger] Desperate Counterattack!",
    requirements: {},
    action_id: "act_counterattack"
  }
];

// Mock master list of actions linking to the choices
const ALL_COMBAT_ACTIONS = [
  {
    id: "act_meditate",
    name: "Meditate",
    narrative_template: "{source.name} closes their eyes, diving into chaotic memories...",
    effects: [{ type: "heal", formula: "self.max_hp * 0.1", target: "self", narrative_template: "Amidst the madness, {target.name} finds a sliver of peace, restoring {amount} HP." }]
  },
  {
    id: "act_leave",
    name: "Leave Temple",
    narrative_template: "{source.name} turns away from the whispers and runs into the cold rain.",
    effects: [{ type: "apply_buff", buff_id: "buff_fleeing", target: "self", narrative_template: "{target.name} gains the [Fleeing] state." }]
  },
  {
    id: "act_search",
    name: "Search Ruins",
    narrative_template: "{source.name} draws their weapon, stepping toward the darkest corner of the {env.name}!",
    effects: [{ type: "damage", formula: "self.max_hp * 0.2", target: "enemy", narrative_template: "A sudden strike connects with {target.name}, dealing {amount} damage!" }]
  },
  {
    id: "act_demonic_claw",
    name: "Soul-Seizing Claw",
    narrative_template: "{source.name} lunges with a ghostly claw!",
    effects: [{ type: "damage", formula: "15", target: "enemy", narrative_template: "The claw tears into {target.name}'s spirit, dealing {amount} damage!" }]
  },
  {
    id: "act_blood_frenzy",
    name: "Blood Frenzy",
    narrative_template: "{source.name}'s eyes turn crimson as they burn blood essence!",
    effects: [{ type: "heal", formula: "50", target: "self", narrative_template: "{target.name} recovers {amount} HP through demonic arts." }]
  },
  {
    id: "act_counterattack",
    name: "Desperate Counterattack",
    narrative_template: "{source.name} ignores the pain and strikes back!",
    effects: [{ type: "damage", formula: "self.max_hp * 0.3", target: "enemy", narrative_template: "The counterattack lands heavily, dealing {amount} damage!" }]
  }
];

export default function GameUI() {
  // Mock state for demonstration
  const [gameState, setGameState] = useState('wandering');
  
  const { 
    activeChoices, 
    combatLogs, 
    handleChoice, 
    startCombat 
  } = useCombatEngine(ALL_COMBAT_CHOICES, ALL_COMBAT_ACTIONS);

  // Audio hook preparation (Conceptual)
  useEffect(() => {
    // This is where you would mount your ambient guqin/wind audio 
    // Example: audioManager.playAmbient(gameState);
  }, [gameState]);

  // Function to start combat manually via button
  const handleStartTestCombat = () => {
    const dummyPlayer = { 
      id: 'p1', 
      name: 'Cultivator', 
      realm_tier: 1, 
      base_stats: { hp: 100, max_hp: 100 }, 
      tags: [], 
      buffs: [],
      triggers: [
        { event: 'on_take_damage', condition: "context.amount >= 10", choice_id: "choice_counterattack" }
      ]
    };
    const dummyEnemy = { 
      id: 'e1', 
      name: 'Heart Demon Illusion', 
      realm_tier: 1, // Cùng đẳng cấp (Same tier)
      base_stats: { hp: 120, max_hp: 120 }, // Điều chỉnh HP phù hợp để test
      tags: [], 
      buffs: [],
      ai_rules: [
        { condition: "always", action_id: "act_demonic_claw", weight: 10 },
        { condition: "self.hp < 50", action_id: "act_blood_frenzy", weight: 50 } // Cập nhật lại điều kiện HP
      ]
    };
    const dummyEnv = { id: 'env1', name: 'Ruined Temple', innate_auras: [], unlocked_choices: [] };
    
    setGameState('combat');
    startCombat(dummyPlayer, dummyEnemy, dummyEnv);
  };

  // Build the narrative text from the combat logs or default state
  const narrativeText = combatLogs.length > 0 
    ? combatLogs[combatLogs.length - 1] 
    : "The cold rain washes over the stone steps of the ruined temple. Inside, a single candle flickers, struggling against the damp wind. You sit in silence, fragments of a past life pulling at the edges of your mind. A choice must be made before the dawn breaks.";

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-center bg-black overflow-hidden font-serif selection:bg-rice-400/30 selection:text-rice-100">
      
      <AtmosphericBackground state={gameState} />
      
      {/* Container for content, ensuring mobile responsiveness and centering */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center w-full px-4 sm:px-8 py-12">
        
        {gameState === 'wandering' ? (
          <div className="flex flex-col items-center gap-6 w-full">
            <h1 className="text-4xl font-bold text-rice-200 tracking-widest text-center mb-8">
              TÂM MA ẢO CẢNH
            </h1>
            {/* Bọc các nút vào container giới hạn chiều rộng giống màn hình combat */}
            <div className="w-full max-w-xl flex flex-col gap-3">
              <ChoiceButton 
                delay={300} 
                text="Đặt lại di sản" 
                onClick={() => {}} 
                className="bg-rice-900/50 hover:bg-rice-800/70 border border-rice-600 text-rice-100 font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              />
              <ChoiceButton 
                delay={600} 
                text="Bắt đầu Test Combat (Cùng cảnh giới)" 
                onClick={handleStartTestCombat} 
                className="bg-rice-900/50 hover:bg-rice-800/70 border border-rice-600 text-rice-100 font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>
        ) : (
          <>
            <EventPanel 
              age={18} 
              realm="Mortal"
              text={narrativeText} 
            />

            {/* Choices Container - restricted width for comfortable reading */}
            <div className="w-full max-w-xl mt-8 flex flex-col gap-2">
              {activeChoices.map((choice, index) => (
                <ChoiceButton 
                  key={choice.id} 
                  delay={500 * (index + 1)} 
                  text={choice.name} 
                  onClick={() => handleChoice(choice)} 
                />
              ))}
            </div>
          </>
        )}

      </div>

    </main>
  );
}
