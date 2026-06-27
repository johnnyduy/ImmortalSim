import os
import re

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/ChoiceButtons.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

old_button = '''          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice.id)}
            className={`w-full text-left p-3 border border-outline-variant/30 bg-surface-container/50 hover:bg-primary/10 hover:border-primary/50 transition-all group relative flex items-center gap-3 overflow-hidden ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {/* Left bracket / indicator */}
            <span className="text-primary/50 group-hover:text-primary font-mono-data transition-colors">A</span>
            
            {/* Icon */}
            {icon !== 'o' && (
              <span className="text-lg opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all">{icon}</span>
            )}
            
            {/* Text */}
            <span className="font-mono-data text-sm uppercase text-on-surface group-hover:text-primary tracking-wider truncate">
              {cleanText}
            </span>

            {/* Right decorative elements if resource */}
            {(icon === 'dY'Z' || choice.id.includes('kiem_tai_nguyen') || choice.id.includes('stones')) && (
              <span className="ml-auto text-[10px] text-primary/70 font-mono-data border border-primary/30 px-1 bg-primary/5">
                +RES
              </span>
            )}
            
            {/* Blinking cursor effect on hover */}
            <span className="w-2 h-4 bg-primary opacity-0 group-hover:animate-pulse ml-2" />
          </motion.button>'''

new_button = '''          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice.id)}
            className={`w-full text-left p-4 border border-white/5 bg-surface-container-high/30 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group relative flex items-center gap-4 overflow-hidden rounded-xl shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {/* Left indicator glow */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(16,185,129,0.8)]" />

            {/* Left bracket / indicator */}
            <span className="text-primary/40 group-hover:text-primary font-mono-data transition-colors ml-1">>></span>
            
            {/* Icon */}
            {icon !== 'o' && (
              <span className="text-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all">{icon}</span>
            )}
            
            {/* Text */}
            <span className="font-headline-sm text-[15px] uppercase text-on-surface group-hover:text-primary tracking-wide truncate group-hover:translate-x-1 transition-transform duration-300">
              {cleanText}
            </span>

            {/* Right decorative elements if resource */}
            {(icon === 'dY'Z' || choice.id.includes('kiem_tai_nguyen') || choice.id.includes('stones')) && (
              <span className="ml-auto text-[10px] text-primary/90 font-mono-data border border-primary/40 px-1.5 py-0.5 bg-primary/10 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                +RES
              </span>
            )}
            
            {/* Blinking cursor effect on hover */}
            <span className="w-1.5 h-4 bg-primary opacity-0 group-hover:opacity-100 group-hover:animate-pulse ml-2" />
          </motion.button>'''

content = content.replace(old_button, new_button)

with open(file_path, 'w', encoding='utf8') as f:
    f.write(content)

print("ChoiceButtons updated!")
