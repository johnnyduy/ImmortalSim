const fs = require('fs');
const path = require('path');

const filesToFix = [
  path.join(__dirname, 'components', 'MountainExploration.tsx'),
  path.join(__dirname, 'components', 'TimeGearPanel.tsx')
];

for (const fullPath of filesToFix) {
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace Inter import with Outfit
    content = content.replace(/import\s+{\s*Inter\s*}\s+from\s+['"]next\/font\/google['"]/g, "import { Outfit } from 'next/font/google'");
    content = content.replace(/const inter = Inter\([^)]+\);/g, "const outfit = Outfit({ subsets: ['latin'] });");
    content = content.replace(/className=\{.*?inter\.className.*?\}/g, (match) => match.replace('inter.className', 'outfit.className'));
    content = content.replace(/\binter\b/g, 'outfit');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Replaced Inter with Outfit in ${fullPath}`);
  }
}
