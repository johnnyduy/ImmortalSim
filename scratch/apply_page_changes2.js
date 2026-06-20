const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Replace prevStage and nextStage calls
const target1 = `  const prevStage = getRealmSubStage(previous.stats.cultivation, previous.realm);
  const nextStage = getRealmSubStage(next.stats.cultivation, next.realm);`;

const replacement1 = `  const prevStage = getRealmSubStage(previous.stats.cultivation, previous.realm, previous.subStageIndex);
  const nextStage = getRealmSubStage(next.stats.cultivation, next.realm, next.subStageIndex);`;

if (content.includes(target1)) {
  console.log('Found prev/nextStage target!');
  content = content.replace(target1, replacement1);
} else {
  console.log('prev/nextStage target NOT found!');
}

// 2. Replace subStageInfo and currentSubStage calls at the top of the Home component
const target2 = `  const subStageInfo = game ? getRealmSubStage(game.stats.cultivation, game.realm) : null;`;
const replacement2 = `  const subStageInfo = game ? getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex) : null;`;

if (content.includes(target2)) {
  console.log('Found subStageInfo target!');
  content = content.replace(target2, replacement2);
} else {
  console.log('subStageInfo target NOT found!');
}

const target3 = `    const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm);`;
const replacement3 = `    const currentSubStage = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);`;

if (content.includes(target3)) {
  console.log('Found currentSubStage target!');
  content = content.replace(target3, replacement3);
} else {
  console.log('currentSubStage target NOT found!');
}

// 4. Replace remaining getRealmSubStage(game.stats.cultivation, game.realm) calls
const target4 = `    const subStageInfo = getRealmSubStage(game.stats.cultivation, game.realm);`;
const replacement4 = `    const subStageInfo = getRealmSubStage(game.stats.cultivation, game.realm, game.subStageIndex);`;

// We have multiple occurrences of this target. Let's split/join to replace all of them.
if (content.includes(target4)) {
  console.log('Found subStageInfo bulk target!');
  content = content.split(target4).join(replacement4);
} else {
  console.log('subStageInfo bulk target NOT found!');
}

// 5. Update StatsPanel props
const target5 = `        <StatsPanel
          stats={game.stats}
          realm={getLocalizedText(translatedRealms[game.realm] || game.realm, language)}
          rawRealm={game.realm}`;

const replacement5 = `        <StatsPanel
          stats={game.stats}
          realm={getLocalizedText(translatedRealms[game.realm] || game.realm, language)}
          rawRealm={game.realm}
          subStageIndex={game.subStageIndex}`;

if (content.includes(target5)) {
  console.log('Found StatsPanel props target!');
  content = content.replace(target5, replacement5);
} else {
  console.log('StatsPanel props target NOT found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed page changes.');
