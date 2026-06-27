import React, { useState, useEffect, useRef } from 'react';
import { TechniqueInstance } from '../types';

import { uiText } from '../lib/i18n';
import type { Lang } from '../types';

interface Props {
  language: Lang;
  technique: TechniqueInstance;
  onSuccess: (perfect: boolean) => void;
  onFail: (severity: 'mild' | 'heavy' | 'severe') => void;
  onCancel: () => void;
}

type ArrowKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const ARROW_SYMBOLS: Record<ArrowKey, string> = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→'
};

const KEY_MAP: Record<string, ArrowKey> = {
  ArrowUp: 'UP', w: 'UP', W: 'UP',
  ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
  ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
  ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT'
};

export default function CultivationMinigame({ technique, onSuccess, onFail, onCancel, language }: Props) {
  const maxRounds = technique.tier === 'thiên' || technique.tier === 'địa' ? 5 : 3;
  
  const [phase, setPhase] = useState<'init' | 'playing' | 'success' | 'fail'>('init');
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetSequence, setTargetSequence] = useState<ArrowKey[]>([]);
  const [inputSequence, setInputSequence] = useState<ArrowKey[]>([]);
  const [rhythmPos, setRhythmPos] = useState(0); // 0 to 100
  const [glitch, setGlitch] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const rhythmRef = useRef<number>(0);
  const rhythmDirRef = useRef<1 | -1>(1);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const inputRef = useRef<ArrowKey[]>([]);
  
  const playSound = (type: 'type' | 'error' | 'success') => {
    try {
      const path = '/audio/crystal-bowl.mp3'; // simple fallback audio
      const audio = new Audio(path);
      audio.volume = type === 'error' ? 0.4 : 0.2;
      audio.play().catch(() => {});
    } catch(e) {}
  };

  const generateSequence = (roundNum: number) => {
    const keys: ArrowKey[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const baseLength = technique.tier === 'thiên' ? 6 : (technique.tier === 'địa' ? 5 : 4);
    const length = baseLength + Math.floor(roundNum / 2);
    
    const seq: ArrowKey[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(keys[Math.floor(Math.random() * keys.length)]);
    }
    return seq;
  };

  const triggerGlitch = (msg: string) => {
    setGlitch(true);
    setFeedback(msg);
    playSound('error');
    setTimeout(() => {
      setGlitch(false);
      setFeedback('');
    }, 500);
  };

  // Khởi tạo game loop
  useEffect(() => {
    if (phase === 'playing') {
      startTimeRef.current = Date.now();
      setTargetSequence(generateSequence(1));
      setInputSequence([]);
      inputRef.current = [];
      setRound(1);
      
      let speed = 1.2; 
      if (technique.tier === 'thiên') speed = 2.0;
      else if (technique.tier === 'địa') speed = 1.6;

      let lastTime = performance.now();

      const gameLoop = (time: number) => {
        const deltaTime = time - lastTime;
        lastTime = time;

        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
           setPhase('fail');
           return;
        }

        let newPos = rhythmRef.current + (speed * rhythmDirRef.current * (deltaTime / 16));
        if (newPos >= 100) {
          newPos = 100;
          rhythmDirRef.current = -1;
        } else if (newPos <= 0) {
          newPos = 0;
          rhythmDirRef.current = 1;
        }
        rhythmRef.current = newPos;
        setRhythmPos(newPos);

        frameRef.current = requestAnimationFrame(gameLoop);
      };

      frameRef.current = requestAnimationFrame(gameLoop);

      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }
  }, [phase, technique.tier]);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'KeyR') {
        e.preventDefault();
        setPhase('success');
        return;
      }

      if (phase !== 'playing' || glitch) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const currentIn = inputRef.current;
        const target = targetSequence;
        
        if (currentIn.length === target.length) {
          const isSweetSpot = rhythmRef.current >= 40 && rhythmRef.current <= 60;
          if (isSweetSpot) {
            playSound('success');
            setFeedback('[ SYNC PERFECT ]');
            setTimeout(() => setFeedback(''), 800);
            
            if (round >= maxRounds) {
              setPhase('success');
            } else {
              const nextRound = round + 1;
              setRound(nextRound);
              setTargetSequence(generateSequence(nextRound));
              inputRef.current = [];
              setInputSequence([]);
            }
          } else {
            triggerGlitch('[ SYNC FAILED ] OUT OF RHYTHM');
            inputRef.current = [];
            setInputSequence([]);
          }
        } else {
          triggerGlitch('[ ERROR ] INCOMPLETE SEQUENCE');
          inputRef.current = [];
          setInputSequence([]);
        }
        return;
      }

      const mappedKey = KEY_MAP[e.key];
      if (mappedKey) {
        e.preventDefault();
        playSound('type');
        
        const currentIn = [...inputRef.current, mappedKey];
        const target = targetSequence;
        const currentIndex = currentIn.length - 1;
        
        if (currentIndex < target.length && currentIn[currentIndex] === target[currentIndex]) {
          inputRef.current = currentIn;
          setInputSequence(currentIn);
        } else {
          triggerGlitch('[ ERROR ] INVALID INPUT SEQUENCE');
          inputRef.current = [];
          setInputSequence([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, targetSequence, round, maxRounds, glitch]);

  // Handle outcome
  useEffect(() => {
    if (phase === 'success') {
      const timer = setTimeout(() => onSuccess(true), 1500);
      return () => clearTimeout(timer);
    } else if (phase === 'fail') {
      const timer = setTimeout(() => {
        let severity: 'mild' | 'heavy' | 'severe' = 'severe';
        if (round >= maxRounds) {
          severity = 'mild';
        } else if (round > 1) {
          severity = 'heavy';
        }
        onFail(severity);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, onFail, onSuccess, round, maxRounds]);

  if (phase === 'init') {
    return (
      <div className="relative w-full h-full bg-[#050505] text-[#00ff41] font-mono flex flex-col items-center justify-center p-4 min-h-[400px]">
        <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
        <div className="max-w-md w-full border border-[#00ff41] bg-[#0a0a0a] p-6 shadow-[0_0_20px_rgba(0,255,65,0.2)] z-10">
          <h2 className="text-xl font-bold tracking-widest mb-4 uppercase">{uiText[language]?.initOverrideProtocol || '[ INITIALIZE OVERRIDE PROTOCOL ]'}</h2>
          <div className="space-y-4 text-sm opacity-80 mb-8">
            <p>{'>'} {uiText[language]?.targetManual || 'TARGET:'} {technique.name}</p>
            <p>{'>'} {uiText[language]?.requiredRounds || 'REQUIRED_ROUNDS:'} {maxRounds}</p>
            <p className="mt-4 border-l-2 border-[#00ff41] pl-3 py-1 bg-[#00ff41]/10">
              {uiText[language]?.instructionCaps || 'INSTRUCTION:'} <br/>
              {uiText[language]?.minigameInst1 || '1. Enter exact arrow keys.'}<br/>
              {uiText[language]?.minigameInst2 || '2. Wait for rhythm cursor.'} <span className="text-white font-bold">[ || ]</span>.<br/>
              {uiText[language]?.minigameInst3 || '3. Press SPACE to execute.'}
            </p>
          </div>
          <button 
            onClick={() => setPhase('playing')}
            className="w-full py-3 border border-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors font-bold uppercase tracking-widest animate-[pulse_2s_infinite]"
          >
            {uiText[language]?.executeBtn || 'Bắt đầu (EXECUTE)'}
          </button>
          <button 
            onClick={onCancel}
            className="w-full mt-3 py-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            {uiText[language]?.abortBtn || 'Hủy Bỏ (ABORT)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] bg-[#050505] text-[#00ff41] font-mono flex flex-col items-center justify-center p-4 transition-all duration-100 ${glitch ? 'animate-[shake_0.2s_infinite] bg-red-950/20 text-red-500 border-red-500' : ''}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}} />
      <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
      
      {phase === 'success' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#00ff41]/10 z-50 backdrop-blur-sm">
          <h1 className="text-4xl font-bold tracking-widest animate-[pulse_1s_infinite] shadow-[0_0_20px_#00ff41] p-8 border border-[#00ff41] bg-[#050505]">
            {uiText[language]?.overrideSuccessful || '[ OVERRIDE SUCCESSFUL ]'}
          </h1>
        </div>
      )}

      {phase === 'fail' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/40 z-50 backdrop-blur-sm">
          <h1 className="text-4xl font-bold tracking-widest text-red-500 animate-[shake_0.5s_infinite] shadow-[0_0_20px_red] p-8 border border-red-500 bg-[#050505]">
            {uiText[language]?.overrideFailed || '[ OVERRIDE FAILED ]'}
          </h1>
          <p className="mt-4 text-red-400">{uiText[language]?.meridianCollapse || 'Meridian collapse detected...'}</p>
        </div>
      )}

      <div className={`max-w-2xl w-full border ${glitch ? 'border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.4)]' : 'border-[#00ff41] shadow-[0_0_30px_rgba(0,255,65,0.15)]'} bg-[#0a0a0a] p-8 flex flex-col relative overflow-hidden`}>
        <div className={`flex justify-between items-center pb-4 border-b ${glitch ? 'border-red-500/50' : 'border-[#00ff41]/50'} mb-8`}>
          <div>
            <div className="text-xs opacity-60">{uiText[language]?.targetManualHeader || 'TARGET_MANUAL'}</div>
            <div className="font-bold text-lg">{technique.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-60">{uiText[language]?.timeRemaining || 'TIME_REMAINING'}</div>
            <div className={`font-bold text-2xl ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
              {timeLeft.toFixed(2)}s
            </div>
          </div>
        </div>

        <div className="flex justify-between text-sm mb-6 font-bold">
          <div>{uiText[language]?.roundLabel || 'ROUND:'} [{round}/{maxRounds}]</div>
          <div className={feedback.includes('FAILED') || feedback.includes('ERROR') ? 'text-red-500' : 'text-yellow-400'}>
            {feedback || '> WAITING FOR INPUT...'}
          </div>
        </div>

        <div className="flex flex-col gap-8 my-8 items-center justify-center min-h-[160px]">
          <div className="flex flex-col items-center">
            <span className="text-xs opacity-50 mb-2">EXPECTED_SEQUENCE</span>
            <div className="flex gap-4">
              {targetSequence.map((key, i) => (
                <div key={i} className={`w-12 h-12 flex items-center justify-center border-2 text-2xl
                  ${inputSequence.length > i 
                    ? 'border-[#00ff41] bg-[#00ff41]/20 text-white' 
                    : 'border-[#00ff41]/30 text-[#00ff41]/50' 
                  }
                `}>
                  {ARROW_SYMBOLS[key]}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs opacity-50 mb-2">USER_INPUT</span>
            <div className="flex gap-4">
              {targetSequence.map((_, i) => (
                <div key={`in-${i}`} className={`w-12 h-12 flex items-center justify-center border-2 text-2xl
                  ${i < inputSequence.length 
                    ? `border-white bg-white/20 text-white` 
                    : glitch ? 'border-red-500/50 bg-red-500/10' : 'border-dashed border-[#00ff41]/20'
                  }
                `}>
                  {i < inputSequence.length ? ARROW_SYMBOLS[inputSequence[i]] : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 mb-4">
          <div className="flex justify-between text-xs opacity-60 mb-2">
            <span>RHYTHM_SYNC</span>
            <span className="animate-pulse">[PRESS SPACE TO EXECUTE]</span>
          </div>
          <div className={`w-full h-8 border-2 ${glitch ? 'border-red-500/50' : 'border-[#00ff41]/50'} relative bg-[#050505]`}>
            <div className={`absolute top-0 bottom-0 left-[40%] right-[40%] ${glitch ? 'bg-red-500/20 border-x border-red-500' : 'bg-[#00ff41]/20 border-x border-[#00ff41]'}`} />
            <div 
              className="absolute top-[-4px] bottom-[-4px] w-2 bg-white shadow-[0_0_10px_white]"
              style={{ left: `calc(${rhythmPos}% - 4px)` }}
            />
          </div>
        </div>

        <div className={`mt-auto pt-4 border-t ${glitch ? 'border-red-500/30 text-red-500/60' : 'border-[#00ff41]/30 text-[#00ff41]/60'} text-xs flex justify-between`}>
          <span>Use ARROWS or W A S D to type.</span>
          <span>SYS_VERSION: 1.0.4</span>
        </div>
      </div>
    </div>
  );
}
