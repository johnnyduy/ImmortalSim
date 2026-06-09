const fs = require('fs');
const path = require('path');
const http = require('https');

const storiesDir = path.join(__dirname, '../data/starting-stories');
const outputDir = path.join(__dirname, '../public/audio');

// Make sure output dir exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const languages = ['vi', 'en'];

// Helper to make request and return buffer
function downloadChunk(text, lang) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    };
    
    http.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download, status: ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Split text into chunks <= 150 chars without breaking words
function splitTextIntoChunks(text, maxLen = 150) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).length > maxLen) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + word : word;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== STARTING VOICE GENERATION ===');
  for (let i = 1; i <= 5; i++) {
    const storyPath = path.join(storiesDir, `story_${i}.json`);
    if (!fs.existsSync(storyPath)) {
      console.warn(`Story file not found: ${storyPath}`);
      continue;
    }
    const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));

    for (const lang of languages) {
      let text = story.description[lang];

      // Replace placeholders with generic terms
      if (lang === 'vi') {
        text = text
          .replace(/{gender_term}/g, 'thiếu niên')
          .replace(/{spiritualRoot}/g, 'linh căn')
          .replace(/{starting_age}/g, 'mười một');
      } else {
        text = text
          .replace(/{gender_term}/g, 'young cultivator')
          .replace(/{spiritualRoot}/g, 'spiritual root')
          .replace(/{starting_age}/g, 'eleven');
      }

      console.log(`\nProcessing story_${i} [${lang}]...`);
      const chunks = splitTextIntoChunks(text, 150);
      console.log(`Split into ${chunks.length} chunks.`);

      const audioBuffers = [];
      let success = true;
      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j];
        console.log(`Downloading chunk ${j + 1}/${chunks.length}: "${chunk.substring(0, 40)}..."`);
        try {
          const buffer = await downloadChunk(chunk, lang);
          audioBuffers.push(buffer);
          // Wait a bit to avoid rate limits
          await delay(600);
        } catch (err) {
          console.error(`Error downloading chunk ${j + 1}:`, err);
          success = false;
          break;
        }
      }

      if (success && audioBuffers.length > 0) {
        const finalBuffer = Buffer.concat(audioBuffers);
        const outputPath = path.join(outputDir, `story_${i}_${lang}.mp3`);
        fs.writeFileSync(outputPath, finalBuffer);
        console.log(`Successfully saved: ${outputPath} (${finalBuffer.length} bytes)`);
      } else {
        console.error(`Failed to generate story_${i} [${lang}]`);
      }
    }
  }
  console.log('\n=== ALL VOICES GENERATED SUCCESSFULLY ===');
}

main().catch(console.error);
