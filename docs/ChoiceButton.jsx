import React from 'react';

export default function ChoiceButton({ text, onClick, delay = 0, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left group relative px-6 py-5 mb-4 animate-fade-in-slow transition-all duration-700 ease-out bg-[rgba(35,30,22,0.78)] border border-rice-300/25 shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(232,220,192,0.16)] backdrop-blur-sm ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Subtle hover background line */}
      <div className="absolute inset-y-0 left-0 w-[2px] bg-rice-400/35 group-hover:bg-rice-200 transition-colors duration-500" />
      <div className="absolute inset-0 bg-[rgba(67,55,35,0)] group-hover:bg-[rgba(67,55,35,0.38)] transition-colors duration-500 rounded-r-sm" />
      
      {/* Choice Text */}
      <span className="relative z-10 text-rice-100 group-hover:text-white font-serif text-md md:text-lg tracking-wide transition-colors duration-500">
        {text}
      </span>
    </button>
  );
}
