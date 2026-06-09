const fs = require('fs');
const path = require('path');
const { createNewGame, tickMonth } = require('../lib/engine');

const inheritance = {
  legacyPower: 0,
  ancestralMemory: 0,
  blessing: 0,
  unlockedTechniques: {},
  unlockedItems: [],
};

function main() {
  console.log('=== STARTING SIMULATION DRY RUN ===');
  let game = createNewGame(inheritance, 0, 'vi', {
    gender: 'nam',
    spiritualRoot: 'Kim Linh Căn',
    sect: 'Kiếm Tông'
  });

  console.log(`Initial Age: ${game.age}, Month: ${game.month}, Event: ${game.currentEvent?.title.vi}`);

  // 1. Simulate answering the birth story choice to start ticking
  const choiceId = game.currentEvent.choices[0].id;
  const { applyChoiceToState } = require('../lib/engine');
  game = applyChoiceToState(game, choiceId, 'vi');
  console.log(`After Birth Story choice: isTicking=${game.isTicking}, Event=${game.currentEvent?.title?.vi || 'None'}`);

  // 2. Tick for 120 months (10 years)
  let ticks = 120;
  let eventCount = 0;
  for (let i = 1; i <= ticks; i++) {
    game = tickMonth(game, 'vi');
    
    if (game.currentEvent) {
      eventCount++;
      console.log(`[Tick ${i}] Event Triggered! Month: ${game.month}, Age: ${game.age}`);
      console.log(`Title: ${game.currentEvent.title.vi}`);
      console.log(`isTicking: ${game.isTicking}`);
      
      // Auto-answer first choice of the event to resume ticking
      const cId = game.currentEvent.choices[0].id;
      game = applyChoiceToState(game, cId, 'vi');
      console.log(`Answered choice. Resumed isTicking=${game.isTicking}\n`);
    } else {
      console.log(`[Tick ${i}] Month: ${game.month}, Age: ${game.age}, Cultivation: ${game.stats.cultivation}`);
    }
  }

  console.log(`\n=== SIMULATION COMPLETED ===`);
  console.log(`Total ticks: ${ticks}`);
  console.log(`Total events triggered: ${eventCount}`);
}

main();
