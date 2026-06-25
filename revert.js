const fs = require('fs');
const path = require('path');

const filesToProcess = [
  path.join(__dirname, 'app/page.tsx'),
  path.join(__dirname, 'lib/engine.ts')
];

for (const file of filesToProcess) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the broken regex insertions
    const brokenPattern = /,\s*zh:\s*"\[ZH-TODO\] "\s*\+\s*String\([\s\S]*?\)\s*\}/g;
    content = content.replace(brokenPattern, '}');

    // Also replace the successful ones! Because we decided to just use LocalizedText with zh?: string
    // Successful ones look like: `{ vi: '...', en: '...', zh: "[ZH-TODO] " + String('...') }`
    // We want to remove the `zh` part from them too.
    // The successful ones look exactly like `, zh: "[ZH-TODO] " + String('...')` inside the object.
    // The previous regex already matches them as long as they end with `}`.
    // Let's verify: `String('...') }` matches `\s*\}\s*`.
    // Wait, the successful one is `{ vi: "A", en: "B", zh: "[ZH-TODO] " + String("B") }`.
    // The regex `,\s*zh:\s*"\[ZH-TODO\] "\s*\+\s*String\([\s\S]*?\)\s*\}` will match `, zh: "[ZH-TODO] " + String("B") }` and replace with `}`.
    // So it perfectly fixes both the broken ones and the successful ones!

    // Also revert `customDeathCause: LocalizedText` back to `{ vi: string; en: string }` if needed.
    // But since `LocalizedText` allows `zh` to be optional, `LocalizedText` is fine!
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Reverted localized text in ${path.basename(file)}`);
  }
}
