const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'StatsPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update imports from ../lib/engine
const targetImport = `import { getNpcFavorabilityLabel } from '../lib/engine';`;
const replacementImport = `import { getNpcFavorabilityLabel, getSubStageMaxCultivation } from '../lib/engine';`;

if (content.includes(targetImport)) {
  console.log('Found targetImport!');
  content = content.replace(targetImport, replacementImport);
} else {
  console.log('targetImport NOT found!');
}

// 2. Add subStageIndex to Props
const targetProps = `type Props = {
  stats: Stats;
  realm: string;
  rawRealm?: Realm;
  inheritance: Inheritance;`;

const replacementProps = `type Props = {
  stats: Stats;
  realm: string;
  rawRealm?: Realm;
  subStageIndex?: number;
  inheritance: Inheritance;`;

if (content.includes(targetProps)) {
  console.log('Found targetProps!');
  content = content.replace(targetProps, replacementProps);
} else {
  console.log('targetProps NOT found!');
}

// 3. Add subStageIndex destructuring in StatsPanel component parameters
const targetDestruct = `export default function StatsPanel({
  stats,
  realm,
  rawRealm,
  inheritance,`;

const replacementDestruct = `export default function StatsPanel({
  stats,
  realm,
  rawRealm,
  subStageIndex,
  inheritance,`;

if (content.includes(targetDestruct)) {
  console.log('Found targetDestruct!');
  content = content.replace(targetDestruct, replacementDestruct);
} else {
  console.log('targetDestruct NOT found!');
}

// 4. Update getRealmSubStage call
const targetCall = `  // calculate sub-stage and dynamic combat stats
  const subStageInfo = getRealmSubStage(stats.cultivation, rawRealm);`;

const replacementCall = `  // calculate sub-stage and dynamic combat stats
  const subStageInfo = getRealmSubStage(stats.cultivation, rawRealm, subStageIndex);`;

if (content.includes(targetCall)) {
  console.log('Found targetCall!');
  content = content.replace(targetCall, replacementCall);
} else {
  console.log('targetCall NOT found!');
}

// 5. Update maxCultivation calculation using getSubStageMaxCultivation
const targetMaxCult = `  const mult = (combatConfig as any).cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  const maxCultivation = 
    subStageInfo.majorRealm === 'Mortal' ? 10.0 :
    subStageInfo.majorRealm === 'Qi Refinement' ? Math.round((10 * Math.pow(mult, 9) - 0.01) * 100) / 100 :
    subStageInfo.majorRealm === 'Foundation Establishment' ? 19.99 :
    subStageInfo.majorRealm === 'Golden Core' ? 39.99 : 99.99;`;

const replacementMaxCult = `  const maxCultivation = getSubStageMaxCultivation(
    subStageInfo.majorRealm,
    subStageInfo.subStageIndex
  );`;

if (content.includes(targetMaxCult)) {
  console.log('Found targetMaxCult!');
  content = content.replace(targetMaxCult, replacementMaxCult);
} else {
  console.log('targetMaxCult NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed stats panel changes.');
