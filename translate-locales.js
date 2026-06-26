const fs = require('fs');
const path = require('path');
const https = require('https');

async function translateText(text) {
  // text usually has '[ZH-TODO] ' at the start.
  const cleanText = text.replace(/^\[ZH-TODO\]\s*/, '');
  if (!cleanText) return text;
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(cleanText)}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // parsed[0] is an array of translations for each sentence.
          const translated = parsed[0].map(x => x[0]).join('');
          resolve(translated);
        } catch(e) {
          console.error("Parse error for:", cleanText, data);
          resolve(text); // fallback
        }
      });
    }).on('error', (err) => {
      console.error("Request error:", err);
      resolve(text);
    });
  });
}

async function traverseAndTranslate(obj) {
  if (typeof obj === 'string') {
    if (obj.startsWith('[ZH-TODO]')) {
      const trans = await translateText(obj);
      console.log(`Translated: ${obj.substring(0, 30)}... -> ${trans.substring(0, 30)}...`);
      return trans;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await traverseAndTranslate(obj[i]);
    }
    return obj;
  }
  
  if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      obj[key] = await traverseAndTranslate(obj[key]);
    }
    return obj;
  }
  
  return obj;
}

async function run() {
  const files = [
    path.join(__dirname, 'locales/zh/ui.json'),
    path.join(__dirname, 'locales/zh/sects.json'),
    path.join(__dirname, 'locales/zh/events.json')
  ];

  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`Processing ${path.basename(file)}...`);
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const translatedData = await traverseAndTranslate(data);
      fs.writeFileSync(file, JSON.stringify(translatedData, null, 2), 'utf8');
      console.log(`Finished ${path.basename(file)}`);
    }
  }
}

run().catch(console.error);
