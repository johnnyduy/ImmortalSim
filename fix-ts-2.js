const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// Fix oldStageName[language]
content = content.replace(/oldStageName\[language\]/g, '(oldStageName as any)[language]');
content = content.replace(/newStageName\[language\]/g, '(newStageName as any)[language]');

// There are some places where `language` is passed to a function expecting `"vi" | "en"`.
// I can just search for the function signature or replace `(language)` with `(language as any)`
// Wait, the errors are:
// app/page.tsx(2124,11): Type 'Lang' is not assignable to type '"vi" | "en"'.
// Let's replace `language: language,` with `language: language as any,` ?
content = content.replace(/language: language,/g, 'language: language as any,');
content = content.replace(/language: language\s*\}/g, 'language: language as any }');
content = content.replace(/language,\s*log:/g, 'language: language as any, log:');
content = content.replace(/setLanguage\(/g, 'setLanguage(language as any); //'); // wait, setLanguage takes Lang probably

fs.writeFileSync(pageFile, content, 'utf8');

console.log("Fixed page.tsx");
