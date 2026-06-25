const fs = require('fs');
const path = require('path');

let errors = [];

const checkDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 1. Em-dash Check
      if (content.includes('—') || content.includes('–')) {
        // Exclude some common en-dashes in comments
        const noComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        if (noComments.includes('—') || noComments.includes('–')) {
          errors.push(`[EM-DASH] ${file} contains em-dash or en-dash. Banned by rule 9.G.`);
        }
      }
      
      // 2. Eyebrow Count Check (approximate)
      const matches = content.match(/uppercase tracking-(widest|wider|wide)/g);
      if (matches && matches.length > 3) {
        errors.push(`[EYEBROW] ${file} contains ${matches.length} 'uppercase tracking' classes. Likely violates the Eyebrow Count rule (max 1 per 3 sections).`);
      }
      
      // 3. Middle-dot Check
      if (content.includes('·')) {
        errors.push(`[MIDDLE-DOT] ${file} contains middle-dot '·'. Use it sparingly.`);
      }

      // 4. Fake AI Words
      if (/Elevate|Seamless|Unleash|Next-Gen|Revolutionize/i.test(content)) {
        errors.push(`[FILLER-WORDS] ${file} contains banned AI filler verbs.`);
      }

      // 5. Scroll Cues
      if (/Scroll down|Scroll to explore|↓ scroll/i.test(content)) {
        errors.push(`[SCROLL-CUE] ${file} contains banned scroll cues.`);
      }
      
      // 6. Section Numbers
      if (/>\s*0[1-9]\s*(\/|·)/i.test(content) || />\s*0[1-9]\s*-/i.test(content)) {
         errors.push(`[SECTION-NUMBER] ${file} contains numbered eyebrows like "01 /".`);
      }
      
      // 7. Tailwind Defaults Check (Inter font)
      if (content.includes('font-inter') || content.includes('font-sans') && content.includes('Inter')) {
         errors.push(`[FONT] ${file} uses 'Inter' font. Avoid as default.`);
      }
    }
  }
};

checkDir(path.join(__dirname, 'app'));
checkDir(path.join(__dirname, 'components'));

if (errors.length > 0) {
  console.log("Pre-flight Checklist FAILED with " + errors.length + " warnings/errors:\n");
  console.log(errors.join("\n"));
} else {
  console.log("Pre-flight Checklist PASSED! (Mechanical rules)");
}
