const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/StatsPanel.tsx');
console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to Unix LF
content = content.replace(/\r\n/g, '\n');

// Helper to count matches
function countMatches(str, target) {
  let count = 0;
  let pos = str.indexOf(target);
  while (pos !== -1) {
    count++;
    pos = str.indexOf(target, pos + target.length);
  }
  return count;
}

// 1. Add rawRealm?: Realm to Props definition
const propsTarget = `type Props = {
  stats: Stats;
  realm: string;`.replace(/\r\n/g, '\n');

const propsReplacement = `type Props = {
  stats: Stats;
  realm: string;
  rawRealm?: Realm;`.replace(/\r\n/g, '\n');

if (countMatches(content, propsTarget) === 1) {
  content = content.replace(propsTarget, propsReplacement);
} else {
  console.error('ERROR: propsTarget matched ' + countMatches(content, propsTarget) + ' times');
  process.exit(1);
}

// 2. Destructure rawRealm in StatsPanel function arguments
const funcTarget = `export default function StatsPanel({
  stats,
  realm,
  inheritance,
  age,
  life,
  labels,
  techniques = [],
  language = 'vi',
  inventory = [],
  onUseItem,
  onEquipItem,
  month = 1,
  sect = '',
  sectContribution = 0,
  spiritStones = 0,
  sectRank = 'ngoại_môn',
  sectPrestige = 0,
  onViewDetail,
  npcFavorability,
  worldState,
  currentLocation = 'sect',
}: Props) {`.replace(/\r\n/g, '\n');

const funcReplacement = `export default function StatsPanel({
  stats,
  realm,
  rawRealm,
  inheritance,
  age,
  life,
  labels,
  techniques = [],
  language = 'vi',
  inventory = [],
  onUseItem,
  onEquipItem,
  month = 1,
  sect = '',
  sectContribution = 0,
  spiritStones = 0,
  sectRank = 'ngoại_môn',
  sectPrestige = 0,
  onViewDetail,
  npcFavorability,
  worldState,
  currentLocation = 'sect',
}: Props) {`.replace(/\r\n/g, '\n');

if (countMatches(content, funcTarget) === 1) {
  content = content.replace(funcTarget, funcReplacement);
} else {
  console.error('ERROR: funcTarget matched ' + countMatches(content, funcTarget) + ' times');
  process.exit(1);
}

// 3. Update getRealmSubStage call to pass rawRealm
const subStageTarget = `  const subStageInfo = getRealmSubStage(stats.cultivation);`.replace(/\r\n/g, '\n');
const subStageReplacement = `  const subStageInfo = getRealmSubStage(stats.cultivation, rawRealm);`.replace(/\r\n/g, '\n');

if (countMatches(content, subStageTarget) === 1) {
  content = content.replace(subStageTarget, subStageReplacement);
} else {
  console.error('ERROR: subStageTarget matched ' + countMatches(content, subStageTarget) + ' times');
  process.exit(1);
}

// 4. Update maxCultivation calculation to use multiplier
const maxCultTarget = `  const maxCultivation = 
    subStageInfo.majorRealm === 'Mortal' ? 15 :
    subStageInfo.majorRealm === 'Qi Refinement' ? 30 :
    subStageInfo.majorRealm === 'Foundation Establishment' ? 50 :
    subStageInfo.majorRealm === 'Golden Core' ? 90 : 150;`.replace(/\r\n/g, '\n');

const maxCultReplacement = `  const mult = (combatConfig as any).cultivation_system?.qi_refinement_layer_multiplier ?? 1.3;
  const maxCultivation = 
    subStageInfo.majorRealm === 'Mortal' ? 10.0 :
    subStageInfo.majorRealm === 'Qi Refinement' ? Math.round((10 * Math.pow(mult, 9) - 0.01) * 100) / 100 :
    subStageInfo.majorRealm === 'Foundation Establishment' ? 19.99 :
    subStageInfo.majorRealm === 'Golden Core' ? 39.99 : 99.99;`.replace(/\r\n/g, '\n');

if (countMatches(content, maxCultTarget) === 1) {
  content = content.replace(maxCultTarget, maxCultReplacement);
} else {
  console.error('ERROR: maxCultTarget matched ' + countMatches(content, maxCultTarget) + ' times');
  process.exit(1);
}

// 5. Update renderBarDetail call to use maxCultivation variable
const renderBarTarget = `                {renderBarDetail(
                  labels.cultivation,
                  stats.cultivation,
                  subStageInfo.majorRealm === 'Mortal' ? 15 :
                  subStageInfo.majorRealm === 'Qi Refinement' ? 30 :
                  subStageInfo.majorRealm === 'Foundation Establishment' ? 50 :
                  subStageInfo.majorRealm === 'Golden Core' ? 90 : 150,
                  "bg-gradient-to-r from-blue-700 to-blue-400",
                  cultIcon
                )}`.replace(/\r\n/g, '\n');

const renderBarReplacement = `                {renderBarDetail(
                  labels.cultivation,
                  stats.cultivation,
                  maxCultivation,
                  "bg-gradient-to-r from-blue-700 to-blue-400",
                  cultIcon
                )}`.replace(/\r\n/g, '\n');

if (countMatches(content, renderBarTarget) === 1) {
  content = content.replace(renderBarTarget, renderBarReplacement);
} else {
  console.error('ERROR: renderBarTarget matched ' + countMatches(content, renderBarTarget) + ' times');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: All StatsPanel cultivation/realm updates applied!');
