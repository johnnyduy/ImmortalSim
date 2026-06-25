const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, 'lib', 'engine.ts');
const controllerPath = path.join(__dirname, 'lib', 'game-controller.ts');

let engineCode = fs.readFileSync(enginePath, 'utf8');

// The functions to move
const tickMonthRegex = /export const tickMonth = \([\s\S]*?\n};\n/;
const getVietnameseMonthNameRegex = /function getVietnameseMonthName[\s\S]*?\n}\n/;
const getEnglishMonthNameRegex = /function getEnglishMonthName[\s\S]*?\n}\n/;

let tickMonthMatch = engineCode.match(tickMonthRegex);
let viMonthMatch = engineCode.match(getVietnameseMonthNameRegex);
let enMonthMatch = engineCode.match(getEnglishMonthNameRegex);

if (!tickMonthMatch) {
  console.log('Could not find tickMonth');
  process.exit(1);
}

// Extract texts
let tickMonthCode = tickMonthMatch[0];
let viMonthCode = viMonthMatch ? viMonthMatch[0] : '';
let enMonthCode = enMonthMatch ? enMonthMatch[0] : '';

// Remove from engineCode
engineCode = engineCode.replace(tickMonthCode, '');
if (viMonthCode) engineCode = engineCode.replace(viMonthCode, '');
if (enMonthCode) engineCode = engineCode.replace(enMonthCode, '');

// Identify helpers that need to be exported in engine.ts
const helpersToExport = [
  'getVietnameseMonthName', 'getEnglishMonthName',
  'getCultivationCap', 'getCultivationGainMultiplier', 'checkAndApplySubStageTransition',
  'getBottlenecks', 'generateBreakthroughEvent', 'buildQuestCompleteEvent',
  'buildQuestFailedEvent', 'getPlayerStat', 'determineRealm', 'tickWorldState',
  'createInitialWorldState', 'worldStateToNews', 'getWorldEventModifiers',
  'generateWorldThresholdEvent', 'generateNpcEvent', 'filterEventsForState',
  'getLocalizedEvents', 'getRandomEvent', 'monthlyNarrativesVi', 'monthlyNarrativesEn',
  'SectPunishmentEvent', 'TournamentAnnualStartEvent', 'translateDeathReason', 'defaultMessages',
  'getLocalizedText', 'renderLocalizedTemplate'
];

helpersToExport.forEach(helper => {
  // Try to export const helper = ...
  const constRegex = new RegExp(`(?<!export\\s)const\\s+${helper}\\s*=`, 'g');
  engineCode = engineCode.replace(constRegex, `export const ${helper} =`);

  // Try to export let helper = ...
  const letRegex = new RegExp(`(?<!export\\s)let\\s+${helper}\\s*=`, 'g');
  engineCode = engineCode.replace(letRegex, `export let ${helper} =`);

  // Try to export function helper(...)
  const fnRegex = new RegExp(`(?<!export\\s)function\\s+${helper}\\s*\\(`, 'g');
  engineCode = engineCode.replace(fnRegex, `export function ${helper}(`);
});

fs.writeFileSync(enginePath, engineCode, 'utf8');

// Generate game-controller.ts imports
const controllerContent = `import type { GameState, Lang, EventDefinition, LogEntry, LocalizedText, ItemInstance, WorldState } from '../types';
import combatConfig from '../data/combat-config.json';
import {
  getCultivationCap, getCultivationGainMultiplier, checkAndApplySubStageTransition,
  getBottlenecks, generateBreakthroughEvent, buildQuestCompleteEvent,
  buildQuestFailedEvent, getPlayerStat, determineRealm, tickWorldState,
  createInitialWorldState, worldStateToNews, getWorldEventModifiers,
  generateWorldThresholdEvent, generateNpcEvent, filterEventsForState,
  getLocalizedEvents, getRandomEvent, monthlyNarrativesVi, monthlyNarrativesEn,
  SectPunishmentEvent, TournamentAnnualStartEvent
} from './engine';
import { translateDeathReason, defaultMessages, getLocalizedText, renderLocalizedTemplate } from './i18n';

${viMonthCode.replace('function', 'export function')}
${enMonthCode.replace('function', 'export function')}

${tickMonthCode}
`;

fs.writeFileSync(controllerPath, controllerContent, 'utf8');
console.log('Extraction complete. Files written.');
