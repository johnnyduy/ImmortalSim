import type { Lang, LogEntry } from '../types';
import { motion } from 'framer-motion';

type Props = {
  log: LogEntry[];
  language: Lang;
  ui: Record<string, string>;
};

export default function EventLog({ log, language, ui }: Props) {
  return (
    <section className="mt-16 max-w-2xl mx-auto relative">
      {/* Cinematic fade at top to blend into background */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-ink-950 to-transparent z-10 pointer-events-none" />
      
      <div className="flex flex-col items-center mb-8 opacity-60">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-rice-400/30 to-transparent mb-4" />
        <p className="text-xs tracking-[0.3em] uppercase text-rice-400/60 font-serif">{ui.eventLogTitle || 'Memory Fragments'}</p>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-rice-400/30 to-transparent mt-4" />
      </div>

      <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-4 before:w-[1px] before:bg-gradient-to-b before:from-rice-400/20 before:via-rice-400/5 before:to-transparent">
        {log.slice(-6).reverse().map((entry, index) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: index * 0.1 }}
            key={`${entry.message[language]}-${index}`}
            className="relative pl-12 pr-4 py-2 group"
          >
            {/* Timeline node */}
            <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-rice-400/30 bg-ink-950 group-hover:bg-rice-400/40 group-hover:border-rice-400/60 transition-all duration-700" />
            
            <p className="text-rice-300/70 font-serif leading-relaxed tracking-wide text-sm text-justify group-hover:text-rice-200/90 transition-colors duration-500">
              {entry.message[language]}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
