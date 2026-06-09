const fs = require('fs');
const file = 'components/StatsPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetLoopStr = `                  const val = npcFavorability?.[npc.id] ?? 0;
                  const label = getNpcFavorabilityLabel(val);`;

const newLoopStr = `                  const val = npcFavorability?.[npc.id] ?? 0;
                  const grudge = inheritance?.npc_grudges?.[npc.id] ?? 0;
                  const label = getNpcFavorabilityLabel(val);`;

const targetRoleStr = `                        <span className="text-left">
                          {npc.role}
                        </span>`;

// Wait, looking at the code in view_file earlier:
// <div className="flex items-center justify-between text-[10px] text-text-tertiary w-full">
//   <span>{npc.role}</span>
//   {npc.id === 'npc_kiem_tong_ta_tieu' && (
//     <span className="text-amber-500/70 font-serif">🔗 Bác cháu liên đới</span>
//   )}
// </div>

const targetRoleJSX = `<div className="flex items-center justify-between text-[10px] text-text-tertiary w-full">
                        <span>{npc.role}</span>
                        {npc.id === 'npc_kiem_tong_ta_tieu' && (
                          <span className="text-amber-500/70 font-serif">🔗 Bác cháu liên đới</span>
                        )}
                      </div>`;

const replacementRoleJSX = `<div className="flex items-center justify-between text-[10px] text-text-tertiary w-full">
                        <span>{npc.role}</span>
                        <div className="flex gap-2 text-right">
                          {grudge > 0 && <span className="text-red-500 font-serif">🔥 Thù hận: {grudge}</span>}
                          {npc.id === 'npc_kiem_tong_ta_tieu' && (
                            <span className="text-amber-500/70 font-serif">🔗 Bác cháu liên đới</span>
                          )}
                        </div>
                      </div>`;

if (code.includes(targetLoopStr) && code.includes(targetRoleJSX)) {
  code = code.replace(targetLoopStr, newLoopStr);
  code = code.replace(targetRoleJSX, replacementRoleJSX);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched StatsPanel.tsx for grudges successfully.');
} else {
  console.log('Target string not found for grudges patch.');
}
