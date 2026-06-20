const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app', 'page.tsx');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/minAge:\s*0,/g, "minRealm: 'Mortal',");
code = code.replace(/maxAge:\s*9999,/g, "");

fs.writeFileSync(file, code);
console.log('page.tsx updated');
