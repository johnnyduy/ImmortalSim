const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, 'lib', 'engine.ts');
let code = fs.readFileSync(enginePath, 'utf8');

// Replace standard pattern minAge: 0, maxAge: 9999
code = code.replace(/minAge:\s*\d+,\s*maxAge:\s*\d+,/g, "minRealm: 'Mortal',");

// Replace standalone minAge: 0 or minAge: age
code = code.replace(/minAge:\s*[^,}]+,/g, "minRealm: 'Mortal',");
code = code.replace(/maxAge:\s*[^,}]+,/g, "");

// Ensure no dangling commas if maxAge was the last before brace
code = code.replace(/,\s*\}/g, '}');

// Now, replace the check in filterEventsForState
code = code.replace(
  `// 1. Check Age Limits
    if (age < event.minAge || age > event.maxAge) return false;`,
  `// 1. Check Realm Limits
    const realmTiers: Record<string, number> = {
      'Mortal': 0, 'Qi Refinement': 1, 'Foundation Establishment': 2, 'Golden Core': 3,
      'Nascent Soul': 4, 'Soul Formation': 5, 'Void Amalgamation': 6, 'Body Integration': 7,
      'Mahayana': 8, 'Tribulation': 9, 'True Immortal': 10
    };
    const reqTier = event.minRealm ? (realmTiers[event.minRealm as string] ?? 0) : 0;
    const currentTier = realmTiers[state.realm] ?? 0;
    if (currentTier < reqTier) return false;
    
    if (event.maxRealm) {
      const maxTier = realmTiers[event.maxRealm as string] ?? 99;
      if (currentTier > maxTier) return false;
    }`
);

fs.writeFileSync(enginePath, code);
console.log('Engine updated');
