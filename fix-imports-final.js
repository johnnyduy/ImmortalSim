const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

const correctHeader = `'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import AtmosphereBackground from '../components/AtmosphereBackground';
import AudioControls from '../components/AudioControls';
import ChoiceButtons from '../components/ChoiceButtons';
import StatsPanel from '../components/StatsPanel';
import TestCombatPanel from '../components/TestCombatPanel';
import AdminPanel from '../components/AdminPanel';
import SettingsModal from '../components/SettingsModal';
import TerminalUI from '../components/TerminalUI';
import ReincarnationUI from '../components/ReincarnationUI';
import { applyChoiceToState, createNewGame, getInitialInheritance, reincarnate, useItemInState, equipItemInState, getPlayerStat, getRandomEvent, addItem, getMenuEvent, addFragment, SectPunishmentEvent, changeLocation, setDynamicEvents, completeTechniqueLearning } from '../lib/engine';
import { tickMonth } from '../lib/game-controller';
import { getRealmSubStage } from '../lib/cultivation-states';
import { getLocalizedText, uiText, translatedRealms } from '../lib/i18n';
import { useAtmosphere } from '../hooks/useAtmosphere';
import TimeGearPanel from '../components/TimeGearPanel';
import OutcomeTransition from '../components/OutcomeTransition';
import type { GameState, Inheritance, Lang, LocalizedText, SectQuest, EventDefinition, TechniqueInstance } from '../types';
import SectMissionsPanel from '../components/SectMissionsPanel';
import { audioManager } from '../styles/AudioManager';
import TypewriterText from '../components/TypewriterText';
import CombatPanel from '../components/CombatPanel';
import LevelRewardAnimation, { type LevelRewardAnimationPayload } from '../components/LevelRewardAnimation';
import SubStageBreakthrough from '../components/SubStageBreakthrough';
import MajorBreakthrough from '../components/MajorBreakthrough';
import MountainExploration from '../components/MountainExploration';
import combatConfig from '../data/combat-config.json';
import type { Character, CombatEnvironment, StatSnapshot } from '../docs/CombatState';
import CultivationMinigame from '../components/CultivationMinigame';
import CombatModal from '../components/CombatModal';
import AlchemyModal from '../components/AlchemyModal';
import BlackMarketModal from '../components/BlackMarketModal';
import SectShopModal from '../components/SectShopModal';
import { resolveCombatAction, finishCombat } from '../lib/combat-system';

// Fallback image helper component for event backgrounds (thiết kế hình tròn viền ngọc bích mảnh)
function EventIllustration({ id, sect }: { id: string; sect?: string }) {`;

// Slice from the first `// Fallback image helper component`
const fallbackImageStr = "// Fallback image helper component for event backgrounds (thiết kế hình tròn viền ngọc bích mảnh)\nfunction EventIllustration({ id, sect }: { id: string; sect?: string }) {";
const index = content.indexOf(fallbackImageStr);
if (index !== -1) {
  content = correctHeader + content.substring(index + fallbackImageStr.length);
} else {
  console.log("Could not find fallback image string!");
}

fs.writeFileSync(pageFile, content, 'utf8');
console.log("Fixed imports");
