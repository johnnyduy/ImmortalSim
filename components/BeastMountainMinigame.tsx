import React, { useState, useEffect, useRef } from 'react';
import { uiText } from '../lib/i18n';
import type { Lang } from '../types';

interface BeastMountainMinigameProps {
  language: Lang;
  inventory: any[];
  onSuccess: (rewardItem: any) => void;
  onFail: (damage: number) => void;
  onCancel: () => void;
  onConsumeItem: (item: any) => void;
}

const BEASTS = [
  { name: 'Huyết Lang', type: 'Thú', tier: 'hoàng', damage: 20 },
  { name: 'Viêm Hổ', type: 'Thú', tier: 'huyền', damage: 45 },
  { name: 'Băng Thiềm', type: 'Yêu', tier: 'địa', damage: 70 },
];

export default function BeastMountainMinigame({
  language,
  inventory,
  onSuccess,
  onFail,
  onCancel,
  onConsumeItem
}: BeastMountainMinigameProps) {
  const [phase, setPhase] = useState<'SCANNING' | 'BAITING' | 'AMBUSHING' | 'RESULT'>('SCANNING');
  const [logs, setLogs] = useState<string[]>([]);
  const [targetBeast, setTargetBeast] = useState<any>(null);
  const [selectedBait, setSelectedBait] = useState<any>(null);
  const [ambushDistance, setAmbushDistance] = useState(100);
  const [resultMsg, setResultMsg] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 1: Scanning
  useEffect(() => {
    if (phase === 'SCANNING') {
      const beast = BEASTS[Math.floor(Math.random() * BEASTS.length)];
      setTargetBeast(beast);
      
      const newLogs = [
        '[SYSTEM] Bắt đầu rà soát dao động linh khí...',
        `[SENSOR] Nhiệt độ có dấu hiệu bất thường...`,
        `[TRACE] Phát hiện dấu vết di chuyển của sinh vật cấp ${beast.tier}...`
      ];
      
      let i = 0;
      timerRef.current = setInterval(() => {
        if (i < newLogs.length) {
          setLogs(prev => [...prev, newLogs[i]]);
          i++;
        }
      }, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  // Phase 3: Ambushing
  useEffect(() => {
    if (phase === 'AMBUSHING') {
      setAmbushDistance(100);
      timerRef.current = setInterval(() => {
        setAmbushDistance(prev => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAmbush(0);
            return 0;
          }
          return prev - (Math.random() * 5 + 5);
        });
      }, 500);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  const handleLockTarget = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('BAITING');
  };

  const handleDeployAmbush = () => {
    if (!selectedBait) return;
    onConsumeItem(selectedBait);
    setPhase('AMBUSHING');
  };

  const handleAmbush = (distanceOverride?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalDist = distanceOverride !== undefined ? distanceOverride : ambushDistance;
    
    // Kill Zone: 15 to 30
    if (finalDist >= 15 && finalDist <= 30) {
      setResultMsg(uiText[language]?.ambushSuccess || 'PHỤC KÍCH THÀNH CÔNG');
      setPhase('RESULT');
      setTimeout(() => {
        onSuccess({
          id: `beast_core_${Date.now()}`,
          name: `Yêu Đan - ${targetBeast.name}`,
          type: 'LINH DƯỢC',
          tier: targetBeast.tier,
          description: `Yêu đan tinh khiết của ${targetBeast.name}, dùng để luyện đan hoặc hấp thụ.`
        });
      }, 2000);
    } else if (finalDist > 30) {
      setResultMsg(uiText[language]?.ambushTooEarly || 'Khởi động quá sớm! Yêu thú bỏ chạy.');
      setPhase('RESULT');
      setTimeout(() => {
        onCancel(); // exit empty handed
      }, 2000);
    } else {
      setResultMsg(uiText[language]?.ambushTooLate || 'Quá muộn! Yêu thú đã phát hiện và tấn công bạn.');
      setPhase('RESULT');
      setTimeout(() => {
        onFail(targetBeast.damage);
      }, 2000);
    }
  };

  const availableBaits = inventory.filter(i => i.type === 'LINH DƯỢC' || i.type === 'ĐAN DƯỢC' || i.name.includes('Linh Thạch'));

  return (
    <div className="flex-1 bg-black text-emerald-400 p-4 flex flex-col font-mono border border-emerald-500/30 overflow-hidden relative">
      <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
      
      <div className="flex justify-between items-center border-b border-emerald-500/50 pb-2 mb-4">
        <h2 className="font-bold text-lg">{uiText[language]?.exploreTitleSys || 'THÁM HIỂM [ BEAST_MOUNTAIN_SYS ]'}</h2>
        <span className="animate-pulse">
          {phase === 'SCANNING' && (uiText[language]?.phaseScanning || 'TRẠNG THÁI: DÒ TÌM VẾT TÍCH')}
          {phase === 'BAITING' && (uiText[language]?.phaseBaiting || 'TRẠNG THÁI: CHUẨN BỊ MỒI NHỬ')}
          {phase === 'AMBUSHING' && (uiText[language]?.phaseAmbushing || 'TRẠNG THÁI: GIĂNG LƯỚI PHỤC KÍCH')}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center relative z-10">
        
        {phase === 'SCANNING' && (
          <div className="w-full max-w-lg">
            <div className="bg-emerald-950/30 p-4 h-64 overflow-y-auto border border-emerald-500/30 mb-4">
              {logs.map((l, idx) => (
                <div key={idx} className="mb-2 opacity-80">{l}</div>
              ))}
            </div>
            <button 
              onClick={handleLockTarget}
              disabled={logs.length < 3}
              className="w-full py-3 bg-emerald-900/40 border border-emerald-500 hover:bg-emerald-500 hover:text-black font-bold transition-colors disabled:opacity-50"
            >
              {uiText[language]?.lockTargetBtn || 'KHÓA MỤC TIÊU (LOCK)'}
            </button>
          </div>
        )}

        {phase === 'BAITING' && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-red-500 mb-2">! {uiText[language]?.targetLocked || 'ĐÃ KHÓA MỤC TIÊU'} !</div>
              <div>Mục tiêu dự kiến: {targetBeast?.name} ({targetBeast?.tier})</div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm">{uiText[language]?.selectBaitLabel || 'CHỌN MỒI NHỬ:'}</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableBaits.length > 0 ? availableBaits.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedBait(item)}
                    className={`p-2 border text-left ${selectedBait?.id === item.id ? 'border-emerald-400 bg-emerald-900/50' : 'border-emerald-500/30 hover:border-emerald-400/50'}`}
                  >
                    {item.name}
                  </button>
                )) : (
                  <div className="col-span-2 text-center py-4 opacity-50">{uiText[language]?.noBaitAvailable || 'Không có vật phẩm phù hợp'}</div>
                )}
              </div>
            </div>

            <button 
              onClick={handleDeployAmbush}
              disabled={!selectedBait}
              className="w-full py-3 bg-emerald-900/40 border border-emerald-500 hover:bg-emerald-500 hover:text-black font-bold transition-colors disabled:opacity-50"
            >
              {uiText[language]?.deployAmbushBtn || 'KÍCH HOẠT ẨN NẶC TRẬN'}
            </button>
          </div>
        )}

        {phase === 'AMBUSHING' && (
          <div className="w-full max-w-lg text-center">
            <h3 className="text-xl mb-8">{uiText[language]?.radarHeatmapHeader || '--- RADAR HEATMAP ---'}</h3>
            
            {/* Radar visualizing distance */}
            <div className="relative h-12 bg-emerald-950/50 border border-emerald-500/50 mb-8 overflow-hidden flex items-center">
              <div className="absolute left-[15%] w-[15%] h-full bg-red-500/20 border-x border-red-500/50 flex items-center justify-center text-xs text-red-400">
                {uiText[language]?.killZoneIndicator || 'VÙNG DIỆT SÁT'}
              </div>
              <div 
                className="absolute text-2xl font-bold text-red-500 transition-all duration-300"
                style={{ right: `${ambushDistance}%` }}
              >
                [!]
              </div>
              <div className="absolute left-4 text-emerald-300">
                [*] (Mồi)
              </div>
            </div>

            <p className="mb-8 animate-pulse text-red-400">{uiText[language]?.targetApproaching || 'YÊU THÚ ĐANG TIẾN LẠI GẦN...'}</p>

            <button 
              onClick={() => handleAmbush()}
              className="w-full py-4 bg-red-900/40 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold text-xl tracking-widest transition-colors"
            >
              {uiText[language]?.execKillArrayBtn || '[ EXEC: KÍCH HOẠT SÁT TRẬN ]'}
            </button>
          </div>
        )}

        {phase === 'RESULT' && (
          <div className="text-center animate-fade-in">
            <h2 className={`text-2xl font-bold mb-4 ${resultMsg.includes('THÀNH CÔNG') || resultMsg.includes('SUCCESS') ? 'text-emerald-400' : 'text-red-500'}`}>
              {resultMsg}
            </h2>
          </div>
        )}
      </div>

      {(phase === 'SCANNING' || phase === 'BAITING') && (
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 px-4 py-1 text-sm border border-emerald-500/50 hover:bg-emerald-500 hover:text-black transition-colors"
        >
          [ ESC ]
        </button>
      )}
    </div>
  );
}
