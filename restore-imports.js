const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

const importsToInsert = `import CultivationMinigame from '../components/CultivationMinigame';
import CombatModal from '../components/CombatModal';
import AlchemyModal from '../components/AlchemyModal';
import BlackMarketModal from '../components/BlackMarketModal';
import SectShopModal from '../components/SectShopModal';
import { resolveCombatAction, finishCombat } from '../lib/combat-system';\n`;

content = content.replace("import type { Character, CombatEnvironment, StatSnapshot } from '../docs/CombatState';\n// Fallback image", "import type { Character, CombatEnvironment, StatSnapshot } from '../docs/CombatState';\n" + importsToInsert + "// Fallback image");

fs.writeFileSync(pageFile, content, 'utf8');
console.log("Restored imports");
