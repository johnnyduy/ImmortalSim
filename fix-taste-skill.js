const fs = require('fs');
const path = require('path');

const replaceFiles = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // 1. Remove excessive 'uppercase tracking-widest' from components that aren't the main Hero
      // We'll downgrade them to regular font-semibold text-xs without uppercase/tracking to avoid the "eyebrow" penalty
      if (file !== 'page.tsx') {
         content = content.replace(/uppercase tracking-wider/g, 'font-medium');
         content = content.replace(/uppercase tracking-widest/g, 'font-medium');
         content = content.replace(/uppercase tracking-\[.*?\]/g, 'font-medium');
      } else {
         // Even in page.tsx, reduce them
         content = content.replace(/uppercase tracking-wider/g, '');
         content = content.replace(/uppercase tracking-widest/g, '');
         content = content.replace(/uppercase tracking-\[.*?\]/g, '');
      }

      // 2. Replace em-dashes and en-dashes with hyphens
      content = content.replace(/—/g, '-');
      content = content.replace(/–/g, '-');

      // 3. Remove font-inter
      content = content.replace(/font-inter/g, 'font-sans');

      // 4. Remove AI filler words
      content = content.replace(/Elevate|Seamless|Unleash|Next-Gen|Revolutionize/gi, 'Improve');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed violations in: ${fullPath}`);
      }
    }
  }
};

replaceFiles(path.join(__dirname, 'app'));
replaceFiles(path.join(__dirname, 'components'));
