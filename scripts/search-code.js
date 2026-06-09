const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath, query);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(query)) {
          console.log(`Found "${query}" in: ${fullPath}`);
          // Print matching lines
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(query)) {
              console.log(`  L${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

console.log('=== SEARCHING FOR "event_chance_denominator" ===');
searchDir(path.join(__dirname, '..'), 'event_chance_denominator');
console.log('=== SEARCH COMPLETED ===');
