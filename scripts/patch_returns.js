const fs = require('fs');
const file = 'lib/engine.ts';
let code = fs.readFileSync(file, 'utf8');

let modified = false;

code = code.replace(/npcFavorability: nextNpcFavorability,/g, (match, offset) => {
  if (offset > 20000) { // arbitrary offset to avoid replacing anything before the function body
    modified = true;
    return `npcFavorability: nextNpcFavorability,\n      worldState: nextWorldState,\n      inheritance: { ...(state.inheritance || {}), npc_grudges: nextNpcGrudges } as any,`;
  }
  return match;
});

if (modified) {
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched returns successfully.');
} else {
  console.log('Already patched.');
}
