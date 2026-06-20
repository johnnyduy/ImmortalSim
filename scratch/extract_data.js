const fs = require('fs');

const config = JSON.parse(fs.readFileSync('data/combat-config.json', 'utf8'));

if (config.items) {
  fs.writeFileSync('data/items.json', JSON.stringify(config.items, null, 2));
  delete config.items;
  fs.writeFileSync('data/combat-config.json', JSON.stringify(config, null, 2));
  console.log('Extracted items to data/items.json');
} else {
  console.log('No items found in combat-config.json');
}

// Create an empty recipes.json if not exists
if (!fs.existsSync('data/recipes.json')) {
  fs.writeFileSync('data/recipes.json', JSON.stringify([], null, 2));
  console.log('Created empty data/recipes.json');
}
