const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/page.tsx');
let lines = fs.readFileSync(file, 'utf8').split('\n');

const replacement = `                  <div className="flex gap-1.5 w-16">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Lang)}
                      className="w-full text-[9px] px-2 py-1 uppercase border border-outline-variant/50 bg-transparent text-on-surface hover:border-secondary focus:border-secondary outline-none transition-colors cursor-pointer"
                    >
                      <option value="vi" className="bg-[#1a1512]">VI</option>
                      <option value="en" className="bg-[#1a1512]">EN</option>
                      <option value="zh" className="bg-[#1a1512]">ZH</option>
                    </select>
                  </div>`;

// Lines are 1-indexed in view_file. We want to replace lines 3030 to 3043.
// In 0-indexed array, this is index 3029 to 3042.
// Delete 14 lines starting at index 3029, and insert the replacement.
lines.splice(3029, 14, replacement);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
