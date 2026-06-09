import React from 'react';

export default function EventPanel({ text, age, realm }) {
  return (
    <div className="relative z-10 max-w-2xl mx-auto w-full px-6 py-12 md:py-20 animate-fade-in-slow">
      {/* Meta info (Age, Realm) */}
      <div className="flex justify-between items-center mb-8 border-b border-ink-800/50 pb-4">
        <span className="text-rice-400 text-sm tracking-[0.2em] uppercase font-serif">
          Age {age}
        </span>
        <span className="text-rice-400 text-sm tracking-[0.2em] uppercase font-serif">
          {realm}
        </span>
      </div>

      {/* Main Narration */}
      <div className="text-rice-200 text-lg md:text-xl font-serif leading-loose tracking-wide text-justify text-shadow-sm">
        {text}
      </div>
    </div>
  );
}