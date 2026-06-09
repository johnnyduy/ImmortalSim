const fs = require('fs');
const path = require('path');

// Colors for terminal logs
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function logHeader(title) {
  console.log(`\n${COLORS.bright}${COLORS.blue}=== ${title} ===${COLORS.reset}`);
}

function logInfo(message) {
  console.log(`${COLORS.cyan}ℹ ${message}${COLORS.reset}`);
}

function logSuccess(message) {
  console.log(`${COLORS.green}✔ ${message}${COLORS.reset}`);
}

function logWarning(message) {
  console.log(`${COLORS.yellow}⚠ ${message}${COLORS.reset}`);
}

function logError(message) {
  console.error(`${COLORS.red}✘ ${message}${COLORS.reset}`);
}

// Read JSON file safely
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logError(`Failed to read/parse ${path.basename(filePath)}: ${error.message}`);
    return defaultValue;
  }
}

// Write JSON file formatted with 2 spaces and ending newline
function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  } catch (error) {
    logError(`Failed to write to ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

// Helper to check if a value is a TODO placeholder
function isTodo(val) {
  return typeof val === 'string' && (val.startsWith('[VI-TODO]') || val.startsWith('[EN-TODO]'));
}

// --- 1. Sync UI locales ---
function syncUiLocales() {
  logHeader('SYNCING UI TRANSLATIONS');
  const enPath = path.join(__dirname, '../locales/en/ui.json');
  const viPath = path.join(__dirname, '../locales/vi/ui.json');

  const enUi = readJsonFile(enPath);
  const viUi = readJsonFile(viPath);

  let updated = false;
  let addedEn = 0;
  let addedVi = 0;
  let todoCount = 0;

  // Find all union keys
  const allKeys = Array.from(new Set([...Object.keys(enUi), ...Object.keys(viUi)])).sort();

  const newEnUi = {};
  const newViUi = {};

  allKeys.forEach((key) => {
    let enVal = enUi[key];
    let viVal = viUi[key];

    if (enVal === undefined) {
      enVal = `[EN-TODO] ${viVal}`;
      updated = true;
      addedEn++;
      logWarning(`UI key missing in EN: "${key}" -> added placeholder.`);
    }

    if (viVal === undefined) {
      viVal = `[VI-TODO] ${enVal}`;
      updated = true;
      addedVi++;
      logWarning(`UI key missing in VI: "${key}" -> added placeholder.`);
    }

    if (isTodo(enVal) || isTodo(viVal)) {
      todoCount++;
    }

    newEnUi[key] = enVal;
    newViUi[key] = viVal;
  });

  // Check if content order or values changed
  const enChanged = JSON.stringify(enUi) !== JSON.stringify(newEnUi);
  const viChanged = JSON.stringify(viUi) !== JSON.stringify(newViUi);

  if (enChanged || viChanged) {
    if (enChanged) writeJsonFile(enPath, newEnUi);
    if (viChanged) writeJsonFile(viPath, newViUi);
    logSuccess(`UI translations updated! Added EN keys: ${addedEn}, Added VI keys: ${addedVi}.`);
  } else {
    logSuccess('UI translations are already in sync.');
  }

  if (todoCount > 0) {
    logInfo(`UI translations contain ${todoCount} pending TODO placeholder(s).`);
  }
}

// --- 2. Sync Events ---
function syncEvents() {
  logHeader('SYNCING EVENTS DATA');
  
  const eventsDir = path.join(__dirname, '../data/events');
  let masterEvents = [];
  if (fs.existsSync(eventsDir)) {
    const files = fs.readdirSync(eventsDir).filter(file => file.endsWith('.json'));
    files.forEach(file => {
      const content = readJsonFile(path.join(eventsDir, file), []);
      masterEvents = [...masterEvents, ...content];
    });
    // Write combined master events to data/events.json as a build artifact
    writeJsonFile(path.join(__dirname, '../data/events.json'), masterEvents);
    logSuccess(`Compiled events from folder into data/events.json`);
  } else {
    masterEvents = readJsonFile(path.join(__dirname, '../data/events.json'), []);
  }

  const enPath = path.join(__dirname, '../locales/en/events.json');
  const viPath = path.join(__dirname, '../locales/vi/events.json');

  const enEvents = readJsonFile(enPath, []);
  const viEvents = readJsonFile(viPath, []);

  // Maps for faster lookups
  const enMap = new Map(enEvents.map((ev) => [ev.id, ev]));
  const viMap = new Map(viEvents.map((ev) => [ev.id, ev]));

  const nextEnEvents = [];
  const nextViEvents = [];
  let addedEvents = 0;
  let addedChoices = 0;
  let missingTranslations = 0;

  masterEvents.forEach((masterEv) => {
    const existingEnEv = enMap.get(masterEv.id);
    const existingViEv = viMap.get(masterEv.id);

    if (!existingEnEv) addedEvents++;
    if (!existingViEv) addedEvents++;

    // 1. Build EN Event
    const masterTitleEn = typeof masterEv.title === 'object' ? masterEv.title.en : masterEv.title;
    const masterDescEn = typeof masterEv.description === 'object' ? masterEv.description.en : masterEv.description;
    
    const enTitle = masterTitleEn || existingEnEv?.title || '';
    const enDesc = masterDescEn || existingEnEv?.description || '';

    const enChoices = masterEv.choices.map((masterChoice) => {
      const existingChoice = existingEnEv?.choices?.find((c) => c.id === masterChoice.id);
      if (!existingChoice) addedChoices++;
      const masterChoiceEn = typeof masterChoice.text === 'object' ? masterChoice.text.en : masterChoice.text;
      return {
        id: masterChoice.id,
        text: masterChoiceEn || existingChoice?.text || '',
        effects: masterChoice.effects,
        ...(masterChoice.metadata ? { metadata: masterChoice.metadata } : {}),
      };
    });

    const enEv = {
      id: masterEv.id,
      title: enTitle,
      description: enDesc,
      minAge: masterEv.minAge,
      maxAge: masterEv.maxAge,
      weight: masterEv.weight,
      choices: enChoices,
      ...(masterEv.tags ? { tags: masterEv.tags } : {}),
      ...(masterEv.metadata ? { metadata: masterEv.metadata } : {}),
    };
    nextEnEvents.push(enEv);

    // 2. Build VI Event
    const masterTitleVi = typeof masterEv.title === 'object' ? masterEv.title.vi : undefined;
    const masterDescVi = typeof masterEv.description === 'object' ? masterEv.description.vi : undefined;

    let viTitle = masterTitleVi || existingViEv?.title;
    let viDesc = masterDescVi || existingViEv?.description;

    if (!viTitle) {
      viTitle = `[VI-TODO] ${masterTitleEn || masterEv.title}`;
      missingTranslations++;
      logWarning(`Missing VI translation for event title: "${masterEv.id}"`);
    }
    if (!viDesc) {
      viDesc = `[VI-TODO] ${masterDescEn || masterEv.description}`;
      missingTranslations++;
      logWarning(`Missing VI translation for event description: "${masterEv.id}"`);
    }

    const viChoices = masterEv.choices.map((masterChoice) => {
      const existingChoice = existingViEv?.choices?.find((c) => c.id === masterChoice.id);
      const masterChoiceVi = typeof masterChoice.text === 'object' ? masterChoice.text.vi : undefined;
      const masterChoiceEn = typeof masterChoice.text === 'object' ? masterChoice.text.en : masterChoice.text;
      let viChoiceText = masterChoiceVi || existingChoice?.text;
      if (!viChoiceText) {
        viChoiceText = `[VI-TODO] ${masterChoiceEn || masterChoice.text}`;
        missingTranslations++;
        logWarning(`Missing VI translation for choice: "${masterEv.id}.${masterChoice.id}"`);
      }
      return {
        id: masterChoice.id,
        text: viChoiceText,
        effects: masterChoice.effects,
        ...(masterChoice.metadata ? { metadata: masterChoice.metadata } : {}),
      };
    });

    const viEv = {
      id: masterEv.id,
      title: viTitle,
      description: viDesc,
      minAge: masterEv.minAge,
      maxAge: masterEv.maxAge,
      weight: masterEv.weight,
      choices: viChoices,
      ...(masterEv.tags ? { tags: masterEv.tags } : {}),
      ...(masterEv.metadata ? { metadata: masterEv.metadata } : {}),
    };
    nextViEvents.push(viEv);
  });

  // Check if content or sorting changed
  const enChanged = JSON.stringify(enEvents) !== JSON.stringify(nextEnEvents);
  const viChanged = JSON.stringify(viEvents) !== JSON.stringify(nextViEvents);

  if (enChanged || viChanged) {
    if (enChanged) writeJsonFile(enPath, nextEnEvents);
    if (viChanged) writeJsonFile(viPath, nextViEvents);
    logSuccess(`Events data updated! Synced ${masterEvents.length} events.`);
  } else {
    logSuccess('Events data is already in sync.');
  }

  if (missingTranslations > 0) {
    logInfo(`Events contain ${missingTranslations} pending VI-TODO translation item(s).`);
  }
}

// --- 3. Sync Sects ---
function syncSects() {
  logHeader('SYNCING SECTS DATA');
  const enPath = path.join(__dirname, '../locales/en/sects.json');
  const viPath = path.join(__dirname, '../locales/vi/sects.json');

  const enSects = readJsonFile(enPath, []);
  const viSects = readJsonFile(viPath, []);

  const viMap = new Map(viSects.map((s) => [s.id, s]));
  const nextViSects = [];
  let missingTranslations = 0;

  enSects.forEach((enSect) => {
    const existingViSect = viMap.get(enSect.id);
    let viName = existingViSect?.name;
    let viDesc = existingViSect?.description;

    if (!viName) {
      viName = `[VI-TODO] ${enSect.name}`;
      missingTranslations++;
      logWarning(`Missing VI translation for sect name: "${enSect.id}"`);
    }
    if (!viDesc) {
      viDesc = `[VI-TODO] ${enSect.description}`;
      missingTranslations++;
      logWarning(`Missing VI translation for sect description: "${enSect.id}"`);
    }

    const viSect = {
      id: enSect.id,
      name: viName,
      description: viDesc,
      alignment: enSect.alignment,
      ...(enSect.metadata ? { metadata: enSect.metadata } : {}),
    };
    nextViSects.push(viSect);
  });

  const viChanged = JSON.stringify(viSects) !== JSON.stringify(nextViSects);

  if (viChanged) {
    writeJsonFile(viPath, nextViSects);
    logSuccess(`Sects data updated! Synced ${enSects.length} sects.`);
  } else {
    logSuccess('Sects data is already in sync.');
  }

  if (missingTranslations > 0) {
    logInfo(`Sects contain ${missingTranslations} pending VI-TODO translation item(s).`);
  }
}

// Main Runner
function run() {
  try {
    logInfo('Starting localization synchronization & validation rule...');
    syncUiLocales();
    syncEvents();
    syncSects();
    console.log(`\n${COLORS.bright}${COLORS.green}✔ All locales synced and verified successfully!${COLORS.reset}\n`);
  } catch (error) {
    logError(`Unexpected error during localization sync: ${error.stack}`);
    process.exit(1);
  }
}

run();
