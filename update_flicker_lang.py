import os
import re

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/TerminalUI.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

# 1. Remove crt-flicker classes
content = content.replace(' crt-flicker', '')
content = content.replace('crt-flicker ', '')

# 2. Remove flickers state and interval (if they still exist)
flicker_state_pattern = r'const \[flickers,\s*setFlickers\]\s*=\s*useState<string\[\]>\(Array\(5\)\.fill\(\'0\.9\'\)\);\s*'
content = re.sub(flicker_state_pattern, '', content)

interval_pattern = r'const flickerInterval = setInterval\(\(\) => \{.*?clearInterval\(flickerInterval\);\s*\}\s*\}, \[\]\);\s*'
content = re.sub(interval_pattern, '', content, flags=re.DOTALL)

# 3. Translate World Metrics
old_metrics = '''                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono tracking-tighter">
                    {/* GLOBAL */}
                    <div className="flex flex-col gap-1 p-2 bg-surface-container-high/30 border border-primary/20 rounded shadow-sm">
                      <div className="text-primary font-bold border-b border-primary/20 pb-1 mb-1 text-center">GLOBAL</div>
                      <div className="flex justify-between"><span>QI:</span><span className="text-primary-container">{game.worldState?.global?.spiritualQi || 0}</span></div>
                      <div className="flex justify-between"><span>DAO:</span><span className="text-primary-container">{game.worldState?.global?.daoFluctuation || 0}</span></div>
                      <div className="flex justify-between"><span>DEM:</span><span className="text-red-400">{game.worldState?.global?.demonicEnergy || 0}</span></div>
                    </div>
                    {/* SECT */}
                    <div className="flex flex-col gap-1 p-2 bg-surface-container-high/30 border border-primary/20 rounded shadow-sm">
                      <div className="text-primary font-bold border-b border-primary/20 pb-1 mb-1 text-center">SECT</div>
                      <div className="flex justify-between"><span>REP:</span><span className="text-primary-container">{game.worldState?.sect?.reputation || 0}</span></div>
                      <div className="flex justify-between"><span>RES:</span><span className="text-primary-container">{game.worldState?.sect?.resources || 0}</span></div>
                      <div className="flex justify-between"><span>STB:</span><span className="text-primary-container">{game.worldState?.sect?.stability || 0}</span></div>
                    </div>
                    {/* CITY */}
                    <div className="flex flex-col gap-1 p-2 bg-surface-container-high/30 border border-primary/20 rounded shadow-sm">
                      <div className="text-primary font-bold border-b border-primary/20 pb-1 mb-1 text-center">CITY</div>
                      <div className="flex justify-between"><span>PRO:</span><span className="text-primary-container">{game.worldState?.city?.prosperity || 0}</span></div>
                      <div className="flex justify-between"><span>SEC:</span><span className="text-primary-container">{game.worldState?.city?.security || 0}</span></div>
                      <div className="flex justify-between"><span>PRC:</span><span className="text-primary-container">{game.worldState?.city?.priceIndex || 0}</span></div>
                    </div>
                  </div>'''

new_metrics = '''                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono tracking-tighter">
                    {/* GLOBAL */}
                    <div className="flex flex-col gap-1 p-2 bg-surface-container-high/30 border border-primary/20 rounded shadow-sm">
                      <div className="text-primary font-bold border-b border-primary/20 pb-1 mb-1 text-center">{language === 'vi' ? 'THẾ GIỚI' : 'GLOBAL'}</div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'KHÍ:' : 'QI:'}</span><span className="text-primary-container">{game.worldState?.global?.spiritualQi || 0}</span></div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'ĐẠO:' : 'DAO:'}</span><span className="text-primary-container">{game.worldState?.global?.daoFluctuation || 0}</span></div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'MA:' : 'DEM:'}</span><span className="text-red-400">{game.worldState?.global?.demonicEnergy || 0}</span></div>
                    </div>
                    {/* SECT */}
                    <div className="flex flex-col gap-1 p-2 bg-surface-container-high/30 border border-primary/20 rounded shadow-sm">
                      <div className="text-primary font-bold border-b border-primary/20 pb-1 mb-1 text-center">{language === 'vi' ? 'TÔNG MÔN' : 'SECT'}</div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'DANH:' : 'REP:'}</span><span className="text-primary-container">{game.worldState?.sect?.reputation || 0}</span></div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'TÀI:' : 'RES:'}</span><span className="text-primary-container">{game.worldState?.sect?.resources || 0}</span></div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'ỔN:' : 'STB:'}</span><span className="text-primary-container">{game.worldState?.sect?.stability || 0}</span></div>
                    </div>
                    {/* CITY */}
                    <div className="flex flex-col gap-1 p-2 bg-surface-container-high/30 border border-primary/20 rounded shadow-sm">
                      <div className="text-primary font-bold border-b border-primary/20 pb-1 mb-1 text-center">{language === 'vi' ? 'THÀNH THỊ' : 'CITY'}</div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'THỊNH:' : 'PRO:'}</span><span className="text-primary-container">{game.worldState?.city?.prosperity || 0}</span></div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'AN:' : 'SEC:'}</span><span className="text-primary-container">{game.worldState?.city?.security || 0}</span></div>
                      <div className="flex justify-between"><span>{language === 'vi' ? 'GIÁ:' : 'PRC:'}</span><span className="text-primary-container">{game.worldState?.city?.priceIndex || 0}</span></div>
                    </div>
                  </div>'''

content = content.replace(old_metrics, new_metrics)

# Also update the section title if it's currently WORLD METRICS.
old_title = '<span>{uiText[language]?.worldStats || "WORLD METRICS"}</span>'
new_title = '<span>{uiText[language]?.worldStats || (language === \'vi\' ? "CHỈ SỐ THẾ GIỚI" : "WORLD METRICS")}</span>'
content = content.replace(old_title, new_title)

with open(file_path, 'w', encoding='utf8') as f:
    f.write(content)
print("Updated TerminalUI.tsx")
