import { useState, useRef, useCallback } from 'react';
import { TimelineEngine } from './TimelineEngine';
import { ChoiceGenerator, ChoiceRule } from './ChoiceGenerator';
import { ModifierPipeline } from './ModifierPipeline';
import { Character, CombatEnvironment, StatSnapshot, CombatAction, CombatPhase } from './CombatState';
import { SkillProcessor } from './SkillProcessor';
import { AIEngine } from './AIEngine';
import { NarrativeCombatEngine } from './NarrativeCombatEngine';
import type { NarrativeCombatEvent, NarrativeLogEntry } from './NarrativeCombatTypes';

export function useCombatEngine(allAvailableChoices: ChoiceRule[], allAvailableActions: CombatAction[]) {
  // Use refs for the core engine instances to avoid unnecessary React re-renders during rapid tick calculations.
  const timelineRef = useRef<TimelineEngine>(new TimelineEngine());
  const playerRef = useRef<Character | null>(null);
  const enemyRef = useRef<Character | null>(null);
  const petRef = useRef<Character | null>(null);
  const envRef = useRef<CombatEnvironment | null>(null);
  const narrativeRef = useRef<NarrativeCombatEngine>(new NarrativeCombatEngine());

  // State to bind to the React UI
  const isPausedRef = useRef<boolean>(false);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [structuredCombatLogs, setStructuredCombatLogs] = useState<NarrativeLogEntry[]>([]);
  const [activeChoices, setActiveChoices] = useState<ChoiceRule[]>([]);
  const [playerStats, setPlayerStats] = useState<StatSnapshot | null>(null);
  const [enemyStats, setEnemyStats] = useState<StatSnapshot | null>(null);
  const [combatPhase, setCombatPhase] = useState<CombatPhase>('setup');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [battlefieldTension, setBattlefieldTension] = useState<number>(0);

  const addLog = useCallback((message: string, event: Partial<NarrativeCombatEvent> = {}) => {
    const narrativeEvent: NarrativeCombatEvent = {
      tick: timelineRef.current.currentTick,
      type: event.type ?? 'system',
      text: message,
      actorId: event.actorId,
      actorName: event.actorName,
      targetId: event.targetId,
      targetName: event.targetName,
      actionId: event.actionId,
      actionName: event.actionName,
      amount: event.amount,
      actorHpPercent: event.actorHpPercent,
      targetHpPercent: event.targetHpPercent,
      tension: envRef.current?.tension ?? event.tension ?? 0,
      combatPhase,
      tags: event.tags ?? [],
    };
    const entries = narrativeRef.current.narrate(narrativeEvent);

    setStructuredCombatLogs((prev) => [...prev, ...entries]);
    setCombatLogs((prev) => [...prev, ...entries.map((entry) => entry.text)]);
  }, [combatPhase]);

  const addSystemLog = useCallback((message: string, event: Partial<NarrativeCombatEvent> = {}) => {
    addLog(message, event);
  }, []);

  const getActionDelay = useCallback((char: Character, baseDelay: number) => {
    const speed = Math.max(1, char.base_stats.speed ?? 10);
    return Math.max(4, Math.round(baseDelay * (10 / speed)));
  }, []);

  const syncStats = useCallback(() => {
    if (playerRef.current && envRef.current) {
      setPlayerStats(ModifierPipeline.calculateCurrentStats(playerRef.current, envRef.current));
    }
    if (enemyRef.current && envRef.current) {
      setEnemyStats(ModifierPipeline.calculateCurrentStats(enemyRef.current, envRef.current));
    }
    setBattlefieldTension(envRef.current?.tension ?? 0);
  }, []);

  const resolveCombatEnd = useCallback(() => {
    if (!playerRef.current || !enemyRef.current) return false;

    const playerDefeated = playerRef.current.base_stats.hp <= 0;
    const enemyDefeated = enemyRef.current.base_stats.hp <= 0;

    if (!playerDefeated && !enemyDefeated) return false;

    const nextWinner = enemyDefeated && !playerDefeated ? 'player' : 'enemy';
    setWinner(nextWinner);
    setCombatPhase('finished');
    setActiveChoices([]);
    isPausedRef.current = true;
    const actor = nextWinner === 'player' ? playerRef.current : enemyRef.current;
    const target = nextWinner === 'player' ? enemyRef.current : playerRef.current;
    addLog(
      nextWinner === 'player'
        ? `${enemyRef.current.name} collapses. The chapter closes in your favor.`
        : `${playerRef.current.name} falls as the battlefield goes silent.`,
      {
        type: 'result',
        actorId: actor.id,
        actorName: actor.name,
        targetId: target.id,
        targetName: target.name,
        tags: nextWinner === 'player' ? ['sword'] : ['heart_demon', 'demonic'],
      }
    );
    syncStats();
    return true;
  }, [addLog, syncStats]);

  const evaluatePlayerTurn = useCallback(() => {
    if (!playerRef.current || !envRef.current) return;
    if (resolveCombatEnd()) return;
    
    // 1. Calculate current stats dynamically through the ModifierPipeline (Accounts for Realm Suppression, Buffs, etc)
    const currentStats = ModifierPipeline.calculateCurrentStats(playerRef.current, envRef.current);
    setPlayerStats(currentStats);

    // 2. Generate valid choices based on the current battlefield state
    const validChoices = ChoiceGenerator.generateValidChoices(playerRef.current, currentStats, allAvailableChoices);
    
    // 3. Pause timeline and present choices to UI
    setActiveChoices(validChoices);
    setCombatPhase('awaiting_player');
    isPausedRef.current = true;
    setBattlefieldTension(envRef.current.tension ?? 0);
  }, [allAvailableChoices, resolveCombatEnd]);

  const evaluateEnemyTurn = useCallback(() => {
    if (!enemyRef.current || !playerRef.current || !envRef.current) return;
    if (resolveCombatEnd()) return;

    const action = AIEngine.decideNextAction(enemyRef.current, playerRef.current, envRef.current, allAvailableActions);

    if (action) {
      timelineRef.current.scheduleEvent(getActionDelay(enemyRef.current, 15), {
        sourceId: enemyRef.current.id,
        type: 'action',
        execute: () => {
          if (playerRef.current && enemyRef.current && envRef.current) {
            const { triggeredChoices, triggeredActions } = SkillProcessor.executeAction(action, enemyRef.current, playerRef.current, envRef.current, addLog);
            
            triggeredActions.forEach(actId => {
               const tAction = allAvailableActions.find(a => a.id === actId);
               if (tAction) {
                   timelineRef.current.scheduleEvent(1, {
                       sourceId: 'system_trigger',
                       type: 'action',
                       execute: () => {
                           if (playerRef.current && enemyRef.current && envRef.current) {
                               SkillProcessor.executeAction(tAction, enemyRef.current, playerRef.current, envRef.current, addLog);
                           }
                       }
                   });
               }
            });

            if (triggeredChoices.length > 0) {
               const validChoices = allAvailableChoices.filter(c => triggeredChoices.includes(c.id));
               setActiveChoices(prev => [...prev, ...validChoices]);
               isPausedRef.current = true;
            }
            
            setPlayerStats(ModifierPipeline.calculateCurrentStats(playerRef.current, envRef.current));
            setEnemyStats(ModifierPipeline.calculateCurrentStats(enemyRef.current, envRef.current));
            setBattlefieldTension(envRef.current.tension ?? 0);
          }

          if (resolveCombatEnd()) return;

          timelineRef.current.scheduleEvent(getActionDelay(enemyRef.current!, 15), {
            sourceId: 'system_enemy_eval',
            type: 'action',
            execute: () => evaluateEnemyTurn()
          });
        }
      });
    } else {
      timelineRef.current.scheduleEvent(20, {
        sourceId: 'system_enemy_eval',
        type: 'action',
        execute: () => evaluateEnemyTurn()
      });
    }
  }, [allAvailableActions, allAvailableChoices, addLog, getActionDelay, resolveCombatEnd]);

  const advanceTimeline = useCallback(() => {
    const timeline = timelineRef.current;
    
    // Run events until the queue is empty or the UI needs to wait for player input
    while (!isPausedRef.current) {
      const nextEvent = timeline.advanceToNextEvent();
      if (!nextEvent) break;
      
      setCurrentTick(timeline.currentTick);
    }
  }, []);

  const startCombat = useCallback((player: Character, enemy: Character, env: CombatEnvironment, pet?: Character) => {
    narrativeRef.current.reset();
    playerRef.current = player;
    enemyRef.current = enemy;
    envRef.current = env;
    petRef.current = pet || null;
    
    timelineRef.current = new TimelineEngine();
    setCombatPhase('active');
    setWinner(null);
    setActiveChoices([]);
    setCurrentTick(0);
    setBattlefieldTension(env.tension ?? 0);
    setCombatLogs([]);
    setStructuredCombatLogs([]);
    addLog(`You have encountered ${enemy.name} in the ${env.name}! Realm suppression active.`, {
      type: 'opening',
      actorId: player.id,
      actorName: player.name,
      targetId: enemy.id,
      targetName: enemy.name,
      tags: ['heart_demon', 'demonic'],
      tension: env.tension ?? 0,
    });
    
    // Schedule the very first action - evaluating the player's opening move
    timelineRef.current.scheduleEvent(0, {
      sourceId: 'system',
      type: 'action',
      execute: () => evaluatePlayerTurn()
    });

    // Schedule the enemy's opening move slightly staggered
    timelineRef.current.scheduleEvent(5, {
      sourceId: 'system_enemy_eval',
      type: 'action',
      execute: () => evaluateEnemyTurn()
    });

    advanceTimeline();
  }, [addLog, advanceTimeline, evaluatePlayerTurn, evaluateEnemyTurn]);

  const handleChoice = useCallback((choice: ChoiceRule) => {
    if (combatPhase === 'finished') return;
    addLog(`You chose to: ${choice.name}`, {
      type: 'choice',
      actorId: playerRef.current?.id,
      actorName: playerRef.current?.name,
      targetId: enemyRef.current?.id,
      targetName: enemyRef.current?.name,
      actionId: choice.action_id,
      actionName: allAvailableActions.find((action) => action.id === choice.action_id)?.name,
      tags: allAvailableActions.find((action) => action.id === choice.action_id)?.narrativeTags ?? [],
    });
    setActiveChoices([]); // Clear UI choices to resume processing
    setCombatPhase('active');
    isPausedRef.current = false;
    
    // Find the action associated with the choice
    const action = allAvailableActions.find(a => a.id === choice.action_id);

    // 1. Schedule the player's action onto the timeline
    timelineRef.current.scheduleEvent(getActionDelay(playerRef.current!, 10), {
      sourceId: playerRef.current?.id || 'player',
      type: 'action',
      execute: () => {
         if (action && playerRef.current && enemyRef.current && envRef.current) {
            const { triggeredChoices, triggeredActions } = SkillProcessor.executeAction(action, playerRef.current, enemyRef.current, envRef.current, addLog);
            
            triggeredActions.forEach(actId => {
               const tAction = allAvailableActions.find(a => a.id === actId);
               if (tAction) {
                   timelineRef.current.scheduleEvent(1, {
                       sourceId: 'system_trigger',
                       type: 'action',
                       execute: () => {
                           if (playerRef.current && enemyRef.current && envRef.current) {
                               SkillProcessor.executeAction(tAction, playerRef.current, enemyRef.current, envRef.current, addLog);
                           }
                       }
                   });
               }
            });

            if (triggeredChoices.length > 0) {
               const validChoices = allAvailableChoices.filter(c => triggeredChoices.includes(c.id));
               setActiveChoices(prev => [...prev, ...validChoices]);
               isPausedRef.current = true;
            }

            // Pet auto attack
            if (petRef.current) {
                const petAction: CombatAction = {
                    id: 'act_pet_strike',
                    name: `Linh Thú (${petRef.current.name}) Tấn Công`,
                    narrativeTags: [],
                    dangerRating: 2,
                    narrative_template: '{source.name} lao đến tấn công {target.name}.',
                    effects: [{
                        type: 'damage',
                        formula: 'self.attack * 1.0',
                        target: 'enemy',
                        narrative_template: '{source.name} gây {amount} sát thương lên {target.name}.'
                    }]
                };
                timelineRef.current.scheduleEvent(5, {
                    sourceId: petRef.current.id,
                    type: 'action',
                    execute: () => {
                        if (petRef.current && enemyRef.current && envRef.current) {
                            SkillProcessor.executeAction(petAction, petRef.current, enemyRef.current, envRef.current, addLog);
                            setEnemyStats(ModifierPipeline.calculateCurrentStats(enemyRef.current, envRef.current));
                        }
                    }
                });
            }
         } else {
            addLog(`Action executed: ${choice.action_id} (No effect defined)`);
         }
         
         // Update the UI with new stats
         if (playerRef.current && envRef.current) {
            setPlayerStats(ModifierPipeline.calculateCurrentStats(playerRef.current, envRef.current));
         }
         if (enemyRef.current && envRef.current) {
            setEnemyStats(ModifierPipeline.calculateCurrentStats(enemyRef.current, envRef.current));
         }
         setBattlefieldTension(envRef.current?.tension ?? 0);

         if (resolveCombatEnd()) return;

         timelineRef.current.scheduleEvent(20, {
           sourceId: 'system',
           type: 'action',
           execute: () => evaluatePlayerTurn()
         });
      }
    });

    // 2. Resume timeline processing
    advanceTimeline();
  }, [addLog, advanceTimeline, combatPhase, evaluatePlayerTurn, allAvailableActions, getActionDelay, resolveCombatEnd]);

  return {
    currentTick,
    playerStats,
    enemyStats,
    combatLogs,
    structuredCombatLogs,
    activeChoices,
    combatPhase,
    winner,
    battlefieldTension,
    startCombat,
    handleChoice
  };
}
