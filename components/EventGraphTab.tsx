import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  ConnectionLineType,
  Panel,
  MarkerType,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { EventDefinition } from '../types';

interface Props {
  onEditEvent: (eventId: string) => void;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 120,
    nodesep: 50
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export default function EventGraphTab({ onEditEvent }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventDefinition | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<EventDefinition | null>(null);

  const [showTags, setShowTags] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      const events: EventDefinition[] = data.events;
      
      const initialNodes: Node[] = [];
      const initialEdges: Edge[] = [];

      const addedConditionNodes = new Set<string>();

      events.forEach((ev) => {
        const eventTitle = typeof ev.title === 'string' ? ev.title : ev.title?.vi || ev.id;
        // Node
        initialNodes.push({
          id: ev.id,
          data: { 
            event: ev, // Store event data for tooltips
            label: (
              <div className="flex flex-col items-center justify-center text-center p-2">
                <span className="font-bold text-xs text-[#c5a059]">{ev.id}</span>
                <span className="text-xs mt-1 truncate w-full" title={eventTitle}>{eventTitle}</span>
              </div>
            ) 
          },
          position: { x: 0, y: 0 }, // will be set by dagre
          className: 'rounded shadow-md border hover:border-[#c5a059] transition-colors',
          style: { width: nodeWidth, backgroundColor: '#1e1915', borderColor: '#3e3328', color: '#ffffff' }
        });

        // 1. Condition Edges (Realm & SubStage)
        if (ev.minRealm) {
          const subStageSuffix = ev.minSubStageIndex !== undefined ? ` (Tầng ${ev.minSubStageIndex})` : '';
          const condId = `cond-realm-${ev.minRealm}${ev.minSubStageIndex !== undefined ? `-${ev.minSubStageIndex}` : ''}`;
          
          if (!addedConditionNodes.has(condId)) {
            addedConditionNodes.add(condId);
            initialNodes.push({
              id: condId,
              data: {
                label: (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <span className="font-bold text-sm text-[#4da6ff]">Cảnh Giới</span>
                    <span className="text-xs mt-1">{ev.minRealm}{subStageSuffix}</span>
                  </div>
                )
              },
              position: { x: 0, y: 0 },
              className: 'rounded-[50px] shadow-lg border-2 hover:opacity-80 transition-opacity',
              style: { width: 180, backgroundColor: '#1a2b3c', borderColor: '#4da6ff', color: '#ffffff' }
            });
          }

          initialEdges.push({
            id: `e-cond-${condId}-${ev.id}`,
            source: condId,
            target: ev.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#4da6ff', strokeWidth: 2, strokeDasharray: '5,5' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: '#4da6ff',
            },
          });
        }

        // 1.5 Condition Edges (Location & Tags)
        const createCondNode = (type: string, value: string, color: string, bg: string) => {
          const condId = `cond-${type}-${value}`;
          if (!addedConditionNodes.has(condId)) {
            addedConditionNodes.add(condId);
            initialNodes.push({
              id: condId,
              data: {
                label: (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <span className={`font-bold text-sm`} style={{ color }}>{type.toUpperCase()}</span>
                    <span className="text-xs mt-1">{value}</span>
                  </div>
                )
              },
              position: { x: 0, y: 0 },
              className: `rounded-[50px] shadow-lg border-2 hover:opacity-80 transition-opacity`,
              style: { width: 150, backgroundColor: bg, borderColor: color, color: '#ffffff' }
            });
          }
          
          initialEdges.push({
            id: `e-cond-${condId}-${ev.id}`,
            source: condId,
            target: ev.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: color, strokeWidth: 1.5, strokeDasharray: '4,4', opacity: 0.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: color,
            },
          });
        };

        if (showLocation && ev.location) {
          createCondNode('location', ev.location, '#4caf50', '#1b3a1d');
        }
        
        if (showTags && ev.tags && Array.isArray(ev.tags)) {
          ev.tags.forEach(tag => {
            createCondNode('tag', tag, '#9c27b0', '#3b1c40');
          });
        }

        // 2. Edges from choices (Event Chains)
        if (ev.choices && Array.isArray(ev.choices)) {
          ev.choices.forEach((choice, idx) => {
            const nextEventId = choice.effects?.nextEvent;
            if (nextEventId) {
              const choiceText = typeof choice.text === 'string' ? choice.text : choice.text?.vi || 'Choice';
              initialEdges.push({
                id: `e-${ev.id}-${nextEventId}-${idx}`,
                source: ev.id,
                target: nextEventId,
                label: choiceText,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#c5a059', strokeWidth: 1.5 },
                labelStyle: { fill: '#a0a0a0', fontSize: 10, fontWeight: 500 },
                labelBgStyle: { fill: '#0a0806', fillOpacity: 0.8 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: '#c5a059',
                },
              });
            }
          });
        }
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        'TB' // Top to Bottom
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges, showTags, showLocation]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.event) {
      onEditEvent(node.id);
    }
  }, [onEditEvent]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.event) {
      setSelectedEvent(node.data.event as EventDefinition);
    } else {
      setSelectedEvent(null);
    }
  }, []);

  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.event) {
      setHoveredEvent(node.data.event as EventDefinition);
    }
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredEvent(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const activeDisplayEvent = selectedEvent || hoveredEvent;

  if (loading) return <div className="p-6 text-text-secondary flex justify-center items-center h-full">Đang tải biểu đồ...</div>;
  if (error) return <div className="p-6 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="w-full h-full bg-[#0a0806] flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="p-4 border-b border-[#3e3328] flex justify-between items-center bg-[#14100c] flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-serif text-[#e5c17b]">Cây Sự Kiện (Event Graph)</h2>
          <p className="text-xs text-text-tertiary mt-1">Sơ đồ rẽ nhánh của các cốt truyện. Bấm đúp vào Node để sửa.</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showLocation} 
              onChange={(e) => setShowLocation(e.target.checked)} 
              className="accent-[#c5a059]"
            />
            Hiện Vị Trí (Location)
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={showTags} 
              onChange={(e) => setShowTags(e.target.checked)} 
              className="accent-[#c5a059]"
            />
            Hiện Tags
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onLayout('TB')} className="px-3 py-1 bg-[#28211b] text-text-secondary text-sm rounded hover:bg-[#3e3328]">
            Dọc (Top-Bottom)
          </button>
          <button onClick={() => onLayout('LR')} className="px-3 py-1 bg-[#28211b] text-text-secondary text-sm rounded hover:bg-[#3e3328]">
            Ngang (Left-Right)
          </button>
          <button onClick={fetchEvents} className="px-3 py-1 bg-[#c5a059] text-black text-sm rounded hover:bg-[#e5c17b]">
            Tải Lại
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onPaneClick={handlePaneClick}
          fitView
          className="bg-[#0a0806]"
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Background color="#1e1915" gap={20} size={1} />
          <MiniMap 
            nodeColor="#3e3328" 
            maskColor="rgba(10, 8, 6, 0.7)" 
            style={{ backgroundColor: '#14100c', border: '1px solid #3e3328' }} 
          />
          <Controls 
            style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#14100c', border: '1px solid #3e3328', borderRadius: '4px' }} 
          />
          
          {activeDisplayEvent && (
            <Panel position="top-right" className="bg-[#14100c] border border-[#c5a059] p-4 rounded shadow-xl w-80 text-white z-50 mr-4 mt-4 pointer-events-none">
              <h3 className="font-bold text-[#c5a059] text-lg border-b border-[#3e3328] pb-2 mb-2">
                {typeof activeDisplayEvent.title === 'string' ? activeDisplayEvent.title : activeDisplayEvent.title.vi}
              </h3>
              <div className="text-xs text-gray-400 mb-2 font-mono">{activeDisplayEvent.id}</div>
              <p className="text-sm text-gray-300 mb-4 line-clamp-4">
                {typeof activeDisplayEvent.description === 'string' ? activeDisplayEvent.description : activeDisplayEvent.description.vi}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {activeDisplayEvent.minRealm && (
                  <span className="px-2 py-1 bg-[#1a2b3c] text-[#4da6ff] rounded text-xs border border-[#4da6ff]">
                    Cảnh Giới: {activeDisplayEvent.minRealm} {activeDisplayEvent.minSubStageIndex !== undefined ? `(T${activeDisplayEvent.minSubStageIndex})` : ''}
                  </span>
                )}
                {activeDisplayEvent.location && (
                  <span className="px-2 py-1 bg-[#1b3a1d] text-[#4caf50] rounded text-xs border border-[#4caf50]">
                    Vị Trí: {activeDisplayEvent.location}
                  </span>
                )}
              </div>
              
              {activeDisplayEvent.tags && activeDisplayEvent.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {activeDisplayEvent.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-[#3b1c40] text-[#9c27b0] rounded text-[10px] border border-[#9c27b0]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {selectedEvent && (
                <div className="mt-4 pt-2 border-t border-[#3e3328] text-xs text-center text-[#c5a059]">
                  Bấm đúp (Double-click) vào Node để sửa
                </div>
              )}
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
