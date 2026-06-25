'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Props {
  text: string;
  speed?: number; // millisecond per character
  onComplete?: () => void;
}

export default function TypewriterText({ text, speed = 8, onComplete }: Props) {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Trigger typing effect ONLY when text or speed changes
  useEffect(() => {
    setDisplayedText('');
    setIsFinished(false);

    let index = 0;
    
    const tick = () => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        timerRef.current = setTimeout(tick, speed);
      } else {
        setIsFinished(true);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    };

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering parent event card click handlers
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayedText(text);
    setIsFinished(true);
    if (onCompleteRef.current) onCompleteRef.current();
  };

  return (
    <span 
      onClick={handleSkip} 
      className="cursor-pointer select-none relative group transition-all"
      title="Click to skip typing effect"
    >
      {displayedText}
      {!isFinished && (
        <span className="inline-block w-1.5 h-4.5 ml-0.5 bg-[#34d399] align-middle animate-pulse">|</span>
      )}
    </span>
  );
}
