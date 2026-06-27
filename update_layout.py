import os
import re

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/TerminalUI.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

# 1. Replace the Core Stats Section with the new Unified + Mailbox design
core_stats_pattern = r'\{\/\*\s*Core Stats Section \(Horizontal\)\s*\*\/\}.*?\}\)\)\}\s*<\/div>\s*<\/div>\s*<\/div>'

new_unified_chunk = '''{/* Core Stats Section (Unified) */}
            <div className="mb-4">
              <h3 className="font-label-md text-label-md text-primary mb-2 border-b border-outline-variant pb-1">
                {uiText[language]?.coreEssence || (language === 'vi' ? "BẢN NGUYÊN" : "CORE ESSENCE")}
              </h3>
              <div className="bg-surface-container-high/20 backdrop-blur-sm border border-white/5 rounded-xl p-3 shadow-inner">
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono-data mb-4">
                  <div className="p-2 border border-white/5 bg-surface-container-high/60 rounded-lg shadow-sm">
                    <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.comprehensionCaps || (language === 'vi' ? "NGỘ" : "COMP")}</div>
                    <div className="text-primary text-sm font-bold">{Math.min(100, game.stats.comprehension || 0)}</div>
                  </div>
                  <div className="p-2 border border-white/5 bg-surface-container-high/60 rounded-lg shadow-sm">
                    <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.soulCaps || (language === 'vi' ? "HỒN" : "SOUL")}</div>
                    <div className="text-primary text-sm font-bold">{Math.min(100, soulValue)}</div>
                  </div>
                  <div className="p-2 border border-white/5 bg-surface-container-high/60 rounded-lg shadow-sm">
                    <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.bodyCaps || (language === 'vi' ? "THỂ" : "BODY")}</div>
                    <div className="text-primary text-sm font-bold">{Math.min(100, bodyValue)}</div>
                  </div>
                  <div className="p-2 border border-white/5 bg-surface-container-high/60 rounded-lg shadow-sm">
                    <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.luckCaps || (language === 'vi' ? "VẬN" : "LUCK")}</div>
                    <div className="text-secondary text-sm font-bold">{Math.min(100, luckValue)}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-mono-data">
                    <span className="text-on-surface-variant">{uiText[language]?.qiCaps || (language === 'vi' ? "KHÍ" : "QI")}</span>
                    <span className="text-primary-container font-bold">{Math.floor(qiValue)}</span>
                  </div>
                  <div className="flex gap-[2px] h-2">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor((qiValue/5000)*30)) ? 'bg-primary-container shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-surface-variant/50'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* World News (Inbox Style) */}
            <div className="mb-4 flex flex-col flex-1 min-h-[200px]">
              <h3 className="font-label-md text-label-md text-primary mb-2 flex justify-between border-b border-outline-variant pb-1">
                <span>{language === 'vi' ? 'BẢNG TIN THIÊN ĐẠO' : 'HEAVENLY DAO NEWS'}</span>
                <span className="material-symbols-outlined text-sm">mail</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {mockBulletins.map(bulletin => (
                  <div key={bulletin.id} className={`flex items-start gap-2 p-2 border border-white/5 hover:bg-surface-container-highest cursor-pointer transition-colors rounded-lg mb-1 ${bulletin.isNew ? 'bg-surface-container/60' : 'bg-transparent'}`}>
                    <div className="mt-1 shrink-0">
                      {bulletin.isNew ? (
                        <span className="w-2 h-2 bg-primary rounded-full inline-block animate-[pulse_1.5s_infinite]"></span>
                      ) : (
                        <span className="w-2 h-2 bg-surface-variant rounded-full inline-block"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-[11px] truncate font-bold ${bulletin.isNew ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {bulletin.title}
                        </h4>
                        <span className="text-[9px] text-surface-variant shrink-0 ml-2">{bulletin.date.split('//')[0]}</span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant line-clamp-2 leading-tight">
                        {bulletin.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>'''

content, count1 = re.subn(core_stats_pattern, new_unified_chunk, content, flags=re.DOTALL)

# 2. Remove the F2 button from the bottom dock
f2_button_pattern = r'<\s*button[^>]*onClick=\{\(\)\s*=>\s*\{\s*setActiveTab\(\'BULLETIN\'\);\s*setUnreadBulletin\(false\);\s*setSelectedItem\(null\);\s*\}\}.*?<\/button>'
content, count2 = re.subn(f2_button_pattern, '', content, flags=re.DOTALL)

# 3. Remove the center panel activeTab === 'BULLETIN' logic
center_panel_bulletin_pattern = r'\s*\)\s*:\s*activeTab\s*===\s*\'BULLETIN\'\s*\?\s*\(\s*<div.*?<\/div>\s*\)\s*:\s*\('
# Wait, this regex might be tricky since there are nested divs. 
# It's better to find it directly using string manipulation.
idx = content.find("activeTab === 'BULLETIN' ? (")
if idx != -1:
    end_idx = content.find("              ) : (", idx)
    if end_idx != -1:
        # We replace the whole block from ": activeTab === 'BULLETIN' ? (" down to ") : ("
        start_replace = content.rfind(") : activeTab === 'BULLETIN' ? (", 0, idx + 40)
        if start_replace != -1:
            content = content[:start_replace] + " ) : (" + content[end_idx + 19:]

if count1 > 0:
    with open(file_path, 'w', encoding='utf8') as f:
        f.write(content)
    print(f"Replaced Core Stats: {count1}, F2 Button: {count2}")
else:
    print("Failed to match Core Stats pattern.")
