import os
import re

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/TerminalUI.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

# 1. Main wrapper
content = content.replace(
    'className="flex flex-col crt-flicker fixed inset-0 z-40 overflow-hidden text-[#00ff41] bg-black font-[\'JetBrains_Mono\',monospace]"',
    'className="flex flex-col crt-flicker fixed inset-0 z-40 overflow-hidden text-on-surface bg-background font-body-md"'
)

# 2. Header / AppBar
content = content.replace(
    'className="flex justify-between items-center w-full px-margin py-unit bg-surface border-b border-outline-variant z-10 shrink-0 h-16"',
    'className="flex justify-between items-center w-full px-margin py-unit bg-surface-container-low/80 backdrop-blur-md border-b border-white/5 z-10 shrink-0 h-16 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"'
)

# 3. Left Sidebar wrapper
content = content.replace(
    'className="w-72 bg-surface-container-lowest border-r border-outline-variant flex flex-col p-gutter shrink-0 hidden md:flex"',
    'className="w-72 bg-surface/50 backdrop-blur-sm border-r border-white/5 flex flex-col p-gutter shrink-0 hidden md:flex shadow-2xl"'
)

# 4. Avatar area
old_avatar = '''<div className="relative w-48 h-48 mx-auto border-2 border-outline p-1 mb-4 group overflow-hidden">
              <div className="absolute inset-0 bg-primary opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <img alt="Cultivator Silhouette" className="w-full h-full object-cover grayscale brightness-50 contrast-150" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRz-Dq5q7Gd7QAyDbsOLdTZVbH91avJmvA7wnat7Y38Q65LD4Es4tMhCcvMfb04QQyLesUlxGgbFPxsV9vdWAnEgXS3MEPqsgj-Nf2RyU0PVgyk5_8Ci2oW7F1QdkcGFaIyi_6bS3g4rW0agDgsXXyt_xCT3_Rh8EtKszDycOvvXK_nqSU4lgtjMF4N3CCRczRrGExM2EsVk1J1jQUTKSn9Ny2s6dH3OtETuJAwTQ2OY-QjH9RjyOMR0iHqqG6-kjME5sZzYaYKoZ2"/>
              <div className="absolute bottom-0 left-0 right-0 bg-primary-container text-on-primary py-1 font-label-md text-label-md uppercase tracking-widest">{t(language, 'soulBonded', 'SOUL_BONDED')}</div>
            </div>'''
new_avatar = '''<div className="relative w-48 h-48 mx-auto p-1 mb-4 group overflow-hidden rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-surface-container-lowest/80 backdrop-blur-md">
              <div className="absolute inset-0 bg-primary opacity-5 group-hover:opacity-15 transition-opacity duration-300"></div>
              <img alt="Cultivator Silhouette" className="w-full h-full object-cover grayscale brightness-75 contrast-125 rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRz-Dq5q7Gd7QAyDbsOLdTZVbH91avJmvA7wnat7Y38Q65LD4Es4tMhCcvMfb04QQyLesUlxGgbFPxsV9vdWAnEgXS3MEPqsgj-Nf2RyU0PVgyk5_8Ci2oW7F1QdkcGFaIyi_6bS3g4rW0agDgsXXyt_xCT3_Rh8EtKszDycOvvXK_nqSU4lgtjMF4N3CCRczRrGExM2EsVk1J1jQUTKSn9Ny2s6dH3OtETuJAwTQ2OY-QjH9RjyOMR0iHqqG6-kjME5sZzYaYKoZ2"/>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/90 to-primary/40 backdrop-blur-sm text-on-primary py-1.5 text-center font-label-caps text-label-caps tracking-widest">{t(language, 'soulBonded', 'SOUL_BONDED')}</div>
            </div>'''
content = content.replace(old_avatar, new_avatar)

# 5. Left Sidebar Stats
old_stats = '''<h2 className="font-headline-md text-headline-md text-primary">[ {(game as any).name || 'USER_001'} ]</h2>
            <div className="flex flex-col gap-1 mt-2 text-left bg-surface-container-high p-unit border border-outline-variant">
              <div className="flex justify-between px-2">
                <span className="text-on-surface-variant text-label-md">{t(language, 'sectLabel', 'SECT:')}</span>
                <span className="text-primary-container text-label-md">{game.sect || 'Rogue'}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-on-surface-variant text-label-md">{t(language, 'realmLabel', 'REALM:')}</span>
                <span className="text-primary-container text-label-md text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
              </div>
            </div>'''
new_stats = '''<h2 className="font-headline-md text-headline-md text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">[ {(game as any).name || 'USER_001'} ]</h2>
            <div className="flex flex-col gap-2 mt-3 text-left">
              <div className="flex justify-between px-3 py-1.5 bg-surface-container-high/60 backdrop-blur-sm rounded-full border border-white/5">
                <span className="text-on-surface-variant text-label-md">{t(language, 'sectLabel', 'SECT')}</span>
                <span className="text-secondary-fixed-dim text-label-md font-bold">{game.sect || 'Rogue'}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 bg-surface-container-high/60 backdrop-blur-sm rounded-full border border-white/5">
                <span className="text-on-surface-variant text-label-md">{t(language, 'realmLabel', 'REALM')}</span>
                <span className="text-primary-container text-label-md font-bold text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
              </div>
            </div>'''
content = content.replace(old_stats, new_stats)

# 6. Bottom Navigation Bar
old_footer = '''<footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch h-16 bg-surface-container border-t border-primary-container">'''
new_footer = '''<footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 h-[4.5rem] bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-full px-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">'''
content = content.replace(old_footer, new_footer)

old_btn = '''className="flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all"'''
new_btn = '''className="flex flex-col items-center justify-center text-primary-container p-2 w-16 h-14 rounded-xl hover:bg-primary/20 hover:text-primary transition-all duration-300 hover:-translate-y-1"'''
content = content.replace(old_btn, new_btn)

old_btn_rel = '''className="relative flex flex-col items-center justify-center text-primary-container p-unit flex-1 hover:bg-primary-container hover:text-on-primary-container transition-all"'''
new_btn_rel = '''className="relative flex flex-col items-center justify-center text-primary-container p-2 w-16 h-14 rounded-xl hover:bg-primary/20 hover:text-primary transition-all duration-300 hover:-translate-y-1"'''
content = content.replace(old_btn_rel, new_btn_rel)

old_btn_active = '''className={`flex flex-col items-center justify-center p-unit flex-1 transition-all ${activeTab === 'BEAST_BAG' ? 'bg-primary-container text-on-primary-container' : 'text-primary-container hover:bg-primary-container hover:text-on-primary-container'}`}'''
new_btn_active = '''className={`flex flex-col items-center justify-center p-2 w-16 h-14 rounded-xl transition-all duration-300 hover:-translate-y-1 ${activeTab === 'BEAST_BAG' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-primary-container hover:bg-primary/20 hover:text-primary'}`}'''
content = content.replace(old_btn_active, new_btn_active)

# 7. Center Main Area
content = content.replace(
    '<main className="flex-1 bg-background p-margin flex flex-col overflow-hidden relative">',
    '<main className="flex-1 bg-transparent p-margin flex flex-col overflow-hidden relative">'
)
content = content.replace(
    '<div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-low border-t border-outline-variant relative">',
    '<div className="flex-1 overflow-y-auto custom-scrollbar bg-surface/40 backdrop-blur-md rounded-xl border border-white/5 relative shadow-2xl">'
)

with open(file_path, 'w', encoding='utf8') as f:
    f.write(content)

print("TerminalUI updated!")
