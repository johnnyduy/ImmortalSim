const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, 'data', 'events');
const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(eventsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = false;

  data.forEach(event => {
    let age = event.minAge;
    let minRealm = 'Mortal'; // Default if no minAge was provided
    if (age !== undefined) {
      if (age >= 35) {
        minRealm = 'Golden Core';
      } else if (age >= 20) {
        minRealm = 'Foundation Establishment';
      } else {
        minRealm = 'Qi Refinement';
      }
      delete event.minAge;
      delete event.maxAge;
      updated = true;
    }
    
    if (!event.minRealm) {
      event.minRealm = minRealm;
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file}`);
  }
});
