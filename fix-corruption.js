const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// The file was corrupted by repeating the whole import section.
// The repetition starts at line 31: `'use client';`
// and ends right before `if (id === 'sect_entry_welfare' && sect) {`
// Let's just find the first `'use client';` and the second `'use client';`.
const firstUseClient = content.indexOf("'use client';");
const secondUseClient = content.indexOf("'use client';", firstUseClient + 1);

if (secondUseClient !== -1) {
  // It repeated. Where does the repetition end?
  // It ends at `import { resolveCombatAction, finishCombat } from '../lib/combat-system';`
  // We can just slice out the entire second block.
  const endOfRepetition = content.indexOf("import { resolveCombatAction, finishCombat } from '../lib/combat-system';", secondUseClient);
  if (endOfRepetition !== -1) {
    const endStr = "import { resolveCombatAction, finishCombat } from '../lib/combat-system';\n";
    const cutPos = endOfRepetition + endStr.length;
    content = content.substring(0, secondUseClient) + content.substring(cutPos);
  }
}

// Then we must re-add the function declaration that was deleted!
// The deleted part was:
/*
// Fallback image helper component for event backgrounds (thiết kế hình tròn viền ngọc bích mảnh)
function EventIllustration({ id, sect }: { id: string; sect?: string }) {
  const [src, setSrc] = useState(`/images/events/${id}.png`);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
*/

const missingFuncDecl = `// Fallback image helper component for event backgrounds (thiết kế hình tròn viền ngọc bích mảnh)
function EventIllustration({ id, sect }: { id: string; sect?: string }) {
  const [src, setSrc] = useState(\`/images/events/\${id}.png\`);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
`;

content = content.replace("    if (id === 'sect_entry_welfare' && sect) {", missingFuncDecl + "    if (id === 'sect_entry_welfare' && sect) {");

// Also let's fix the duplicate import uiText:
content = content.replace(/import \{ uiText \} from '\.\.\/lib\/i18n';/g, ''); // Remove all
content = content.replace(/import \{ getLocalizedText, uiText, translatedRealms \} from '\.\.\/lib\/i18n';/g, ''); // Remove all
content = content.replace("import { getRealmSubStage } from '../lib/cultivation-states';", "import { getRealmSubStage } from '../lib/cultivation-states';\nimport { getLocalizedText, uiText, translatedRealms } from '../lib/i18n';");

fs.writeFileSync(pageFile, content, 'utf8');
