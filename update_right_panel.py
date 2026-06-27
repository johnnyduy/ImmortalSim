import os
import re

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/TerminalUI.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

pattern = r'\{\/\*\s*Radar Chart Section\s*\*\/\}.*?luckCaps.*?\)\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>'

new_chunk = '''{/* World Metrics Section */}
                <div className="mb-6">
                  <h3 className="font-label-md text-label-md text-primary mb-3 flex justify-between border-b border-outline-variant pb-1">
                    <span>{uiText[language]?.worldStats || "WORLD METRICS"}</span>
                    <span className="material-symbols-outlined text-sm">public</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono tracking-tighter">
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
                  </div>
                </div>
  
            {/* Core Stats Section (Horizontal) */}
            <div className="mb-8">
              <h3 className="font-label-md text-label-md text-primary mb-3 border-b border-outline-variant pb-1">
                {uiText[language]?.coreEssence || "BẢN NGUYÊN (CORE)"}
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono-data mb-4">
                <div className="p-2 border border-white/5 bg-surface-container-high/40 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.comprehensionCaps || "NGỘ"}</div>
                  <div className="text-primary text-sm font-bold">{Math.min(100, game.stats.comprehension || 0)}</div>
                </div>
                <div className="p-2 border border-white/5 bg-surface-container-high/40 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.soulCaps || "HỒN"}</div>
                  <div className="text-primary text-sm font-bold">{Math.min(100, soulValue)}</div>
                </div>
                <div className="p-2 border border-white/5 bg-surface-container-high/40 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.bodyCaps || "THỂ"}</div>
                  <div className="text-primary text-sm font-bold">{Math.min(100, bodyValue)}</div>
                </div>
                <div className="p-2 border border-white/5 bg-surface-container-high/40 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="text-on-surface-variant mb-1 uppercase truncate">{uiText[language]?.luckCaps || "VẬN"}</div>
                  <div className="text-secondary text-sm font-bold">{Math.min(100, luckValue)}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-mono-data">
                  <span className="text-on-surface-variant">{uiText[language]?.qiCaps || "KHÍ (QI)"}</span>
                  <span className="text-primary-container font-bold">{Math.floor(qiValue)}</span>
                </div>
                <div className="flex gap-[2px] h-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(30, Math.floor((qiValue/5000)*30)) ? 'bg-primary-container shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-surface-variant/50'}`} />
                  ))}
                </div>
              </div>
            </div>'''

new_content, count = re.subn(pattern, new_chunk, content, flags=re.DOTALL)

if count > 0:
    with open(file_path, 'w', encoding='utf8') as f:
        f.write(new_content)
    print("Successfully replaced Radar and Core Stats sections!")
else:
    print("Regex match failed")
