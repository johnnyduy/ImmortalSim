import os
import re

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/TerminalUI.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

# 1. Right Sidebar Wrapper
old_right = '<aside className="w-64 bg-surface border-l border-outline-variant p-gutter shrink-0 hidden lg:block overflow-y-auto custom-scrollbar">'
new_right = '<aside className="w-72 bg-surface/30 backdrop-blur-md border-l border-white/5 p-gutter shrink-0 hidden lg:block overflow-y-auto custom-scrollbar shadow-2xl">'
content = content.replace(old_right, new_right)

# 2. Progress Bars (Core Stats)
old_qi = '''                <div className="font-code-sm tracking-tight text-primary-container">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((qiValue/5000)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((qiValue/5000)*30))) + ']'}
                </div>'''
new_qi = '''                <div className="flex gap-[2px] h-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor((qiValue/5000)*30)) ? 'bg-primary-container shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-surface-variant/50'}`} />
                  ))}
                </div>'''
content = content.replace(old_qi, new_qi)

old_soul = '''                <div className="font-code-sm tracking-tight text-primary-container">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((soulValue/100)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((soulValue/100)*30))) + ']'}
                </div>'''
new_soul = '''                <div className="flex gap-[2px] h-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor((soulValue/100)*30)) ? 'bg-primary-container shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-surface-variant/50'}`} />
                  ))}
                </div>'''
content = content.replace(old_soul, new_soul)

old_body = '''                <div className="font-code-sm tracking-tight text-primary-container">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((bodyValue/100)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((bodyValue/100)*30))) + ']'}
                </div>'''
new_body = '''                <div className="flex gap-[2px] h-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor((bodyValue/100)*30)) ? 'bg-primary-container shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-surface-variant/50'}`} />
                  ))}
                </div>'''
content = content.replace(old_body, new_body)

old_luck = '''                <div className="font-code-sm tracking-tight text-secondary">
                  {'[' + '|'.repeat(Math.min(30, Math.floor((luckValue/100)*30))) + '.'.repeat(30 - Math.min(30, Math.floor((luckValue/100)*30))) + ']'}
                </div>'''
new_luck = '''                <div className="flex gap-[2px] h-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor((luckValue/100)*30)) ? 'bg-secondary-fixed-dim shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'bg-surface-variant/50'}`} />
                  ))}
                </div>'''
content = content.replace(old_luck, new_luck)


# 3. Radar Chart Upgrade
old_radar = '''                <div className="relative w-full aspect-square border border-outline-variant radar-grid flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 stroke-primary-container fill-primary-container/20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></circle>
                    <circle cx="50" cy="50" r="30" fill="none" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></circle>
                    <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></line>
                    <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="2 2" strokeWidth="0.5" stroke="#008f11"></line>'''

new_radar = '''                <div className="relative w-full aspect-square bg-surface-container-high/30 rounded-full border border-white/5 flex items-center justify-center shadow-inner">
                  <svg className="w-full h-full transform -rotate-90 stroke-primary-container fill-[url(#radarGrad)]" viewBox="0 0 100 100">
                    <defs>
                      <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.5"/>
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="none" strokeDasharray="2 4" strokeWidth="0.5" stroke="rgba(16,185,129,0.3)"></circle>
                    <circle cx="50" cy="50" r="30" fill="none" strokeDasharray="2 4" strokeWidth="0.5" stroke="rgba(16,185,129,0.3)"></circle>
                    <circle cx="50" cy="50" r="15" fill="none" strokeDasharray="2 4" strokeWidth="0.5" stroke="rgba(16,185,129,0.3)"></circle>
                    <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="2 4" strokeWidth="0.5" stroke="rgba(16,185,129,0.3)"></line>
                    <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="2 4" strokeWidth="0.5" stroke="rgba(16,185,129,0.3)"></line>'''
content = content.replace(old_radar, new_radar)

# 4. Next Breakthrough Bar
old_breakthrough = '''            <div className="font-code-sm tracking-tight text-primary-container">
              {'[' + '|'.repeat(Math.min(30, Math.floor(cultivationProgress*30))) + '.'.repeat(30 - Math.min(30, Math.floor(cultivationProgress*30))) + ']'}
            </div>'''
new_breakthrough = '''            <div className="flex gap-[2px] h-3 mt-1 bg-surface-container-lowest/80 p-[2px] rounded-sm border border-outline/30">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor(cultivationProgress*30)) ? 'bg-gradient-to-t from-primary-fixed-dim to-primary-container shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-surface-variant/30'}`} />
              ))}
            </div>'''
content = content.replace(old_breakthrough, new_breakthrough)

with open(file_path, 'w', encoding='utf8') as f:
    f.write(content)

print("TerminalUI right panel updated!")
