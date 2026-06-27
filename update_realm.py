import os

file_path = 'c:/Users/ADMIN/Documents/ImmortalSim/components/TerminalUI.tsx'
with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

# 1. Update import
old_import = "import { applyChoiceToState } from '../lib/engine';"
new_import = "import { applyChoiceToState, getSubStageMaxCultivation } from '../lib/engine';"
content = content.replace(old_import, new_import)

# 2. Add progress bar in Realm box
# We need to find the REALM div and append the progress bar inside it if not Mortal.
# The previous realm section was:
#               <div className="flex justify-between px-3 py-1.5 bg-surface-container-high/60 backdrop-blur-sm rounded-full border border-white/5">
#                 <span className="text-on-surface-variant text-label-md">{t(language, 'realmLabel', 'REALM')}</span>
#                 <span className="text-primary-container text-label-md font-bold text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
#               </div>

old_realm_div = '''              <div className="flex justify-between px-3 py-1.5 bg-surface-container-high/60 backdrop-blur-sm rounded-full border border-white/5">
                <span className="text-on-surface-variant text-label-md">{t(language, 'realmLabel', 'REALM')}</span>
                <span className="text-primary-container text-label-md font-bold text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
              </div>'''

new_realm_div = '''              <div className="flex flex-col px-3 py-1.5 bg-surface-container-high/60 backdrop-blur-sm rounded-xl border border-white/5">
                <div className="flex justify-between mb-1">
                  <span className="text-on-surface-variant text-label-md uppercase">{t(language, 'realmLabel', 'REALM')}:</span>
                  <span className="text-primary-container text-label-md font-bold text-right max-w-[120px] truncate">{currentSubStage.subStageName[language]}</span>
                </div>
                {game.realm.toLowerCase() !== 'mortal' && (() => {
                  const maxQi = getSubStageMaxCultivation(game.realm, game.subStageIndex);
                  const progress = Math.min(1, Math.max(0, qiValue / maxQi));
                  return (
                    <div className="flex gap-[2px] h-2">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className={`flex-1 rounded-[1px] ${i < Math.min(20, Math.floor(progress * 20)) ? 'bg-primary-container shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-surface-variant/50'}`} />
                      ))}
                    </div>
                  );
                })()}
              </div>'''
content = content.replace(old_realm_div, new_realm_div)

# 3. Remove "Next Breakthrough" block completely
# The block is:
#           {/* Next Breakthrough */}
#           <div className="mt-auto bg-surface-container-highest p-3 terminal-border">
#             <h4 className="font-label-md text-label-md text-secondary mb-2">{uiText[language]?.nextBreakthrough || "NEXT BREAKTHROUGH"}</h4>
#             <div className="text-code-sm space-y-1">
#               <p className="flex justify-between"><span>TARGET:</span> <span className="uppercase text-right">[{currentSubStage.subStageName[language]}]</span></p>
#               <p className="flex justify-between"><span>REQ_QI:</span> <span>{Math.floor(qiValue)} / 500</span></p>
#             </div>
#             <div className="mt-4 border-t border-outline-variant pt-2">
#               <button 
#                 onClick={onAscension}
#                 className="w-full text-code-sm text-center py-1 hover:bg-secondary hover:text-on-secondary transition-colors text-secondary border border-secondary/30">
#                 [ {uiText[language]?.initiateAscension || "INITIATE ASCENSION"} ]
#               </button>
#             </div>
#           </div>

import re
pattern = r'\{\/\*\s*Next Breakthrough\s*\*\/\}.*?<\/div>\s*<\/div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf8') as f:
    f.write(content)

print("TerminalUI Realm and Next Breakthrough updated!")
