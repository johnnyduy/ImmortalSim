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
  return typeof val === 'string' && (val.startsWith('[VI-TODO]') || val.startsWith('[EN-TODO]') || val.startsWith('[ZH-TODO]'));
}

// --- 1. Sync UI locales ---
function syncUiLocales() {
  logHeader('SYNCING UI TRANSLATIONS');
  const enPath = path.join(__dirname, '../locales/en/ui.json');
  const viPath = path.join(__dirname, '../locales/vi/ui.json');
  const zhPath = path.join(__dirname, '../locales/zh/ui.json');

  const enUi = readJsonFile(enPath);
  const viUi = readJsonFile(viPath);
  const zhUi = readJsonFile(zhPath);

  let updated = false;
  let addedEn = 0;
  let addedVi = 0;
  let addedZh = 0;
  let todoCount = 0;

  // Find all union keys
  const allKeys = Array.from(new Set([...Object.keys(enUi), ...Object.keys(viUi), ...Object.keys(zhUi)])).sort();

  const newEnUi = {};
  const newViUi = {};
  const newZhUi = {};

  allKeys.forEach((key) => {
    let enVal = enUi[key];
    let viVal = viUi[key];
    let zhVal = zhUi[key];

    if (enVal === undefined) {
      enVal = `[EN-TODO] ${viVal || zhVal}`;
      updated = true;
      addedEn++;
      logWarning(`UI key missing in EN: "${key}" -> added placeholder.`);
    }

    if (viVal === undefined) {
      viVal = `[VI-TODO] ${enVal || zhVal}`;
      updated = true;
      addedVi++;
      logWarning(`UI key missing in VI: "${key}" -> added placeholder.`);
    }

    if (zhVal === undefined) {
      zhVal = `[ZH-TODO] ${enVal || viVal}`;
      updated = true;
      addedZh++;
      logWarning(`UI key missing in ZH: "${key}" -> added placeholder.`);
    }

    if (isTodo(enVal) || isTodo(viVal) || isTodo(zhVal)) {
      todoCount++;
    }

    newEnUi[key] = enVal;
    newViUi[key] = viVal;
    newZhUi[key] = zhVal;
  });

  // Check if content order or values changed
  const enChanged = JSON.stringify(enUi) !== JSON.stringify(newEnUi);
  const viChanged = JSON.stringify(viUi) !== JSON.stringify(newViUi);
  const zhChanged = JSON.stringify(zhUi) !== JSON.stringify(newZhUi);

  if (enChanged || viChanged || zhChanged) {
    if (enChanged) writeJsonFile(enPath, newEnUi);
    if (viChanged) writeJsonFile(viPath, newViUi);
    if (zhChanged) writeJsonFile(zhPath, newZhUi);
    logSuccess(`UI translations updated! Added EN keys: ${addedEn}, Added VI keys: ${addedVi}, Added ZH keys: ${addedZh}.`);
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
  const zhPath = path.join(__dirname, '../locales/zh/events.json');

  const enEvents = readJsonFile(enPath, []);
  const viEvents = readJsonFile(viPath, []);
  const zhEvents = readJsonFile(zhPath, []);

  // Maps for faster lookups
  const enMap = new Map(enEvents.map((ev) => [ev.id, ev]));
  const viMap = new Map(viEvents.map((ev) => [ev.id, ev]));
  const zhMap = new Map(zhEvents.map((ev) => [ev.id, ev]));

  const nextEnEvents = [];
  const nextViEvents = [];
  const nextZhEvents = [];
  
  let missingTranslationsVi = 0;
  let missingTranslationsZh = 0;

  masterEvents.forEach((masterEv) => {
    const existingEnEv = enMap.get(masterEv.id);
    const existingViEv = viMap.get(masterEv.id);
    const existingZhEv = zhMap.get(masterEv.id);

    // 1. Build EN Event
    const masterTitleEn = typeof masterEv.title === 'object' ? masterEv.title.en : masterEv.title;
    const masterDescEn = typeof masterEv.description === 'object' ? masterEv.description.en : masterEv.description;
    
    const enTitle = masterTitleEn || existingEnEv?.title || '';
    const enDesc = masterDescEn || existingEnEv?.description || '';

    const enChoices = masterEv.choices.map((masterChoice) => {
      const existingChoice = existingEnEv?.choices?.find((c) => c.id === masterChoice.id);
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
      missingTranslationsVi++;
    }
    if (!viDesc) {
      viDesc = `[VI-TODO] ${masterDescEn || masterEv.description}`;
      missingTranslationsVi++;
    }

    const viChoices = masterEv.choices.map((masterChoice) => {
      const existingChoice = existingViEv?.choices?.find((c) => c.id === masterChoice.id);
      const masterChoiceVi = typeof masterChoice.text === 'object' ? masterChoice.text.vi : undefined;
      const masterChoiceEn = typeof masterChoice.text === 'object' ? masterChoice.text.en : masterChoice.text;
      let viChoiceText = masterChoiceVi || existingChoice?.text;
      if (!viChoiceText) {
        viChoiceText = `[VI-TODO] ${masterChoiceEn || masterChoice.text}`;
        missingTranslationsVi++;
      }
      return {
        id: masterChoice.id,
        text: viChoiceText,
        effects: masterChoice.effects,
        ...(masterChoice.metadata ? { metadata: masterChoice.metadata } : {}),
      };
    });

    const viEv = {
      ...enEv,
      title: viTitle,
      description: viDesc,
      choices: viChoices,
    };
    nextViEvents.push(viEv);

    // 3. Build ZH Event
    const masterTitleZh = typeof masterEv.title === 'object' ? masterEv.title.zh : undefined;
    const masterDescZh = typeof masterEv.description === 'object' ? masterEv.description.zh : undefined;

    let zhTitle = masterTitleZh || existingZhEv?.title;
    let zhDesc = masterDescZh || existingZhEv?.description;

    if (!zhTitle) {
      zhTitle = `[ZH-TODO] ${masterTitleEn || masterEv.title}`;
      missingTranslationsZh++;
    }
    if (!zhDesc) {
      zhDesc = `[ZH-TODO] ${masterDescEn || masterEv.description}`;
      missingTranslationsZh++;
    }

    const zhChoices = masterEv.choices.map((masterChoice) => {
      const existingChoice = existingZhEv?.choices?.find((c) => c.id === masterChoice.id);
      const masterChoiceZh = typeof masterChoice.text === 'object' ? masterChoice.text.zh : undefined;
      const masterChoiceEn = typeof masterChoice.text === 'object' ? masterChoice.text.en : masterChoice.text;
      let zhChoiceText = masterChoiceZh || existingChoice?.text;
      if (!zhChoiceText) {
        zhChoiceText = `[ZH-TODO] ${masterChoiceEn || masterChoice.text}`;
        missingTranslationsZh++;
      }
      return {
        id: masterChoice.id,
        text: zhChoiceText,
        effects: masterChoice.effects,
        ...(masterChoice.metadata ? { metadata: masterChoice.metadata } : {}),
      };
    });

    const zhEv = {
      ...enEv,
      title: zhTitle,
      description: zhDesc,
      choices: zhChoices,
    };
    nextZhEvents.push(zhEv);
  });

  // Check if content or sorting changed
  const enChanged = JSON.stringify(enEvents) !== JSON.stringify(nextEnEvents);
  const viChanged = JSON.stringify(viEvents) !== JSON.stringify(nextViEvents);
  const zhChanged = JSON.stringify(zhEvents) !== JSON.stringify(nextZhEvents);

  if (enChanged || viChanged || zhChanged) {
    if (enChanged) writeJsonFile(enPath, nextEnEvents);
    if (viChanged) writeJsonFile(viPath, nextViEvents);
    if (zhChanged) writeJsonFile(zhPath, nextZhEvents);
    logSuccess(`Events data updated! Synced ${masterEvents.length} events.`);
  } else {
    logSuccess('Events data is already in sync.');
  }

  if (missingTranslationsVi > 0) logInfo(`Events contain ${missingTranslationsVi} pending VI-TODO item(s).`);
  if (missingTranslationsZh > 0) logInfo(`Events contain ${missingTranslationsZh} pending ZH-TODO item(s).`);
}

// --- 3. Sync Sects ---
function syncSects() {
  logHeader('SYNCING SECTS DATA');
  const enPath = path.join(__dirname, '../locales/en/sects.json');
  const viPath = path.join(__dirname, '../locales/vi/sects.json');
  const zhPath = path.join(__dirname, '../locales/zh/sects.json');

  const enSects = readJsonFile(enPath, []);
  const viSects = readJsonFile(viPath, []);
  const zhSects = readJsonFile(zhPath, []);

  const viMap = new Map(viSects.map((s) => [s.id, s]));
  const zhMap = new Map(zhSects.map((s) => [s.id, s]));
  const nextViSects = [];
  const nextZhSects = [];
  let missingVi = 0;
  let missingZh = 0;

  enSects.forEach((enSect) => {
    const existingViSect = viMap.get(enSect.id);
    const existingZhSect = zhMap.get(enSect.id);
    
    let viName = existingViSect?.name;
    let viDesc = existingViSect?.description;
    if (!viName) { viName = `[VI-TODO] ${enSect.name}`; missingVi++; }
    if (!viDesc) { viDesc = `[VI-TODO] ${enSect.description}`; missingVi++; }

    let zhName = existingZhSect?.name;
    let zhDesc = existingZhSect?.description;
    if (!zhName) { zhName = `[ZH-TODO] ${enSect.name}`; missingZh++; }
    if (!zhDesc) { zhDesc = `[ZH-TODO] ${enSect.description}`; missingZh++; }

    nextViSects.push({ ...enSect, name: viName, description: viDesc });
    nextZhSects.push({ ...enSect, name: zhName, description: zhDesc });
  });

  const viChanged = JSON.stringify(viSects) !== JSON.stringify(nextViSects);
  const zhChanged = JSON.stringify(zhSects) !== JSON.stringify(nextZhSects);

  if (viChanged || zhChanged) {
    if (viChanged) writeJsonFile(viPath, nextViSects);
    if (zhChanged) writeJsonFile(zhPath, nextZhSects);
    logSuccess(`Sects data updated!`);
  } else {
    logSuccess('Sects data is already in sync.');
  }

  if (missingVi > 0) logInfo(`Sects contain ${missingVi} pending VI-TODO.`);
  if (missingZh > 0) logInfo(`Sects contain ${missingZh} pending ZH-TODO.`);
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
