'use client';

import { useEffect, useState } from 'react';
import type { GameState, WorldState } from '../types';
import { getNpcFavorabilityLabel, changeNpcFavorability, createInitialWorldState, getWorldEventModifiers, generateWorldThresholdEvent, worldStateToNews, applyChoiceToState, tickMonth, createNewGame } from '../lib/engine';

type Tab = 'techniques' | 'npcs' | 'sects' | 'events' | 'time_gear' | 'scriptures' | 'cultivation' | 'npc_relations' | 'world_state';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  showAudioPaths: boolean;
  onToggleAudioPaths: (val: boolean) => void;
  onStartTestCombat?: () => void;
  game?: GameState | null;
  onChangeGame?: (game: GameState) => void;
};

export default function AdminPanel({ isOpen, onClose, showAudioPaths, onToggleAudioPaths, onStartTestCombat, game, onChangeGame }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('techniques');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // States for configs
  const [combatConfig, setCombatConfig] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [sects, setSects] = useState<any[]>([]);

  // Editing states
  const [editingItem, setEditingItem] = useState<{ type: string; index: number; data: any } | null>(null);
  const [isImportingJSON, setIsImportingJSON] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{
    finalState: GameState;
    eventHistory: Array<{
      age: number;
      month: number;
      eventTitle: string;
      choiceText: string;
      effectsSummary: string;
      effects?: any;
      statsBefore?: any;
      statsAfter?: any;
    }>;
  } | null>(null);

  // Fetch configs
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (data.success) {
        setCombatConfig(data.combatConfig);
        setSects(data.sects);
      } else {
        showNotification(data.error || 'Failed to load configurations.', 'error');
      }

      // Fetch dynamic events directly from the modular files endpoint
      const eventsRes = await fetch('/api/admin/events');
      const eventsData = await eventsRes.json();
      if (eventsData.success) {
        setEvents(eventsData.events);
      } else {
        showNotification(eventsData.error || 'Failed to load events.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error fetching configurations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setEditingItem(null);
      setIsImportingJSON(false);
      setSimulationResults(null);
    }
  }, [isOpen]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Save config back to file
  const saveConfig = async (type: 'combat' | 'events' | 'sects', updatedData: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: updatedData }),
      });
      const result = await res.json();
      if (result.success) {
        showNotification(result.message || 'Config saved and synced successfully.', 'success');
        fetchData();
        setEditingItem(null);
      } else {
        showNotification(result.error || 'Failed to save config.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error saving config.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveEvent = async (event: any, originalId?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', event, originalId }),
      });
      const result = await res.json();
      if (result.success) {
        showNotification(result.message || 'Event saved successfully.', 'success');
        fetchData();
        setEditingItem(null);
      } else {
        const detailStr = result.details ? `: ${result.details.join(', ')}` : '';
        showNotification((result.error || 'Failed to save event') + detailStr, 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error saving event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const result = await res.json();
      if (result.success) {
        showNotification(result.message || 'Event deleted successfully.', 'success');
        fetchData();
      } else {
        showNotification(result.error || 'Failed to delete event.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error deleting event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runFastTest = () => {
    setSaving(true);
    setTimeout(() => {
      try {
        let state: GameState = game
          ? JSON.parse(JSON.stringify(game))
          : createNewGame(
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

        if (!state.alive) {
          state = createNewGame(
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

        const history: any[] = [];
        let iterations = 0;
        const maxIterations = 5000;

        while (state.alive && iterations < maxIterations) {
          iterations++;

          if (state.currentEvent) {
            const event = state.currentEvent;
            const choices = event.choices || [];
            if (choices.length === 0) {
              state.alive = false;
              state.deathCause = { vi: 'Hồn phi phách tán do nhân quả hư vô (Sự kiện không có lựa chọn)', en: 'Disintegrated by karma void' };
              break;
            }

            const randomChoice = choices[Math.floor(Math.random() * choices.length)];

            const effectsStr = Object.entries(randomChoice.effects || {})
              .map(([k, v]) => {
                if (typeof v === 'number') {
                  return `${k}: ${v > 0 ? `+${v}` : v}`;
                }
                if (typeof v === 'object' && v !== null) {
                  return `${k}: ${JSON.stringify(v)}`;
                }
                return `${k}: ${v}`;
              })
              .join(', ');

            const statsBefore = {
              health: Math.round(state.stats.health),
              cultivation: Number(state.stats.cultivation.toFixed(1)),
              luck: Math.round(state.stats.luck),
              comprehension: Math.round(state.stats.comprehension),
              karma: Math.round(state.stats.karma),
              daoHeart: Math.round(state.stats.daoHeart),
              spiritStones: Math.round(state.spiritStones || 0),
            };

            state = applyChoiceToState(state, randomChoice.id, 'vi');

            const statsAfter = {
              health: Math.round(state.stats.health),
              cultivation: Number(state.stats.cultivation.toFixed(1)),
              luck: Math.round(state.stats.luck),
              comprehension: Math.round(state.stats.comprehension),
              karma: Math.round(state.stats.karma),
              daoHeart: Math.round(state.stats.daoHeart),
              spiritStones: Math.round(state.spiritStones || 0),
            };

            history.push({
              age: state.age,
              month: state.month,
              eventTitle: typeof event.title === 'object' ? event.title.vi : event.title,
              choiceText: typeof randomChoice.text === 'object' ? randomChoice.text.vi : randomChoice.text,
              effectsSummary: effectsStr || 'Không có thay đổi chỉ số trực tiếp',
              effects: randomChoice.effects || {},
              statsBefore,
              statsAfter,
            });

            state = applyChoiceToState(state, randomChoice.id, 'vi');
          } else {
            state = tickMonth(state, 'vi');
          }
        }

        if (iterations >= maxIterations && state.alive) {
          state.alive = false;
          state.deathCause = { vi: 'Độ kiếp thành công phi thăng thượng giới (Hoặc hết thọ nguyên tối đa giả lập)', en: 'Ascended or reached simulation limit' };
        }

        setSimulationResults({
          finalState: state,
          eventHistory: history,
        });
      } catch (err: any) {
        alert(`Lỗi trong quá trình giả lập: ${err.message}`);
      } finally {
        setSaving(false);
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md overflow-hidden p-4 sm:p-6">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-[#0c0a08] border border-[#c5a059]/40 rounded-sm shadow-2xl">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-[#3e3328]/70 gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl text-[#e5c17b] tracking-wider uppercase">Thái Cổ Thần Điện (Admin Panel)</h1>
            <p className="text-xs text-text-tertiary">Bấm tổ hợp phím Ctrl + X hoặc nhấn Đóng để ẩn bảng điều khiển này.</p>
            <div className="pt-1.5 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none text-left">
                <input
                  type="checkbox"
                  checked={showAudioPaths}
                  onChange={(e) => onToggleAudioPaths(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#c5a059] rounded-sm cursor-pointer"
                />
                <span className="text-[10px] text-[#e5c17b] font-serif uppercase tracking-wider font-bold">Hiển thị đường dẫn âm thanh (Display Audio Paths)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 self-end sm:self-auto">
            {onStartTestCombat && (
              <button
                type="button"
                onClick={onStartTestCombat}
                className="px-4 py-2 text-xs uppercase tracking-widest text-red-400/90 border border-red-950/60 bg-red-950/15 hover:border-red-500 hover:text-white hover:bg-red-950/30 transition font-serif"
              >
                ⚔️ Bắt đầu Test Combat
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs uppercase tracking-widest text-[#847764] border border-[#3e3328] hover:border-[#c5a059]/60 hover:text-white transition font-serif"
            >
              Đóng (Close)
            </button>
          </div>
        </header>

        {/* Status / Notification */}
        {notification && (
          <div className={`px-6 py-3 text-sm font-serif border-b ${
            notification.type === 'success' 
              ? 'bg-green-950/20 border-green-800/40 text-green-400' 
              : 'bg-red-950/20 border-red-800/40 text-red-400'
          } animate-fade-in`}>
            {notification.message}
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="flex bg-[#14110f] border-b border-[#3e3328]/50 overflow-x-auto">
          {(['techniques', 'npcs', 'sects', 'events', 'time_gear', 'scriptures', 'cultivation', 'npc_relations', 'world_state'] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              techniques: 'Công pháp & Vũ kĩ',
              npcs: 'Nhân vật NPC',
              sects: 'Danh môn Môn phái',
              events: 'Sự kiện Đời người',
              time_gear: 'Bánh răng Thời gian',
              scriptures: '📖 Tàng Kinh Các',
              cultivation: '🌱 Tu Vi & Linh Căn',
              npc_relations: '👥 Lược Đồ Nhân Mạch',
              world_state: '🌍 Mạch Máu Thế Giới',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setEditingItem(null);
                  setSimulationResults(null);
                }}
                className={`px-5 py-3.5 text-xs sm:text-sm font-serif uppercase tracking-widest border-r border-[#3e3328]/50 transition whitespace-nowrap ${
                  activeTab === tab 
                    ? 'text-[#e5c17b] bg-[#0c0a08] border-b-2 border-b-[#c5a059] font-medium' 
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-black/25'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </nav>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* World State tab renders independently — no config fetch needed */}
          {activeTab === 'world_state' ? (
            <WorldStateView game={game} onChangeGame={onChangeGame} />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-10 h-10 border-2 border-t-transparent border-[#c5a059] rounded-full animate-spin"></div>
              <p className="font-serif text-sm text-[#847764] animate-pulse">Đang cảm ngộ quy tắc thiên địa...</p>
            </div>
          ) : editingItem ? (
            // Sub form overlay for edit/create
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between border-b border-[#3e3328]/40 pb-4">
                <h3 className="font-serif text-lg text-[#e5c17b]">
                  {editingItem.index === -1 ? 'Khởi tạo thực thể mới' : 'Biên dịch sửa đổi thông số'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-xs text-text-tertiary hover:text-white transition"
                >
                  Quay lại danh sách
                </button>
              </div>

              {editingItem.type === 'technique' && (
                <TechniqueForm
                  data={editingItem.data}
                  onCancel={() => setEditingItem(null)}
                  onSave={(updated) => {
                    const isPlayer = editingItem.data.isPlayer;
                    const field = isPlayer ? 'techniques' : 'enemy_arts';
                    const list = [...(combatConfig[field] || [])];
                    if (editingItem.index === -1) {
                      list.push(updated);
                    } else {
                      list[editingItem.index] = updated;
                    }
                    saveConfig('combat', { ...combatConfig, [field]: list });
                  }}
                />
              )}

              {editingItem.type === 'npc' && (
                <NpcForm
                  data={editingItem.data}
                  techniques={combatConfig.techniques || []}
                  enemyArts={combatConfig.enemy_arts || []}
                  realms={combatConfig.realms || []}
                  physiques={combatConfig.physiques || []}
                  onCancel={() => setEditingItem(null)}
                  onSave={(updated) => {
                    const list = [...(combatConfig.npcs || [])];
                    if (editingItem.index === -1) {
                      list.push(updated);
                    } else {
                      list[editingItem.index] = updated;
                    }
                    saveConfig('combat', { ...combatConfig, npcs: list });
                  }}
                />
              )}

              {editingItem.type === 'sect' && (
                <SectForm
                  data={editingItem.data}
                  onCancel={() => setEditingItem(null)}
                  onSave={(updated) => {
                    const list = [...sects];
                    if (editingItem.index === -1) {
                      list.push(updated);
                    } else {
                      list[editingItem.index] = updated;
                    }
                    saveConfig('sects', list);
                  }}
                />
              )}

              {editingItem.type === 'event' && (
                <EventForm
                  data={editingItem.data}
                  onCancel={() => setEditingItem(null)}
                  onSave={(updated) => {
                    saveEvent(updated, editingItem.index === -1 ? undefined : editingItem.data.id);
                  }}
                />
              )}

              {editingItem.type === 'scripture' && (
                <ScriptureForm
                  data={editingItem.data}
                  onCancel={() => setEditingItem(null)}
                  onSave={(updated) => {
                    const list = [...(combatConfig.techniques || [])];
                    if (editingItem.index === -1) {
                      list.push(updated);
                    } else {
                      const origIndex = list.findIndex((t: any) => t.id === editingItem.data.id);
                      if (origIndex > -1) {
                        list[origIndex] = updated;
                      } else {
                        list.push(updated);
                      }
                    }
                    saveConfig('combat', { ...combatConfig, techniques: list });
                  }}
                />
              )}
            </div>
          ) : (
            // List rendering
            <div className="space-y-6 animate-fade-in">
              {activeTab === 'cultivation' && (
                <CultivationConfig
                  combatConfig={combatConfig}
                  onSave={(updatedCS) => {
                    saveConfig('combat', { ...combatConfig, cultivation_system: updatedCS });
                  }}
                />
              )}
              {activeTab === 'time_gear' && (
                <TimeGearConfig
                  combatConfig={combatConfig}
                  onSave={(updatedTimeGear) => {
                    saveConfig('combat', { ...combatConfig, time_gear: updatedTimeGear });
                  }}
                />
              )}
              {activeTab === 'scriptures' && (
                <ScriptureList
                  combatConfig={combatConfig}
                  onEdit={(index) => {
                    setEditingItem({
                      type: 'scripture',
                      index,
                      data: combatConfig.techniques.filter((t: any) => t.is_basic_manual)[index],
                    });
                  }}
                  onDelete={(index) => {
                    const basicManuals = combatConfig.techniques.filter((t: any) => t.is_basic_manual);
                    const targetTech = basicManuals[index];
                    const updatedList = combatConfig.techniques.filter((t: any) => t.id !== targetTech.id);
                    if (confirm(`Xác nhận phế bỏ bộ tâm pháp sơ cấp [${targetTech.label}] khỏi Tàng Kinh Các?`)) {
                      saveConfig('combat', { ...combatConfig, techniques: updatedList });
                    }
                  }}
                  onAdd={() => {
                    setEditingItem({
                      type: 'scripture',
                      index: -1,
                      data: {
                        id: 'manual_' + Date.now().toString().slice(-4),
                        label: '',
                        type: 'tâm_pháp',
                        tier: 'hoàng',
                        fragments_required: 1,
                        learning_requirements: {
                          realm: 'Mortal',
                          comprehension: 1,
                          age: 11
                        },
                        description: '',
                        choiceText: '',
                        is_basic_manual: true,
                        sect: 'Kiếm Tông',
                        spiritual_root: 'Kim',
                        max_cultivation_level: 26.0,
                        image: '/images/sects/book_metal.png',
                        action: {
                          id: '',
                          name: '',
                          narrativeTags: [],
                          intentType: '',
                          dangerRating: 4,
                          costs: { qi: 4 },
                          narrative_template: '',
                          effects: []
                        }
                      },
                    });
                  }}
                />
              )}
              {activeTab === 'techniques' && (
                <TechniqueList
                  combatConfig={combatConfig}
                  onEdit={(index, isPlayer) => {
                    const key = isPlayer ? 'techniques' : 'enemy_arts';
                    setEditingItem({
                      type: 'technique',
                      index,
                      data: { ...combatConfig[key][index], isPlayer },
                    });
                  }}
                  onDelete={(index, isPlayer) => {
                    const key = isPlayer ? 'techniques' : 'enemy_arts';
                    const list = combatConfig[key].filter((_: any, idx: number) => idx !== index);
                    if (confirm('Xác nhận phế bỏ loại công pháp/vũ kĩ này?')) {
                      saveConfig('combat', { ...combatConfig, [key]: list });
                    }
                  }}
                  onAdd={(isPlayer, defaultType) => {
                    setEditingItem({
                      type: 'technique',
                      index: -1,
                      data: {
                        isPlayer,
                        id: '',
                        label: '',
                        type: defaultType,
                        description: '',
                        choiceText: isPlayer ? '' : undefined,
                        action: {
                          id: '',
                          name: '',
                          narrativeTags: [],
                          intentType: '',
                          dangerRating: 5,
                          costs: isPlayer ? { qi: 5 } : undefined,
                          narrative_template: '',
                          effects: []
                        }
                      },
                    });
                  }}
                />
              )}

              {activeTab === 'npcs' && (
                <NpcList
                  npcs={combatConfig?.npcs || []}
                  onEdit={(index) => {
                    setEditingItem({
                      type: 'npc',
                      index,
                      data: combatConfig.npcs[index],
                    });
                  }}
                  onDelete={(index) => {
                    const list = combatConfig.npcs.filter((_: any, idx: number) => idx !== index);
                    if (confirm('Xác nhận xóa bỏ nhân vật NPC này khỏi ma cảnh?')) {
                      saveConfig('combat', { ...combatConfig, npcs: list });
                    }
                  }}
                  onAdd={() => {
                    setEditingItem({
                      type: 'npc',
                      index: -1,
                      data: {
                        id: 'enemy_' + Date.now().toString().slice(-4),
                        name: '',
                        realm: 'qi',
                        physique: 'balanced',
                        technique: '',
                        tactic: 'balanced',
                        description: ''
                      },
                    });
                  }}
                />
              )}

              {activeTab === 'sects' && (
                <SectList
                  sects={sects}
                  onEdit={(index) => {
                    setEditingItem({
                      type: 'sect',
                      index,
                      data: sects[index],
                    });
                  }}
                  onDelete={(index) => {
                    const list = sects.filter((_: any, idx: number) => idx !== index);
                    if (confirm('Xác nhận trục xuất tông môn phái này khỏi lục địa?')) {
                      saveConfig('sects', list);
                    }
                  }}
                  onAdd={() => {
                    setEditingItem({
                      type: 'sect',
                      index: -1,
                      data: { id: '', name: '', description: '', alignment: 'neutral' },
                    });
                  }}
                />
              )}

              {activeTab === 'events' && (
                simulationResults ? (
                  <SimulationReport
                    results={simulationResults}
                    onClose={() => setSimulationResults(null)}
                  />
                ) : isImportingJSON ? (
                  <EventImportForm
                    onCancel={() => setIsImportingJSON(false)}
                    onImport={async (jsonText) => {
                      setSaving(true);
                      try {
                        const res = await fetch('/api/admin/events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'import', jsonText }),
                        });
                        const result = await res.json();
                        if (result.success) {
                          showNotification(result.message || 'Import successful.', 'success');
                          setIsImportingJSON(false);
                          fetchData();
                          if (result.importedTitles && result.importedTitles.length > 0) {
                            const titleList = result.importedTitles.map((title: string) => `• ${title}`).join('\n');
                            alert(`Cập nhật thành công các sự kiện sau:\n\n${titleList}`);
                          }
                        } else {
                          const details = result.details ? `\n- ${result.details.join('\n- ')}` : '';
                          alert(`${result.error || 'Import failed.'}${details}`);
                        }
                      } catch (err: any) {
                        alert(`Error importing events: ${err.message}`);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                ) : (
                  <EventList
                    events={events}
                    onEdit={(index) => {
                      setEditingItem({
                        type: 'event',
                        index,
                        data: events[index],
                      });
                    }}
                    onDelete={(index) => {
                      const eventToDelete = events[index];
                      if (confirm(`Xác nhận xóa bỏ chuỗi vận mệnh sự kiện [${eventToDelete.title || (typeof eventToDelete.title === 'object' ? eventToDelete.title.vi : '')}] (ID: ${eventToDelete.id})?`)) {
                        deleteEvent(eventToDelete.id);
                      }
                    }}
                    onAdd={() => {
                      setEditingItem({
                        type: 'event',
                        index: -1,
                        data: {
                          id: '',
                          title: '',
                          description: '',
                          minAge: 1,
                          maxAge: 100,
                          weight: 1,
                          choices: []
                        },
                      });
                    }}
                    onImportJSON={() => setIsImportingJSON(true)}
                    onFastTest={runFastTest}
                  />
                )
              )}
              {activeTab === 'npc_relations' && (
                <NpcRelationsView game={game} onChangeGame={onChangeGame} />
              )}
            </div>
          )}
        </div>
        
        {saving && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#14110f] border border-[#c5a059]/50 p-6 rounded-sm text-center max-w-sm space-y-3">
              <div className="w-8 h-8 border-2 border-t-transparent border-[#c5a059] rounded-full animate-spin mx-auto"></div>
              <p className="font-serif text-[#e5c17b]">Đang khắc ấn quy tắc lên phiến đá thiên mệnh...</p>
              <p className="text-xs text-text-tertiary">Vui lòng không tắt hoặc tải lại trang.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 1. TECHNIQUES LIST & FORM
// ==========================================
function TechniqueList({
  combatConfig,
  onEdit,
  onDelete,
  onAdd,
}: {
  combatConfig: any;
  onEdit: (index: number, isPlayer: boolean) => void;
  onDelete: (index: number, isPlayer: boolean) => void;
  onAdd: (isPlayer: boolean, defaultType: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<string>('tâm_pháp');

  const subTabs = [
    { key: 'tâm_pháp', label: 'Tâm Pháp' },
    { key: 'vũ_kỹ', label: 'Vũ Kỹ' },
    { key: 'pháp_thuật', label: 'Pháp Thuật' },
    { key: 'bí_kỹ', label: 'Bí Kỹ' },
    { key: 'thần_thông', label: 'Thần Thông' },
    { key: 'độn_thuật', label: 'Độn Thuật' },
    { key: 'cấm_thuật', label: 'Cấm thuật' }
  ];

  const pList = combatConfig?.techniques || [];
  const eList = combatConfig?.enemy_arts || [];

  const pListWithIndex = pList.map((t: any, index: number) => ({ ...t, originalIndex: index }));
  const filteredPList = pListWithIndex.filter((t: any) => (t.type || 'vũ_kỹ') === activeSubTab);

  const eListWithIndex = eList.map((t: any, index: number) => ({ ...t, originalIndex: index }));
  const filteredEList = eListWithIndex.filter((t: any) => (t.type || 'vũ_kỹ') === activeSubTab);

  return (
    <div className="space-y-6">
      {/* Sub-tabs Navigation */}
      <div className="flex bg-[#100e0c]/90 border border-[#3e3328]/40 rounded-sm overflow-x-auto p-1 gap-1">
        {subTabs.map((subTab) => (
          <button
            key={subTab.key}
            type="button"
            onClick={() => setActiveSubTab(subTab.key)}
            className={`px-4 py-2 text-xs font-serif uppercase tracking-wider transition whitespace-nowrap rounded-sm ${
              activeSubTab === subTab.key
                ? 'text-[#e5c17b] bg-[#1a1612] border border-[#c5a059]/40 font-semibold'
                : 'text-[#847764] hover:text-[#c5a059] hover:bg-[#14110f]/50'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* Player Techniques */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#3e3328]/50 pb-2">
          <h4 className="font-serif text-md text-[#e5c17b]">Tu Sĩ Công Pháp (Player Techniques)</h4>
          <button
            type="button"
            onClick={() => onAdd(true, activeSubTab)}
            className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition"
          >
            + Khai sáng công pháp
          </button>
        </div>
        
        {filteredPList.length === 0 ? (
          <p className="text-xs text-text-tertiary italic p-4 text-center border border-[#3e3328]/30 bg-[#14110f]/20 rounded-sm">
            Chưa khai sáng công pháp nào thuộc loại này.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPList.map((t: any) => (
              <div key={t.id || t.originalIndex} className="bg-[#14110f] border border-[#3e3328]/60 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h5 className="font-serif text-[#e5c17b] text-base">{t.label} <span className="text-[10px] text-text-tertiary">({t.id})</span></h5>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{t.description}</p>
                  <div className="text-[11px] text-[#847764] mt-2">
                    Chiêu thức: <span className="text-text-secondary">{t.action?.name}</span> (Tốn: {t.action?.costs?.qi || 0} Qi)
                  </div>
                  {t.type === 'tâm_pháp' && t.m_manual !== undefined && (
                    <div className="text-[11px] text-[#e5c17b] mt-1">
                      Hệ số Tâm Pháp (M_manual): <span className="font-semibold">{t.m_manual}x</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#3e3328]/30">
                  <button
                    type="button"
                    onClick={() => onEdit(t.originalIndex, true)}
                    className="px-2.5 py-1 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-transparent hover:border-[#c5a059]/30 rounded-sm"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t.originalIndex, true)}
                    className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-sm"
                  >
                    Phế bỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enemy Arts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#3e3328]/50 pb-2">
          <h4 className="font-serif text-md text-[#e5c17b]">Tà Ma Vũ Kĩ (Enemy Arts)</h4>
          <button
            type="button"
            onClick={() => onAdd(false, activeSubTab)}
            className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition"
          >
            + Chế tạo ma kĩ
          </button>
        </div>

        {filteredEList.length === 0 ? (
          <p className="text-xs text-text-tertiary italic p-4 text-center border border-[#3e3328]/30 bg-[#14110f]/20 rounded-sm">
            Chưa chế tạo ma kĩ nào thuộc loại này.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEList.map((t: any) => (
              <div key={t.id || t.originalIndex} className="bg-[#14110f] border border-[#3e3328]/60 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h5 className="font-serif text-[#e5c17b] text-base">{t.label} <span className="text-[10px] text-text-tertiary">({t.id})</span></h5>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{t.description}</p>
                  <div className="text-[11px] text-[#847764] mt-2">
                    Chiêu thức: <span className="text-text-secondary">{t.action?.name}</span>
                  </div>
                  {t.type === 'tâm_pháp' && t.m_manual !== undefined && (
                    <div className="text-[11px] text-[#e5c17b] mt-1">
                      Hệ số Tâm Pháp (M_manual): <span className="font-semibold">{t.m_manual}x</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#3e3328]/30">
                  <button
                    type="button"
                    onClick={() => onEdit(t.originalIndex, false)}
                    className="px-2.5 py-1 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-transparent hover:border-[#c5a059]/30 rounded-sm"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t.originalIndex, false)}
                    className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-sm"
                  >
                    Phế bỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TechniqueForm({
  data,
  onCancel,
  onSave,
}: {
  data: any;
  onCancel: () => void;
  onSave: (updated: any) => void;
}) {
  const [id, setId] = useState(data.id || '');
  const [label, setLabel] = useState(data.label || '');
  const [type, setType] = useState(data.type || 'vũ_kỹ');
  const [mManual, setMManual] = useState(data.m_manual !== undefined ? data.m_manual : 1.0);
  const [description, setDescription] = useState(data.description || '');
  const [choiceText, setChoiceText] = useState(data.choiceText || '');

  // action details
  const [actionName, setActionName] = useState(data.action?.name || '');
  const [intentType, setIntentType] = useState(data.action?.intentType || '');
  const [dangerRating, setDangerRating] = useState(data.action?.dangerRating || 5);
  const [qiCost, setQiCost] = useState(data.action?.costs?.qi || 0);
  const [narrativeTemplate, setNarrativeTemplate] = useState(data.action?.narrative_template || '');
  
  // effects list
  const [effects, setEffects] = useState<any[]>(data.action?.effects || []);

  const addEffect = () => {
    setEffects([
      ...effects,
      { type: 'damage', formula: 'self.attack * 1.0', target: 'enemy', narrative_template: '{target.name} chịu {amount} thương tổn.' }
    ]);
  };

  const removeEffect = (index: number) => {
    setEffects(effects.filter((_, idx) => idx !== index));
  };

  const updateEffect = (index: number, key: string, value: any) => {
    const updated = [...effects];
    updated[index] = { ...updated[index], [key]: value };
    setEffects(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !label || !actionName) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc (Mã, Tên, Chiêu thức).');
      return;
    }

    const action: any = {
      id: data.isPlayer ? `act_player_${id}` : `act_enemy_${id}`,
      name: actionName,
      narrativeTags: data.isPlayer ? [id, 'calm'] : [id, 'heart_demon'],
      intentType: intentType || id,
      dangerRating: Number(dangerRating),
      narrative_template: narrativeTemplate,
      effects
    };

    if (data.isPlayer) {
      action.costs = { qi: Number(qiCost) };
    }

    const submission: any = {
      ...data,
      id,
      label,
      type,
      description,
      action
    };

    if (type === 'tâm_pháp') {
      submission.m_manual = Number(mManual);
    } else {
      delete submission.m_manual;
    }

    if (data.isPlayer) {
      submission.choiceText = choiceText || `Vận ${label} tiến công.`;
    }

    delete submission.isPlayer;

    onSave(submission);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-text-secondary">
      <div className="grid grid-cols-3 gap-4">
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Mã Định Danh (ID)*</span>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="vi_du_kiem_phap"
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
            disabled={data.id !== ''}
          />
        </label>
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Tên Gọi (Label)*</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Thanh Vân Kiếm Pháp"
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
          />
        </label>
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Loại Công Pháp (Type)*</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
            required
          >
            <option value="tâm_pháp">Tâm Pháp</option>
            <option value="vũ_kỹ">Vũ Kỹ</option>
            <option value="pháp_thuật">Pháp Thuật</option>
            <option value="bí_kỹ">Bí Kỹ</option>
            <option value="thần_thông">Thần Thông</option>
            <option value="độn_thuật">Độn Thuật</option>
            <option value="cấm_thuật">Cấm thuật</option>
          </select>
        </label>
      </div>

      {type === 'tâm_pháp' && (
        <div className="grid grid-cols-3 gap-4 animate-fade-in">
          <label className="block space-y-2 col-span-1">
            <span className="text-xs uppercase tracking-widest text-[#e5c17b]">Hệ số hiệu quả (M_manual)*</span>
            <input
              type="number"
              step="0.05"
              value={mManual}
              onChange={(e) => setMManual(Number(e.target.value))}
              placeholder="1.0"
              className="w-full bg-[#14110f] border border-[#c5a059]/40 rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
              required
            />
          </label>
        </div>
      )}

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Mô Tả Công Pháp (Description)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả về sức mạnh và xuất xứ của thuật này..."
          rows={2}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
        />
      </label>

      {data.isPlayer && (
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Lời Dẫn Lựa Chọn (Choice Text)</span>
          <input
            type="text"
            value={choiceText}
            onChange={(e) => setChoiceText(e.target.value)}
            placeholder="Vận chuyển thanh vân chân khí, tung một chém kiếm quyết."
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          />
        </label>
      )}

      {/* Action configuration */}
      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">Thiết Lập Chiêu Thức Chiến Đấu (Action details)</h4>
        
        <div className="grid grid-cols-3 gap-4">
          <label className="block space-y-2 col-span-1">
            <span className="text-[11px] uppercase tracking-widest text-[#847764]">Tên Chiêu Thức*</span>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              placeholder="Thanh Vân Phá"
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none focus:border-[#c5a059]"
              required
            />
          </label>
          <label className="block space-y-2 col-span-1">
            <span className="text-[11px] uppercase tracking-widest text-[#847764]">Hệ Nguyên Tố/Thuật</span>
            <input
              type="text"
              value={intentType}
              onChange={(e) => setIntentType(e.target.value)}
              placeholder="sword / flame / shield"
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none focus:border-[#c5a059]"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 col-span-1">
            <label className="block space-y-2">
              <span className="text-[11px] uppercase tracking-widest text-[#847764]">Nguy Hiểm</span>
              <input
                type="number"
                value={dangerRating}
                onChange={(e) => setDangerRating(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none focus:border-[#c5a059]"
              />
            </label>
            {data.isPlayer && (
              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-widest text-[#847764]">Tốn Qi</span>
                <input
                  type="number"
                  value={qiCost}
                  onChange={(e) => setQiCost(Number(e.target.value))}
                  min={0}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none focus:border-[#c5a059]"
                />
              </label>
            )}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-[#847764]">Lời Dẫn Miêu Tả Tung Chiêu (Narrative Template)</span>
          <input
            type="text"
            value={narrativeTemplate}
            onChange={(e) => setNarrativeTemplate(e.target.value)}
            placeholder="{source.name} vận hóa tiên cơ, chém thẳng xuống đối thủ."
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none focus:border-[#c5a059]"
          />
        </label>

        {/* Effects management */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-t border-[#3e3328]/30 pt-2">
            <span className="text-xs uppercase tracking-widest text-[#e5c17b]">Các hiệu ứng kích hoạt ({effects.length})</span>
            <button
              type="button"
              onClick={addEffect}
              className="text-xs text-[#c5a059] hover:underline"
            >
              + Thêm hiệu ứng
            </button>
          </div>

          <div className="space-y-3">
            {effects.map((eff, index) => (
              <div key={index} className="border border-[#3e3328]/40 p-3 bg-black/40 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-serif text-[#847764]">Hiệu ứng #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEffect(index)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Xóa
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase text-text-tertiary">Loại hiệu ứng</span>
                    <select
                      value={eff.type}
                      onChange={(e) => updateEffect(index, 'type', e.target.value)}
                      className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-lunar text-xs outline-none"
                    >
                      <option value="damage">damage (Sát thương)</option>
                      <option value="heal">heal (Hồi HP)</option>
                      <option value="add_tension">add_tension (Tăng căng thẳng)</option>
                      <option value="restore_resource">restore_resource (Hồi Qi)</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase text-text-tertiary">Công thức tính (Formula)</span>
                    <input
                      type="text"
                      value={eff.formula}
                      onChange={(e) => updateEffect(index, 'formula', e.target.value)}
                      placeholder="self.attack * 1.5"
                      className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-lunar text-xs outline-none"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase text-text-tertiary">Đối tượng tác động</span>
                    <select
                      value={eff.target}
                      onChange={(e) => updateEffect(index, 'target', e.target.value)}
                      className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-lunar text-xs outline-none"
                    >
                      <option value="enemy">enemy (Đối thủ)</option>
                      <option value="self">self (Bản thân)</option>
                    </select>
                  </label>
                </div>

                {eff.type === 'restore_resource' && (
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase text-text-tertiary">Tài nguyên phục hồi (Resource)</span>
                    <input
                      type="text"
                      value={eff.resource || 'qi'}
                      onChange={(e) => updateEffect(index, 'resource', e.target.value)}
                      placeholder="qi / fatigue"
                      className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-lunar text-xs outline-none"
                    />
                  </label>
                )}

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase text-text-tertiary">Lời văn mô tả sát thương (Narrative Template)</span>
                  <input
                    type="text"
                    value={eff.narrative_template}
                    onChange={(e) => updateEffect(index, 'narrative_template', e.target.value)}
                    placeholder="Kiếm quang chém trúng {target.name}, gây {amount} sát thương."
                    className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-lunar text-xs outline-none"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-[#3e3328] text-text-tertiary hover:text-white rounded-sm transition"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition"
        >
          Lưu chuyển (Save)
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 2. NPC LIST & FORM
// ==========================================
function NpcList({
  npcs,
  onEdit,
  onDelete,
  onAdd,
}: {
  npcs: any[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#3e3328]/50 pb-2">
        <h4 className="font-serif text-md text-[#e5c17b]">Danh Sách Tà Ma/NPC Ma Cảnh</h4>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition"
        >
          + Triệu hoán ma đầu mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {npcs.map((npc, index) => (
          <div key={npc.id || index} className="bg-[#14110f] border border-[#3e3328]/60 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <h5 className="font-serif text-[#e5c17b] text-base">{npc.name}</h5>
                <span className="text-[10px] text-accent uppercase tracking-widest">{npc.realm}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{npc.description}</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 text-[10px] text-text-tertiary">
                <div>Thể chất: <span className="text-text-secondary">{npc.physique}</span></div>
                <div>Lối chiến: <span className="text-text-secondary">{npc.tactic}</span></div>
                <div className="col-span-2">Đặc kĩ: <span className="text-text-secondary">{npc.technique}</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#3e3328]/30">
              <button
                type="button"
                onClick={() => onEdit(index)}
                className="px-2.5 py-1 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-transparent hover:border-[#c5a059]/30 rounded-sm"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => onDelete(index)}
                className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-sm"
              >
                Xóa bỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NpcForm({
  data,
  techniques,
  enemyArts,
  realms,
  physiques,
  onCancel,
  onSave,
}: {
  data: any;
  techniques: any[];
  enemyArts: any[];
  realms: any[];
  physiques: any[];
  onCancel: () => void;
  onSave: (updated: any) => void;
}) {
  const [name, setName] = useState(data.name || '');
  const [realm, setRealm] = useState(data.realm || 'qi_1');
  const [physique, setPhysique] = useState(data.physique || 'balanced');
  const [technique, setTechnique] = useState(data.technique || '');
  const [tactic, setTactic] = useState(data.tactic || 'balanced');
  const [description, setDescription] = useState(data.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !technique) {
      alert('Vui lòng điền đầy đủ Tên và chọn võ công chính.');
      return;
    }

    onSave({
      id: data.id,
      name,
      realm,
      physique,
      technique,
      tactic,
      description
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-text-secondary">
      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Tên Nhân Vật (NPC)*</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ảo Ảnh Tâm Ma"
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
          />
        </label>
        
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Cảnh Giới (Realm)</span>
          <select
            value={realm}
            onChange={(e) => setRealm(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
          >
            {realms.map((r: any) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Thể Chất (Physique)</span>
          <select
            value={physique}
            onChange={(e) => setPhysique(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
          >
            {physiques.map((p: any) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Võ Học Chủ Đạo*</span>
          <select
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
            required
          >
            <option value="">-- Chọn võ kĩ --</option>
            <optgroup label="Tà ma vũ kĩ (Enemy Arts)">
              {enemyArts.map((art) => (
                <option key={art.id} value={art.id}>{art.label}</option>
              ))}
            </optgroup>
            <optgroup label="Chính phái công pháp (Player Techs)">
              {techniques.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.label}</option>
              ))}
            </optgroup>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Đạo Chiến Thuật</span>
          <select
            value={tactic}
            onChange={(e) => setTactic(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
          >
            <option value="balanced">Cân bằng</option>
            <option value="aggressive">Cuồng công</option>
            <option value="defensive">Thủ thế</option>
            <option value="swift">Tốc chiến</option>
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Tóm Tắt Lai Lịch (Description)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả về gốc gác hoặc tính cách của ma đầu này khi xuất chiêu..."
          rows={3}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
        />
      </label>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-[#3e3328] text-text-tertiary hover:text-white rounded-sm transition"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition"
        >
          Triệu hoán (Save)
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 3. SECT LIST & FORM
// ==========================================
function SectList({
  sects,
  onEdit,
  onDelete,
  onAdd,
}: {
  sects: any[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#3e3328]/50 pb-2">
        <h4 className="font-serif text-md text-[#e5c17b]">Danh Tông Môn Phái Đại Lục</h4>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition"
        >
          + Lập tông môn mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sects.map((sect, index) => (
          <div key={sect.id || index} className="bg-[#14110f] border border-[#3e3328]/60 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h5 className="font-serif text-[#e5c17b] text-base">{sect.name}</h5>
                <span className="text-[10px] text-accent uppercase tracking-widest">{sect.alignment}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{sect.description}</p>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#3e3328]/30">
              <button
                type="button"
                onClick={() => onEdit(index)}
                className="px-2.5 py-1 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-transparent hover:border-[#c5a059]/30 rounded-sm"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => onDelete(index)}
                className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-sm"
              >
                Xóa tông môn
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectForm({
  data,
  onCancel,
  onSave,
}: {
  data: any;
  onCancel: () => void;
  onSave: (updated: any) => void;
}) {
  const [id, setId] = useState(data.id || '');
  const [name, setName] = useState(data.name || '');
  const [description, setDescription] = useState(data.description || '');
  const [alignment, setAlignment] = useState(data.alignment || 'neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      alert('Vui lòng nhập Mã tông môn và Tên tông môn.');
      return;
    }

    onSave({
      id,
      name,
      description,
      alignment
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-text-secondary">
      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Mã Tông Môn (ID)*</span>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="duong_gia_bao"
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
            disabled={data.id !== ''}
          />
        </label>
        
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Tên Tông Môn*</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kiếm Vương Các"
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Chính/Tà Tông Môn</span>
        <select
          value={alignment}
          onChange={(e) => setAlignment(e.target.value)}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
        >
          <option value="righteous">Chính phái (Righteous)</option>
          <option value="neutral">Trung lập (Neutral)</option>
          <option value="demonic">Ma đạo (Demonic)</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Lịch Sử Tông Môn (Description)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả truyền thuyết tông môn, các mật pháp nổi danh..."
          rows={4}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
        />
      </label>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-[#3e3328] text-text-tertiary hover:text-white rounded-sm transition"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition"
        >
          Khai môn lập phái (Save)
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 4. EVENT LIST & FORM
// ==========================================
// ==========================================
// 4. EVENT LIST & FORM & IMPORT FORM
// ==========================================
function EventList({
  events,
  onEdit,
  onDelete,
  onAdd,
  onImportJSON,
  onFastTest,
}: {
  events: any[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onImportJSON: () => void;
  onFastTest: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#3e3328]/50 pb-2">
        <h4 className="font-serif text-md text-[#e5c17b]">Các Sự Kiện Tu Chân Đời Người</h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFastTest}
            className="px-3 py-1 text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-sm transition font-serif uppercase tracking-wider"
          >
            ⚡ Chạy Fast Test (Giả lập)
          </button>
          <button
            type="button"
            onClick={onImportJSON}
            className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#c5a059] hover:bg-[#c5a059]/10 rounded-sm transition font-serif uppercase tracking-wider"
          >
            📥 Nhập JSON sự kiện
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition font-serif uppercase tracking-wider"
          >
            + Dệt thêm sự kiện mới
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {events.map((ev, index) => {
          const titleText = typeof ev.title === 'object' ? `${ev.title.vi} (${ev.title.en})` : ev.title;
          const descText = typeof ev.description === 'object' ? ev.description.vi : ev.description;
          const locationLabel = ev.location ? `[${ev.location.toUpperCase()}] ` : '';
          
          return (
            <div key={ev.id || index} className="bg-[#14110f] border border-[#3e3328]/60 p-4 space-y-2 flex items-center justify-between gap-6">
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline gap-4 flex-wrap">
                  <h5 className="font-serif text-[#e5c17b] text-base">{locationLabel}{titleText}</h5>
                  <span className="text-[10px] text-text-tertiary">Mã: {ev.id}</span>
                  <span className="text-[10px] text-[#847764] uppercase tracking-wider">Tuổi: {ev.minAge} - {ev.maxAge} (Nặng: {ev.weight})</span>
                  {ev._sourceFile && (
                    <span className="text-[9px] bg-[#3e3328]/30 text-[#847764] px-1 border border-[#3e3328]/50 rounded-sm">File: {ev._sourceFile}</span>
                  )}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{descText}</p>
                <div className="text-[10px] text-text-tertiary flex gap-3">
                  <span>Số lựa chọn: <span className="text-text-secondary">{(ev.choices || []).length}</span></span>
                  {ev.tags && ev.tags.length > 0 && (
                    <span>Tags: <span className="text-text-secondary">{ev.tags.join(', ')}</span></span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(index)}
                  className="px-2.5 py-2 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-[#3e3328] rounded-sm transition"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  className="px-2.5 py-2 text-xs text-red-400 hover:bg-red-950/20 border border-[#3e3328] rounded-sm transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventForm({
  data,
  onCancel,
  onSave,
}: {
  data: any;
  onCancel: () => void;
  onSave: (updated: any) => void;
}) {
  const [isRawJson, setIsRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');

  // form state
  const [id, setId] = useState(data.id || '');
  const [titleVi, setTitleVi] = useState(typeof data.title === 'object' ? (data.title.vi || '') : (data.title || ''));
  const [titleEn, setTitleEn] = useState(typeof data.title === 'object' ? (data.title.en || '') : '');
  const [descriptionVi, setDescriptionVi] = useState(typeof data.description === 'object' ? (data.description.vi || '') : (data.description || ''));
  const [descriptionEn, setDescriptionEn] = useState(typeof data.description === 'object' ? (data.description.en || '') : '');
  const [minAge, setMinAge] = useState(data.minAge || 1);
  const [maxAge, setMaxAge] = useState(data.maxAge || 100);
  const [weight, setWeight] = useState(data.weight || 1);
  const [location, setLocation] = useState(data.location || 'sect');
  const [tags, setTags] = useState<string[]>(data.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  // Format choices to bilingual structure
  const formattedChoices = (data.choices || []).map((c: any) => ({
    id: c.id,
    textVi: typeof c.text === 'object' ? (c.text.vi || '') : (c.text || ''),
    textEn: typeof c.text === 'object' ? (c.text.en || '') : '',
    effects: c.effects || {}
  }));
  const [choices, setChoices] = useState<any[]>(formattedChoices);

  // Sync to raw JSON
  useEffect(() => {
    if (isRawJson) {
      const currentEventData = {
        id: id || undefined,
        location: location || undefined,
        tags: tags.length > 0 ? tags : undefined,
        title: titleEn ? { vi: titleVi, en: titleEn } : titleVi,
        description: descriptionEn ? { vi: descriptionVi, en: descriptionEn } : descriptionVi,
        minAge: Number(minAge),
        maxAge: Number(maxAge),
        weight: Number(weight),
        choices: choices.map(c => ({
          id: c.id,
          text: c.textEn ? { vi: c.textVi, en: c.textEn } : c.textVi,
          effects: c.effects
        }))
      };
      setRawJsonText(JSON.stringify(currentEventData, null, 2));
    }
  }, [isRawJson]);

  const addChoice = () => {
    setChoices([
      ...choices,
      { id: 'choice_' + Date.now().toString().slice(-4), textVi: '', textEn: '', effects: {} }
    ]);
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, idx) => idx !== index));
  };

  const updateChoice = (index: number, key: string, value: any) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], [key]: value };
    setChoices(updated);
  };

  const updateChoiceEffect = (choiceIndex: number, stat: string, value: number) => {
    const updated = [...choices];
    const currentEffects = { ...updated[choiceIndex].effects };
    if (value === 0) {
      delete currentEffects[stat];
    } else {
      currentEffects[stat] = value;
    }
    updated[choiceIndex].effects = currentEffects;
    setChoices(updated);
  };

  const addTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRawJson) {
      try {
        const parsed = JSON.parse(rawJsonText);
        if (!parsed.id || !parsed.title || !parsed.description) {
          alert('JSON check failed: Event ID, title, and description are required.');
          return;
        }
        onSave(parsed);
      } catch (err: any) {
        alert(`JSON check failed: invalid syntax: ${err.message}`);
      }
      return;
    }

    if (!id || !titleVi || !descriptionVi) {
      alert('Vui lòng điền mã sự kiện, tiêu đề (VI) và mô tả (VI).');
      return;
    }
    if (choices.length === 0) {
      alert('Mỗi sự kiện cần có ít nhất 1 lựa chọn.');
      return;
    }
    if (choices.some(c => !c.id || !c.textVi)) {
      alert('Tất cả lựa chọn bắt buộc có ID và Tiếng Việt hiển thị.');
      return;
    }

    const compiledEvent = {
      id,
      location,
      tags: tags.length > 0 ? tags : undefined,
      title: titleEn ? { vi: titleVi, en: titleEn } : titleVi,
      description: descriptionEn ? { vi: descriptionVi, en: descriptionEn } : descriptionVi,
      minAge: Number(minAge),
      maxAge: Number(maxAge),
      weight: Number(weight),
      choices: choices.map(c => ({
        id: c.id,
        text: c.textEn ? { vi: c.textVi, en: c.textEn } : c.textVi,
        effects: c.effects
      }))
    };

    onSave(compiledEvent);
  };

  // Switch back from Raw JSON to Form
  const handleToggleMode = () => {
    if (isRawJson) {
      try {
        const parsed = JSON.parse(rawJsonText);
        setId(parsed.id || '');
        setLocation(parsed.location || 'sect');
        setTags(parsed.tags || []);
        
        if (typeof parsed.title === 'object') {
          setTitleVi(parsed.title.vi || '');
          setTitleEn(parsed.title.en || '');
        } else {
          setTitleVi(parsed.title || '');
          setTitleEn('');
        }
        
        if (typeof parsed.description === 'object') {
          setDescriptionVi(parsed.description.vi || '');
          setDescriptionEn(parsed.description.en || '');
        } else {
          setDescriptionVi(parsed.description || '');
          setDescriptionEn('');
        }
        
        setMinAge(parsed.minAge || 1);
        setMaxAge(parsed.maxAge || 100);
        setWeight(parsed.weight || 1);
        
        const restoredChoices = (parsed.choices || []).map((c: any) => ({
          id: c.id,
          textVi: typeof c.text === 'object' ? (c.text.vi || '') : (c.text || ''),
          textEn: typeof c.text === 'object' ? (c.text.en || '') : '',
          effects: c.effects || {}
        }));
        setChoices(restoredChoices);
        setIsRawJson(false);
      } catch (err: any) {
        alert(`Không thể chuyển đổi: Lỗi cú pháp JSON: ${err.message}`);
      }
    } else {
      setIsRawJson(true);
    }
  };

  const AVAILABLE_STATS = ['health', 'luck', 'comprehension', 'karma', 'cultivation', 'age'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-[#100e0c]/90 border border-[#3e3328]/40 p-3 rounded-sm">
        <span className="text-xs text-text-tertiary">
          Chế độ chỉnh sửa: <strong className="text-[#e5c17b]">{isRawJson ? 'MÃ NGUỒN JSON' : 'GIAO DIỆN FORM'}</strong>
        </span>
        <button
          type="button"
          onClick={handleToggleMode}
          className="px-3 py-1 text-xs border border-[#c5a059]/60 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition font-serif"
        >
          {isRawJson ? '👁️ Chuyển sang chỉnh Form' : '⚙️ Chuyển sang sửa bằng JSON'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-sm text-text-secondary">
        {isRawJson ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#847764]">Mã JSON của Sự Kiện (Raw JSON Code)*</span>
              <textarea
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                rows={18}
                className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059] font-mono text-xs"
                required
              />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <label className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Mã Sự Kiện (Event ID)*</span>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="linh_khi_tieu_tan"
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                  disabled={data.id !== ''}
                />
              </label>

              <label className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Vị Trí (Location)*</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059]"
                  required
                >
                  <option value="sect">Tông môn (Sect)</option>
                  <option value="city">Thành thị (City)</option>
                  <option value="mountain">Sơn mạch (Mountain)</option>
                  <option value="secret_realm">Bí cảnh (Secret Realm)</option>
                  <option value="any">Tự do (Any)</option>
                </select>
              </label>

              <div className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Gắn Nhãn (Tags)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Nhập tag rồi ấn Enter..."
                    className="flex-1 bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-xs text-lunar outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 border border-[#3e3328] hover:bg-[#c5a059]/10 text-xs rounded-sm transition"
                  >
                    Thêm
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {tags.map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-[#3e3328]/20 border border-[#3e3328]/60 text-[#847764] px-1.5 py-0.5 rounded-sm text-[10px]">
                        {t}
                        <button type="button" onClick={() => removeTag(idx)} className="text-red-400 hover:text-white font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Tiêu Đề (Tiếng Việt)*</span>
                <input
                  type="text"
                  value={titleVi}
                  onChange={(e) => setTitleVi(e.target.value)}
                  placeholder="Linh Khí Khô Kiệt"
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>

              <label className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Tiêu Đề (English)</span>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Spiritual Qi Depletion"
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Mô Tả Bối Cảnh (Tiếng Việt)*</span>
                <textarea
                  value={descriptionVi}
                  onChange={(e) => setDescriptionVi(e.target.value)}
                  placeholder="Mô tả bối cảnh..."
                  rows={3}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>

              <label className="block space-y-2 col-span-1">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Mô Tả Bối Cảnh (English)</span>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Bilingual English description..."
                  rows={3}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Tuổi Nhỏ Nhất (Min Age)</span>
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Tuổi Lớn Nhất (Max Age)</span>
                <input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#847764]">Trọng Số (Weight)</span>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
                />
              </label>
            </div>

            {/* Choices management */}
            <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
              <div className="flex items-center justify-between border-b border-[#3e3328]/40 pb-2">
                <h4 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest">Các Lựa Chọn Hành Động (Choices)*</h4>
                <button
                  type="button"
                  onClick={addChoice}
                  className="text-xs text-[#c5a059] hover:underline"
                >
                  + Bổ sung lựa chọn
                </button>
              </div>

              <div className="space-y-4">
                {choices.map((choice, choiceIdx) => (
                  <div key={choiceIdx} className="border border-[#3e3328]/40 p-4 bg-black/40 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif text-[#847764]">Lựa chọn #{choiceIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeChoice(choiceIdx)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Xóa bỏ
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <label className="block space-y-1 col-span-1">
                        <span className="text-[10px] uppercase text-text-tertiary">Mã Lựa Chọn*</span>
                        <input
                          type="text"
                          value={choice.id}
                          onChange={(e) => updateChoice(choiceIdx, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="ngoi_thien_tinh_tu"
                          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-xs text-lunar outline-none"
                          required
                        />
                      </label>
                      <label className="block space-y-1 col-span-1">
                        <span className="text-[10px] uppercase text-text-tertiary">Tiếng Việt Hiển Thị*</span>
                        <input
                          type="text"
                          value={choice.textVi}
                          onChange={(e) => updateChoice(choiceIdx, 'textVi', e.target.value)}
                          placeholder="Chọn ngồi tĩnh tu..."
                          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-xs text-lunar outline-none"
                          required
                        />
                      </label>
                      <label className="block space-y-1 col-span-1">
                        <span className="text-[10px] uppercase text-text-tertiary">English Text</span>
                        <input
                          type="text"
                          value={choice.textEn}
                          onChange={(e) => updateChoice(choiceIdx, 'textEn', e.target.value)}
                          placeholder="Choose to meditate..."
                          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-2 py-1 text-xs text-lunar outline-none"
                        />
                      </label>
                    </div>

                    {/* Effects in choice */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase text-text-tertiary block">Ảnh hưởng thuộc tính sau lựa chọn:</span>
                        <span className="text-[9px] text-[#847764] italic">Hỗ trợ các thuộc tính phức tạp qua chỉnh sửa JSON.</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {AVAILABLE_STATS.map((stat) => {
                          const val = choice.effects[stat] !== undefined ? choice.effects[stat] : 0;
                          return (
                            <label key={stat} className="block text-center bg-[#14110f] border border-[#3e3328]/60 p-1.5 rounded-sm">
                              <span className="text-[9px] uppercase tracking-tighter text-[#847764] block truncate">{stat}</span>
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => updateChoiceEffect(choiceIdx, stat, Number(e.target.value))}
                                className="w-full bg-transparent text-center text-xs text-lunar outline-none"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-[#3e3328] text-text-tertiary hover:text-white rounded-sm transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition font-serif uppercase tracking-widest text-xs"
          >
            Mở vận mệnh (Save)
          </button>
        </div>
      </form>
    </div>
  );
}

function EventImportForm({
  onCancel,
  onImport,
}: {
  onCancel: () => void;
  onImport: (jsonText: string) => void;
}) {
  const [jsonText, setJsonText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      alert('Vui lòng nhập nội dung văn bản JSON.');
      return;
    }
    onImport(jsonText);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-text-secondary animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#3e3328]/40 pb-2">
        <h4 className="font-serif text-[#e5c17b] text-md">📥 Nhập Nhiều Sự Kiện Bằng JSON (Batch Import)</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-text-tertiary hover:text-white transition"
        >
          Quay lại danh sách
        </button>
      </div>

      <p className="text-xs text-text-tertiary leading-relaxed">
        Nhập một đối tượng sự kiện đơn lẻ hoặc mảng các đối tượng sự kiện theo định dạng JSON.
        Bất kỳ sự kiện trùng ID hiện có sẽ tự động bị ghi đè (Cập nhật), ID mới sẽ được tạo thêm vào các tệp phân loại tương ứng dựa trên thuộc tính <code className="text-[#e5c17b]">location</code>.
      </p>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder={`[\n  {\n    "id": "my_custom_event",\n    "location": "city",\n    "tags": ["city", "market"],\n    "title": {\n      "en": "Custom Event",\n      "vi": "Sự kiện tự chế"\n    },\n    "description": {\n      "en": "A mysterious merchant offers you a map...",\n      "vi": "Một thương nhân bí ẩn đưa cho bạn tấm bản đồ..."\n    },\n    "minAge": 15,\n    "maxAge": 80,\n    "weight": 2,\n    "choices": [\n      {\n        "id": "accept_map",\n        "text": {\n          "en": "Accept it.",\n          "vi": "Nhận bản đồ."\n        },\n        "effects": {\n          "luck": 2,\n          "money": -50\n        }\n      }\n    ]\n  }\n]`}
        rows={15}
        className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-3 text-lunar outline-none focus:border-[#c5a059] font-mono text-xs"
        required
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-[#3e3328] text-text-tertiary hover:text-white rounded-sm transition"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          className="px-6 py-2 border border-[#c5a059] bg-[#c5a059]/15 text-[#e5c17b] hover:bg-[#c5a059]/25 hover:text-white rounded-sm transition font-serif uppercase tracking-widest text-xs"
        >
          Cập nhật & Thêm mới
        </button>
      </div>
    </form>
  );
}

function TimeGearConfig({
  combatConfig,
  onSave,
}: {
  combatConfig: any;
  onSave: (updated: any) => void;
}) {
  const timeGear = combatConfig?.time_gear || { tick_interval_seconds: 10, event_chance_denominator: 12, starting_spirit_stones: 10 };
  const [seconds, setSeconds] = useState(timeGear.tick_interval_seconds);
  const [denom, setDenom] = useState(timeGear.event_chance_denominator);
  const [startingStones, setStartingStones] = useState(timeGear.starting_spirit_stones ?? 10);
  const [travelHp, setTravelHp] = useState(timeGear.travel_cost_hp ?? 2);
  const [travelStones, setTravelStones] = useState(timeGear.travel_cost_stones ?? 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...timeGear,
      tick_interval_seconds: Number(seconds),
      event_chance_denominator: Number(denom),
      starting_spirit_stones: Number(startingStones),
      travel_cost_hp: Number(travelHp),
      travel_cost_stones: Number(travelStones),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md text-sm text-text-secondary animate-fade-in">
      <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">
        Cấu hình Bánh Răng Thời Gian (Time Gear Settings)
      </h4>
      
      <label className="block space-y-2 text-left">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Tần Suất Xoay (Giây / Tháng)*</span>
        <input
          type="number"
          value={seconds}
          onChange={(e) => setSeconds(Math.max(1, Number(e.target.value)))}
          min={1}
          max={3600}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          required
        />
        <span className="block text-xs text-text-tertiary">Thời gian đếm ngược giữa mỗi tháng tu luyện. Mặc định là 10 giây.</span>
      </label>

      <label className="block space-y-2 text-left">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Tỷ Lệ Kích Hoạt Sự Kiện (1 / X)*</span>
        <input
          type="number"
          value={denom}
          onChange={(e) => setDenom(Math.max(1, Number(e.target.value)))}
          min={1}
          max={1000}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          required
        />
        <span className="block text-xs text-text-tertiary">Mỗi tháng sẽ có tỷ lệ 1/X cơ hội kích hoạt kỳ ngộ (ví dụ: X = 12 tức tỷ lệ 1/12). Mặc định là 12.</span>
      </label>

      <label className="block space-y-2 text-left">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Linh Thạch Phúc Lợi Nhập Môn*</span>
        <input
          type="number"
          value={startingStones}
          onChange={(e) => setStartingStones(Math.max(0, Number(e.target.value)))}
          min={0}
          max={100000}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          required
        />
        <span className="block text-xs text-text-tertiary">Số lượng hạ phẩm linh thạch ban tặng cho đệ tử mới gia nhập. Mặc định là 10.</span>
      </label>

      <label className="block space-y-2 text-left">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Tiêu Hao HP Khi Di Chuyển*</span>
        <input
          type="number"
          value={travelHp}
          onChange={(e) => setTravelHp(Math.max(0, Number(e.target.value)))}
          min={0}
          max={100}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          required
        />
        <span className="block text-xs text-text-tertiary">Mỗi lần di chuyển giữa các địa điểm người chơi mất X lượng HP. Mặc định là 2.</span>
      </label>

      <label className="block space-y-2 text-left">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Tiêu Hao Linh Thạch Khi Di Chuyển*</span>
        <input
          type="number"
          value={travelStones}
          onChange={(e) => setTravelStones(Math.max(0, Number(e.target.value)))}
          min={0}
          max={10000}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          required
        />
        <span className="block text-xs text-text-tertiary">Mỗi lần di chuyển giữa các địa điểm người chơi tốn X hạ phẩm linh thạch. Mặc định là 10.</span>
      </label>

      <div className="pt-4 border-t border-[#3e3328]/50 text-left">
        <button
          type="submit"
          className="px-6 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition font-serif"
        >
          Lưu cấu hình thời gian
        </button>
      </div>
    </form>
  );
}

function ScriptureList({
  combatConfig,
  onEdit,
  onDelete,
  onAdd,
}: {
  combatConfig: any;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}) {
  const list = (combatConfig?.techniques || []).filter((t: any) => t.is_basic_manual);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#3e3328]/50 pb-2">
        <div className="text-left">
          <h4 className="font-serif text-md text-[#e5c17b]">Tàng Kinh Các (32 Bộ Tâm Pháp Sơ Cấp Linh Căn)</h4>
          <p className="text-xs text-text-tertiary">Các quyển tâm pháp này giới hạn tu luyện từ Luyện Khí tầng 1 đến 12.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 text-xs border border-[#c5a059]/40 text-[#e5c17b] hover:bg-[#c5a059]/10 rounded-sm transition font-serif"
        >
          + Thêm tâm pháp linh căn
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {list.map((t: any, index: number) => (
          <div key={t.id || index} className="bg-[#14110f] border border-[#3e3328]/60 p-4 rounded-sm flex flex-col justify-between text-left relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={t.image || '/images/sects/book_metal.png'}
                  alt={t.label}
                  className="w-12 h-12 rounded-sm border border-[#3e3328] object-cover bg-black/40 group-hover:scale-105 transition-transform duration-300 animate-fade-in"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/sects/book_metal.png';
                  }}
                />
                <div className="min-w-0">
                  <h5 className="font-serif text-[#e5c17b] text-sm font-bold truncate">{t.label}</h5>
                  <div className="flex flex-wrap gap-1 mt-1 text-[9px] uppercase font-mono">
                    <span className="px-1.5 py-0.5 rounded-sm bg-[#c5a059]/10 text-[#e5c17b]">{t.sect}</span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-blue-950/40 text-blue-400">{t.spiritual_root}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{t.description}</p>
              <div className="text-[10px] text-[#847764] space-y-0.5 font-serif border-t border-[#3e3328]/30 pt-1.5">
                <div>Chiêu thức: <span className="text-text-secondary font-sans">{t.action?.name}</span> (Tốn: {t.action?.costs?.qi || 0} Qi)</div>
                <div>Giới hạn tu vi: <span className="text-text-secondary font-sans">{t.max_cultivation_level || 26.0}</span> (Tầng 12)</div>
                <div>Hệ số Tâm Pháp (M_manual): <span className="text-text-secondary font-sans">{t.m_manual || 1.0}x</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#3e3328]/30 mt-3">
              <button
                type="button"
                onClick={() => onEdit(index)}
                className="px-2.5 py-1 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 border border-transparent hover:border-[#c5a059]/30 rounded-sm font-serif"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => onDelete(index)}
                className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-sm font-serif"
              >
                Phế bỏ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScriptureForm({
  data,
  onCancel,
  onSave,
}: {
  data: any;
  onCancel: () => void;
  onSave: (updated: any) => void;
}) {
  const [id, setId] = useState(data.id || '');
  const [label, setLabel] = useState(data.label || '');
  const [mManual, setMManual] = useState(data.m_manual !== undefined ? data.m_manual : 1.0);
  const [description, setDescription] = useState(data.description || '');
  const [choiceText, setChoiceText] = useState(data.choiceText || '');
  const [sect, setSect] = useState(data.sect || 'Kiếm Tông');
  const [root, setRoot] = useState(data.spiritual_root || 'Kim');
  const [maxCultivation, setMaxCultivation] = useState(data.max_cultivation_level || 26.0);
  const [image, setImage] = useState(data.image || '/images/sects/book_metal.png');

  // Action states
  const [actionName, setActionName] = useState(data.action?.name || '');
  const [qiCost, setQiCost] = useState(data.action?.costs?.qi || 4);
  const [narrativeTemplate, setNarrativeTemplate] = useState(data.action?.narrative_template || '');
  const [effects, setEffects] = useState<any[]>(data.action?.effects || []);

  const rootsList = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Lôi', 'Băng', 'Phong'];
  const sectsList = ['Kiếm Tông', 'Ma Đạo', 'Huyết Tông', 'Đan Tông'];

  const handleRootChange = (newRoot: string) => {
    setRoot(newRoot);
    const rootImgMap: Record<string, string> = {
      'Kim': 'book_metal',
      'Mộc': 'book_wood',
      'Thủy': 'book_water',
      'Hỏa': 'book_fire',
      'Thổ': 'book_earth',
      'Lôi': 'book_thunder',
      'Băng': 'book_ice',
      'Phong': 'book_wind'
    };
    setImage(`/images/sects/${rootImgMap[newRoot]}.png`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !label || !actionName) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const action = {
      ...data.action,
      id: `act_player_${id}`,
      name: actionName,
      costs: { qi: Number(qiCost) },
      narrative_template: narrativeTemplate,
      effects
    };

    onSave({
      ...data,
      id,
      label,
      description,
      m_manual: Number(mManual),
      choiceText: choiceText || `Vận chuyển chu thiên ${label} hấp thu tinh khí.`,
      sect,
      spiritual_root: root,
      max_cultivation_level: Number(maxCultivation),
      image,
      action
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-text-secondary text-left">
      <div className="grid grid-cols-3 gap-4">
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Mã Định Danh (ID)*</span>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
            disabled={data.id !== '' && data.id.startsWith('manual_')}
          />
        </label>
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Tên Tâm Pháp Sơ Cấp*</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
          />
        </label>
        <label className="block space-y-2 col-span-1">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Hệ số hiệu quả (M_manual)*</span>
          <input
            type="number"
            step="0.05"
            value={mManual}
            onChange={(e) => setMManual(Number(e.target.value))}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Môn Phái Độc Quyền</span>
          <select
            value={sect}
            onChange={(e) => setSect(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          >
            {sectsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Yêu Cầu Linh Căn</span>
          <select
            value={root}
            onChange={(e) => handleRootChange(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
          >
            {rootsList.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#847764]">Giới Hạn Tu Vi*</span>
          <input
            type="number"
            step="0.1"
            value={maxCultivation}
            onChange={(e) => setMaxCultivation(Number(e.target.value))}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
            required
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#847764]">Mô Tả Tâm Pháp Sơ Cấp</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2.5 text-lunar outline-none focus:border-[#c5a059]"
        />
      </label>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h5 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">Chiêu thức trong đấu pháp</h5>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-widest text-[#847764]">Tên Chiêu Thức*</span>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-widest text-[#847764]">Linh Lực Tiêu Hao (Qi Cost)</span>
            <input
              type="number"
              value={qiCost}
              onChange={(e) => setQiCost(Number(e.target.value))}
              min={0}
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none"
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-[#847764]">Lời Dẫn Miêu Tả Kỹ Năng</span>
          <input
            type="text"
            value={narrativeTemplate}
            onChange={(e) => setNarrativeTemplate(e.target.value)}
            className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-3 py-2 text-lunar outline-none"
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-black/40 hover:bg-black/60 text-text-secondary border border-[#3e3328] rounded-sm transition font-serif"
        >
          Hủy bỏ (Cancel)
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition font-serif"
        >
          Khắc Lên Thạch Phiến (Save)
        </button>
      </div>
    </form>
  );
}

function NpcRelationsView({
  game,
  onChangeGame,
}: {
  game?: GameState | null;
  onChangeGame?: (game: GameState) => void;
}) {
  if (!game || !onChangeGame) {
    return (
      <div className="text-center p-8 border border-[#3e3328]/60 bg-[#14110f]/20 rounded-sm">
        <p className="font-serif text-[#847764] italic">Không tìm thấy thông tin kiếp sống hiện tại. Hãy bắt đầu hoặc hồi sinh kiếp mới để tải Lược đồ Nhân Mạch.</p>
      </div>
    );
  }

  const favor = game.npcFavorability || {
    npc_kiem_tong_chap_su: 0,
    npc_kiem_tong_ta_tieu: 0,
    npc_dan_tong_chap_su: 0,
    npc_ma_dao_chap_su: 0,
    npc_huyet_tong_chap_su: 0,
  };

  const handleFavorabilityChange = (npcId: string, newVal: number) => {
    const currentVal = favor[npcId] ?? 0;
    const diff = newVal - currentVal;
    if (diff === 0) return;
    const updatedFavors = changeNpcFavorability(favor, npcId, diff);
    onChangeGame({
      ...game,
      npcFavorability: updatedFavors,
    });
  };

  const getFavorabilityBadgeColor = (val: number) => {
    if (val >= 60) return 'text-emerald-400 bg-emerald-950/20 border-emerald-800/40';
    if (val >= 20) return 'text-[#e5c17b] bg-[#c5a059]/10 border-[#c5a059]/30';
    if (val <= -60) return 'text-red-400 bg-red-950/25 border-red-900/40';
    if (val <= -20) return 'text-orange-400 bg-orange-950/20 border-orange-900/40';
    return 'text-text-tertiary bg-black/35 border-[#3e3328]/60';
  };

  const npcs = [
    {
      id: 'npc_kiem_tong_chap_su',
      name: 'Tạ Trần',
      role: 'Ngoại môn Chấp sự',
      sect: 'Kiếm Tông',
      avatar: '👨‍💼',
      desc: 'Chấp sự Ngoại môn Kiếm Tông. Thiết diện vô tư nhưng rất bao che cho người nhà.',
      relation: 'Bác ruột của Tạ Tiêu',
      events: [
        { name: '⚖️ Gây Khó Dễ (Lao dịch)', trigger: 'Hảo cảm ≤ -30', desc: 'Phạt quét dọn Tẩy Kiếm Trì (-10 HP).' },
        { name: '🤝 Hỏi Thăm Đàm Đạo', trigger: 'Bình thường (-29 đến 29)', desc: 'Tĩnh tâm hỏi thăm tăng ngộ tính (+1 Ngộ tính).' },
        { name: '🎁 Chỉ Điểm Kiếm Quyết', trigger: 'Hảo cảm ≥ 30', desc: 'Ban thưởng Kiếm Quyết tàn thiên (+2 Ngộ tính).' }
      ]
    },
    {
      id: 'npc_kiem_tong_ta_tieu',
      name: 'Tạ Tiêu',
      role: 'Đệ tử Ngoại môn',
      sect: 'Kiếm Tông',
      avatar: '🧑‍🎤',
      desc: 'Cháu ruột Chấp sự Tạ Trần. Ăn chơi sa đọa, hay mượn linh thạch không trả, thích hiếp đáp tân đệ tử.',
      relation: 'Cháu ruột Chấp sự Tạ Trần (Giảm hảo cảm Tạ Tiêu lan truyền x0.6 sang Tạ Trần, tăng lan truyền x0.3)',
      events: [
        { name: '☠️ Tạ Tiêu Báo Thù (Combat)', trigger: 'Hảo cảm ≤ -30', desc: 'Kích hoạt trận chiến sinh tử đấu pháp.' },
        { name: '💰 Mượn Linh Thạch / 👿 Cướp Đoạt', trigger: 'Bình thường (-29 đến 29)', desc: 'Mượn linh thạch không trả hoặc hiếp đáp tân đệ tử.' },
        { name: '🍶 Bách Hoa Tửu Chiêu Đãi', trigger: 'Hảo cảm ≥ 30', desc: 'Rủ uống rượu tăng khí vận (+2 Khí vận, -1 Đạo tâm).' }
      ]
    },
    {
      id: 'npc_dan_tong_chap_su',
      name: 'Linh Dương',
      role: 'Ngoại môn Chấp sự',
      sect: 'Đan Tông',
      avatar: '👨‍🔬',
      desc: 'Chấp sự Ngoại môn Đan Tông. Say mê luyện đan, thích tìm đệ tử thử các loại đan dược mới.',
      relation: 'Độc lập',
      events: [
        { name: '☠️ Thử Thuốc Độc', trigger: 'Hảo cảm ≤ -30', desc: 'Bắt thử độc đan (-15 HP, ngẫu nhiên +1 Ngộ tính).' },
        { name: '🌿 Thu Mua Dược Liệu', trigger: 'Bình thường (-29 đến 29)', desc: 'Thu mua Linh thảo đổi lấy Linh thạch hoặc Cống hiến.' },
        { name: '🧪 Tặng Huyền Nguyên Đan', trigger: 'Hảo cảm ≥ 30', desc: 'Ban tặng Huyền Nguyên Đan miễn phí.' }
      ]
    },
    {
      id: 'npc_ma_dao_chap_su',
      name: 'Khấu Vô Kỵ',
      role: 'Ngoại môn Chấp sự',
      sect: 'Ma Đạo',
      avatar: '😈',
      desc: 'Chấp sự Ngoại môn Ma Đạo. Tâm tính tàn ác, tham lam vô độ, thích thu phí bảo kê.',
      relation: 'Độc lập',
      events: [
        { name: '🔮 Ám Hại Luyện Cờ (Combat)', trigger: 'Hảo cảm ≤ -30', desc: 'Chặn đường mưu hại làm cờ vây công.' },
        { name: '💸 Thu Phí Bảo Kê', trigger: 'Bình thường (-29 đến 29)', desc: 'Cưỡng đoạt thu 10 Linh thạch hằng tuần.' },
        { name: '🔮 Chỉ Điểm Cướp Đoạt', trigger: 'Hảo cảm ≥ 30', desc: 'Rủ đi cướp tiêu xa Đan Tông (+40 Linh thạch, -5 Nghiệp lực).' }
      ]
    },
    {
      id: 'npc_huyet_tong_chap_su',
      name: 'Xích Liệt',
      role: 'Ngoại môn Chấp sự',
      sect: 'Huyết Tông',
      avatar: '🧛',
      desc: 'Chấp sự Ngoại môn Huyết Tông. Tu luyện huyết pháp, toàn thân mùi huyết tinh hung bạo.',
      relation: 'Độc lập',
      events: [
        { name: '🩸 Tế Huyết Nhục Thân', trigger: 'Hảo cảm ≤ -30', desc: 'Cưỡng bức hiến tế tinh huyết luyện pháp khí (-25 HP).' },
        { name: '🦴 Thu Thập Yêu Cốt', trigger: 'Bình thường (-29 đến 29)', desc: 'Yêu cầu nộp Linh thú cốt/quặng sắt đổi Cống hiến.' },
        { name: '🩸 Ban Huyết Phách Đan', trigger: 'Hảo cảm ≥ 30', desc: 'Ban tặng Huyết Phách Đan (+30 HP, +2.0 Tu vi).' }
      ]
    }
  ];

  // Helper for rendering a card
  const renderNpcCard = (npc: typeof npcs[0]) => {
    const val = favor[npc.id] ?? 0;
    const label = getNpcFavorabilityLabel(val);
    const badgeColor = getFavorabilityBadgeColor(val);

    const borderStyle = val >= 30 
      ? 'border-[#c5a059]/60 shadow-[0_0_12px_rgba(197,160,89,0.12)]' 
      : val <= -30 
        ? 'border-red-950/60 shadow-[0_0_12px_rgba(239,68,68,0.1)]' 
        : 'border-[#3e3328]/60';

    return (
      <div 
        key={npc.id} 
        className={`bg-[#0c0a08]/95 border ${borderStyle} p-4 rounded-sm flex flex-col space-y-3 hover:scale-[1.01] transition-all duration-300`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{npc.avatar}</span>
            <div>
              <h5 className="font-serif text-[#e5c17b] text-base font-bold">{npc.name}</h5>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">{npc.role} • {npc.sect}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-sm font-serif ${badgeColor}`}>
            {label} ({val > 0 ? `+${val}` : val})
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed bg-black/20 p-2 border border-[#3e3328]/35 rounded-sm">
          {npc.desc}
        </p>

        {npc.relation !== 'Độc lập' && (
          <div className="text-[10px] text-amber-500/80 bg-amber-950/10 border border-amber-900/30 px-2.5 py-1.5 rounded-sm font-serif">
            🔗 <strong>Quan hệ:</strong> {npc.relation}
          </div>
        )}

        {/* Sliders and Inputs */}
        <div className="space-y-2 pt-2 border-t border-[#3e3328]/30">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-text-tertiary">
            <span>Thiết lập Hảo Cảm</span>
            <span className="text-[#e5c17b] font-mono font-bold">{val}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-100"
              max="100"
              value={val}
              onChange={(e) => handleFavorabilityChange(npc.id, Number(e.target.value))}
              className="flex-1 accent-[#c5a059] h-1 bg-black rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min="-100"
              max="100"
              value={val}
              onChange={(e) => {
                let n = Number(e.target.value);
                if (n > 100) n = 100;
                if (n < -100) n = -100;
                handleFavorabilityChange(npc.id, n);
              }}
              className="w-14 bg-[#14110f] border border-[#3e3328] rounded-sm text-center py-0.5 text-xs font-mono text-[#e5c17b]"
            />
          </div>
        </div>

        {/* NPC Events Triggers */}
        <div className="pt-2 border-t border-[#3e3328]/30 space-y-1.5">
          <h6 className="text-[10px] uppercase text-[#847764] font-bold tracking-wider">Trạng thái sự kiện liên quan:</h6>
          <div className="space-y-1 text-[11px]">
            {npc.events.map((evt, idx) => {
              let isTriggered = false;
              if (evt.trigger.includes('≤ -30') && val <= -30) isTriggered = true;
              else if (evt.trigger.includes('≥ 30') && val >= 30) isTriggered = true;
              else if (evt.trigger.includes('Bình thường') && val > -30 && val < 30) isTriggered = true;

              return (
                <div 
                  key={idx} 
                  className={`p-1.5 rounded-sm border ${
                    isTriggered 
                      ? 'border-[#c5a059]/45 bg-[#c5a059]/10 text-white font-medium shadow-[0_0_8px_rgba(197,160,89,0.05)]' 
                      : 'border-transparent text-text-tertiary'
                  }`}
                >
                  <div className="flex justify-between font-serif text-[11px]">
                    <span className={isTriggered ? 'text-[#e5c17b]' : ''}>{evt.name}</span>
                    <span className="text-[10px] scale-90">{evt.trigger}</span>
                  </div>
                  <p className="text-[10px] leading-tight text-text-secondary mt-0.5">{evt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const chapSuKiemTong = npcs.find(n => n.id === 'npc_kiem_tong_chap_su')!;
  const taTieuKiemTong = npcs.find(n => n.id === 'npc_kiem_tong_ta_tieu')!;
  const danTong = npcs.find(n => n.id === 'npc_dan_tong_chap_su')!;
  const maDao = npcs.find(n => n.id === 'npc_ma_dao_chap_su')!;
  const huyetTong = npcs.find(n => n.id === 'npc_huyet_tong_chap_su')!;

  return (
    <div className="space-y-6 animate-fade-in text-sm text-text-secondary">
      <div className="border border-[#c5a059]/35 bg-[#14110f]/40 p-4 rounded-sm flex items-center gap-3">
        <span className="text-xl">👥</span>
        <div>
          <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-wider font-semibold">Lược Đồ Nhân Mạch Môn Phái</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Theo dõi và thử nghiệm hảo cảm NPC. Hảo cảm ảnh hưởng trực tiếp đến chuỗi sự kiện môn phái hàng tháng và các cuộc đột kích thù địch/hữu hảo.
            Khi hảo cảm NPC phụ (Tạ Tiêu) thay đổi, hảo cảm của Chấp sự (Tạ Trần) sẽ thay đổi liên đới theo hệ số phản ánh quan hệ gia tộc.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Column 1: Kiếm Tông (Contains relation line) */}
        <div className="md:col-span-1 flex flex-col space-y-4">
          <div className="border-b border-[#3e3328] pb-1.5 mb-1 text-center">
            <h5 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest font-bold">⚔️ Kiếm Tông</h5>
          </div>
          
          {renderNpcCard(chapSuKiemTong)}

          {/* Relation Line Representation */}
          <div className="flex flex-col items-center py-2 relative">
            <div className="w-0.5 h-10 border-l border-dashed border-[#c5a059]/65"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c0a08] border border-[#c5a059]/40 px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-wider text-[#e5c17b] font-serif font-bold text-center whitespace-nowrap shadow-md">
              Bác Cháu (Liên Đới)
            </div>
          </div>

          {renderNpcCard(taTieuKiemTong)}
        </div>

        {/* Column 2: Đan Tông */}
        <div className="flex flex-col space-y-4">
          <div className="border-b border-[#3e3328] pb-1.5 mb-1 text-center">
            <h5 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest font-bold">🧪 Đan Tông</h5>
          </div>
          {renderNpcCard(danTong)}
        </div>

        {/* Column 3: Ma Đạo */}
        <div className="flex flex-col space-y-4">
          <div className="border-b border-[#3e3328] pb-1.5 mb-1 text-center">
            <h5 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest font-bold">🔮 Ma Đạo</h5>
          </div>
          {renderNpcCard(maDao)}
        </div>

        {/* Column 4: Huyết Tông */}
        <div className="flex flex-col space-y-4">
          <div className="border-b border-[#3e3328] pb-1.5 mb-1 text-center">
            <h5 className="font-serif text-[#e5c17b] text-sm uppercase tracking-widest font-bold">🩸 Huyết Tông</h5>
          </div>
          {renderNpcCard(huyetTong)}
        </div>
      </div>
    </div>
  );
}

function CultivationConfig({
  combatConfig,
  onSave,
}: {
  combatConfig: any;
  onSave: (updated: any) => void;
}) {
  const cs = combatConfig?.cultivation_system || {
    base_gain: { passive: 0.02, active_retreat: 0.80, annual_quest_average: 0.12 },
    spiritual_roots: [
      { id: "thien", name: "Thiên Linh Căn", multiplier: 2.5, damage_bonus_pct: 100 },
      { id: "don", name: "Đơn Linh Căn", multiplier: 1.2, damage_bonus_pct: 30 },
      { id: "song", name: "Song Linh Căn", multiplier: 0.9, damage_bonus_pct: 0 },
      { id: "tam", name: "Tam Linh Căn", multiplier: 0.7, damage_bonus_pct: 0 },
      { id: "tap", name: "Tạp Linh Căn", multiplier: 0.4, damage_bonus_pct: 5, defense_bonus_pct: 15 }
    ],
    manual_tiers: [
      { tier: "hoàng", label: "Hoàng Cấp", multiplier: 1.0, max_level_no_pill: 26.99 },
      { tier: "huyền", label: "Huyền Cấp", multiplier: 1.5, max_level_no_pill: 49.99 },
      { tier: "địa", label: "Địa Cấp", multiplier: 2.2, max_level_no_pill: 89.99 },
      { tier: "thiên", label: "Thiên Cấp", multiplier: 3.5, max_level_no_pill: 149.99 }
    ],
    bottlenecks: [
      { realm_from: "Qi Refinement", realm_to: "Foundation Establishment", threshold: 29.99, pill_item_id: "item_truc_co_dan", next_cult: 30.0, label: "Trúc Cơ" },
      { realm_from: "Foundation Establishment", realm_to: "Golden Core", threshold: 49.99, pill_item_id: "item_kim_dan_dan", next_cult: 50.0, label: "Kim Đan" },
      { realm_from: "Golden Core", realm_to: "Nascent Soul", threshold: 89.99, pill_item_id: "item_nguyen_anh_dan", next_cult: 90.0, label: "Nguyên Anh" }
    ]
  };

  const [passive, setPassive] = useState(cs.base_gain?.passive ?? 0.02);
  const [activeRetreat, setActiveRetreat] = useState(cs.base_gain?.active_retreat ?? 0.80);
  const [annualAverage, setAnnualAverage] = useState(cs.base_gain?.annual_quest_average ?? 0.12);

  const [roots, setRoots] = useState<any[]>(cs.spiritual_roots ?? []);
  const [manuals, setManuals] = useState<any[]>(cs.manual_tiers ?? []);
  const [bottlenecks, setBottlenecks] = useState<any[]>(cs.bottlenecks ?? []);

  const handleRootChange = (index: number, field: string, value: number) => {
    const updated = [...roots];
    updated[index] = { ...updated[index], [field]: value };
    setRoots(updated);
  };

  const handleManualChange = (index: number, field: string, value: number) => {
    const updated = [...manuals];
    updated[index] = { ...updated[index], [field]: value };
    setManuals(updated);
  };

  const handleBottleneckChange = (index: number, field: string, value: any) => {
    const updated = [...bottlenecks];
    updated[index] = { ...updated[index], [field]: value };
    setBottlenecks(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      base_gain: {
        passive: Number(passive),
        active_retreat: Number(activeRetreat),
        annual_quest_average: Number(annualAverage),
      },
      spiritual_roots: roots.map(r => ({
        ...r,
        multiplier: Number(r.multiplier),
        damage_bonus_pct: Number(r.damage_bonus_pct),
        defense_bonus_pct: r.defense_bonus_pct !== undefined ? Number(r.defense_bonus_pct) : undefined,
      })),
      manual_tiers: manuals.map(m => ({
        ...m,
        multiplier: Number(m.multiplier),
        max_level_no_pill: Number(m.max_level_no_pill),
      })),
      bottlenecks: bottlenecks.map(b => ({
        ...b,
        threshold: Number(b.threshold),
        next_cult: Number(b.next_cult),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-sm text-text-secondary pb-6 animate-fade-in">
      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">🌱 Tốc độ Tu luyện Cơ bản (Base Gain rates)</h4>
        <div className="grid grid-cols-3 gap-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#847764]">Hấp thụ Thụ động (Passive / tháng)</span>
            <input
              type="number"
              step="0.001"
              value={passive}
              onChange={(e) => setPassive(Number(e.target.value))}
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#847764]">Bế quan Tĩnh tu (Active / tháng)</span>
            <input
              type="number"
              step="0.01"
              value={activeRetreat}
              onChange={(e) => setActiveRetreat(Number(e.target.value))}
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#847764]">Trung bình năm có nhiệm vụ (baseline)</span>
            <input
              type="number"
              step="0.01"
              value={annualAverage}
              onChange={(e) => setAnnualAverage(Number(e.target.value))}
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
              required
            />
          </label>
        </div>
      </div>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">🌱 Hệ số Tư chất Linh Căn (Spiritual Roots multipliers)</h4>
        <div className="space-y-4">
          {roots.map((r, index) => (
            <div key={r.id} className="grid grid-cols-4 gap-4 items-center bg-[#14110f] p-3 border border-[#3e3328]/40 rounded-sm">
              <span className="font-serif text-[#e5c17b] font-semibold text-sm">{r.name} ({r.id})</span>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase text-[#847764]">Hệ số tốc độ (Multiplier)</span>
                <input
                  type="number"
                  step="0.1"
                  value={r.multiplier}
                  onChange={(e) => handleRootChange(index, 'multiplier', Number(e.target.value))}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase text-[#847764]">Tăng Sát thương (%)</span>
                <input
                  type="number"
                  value={r.damage_bonus_pct}
                  onChange={(e) => handleRootChange(index, 'damage_bonus_pct', Number(e.target.value))}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
              {r.defense_bonus_pct !== undefined ? (
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase text-[#847764]">Tăng Kháng phòng thủ (%)</span>
                  <input
                    type="number"
                    value={r.defense_bonus_pct}
                    onChange={(e) => handleRootChange(index, 'defense_bonus_pct', Number(e.target.value))}
                    className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                    required
                  />
                </label>
              ) : (
                <div className="text-xs text-text-tertiary italic pt-4">Không có bổ trợ phụ</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">📖 Phẩm cấp Tâm Pháp & Giới hạn bình sinh (Manual Tiers & Caps)</h4>
        <div className="space-y-4">
          {manuals.map((m, index) => (
            <div key={m.tier} className="grid grid-cols-3 gap-4 items-center bg-[#14110f] p-3 border border-[#3e3328]/40 rounded-sm">
              <span className="font-serif text-[#e5c17b] font-semibold text-sm">{m.label} ({m.tier})</span>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase text-[#847764]">Hệ số tu luyện (Multiplier)</span>
                <input
                  type="number"
                  step="0.1"
                  value={m.multiplier}
                  onChange={(e) => handleManualChange(index, 'multiplier', Number(e.target.value))}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase text-[#847764]">Cực hạn tu vi không có đan dược (Max Cap)</span>
                <input
                  type="number"
                  step="0.01"
                  value={m.max_level_no_pill}
                  onChange={(e) => handleManualChange(index, 'max_level_no_pill', Number(e.target.value))}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">⚡ Điểm nghẽn Bình Cảnh & Đan Dược phá cảnh (Bottlenecks & Pills)</h4>
        <div className="space-y-4">
          {bottlenecks.map((b, index) => (
            <div key={b.realm_from} className="grid grid-cols-4 gap-4 items-center bg-[#14110f] p-3 border border-[#3e3328]/40 rounded-sm">
              <div className="flex flex-col gap-0.5 col-span-1">
                <span className="font-serif text-[#e5c17b] font-medium text-xs">Đột phá: {b.label}</span>
                <span className="text-[10px] text-text-tertiary">Ngưỡng: {b.threshold}</span>
              </div>
              <label className="block space-y-1 col-span-1">
                <span className="text-[10px] uppercase text-[#847764]">Mã Đan dược yêu cầu</span>
                <input
                  type="text"
                  value={b.pill_item_id}
                  onChange={(e) => handleBottleneckChange(index, 'pill_item_id', e.target.value)}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
              <label className="block space-y-1 col-span-1">
                <span className="text-[10px] uppercase text-[#847764]">Mức tu vi chuyển tiếp (Next Cult)</span>
                <input
                  type="number"
                  step="0.1"
                  value={b.next_cult}
                  onChange={(e) => handleBottleneckChange(index, 'next_cult', Number(e.target.value))}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
              <label className="block space-y-1 col-span-1">
                <span className="text-[10px] uppercase text-[#847764]">Tỷ lệ thành công tự nhiên (No pill)</span>
                <input
                  type="number"
                  step="0.01"
                  value={b.success_rate_no_pill ?? 0.01}
                  onChange={(e) => handleBottleneckChange(index, 'success_rate_no_pill', Number(e.target.value))}
                  className="w-full bg-[#0c0a08] border border-[#3e3328] rounded-sm px-3 py-1.5 text-lunar outline-none focus:border-[#c5a059]"
                  required
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="submit"
          className="px-8 py-3 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#e5c17b] border border-[#c5a059]/50 rounded-sm transition font-serif uppercase tracking-wider text-xs"
        >
          Khắc ấn Tu Vi lên Thạch Bản (Save Cultivation Config)
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 10. WORLD STATE VIEW — MẠCH MÁU THẾ GIỚI
// ==========================================
function WorldStateView({
  game,
  onChangeGame,
}: {
  game?: GameState | null;
  onChangeGame?: (g: GameState) => void;
}) {
  const world = game?.worldState ?? null;

  // Local editable copy
  const [localWorld, setLocalWorld] = useState<WorldState | null>(null);
  const [randomizeMode, setRandomizeMode] = useState(true);

  useEffect(() => {
    if (world) setLocalWorld(JSON.parse(JSON.stringify(world)));
    else setLocalWorld(null);
  }, [game?.worldState]);

  if (!game) {
    return (
      <div className="text-center py-16 text-text-tertiary font-serif italic">
        <div className="text-4xl mb-4">🌍</div>
        <p>Chưa có dữ liệu game. Bắt đầu một hành trình mới để xem Mạch Máu Thế Giới.</p>
      </div>
    );
  }

  if (!localWorld) {
    return (
      <div className="text-center py-16 text-text-tertiary font-serif italic">
        <p>WorldState chưa được khởi tạo.</p>
        <button
          type="button"
          onClick={() => {
            if (!game || !onChangeGame) return;
            const ws = createInitialWorldState(randomizeMode);
            onChangeGame({ ...game, worldState: ws });
          }}
          className="mt-4 px-6 py-2 border border-[#c5a059]/50 text-[#e5c17b] text-xs rounded-sm hover:bg-[#c5a059]/10"
        >
          🌍 Khởi tạo Mạch Máu Thế Giới
        </button>
      </div>
    );
  }

  const applyLocalWorld = (next: WorldState) => {
    setLocalWorld(next);
    if (game && onChangeGame) {
      onChangeGame({ ...game, worldState: next });
    }
  };

  const setVar = (
    group: keyof Omit<WorldState, 'history'>,
    key: string,
    value: number
  ) => {
    const next = { ...localWorld, [group]: { ...(localWorld as any)[group], [key]: value } } as WorldState;
    applyLocalWorld(next);
  };

  // Compute world news and event modifiers for preview
  const news = worldStateToNews(localWorld, 'vi');
  const mods = getWorldEventModifiers(localWorld);
  const previewEvent = generateWorldThresholdEvent(localWorld, game, 'vi');

  const COLOR = {
    good: '#4ade80',
    warn: '#facc15',
    bad: '#f87171',
    accent: '#e5c17b',
  };

  const barColor = (v: number, invert = false): string => {
    const pct = invert ? 100 - v : v;
    if (pct >= 70) return COLOR.good;
    if (pct >= 40) return COLOR.warn;
    return COLOR.bad;
  };

  type VarDef = { key: string; label: string; min?: number; max?: number; invert?: boolean; unit?: string };

  const GROUPS: Array<{
    groupKey: keyof Omit<WorldState, 'history'>;
    title: string;
    emoji: string;
    color: string;
    vars: VarDef[];
  }> = [
    {
      groupKey: 'sect',
      title: 'Tông Môn',
      emoji: '⛩️',
      color: '#e5c17b',
      vars: [
        { key: 'reputation', label: 'Danh vọng' },
        { key: 'resources', label: 'Tài nguyên' },
        { key: 'stability', label: 'Nội bộ ổn định' },
        { key: 'warLevel', label: 'Chiến sự', invert: true },
      ],
    },
    {
      groupKey: 'city',
      title: 'Thành Thị',
      emoji: '🏙️',
      color: '#60a5fa',
      vars: [
        { key: 'prosperity', label: 'Phồn vinh' },
        { key: 'security', label: 'An ninh' },
        { key: 'priceIndex', label: 'Giá cả', min: 50, max: 300, unit: '%' },
        { key: 'morale', label: 'Dân tâm' },
      ],
    },
    {
      groupKey: 'mountain',
      title: 'Sơn Mạch',
      emoji: '⛰️',
      color: '#34d399',
      vars: [
        { key: 'beastActivity', label: 'Yêu thú hoạt động', invert: true },
        { key: 'resources', label: 'Tài nguyên thiên địa' },
        { key: 'danger', label: 'Độ nguy hiểm', invert: true },
      ],
    },
    {
      groupKey: 'demonic',
      title: 'Ma Đạo',
      emoji: '💀',
      color: '#f87171',
      vars: [
        { key: 'infiltration', label: 'Thâm nhập', invert: true },
        { key: 'activity', label: 'Hoạt động tà tu', invert: true },
      ],
    },
    {
      groupKey: 'global',
      title: 'Thiên Địa',
      emoji: '✨',
      color: '#a78bfa',
      vars: [
        { key: 'spiritualQi', label: 'Linh khí' },
        { key: 'daoFluctuation', label: 'Thiên đạo dị động', invert: true },
        { key: 'demonicEnergy', label: 'Ma khí', invert: true },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e3328]/50 pb-4">
        <div>
          <h2 className="font-serif text-lg text-[#e5c17b] tracking-wider">🌍 Mạch Máu Thế Giới</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Tháng {game.month} — Tuổi {game.age} | Lịch sử: {localWorld.history?.length ?? 0} tháng
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Toggle random/fixed */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-[#14110f] border border-[#3e3328]/60 px-3 py-2 rounded-sm text-xs">
            <input
              type="checkbox"
              checked={randomizeMode}
              onChange={e => setRandomizeMode(e.target.checked)}
              className="accent-[#c5a059]"
            />
            <span className="text-text-secondary">Khởi tạo ngẫu nhiên ±15</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const ws = createInitialWorldState(randomizeMode);
              applyLocalWorld(ws);
            }}
            className="px-4 py-2 border border-[#c5a059]/50 text-[#e5c17b] text-xs hover:bg-[#c5a059]/10 transition rounded-sm"
          >
            🔄 Reset Thế Giới
          </button>
        </div>
      </div>

      {/* World News Banner */}
      {news.length > 0 && (
        <div className="bg-[#0f0d0b] border border-[#c5a059]/20 rounded-sm p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-[#c5a059] font-bold">📰 Tin Tức Thế Giới Tháng Này</p>
          {news.map((n, i) => (
            <p key={i} className="text-xs text-text-secondary font-serif">{n}</p>
          ))}
        </div>
      )}

      {/* 5 Variable Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {GROUPS.map(g => {
          const groupData = (localWorld as any)[g.groupKey] as Record<string, number>;
          return (
            <div
              key={g.groupKey}
              className="bg-[#0f0d0b] border border-[#3e3328]/60 rounded-sm p-4 space-y-3"
              style={{ borderLeftColor: g.color, borderLeftWidth: 3 }}
            >
              <h3
                className="font-serif text-sm font-bold tracking-wide"
                style={{ color: g.color }}
              >
                {g.emoji} {g.title}
              </h3>
              <div className="space-y-4">
                {g.vars.map(v => {
                  const min = v.min ?? 0;
                  const max = v.max ?? 100;
                  const val = groupData[v.key] ?? 0;
                  const pct = ((val - min) / (max - min)) * 100;
                  const color = v.min !== undefined
                    ? (val > 150 ? COLOR.bad : val > 110 ? COLOR.warn : COLOR.good)
                    : barColor(val, v.invert);

                  return (
                    <div key={v.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-text-secondary">{v.label}</span>
                        <span className="text-[11px] font-bold font-mono" style={{ color }}>
                          {Math.round(val)}{v.unit || ''}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-[#1a1512] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(2, pct)}%`, background: color }}
                        />
                      </div>
                      {/* Slider */}
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={1}
                        value={Math.round(val)}
                        onChange={e => setVar(g.groupKey, v.key, Number(e.target.value))}
                        className="w-full h-1 cursor-pointer"
                        style={{ accentColor: g.color }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Modifiers Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0f0d0b] border border-[#3e3328]/60 rounded-sm p-4 space-y-3">
          <h3 className="font-serif text-sm text-[#e5c17b] font-bold tracking-wide">⚖️ Hệ Số Sự Kiện Hiện Tại</h3>
          <div className="space-y-2">
            {Object.entries(mods).length === 0 ? (
              <p className="text-xs text-text-tertiary italic">Thế giới ở trạng thái cân bằng, không có modifier đặc biệt.</p>
            ) : (
              Object.entries(mods).sort((a, b) => b[1] - a[1]).map(([tag, mult]) => (
                <div key={tag} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-text-secondary bg-[#1a1512] px-2 py-0.5 rounded text-[10px]">
                    tag:{tag}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (mult - 1) * 33)}px`,
                        background: mult > 2 ? COLOR.bad : mult > 1.5 ? COLOR.warn : COLOR.good,
                      }}
                    />
                    <span className="font-bold font-mono" style={{ color: mult > 2 ? COLOR.bad : mult > 1.5 ? COLOR.warn : COLOR.good }}>
                      ×{mult.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Threshold Event Preview */}
        <div className="bg-[#0f0d0b] border border-[#3e3328]/60 rounded-sm p-4 space-y-3">
          <h3 className="font-serif text-sm text-[#e5c17b] font-bold tracking-wide">🎯 Sự Kiện Threshold Tiềm Năng</h3>
          {previewEvent ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#ffd166] font-serif">
                {typeof previewEvent.title === 'string' ? previewEvent.title : previewEvent.title.vi}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
                {typeof previewEvent.description === 'string' ? previewEvent.description : previewEvent.description.vi}
              </p>
              <div className="text-[10px] text-[#847764]">
                {previewEvent.choices.length} lựa chọn | Tags: {previewEvent.tags?.join(', ') || 'none'}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-tertiary italic">
              Không có sự kiện threshold nào đang ở ngưỡng kích hoạt. Tăng các biến cực đoan để kích hoạt sự kiện đặc biệt.
            </p>
          )}
          <div className="text-[10px] text-[#847764] border-t border-[#3e3328]/30 pt-2 space-y-0.5">
            <p>• beastActivity &gt;85 → Thú Triều Tràn Thành (35%)</p>
            <p>• stability &lt;20 → Nội Loạn Môn Phái (30%)</p>
            <p>• daoFluctuation &gt;78 → Bí Cảnh Khai Mở (28%)</p>
            <p>• demonicEnergy &gt;80 + infiltration &gt;70 → Ma Đạo Xâm Nhập (25%)</p>
            <p>• prosperity &gt;85 → Đại Đấu Giá Thập Niên (30%)</p>
          </div>
        </div>
      </div>

      {/* Sparkline history */}
      {localWorld.history && localWorld.history.length > 1 && (
        <div className="bg-[#0f0d0b] border border-[#3e3328]/60 rounded-sm p-4 space-y-3">
          <h3 className="font-serif text-sm text-[#e5c17b] font-bold tracking-wide">📈 Lịch Sử Biến Động ({localWorld.history.length} tháng)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Danh vọng TM', fn: (s: any) => s.sect.reputation, color: '#e5c17b' },
              { label: 'Yêu thú', fn: (s: any) => s.mountain.beastActivity, color: '#f87171' },
              { label: 'An ninh', fn: (s: any) => s.city.security, color: '#60a5fa' },
              { label: 'Ma khí', fn: (s: any) => s.global.demonicEnergy, color: '#c084fc' },
              { label: 'Linh khí', fn: (s: any) => s.global.spiritualQi, color: '#4ade80' },
              { label: 'Giá cả', fn: (s: any) => Math.min(100, (s.city.priceIndex - 50) / 2.5), color: '#fb923c' },
            ].map(metric => {
              const vals = localWorld.history!.map(h => metric.fn(h.snapshot));
              const W = 120, H = 32;
              const min = Math.min(...vals), max = Math.max(...vals, min + 1);
              const points = vals.map((v, i) => {
                const x = (i / (vals.length - 1)) * W;
                const y = H - ((v - min) / (max - min)) * H;
                return `${x},${y}`;
              }).join(' ');
              const last = vals[vals.length - 1];
              return (
                <div key={metric.label} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-text-tertiary">{metric.label}</span>
                    <span className="font-mono font-bold" style={{ color: metric.color }}>{Math.round(last)}</span>
                  </div>
                  <svg width={W} height={H} className="w-full overflow-visible">
                    <polyline
                      points={points}
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      opacity="0.8"
                    />
                    <circle
                      cx={(vals.length - 1) / (vals.length - 1) * W}
                      cy={H - ((last - min) / (max - min)) * H}
                      r="2.5"
                      fill={metric.color}
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SIMULATION REPORT (FAST TEST VIEW)
// ==========================================
// ==========================================
// SIMULATION REPORT (FAST TEST VIEW)
// ==========================================
const STAT_LABELS: Record<string, string> = {
  health: 'Khí Huyết',
  cultivation: 'Tu Vi',
  luck: 'Vận Khí',
  comprehension: 'Ngộ Tính',
  karma: 'Nhân Quả',
  daoHeart: 'Đạo Tâm',
  spiritStones: 'Linh Thạch',
};

const getStatChanges = (before: any, after: any) => {
  const list: Array<{ label: string; before: number; after: number; change: string }> = [];
  const keys = ['health', 'cultivation', 'luck', 'comprehension', 'karma', 'daoHeart', 'spiritStones'];
  
  keys.forEach(key => {
    const valB = before[key] || 0;
    const valA = after[key] || 0;
    const diff = valA - valB;
    if (diff !== 0) {
      const diffStr = diff > 0 ? `+${diff.toFixed(key === 'cultivation' ? 1 : 0)}` : diff.toFixed(key === 'cultivation' ? 1 : 0);
      list.push({
        label: STAT_LABELS[key],
        before: valB,
        after: valA,
        change: diffStr
      });
    }
  });
  return list;
};

function SimulationReport({
  results,
  onClose,
}: {
  results: {
    finalState: GameState;
    eventHistory: Array<{
      age: number;
      month: number;
      eventTitle: string;
      choiceText: string;
      effectsSummary: string;
      effects?: any;
      statsBefore?: any;
      statsAfter?: any;
    }>;
  };
  onClose: () => void;
}) {
  const downloadLog = () => {
    const timeStr = new Date().toISOString();
    const finalStats = results.finalState.stats || {};
    const deathReason = results.finalState.deathCause?.vi || results.finalState.deathCause?.en || 'Thọ nguyên khô kiệt, tan biến vào thiên địa.';

    const eventLogs = results.eventHistory.map((item) => {
      const statsB = item.statsBefore || {};
      const statsA = item.statsAfter || {};
      const changes = getStatChanges(statsB, statsA);
      
      let tableLines = [
        `| Chỉ số | Trước | Sau | Thay đổi |`,
        `| --- | --- | --- | --- |`
      ];
      
      if (changes.length === 0) {
        tableLines.push(`| Mệnh Số | 0 | 0 | 0 |`);
      } else {
        changes.forEach(c => {
          tableLines.push(`| ${c.label} | ${c.before} | ${c.after} | ${c.change} |`);
        });
      }

      return [
        `[Tuổi ${item.age} - Tháng ${item.month}] - [${item.eventTitle}]`,
        `Tình huống: Bản thân đối mặt với cảnh ngộ "${item.eventTitle}", tâm niệm chọn cách "${item.choiceText}" để ứng phó hiểm cảnh.`,
        `Kết quả: Nhân quả xoay vần, thiên cơ mở ra, khí vận cơ thể bắt đầu biến chuyển.`,
        tableLines.join('\n'),
        `\n`
      ].join('\n');
    });

    const lines = [
      `# BÁO CÁO GIẢ LẬP MỆNH VẬN TU TIÊN (FAST TEST)`,
      `Thời gian tạo: ${timeStr}`,
      `Kiếp thứ: #${results.finalState.run || 1}`,
      `Giới tính: ${results.finalState.gender || 'nam'}`,
      `Linh căn xuất thế: ${finalStats.spiritualRoot || 'Kim Linh Căn'}`,
      `Môn phái gia nhập: ${results.finalState.sect || 'Kiếm Tông'}`,
      `Số kiếp nạn trải qua: ${results.eventHistory.length}`,
      `=========================================`,
      ``,
      ...eventLogs,
      `=========================================`,
      `## KẾT THÚC GIẢ LẬP MỆNH VẬN`,
      `- Tuổi thọ đạt đến: ${results.finalState.age} tuổi, tháng ${results.finalState.month}`,
      `- Cảnh giới tu vi cuối cùng: ${results.finalState.realm}`,
      `- Các chỉ số thuộc tính cuối cùng:`,
      `  - Khí Huyết (HP): ${finalStats.health}`,
      `  - Tu Vi Điểm: ${finalStats.cultivation}`,
      `  - Vận Khí (Luck): ${finalStats.luck}`,
      `  - Ngộ Tính: ${finalStats.comprehension}`,
      `  - Nhân Quả (Karma): ${finalStats.karma}`,
      `  - Thọ Nguyên còn lại: ${finalStats.lifespan}`,
      `  - Đạo Tâm: ${finalStats.daoHeart}`,
      `  - Linh Thạch tích lũy: ${results.finalState.spiritStones || 0}`,
      `  - Cống hiến Tông Môn: ${results.finalState.sectContribution || 0}`,
      `- Nguyên nhân kết thúc: ${deathReason}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fast-test-sim-${results.finalState.age}-tuoi.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deathReason = results.finalState.deathCause?.vi || results.finalState.deathCause?.en || 'Thọ nguyên khô kiệt, tan biến vào thiên địa.';

  return (
    <div className="space-y-6 animate-fade-in text-sm text-text-secondary">
      <div className="flex items-center justify-between border-b border-[#3e3328]/40 pb-4">
        <h3 className="font-serif text-lg text-[#e5c17b]">
          ⚡ Kết Quả Giả Lập Mệnh Vận (Simulation Report)
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-text-tertiary hover:text-white transition"
        >
          Quay lại danh sách
        </button>
      </div>

      {/* Summary dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#14110f] border border-[#3e3328]/60 p-4 rounded-sm text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#847764] block">Tuổi thọ đạt được</span>
          <span className="font-serif text-2xl text-[#e5c17b] mt-1 block">{results.finalState.age} tuổi</span>
          <span className="text-[10px] text-text-tertiary">Tháng {results.finalState.month}</span>
        </div>
        <div className="bg-[#14110f] border border-[#3e3328]/60 p-4 rounded-sm text-center col-span-2">
          <span className="text-[10px] uppercase tracking-widest text-[#847764] block">Nguyên nhân từ trần</span>
          <span className="font-serif text-sm text-red-400 mt-2 block leading-relaxed line-clamp-2">{deathReason}</span>
        </div>
        <div className="bg-[#14110f] border border-[#3e3328]/60 p-4 rounded-sm text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#847764] block">Cảnh giới cuối cùng</span>
          <span className="font-serif text-md text-green-400 mt-2 block font-semibold">{results.finalState.realm}</span>
        </div>
      </div>

      {/* Actions and Logs */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-serif text-sm text-[#e5c17b]">Cuộn Trục Mệnh Vận ({results.eventHistory.length} Sự kiện)</h4>
          <button
            type="button"
            onClick={downloadLog}
            className="px-4 py-2 border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:text-white rounded-sm text-xs transition font-serif uppercase tracking-wider"
          >
            📥 Tải xuống Nhật ký đầy đủ (.txt)
          </button>
        </div>

        <div className="border border-[#3e3328]/60 bg-black/40 rounded-sm overflow-hidden">
          <div className="max-h-[50vh] overflow-y-auto p-4 space-y-6 font-serif text-sm text-text-secondary">
            {results.eventHistory.map((item, idx) => {
              const changes = getStatChanges(item.statsBefore || {}, item.statsAfter || {});
              return (
                <div key={idx} className="border-b border-[#3e3328]/20 pb-4 last:border-0 last:pb-0 space-y-2">
                  {/* Title */}
                  <div className="text-[13px] text-[#e5c17b] font-semibold">
                    [Tuổi {item.age} - Tháng {item.month}] - [{item.eventTitle}]
                  </div>
                  {/* Context & Result */}
                  <div className="pl-3 border-l border-[#c5a059]/30 text-xs text-text-tertiary space-y-1 leading-relaxed">
                    <p><strong className="text-text-secondary font-semibold">Tình huống:</strong> Bản thân đối mặt với cảnh ngộ "{item.eventTitle}", tâm niệm chọn cách "{item.choiceText}" để ứng phó hiểm cảnh.</p>
                    <p><strong className="text-text-secondary font-semibold">Kết quả:</strong> Nhân quả xoay vần, thiên cơ mở ra, khí vận cơ thể bắt đầu biến chuyển.</p>
                  </div>
                  {/* Table */}
                  <div className="pl-3 overflow-x-auto">
                    <table className="min-w-[280px] text-[11px] font-mono text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#3e3328]/40 text-[#847764] uppercase tracking-wider">
                          <th className="py-1 pr-4 font-normal">Chỉ số</th>
                          <th className="py-1 pr-4 font-normal">Trước</th>
                          <th className="py-1 pr-4 font-normal">Sau</th>
                          <th className="py-1 text-right font-normal">Thay đổi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changes.length === 0 ? (
                          <tr className="border-b border-[#3e3328]/10">
                            <td className="py-1 pr-4 text-text-tertiary">Mệnh Số</td>
                            <td className="py-1 pr-4">0</td>
                            <td className="py-1 pr-4">0</td>
                            <td className="py-1 text-right text-text-tertiary">0</td>
                          </tr>
                        ) : (
                          changes.map((c, cIdx) => (
                            <tr key={cIdx} className="border-b border-[#3e3328]/10 last:border-0">
                              <td className="py-1 pr-4 text-text-secondary">{c.label}</td>
                              <td className="py-1 pr-4 text-text-tertiary">{c.before}</td>
                              <td className="py-1 pr-4 text-text-tertiary">{c.after}</td>
                              <td className={`py-1 text-right font-semibold ${c.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                {c.change}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#3e3328]/50">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-[#3e3328] text-text-tertiary hover:text-white rounded-sm transition text-xs uppercase tracking-widest font-serif"
        >
          Đóng & Quay lại
        </button>
      </div>
    </div>
  );
}

