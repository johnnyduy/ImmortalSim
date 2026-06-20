const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `      bottlenecks: bottlenecks.map(b => ({
        ...b,
        threshold: Number(b.threshold),
        next_cult: Number(b.next_cult),
      })),`;

const replacement = `      bottlenecks: bottlenecks.map(b => ({
        ...b,
        threshold: Number(b.threshold),
        next_cult: Number(b.next_cult),
      })),
      qi_refinement_layer_multiplier: Number(qiRefinementMultiplier),`;

const cleanTarget = target.replace(/\r\n/g, '\n');
const cleanReplacement = replacement.replace(/\r\n/g, '\n');
const normalized = content.replace(/\r\n/g, '\n');

if (normalized.includes(cleanTarget)) {
  console.log('Found submit insertion point!');
  const updated = normalized.replace(cleanTarget, cleanReplacement);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Successfully updated AdminPanel.tsx submit handler!');
} else {
  console.log('Submit insertion point NOT found!');
}
