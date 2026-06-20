const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target1 = `nextRealmOverride = matching.realm_to;`;
const replacement1 = `nextRealmOverride = matching.realm_to as Realm;`;

let found = false;
if (content.includes(target1)) {
  console.log('Found target 1!');
  content = content.split(target1).join(replacement1);
  found = true;
} else {
  console.log('Target 1 NOT found!');
}

const normalized = content.replace(/\r\n/g, '\n');

const target2 = `              tempLogs.push({
                type: 'info',
                message: { vi: \`✨ Thành công! Ngộ ra chân lý đất trời, tự nhiên đột phá bình cảnh %s!\`, en: \`✨ Success! Grasped worldly truth, naturally broke %s bottleneck!\` }
              }.replace(/\\%s/g, '\${matching.label}'));`;

const replacement2 = `              tempLogs.push({
                type: 'info',
                message: {
                  vi: \`✨ Thành công! Ngộ ra chân lý đất trời, tự nhiên đột phá bình cảnh \${matching.label}!\`,
                  en: \`✨ Success! Grasped worldly truth, naturally broke \${matching.label} bottleneck!\`
                }
              });`;

const cleanTarget2 = target2.replace(/\r\n/g, '\n');
const cleanReplacement2 = replacement2.replace(/\r\n/g, '\n');

if (normalized.includes(cleanTarget2)) {
  console.log('Found target 2!');
  const updated = normalized.replace(cleanTarget2, cleanReplacement2);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Successfully updated engine.ts!');
} else {
  console.log('Target 2 NOT found! Printing context...');
  const index = normalized.indexOf('Thuận Thiên Đột Phá');
  if (index !== -1) {
    console.log(normalized.substring(index - 100, index + 400));
  }
  if (found) {
    // Save content anyway if target 1 was found and target 2 was not found
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
