const fs = require('fs');
const path = require('path');

const dirs = [path.join(__dirname, 'components'), path.join(__dirname, 'app')];
const filesToProcess = [];

function findFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      filesToProcess.push(fullPath);
    }
  }
}

dirs.forEach(findFiles);

for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('uiText') && !content.includes('import { uiText }')) {
    const importMatches = [...content.matchAll(/^import .*;$/gm)];
    let index = 0;
    if (importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      index = lastImport.index + lastImport[0].length;
    }
    const depth = file.split(path.sep).length - path.join(__dirname, '').split(path.sep).length - 1;
    const relativePath = depth === 0 ? './lib/i18n' : '../'.repeat(depth) + 'lib/i18n';
    content = content.slice(0, index) + `\nimport { uiText } from '${relativePath}';` + content.slice(index);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed import in ${path.basename(file)}`);
  }
}
