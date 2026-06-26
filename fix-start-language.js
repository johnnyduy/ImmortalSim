const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `                  <div className="flex gap-1.5">
                    {(['en', 'vi'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLanguage(l)}
                        className={\`text-[9px] px-2 py-1 uppercase border transition-colors \${
                          language === l ? 'border-secondary text-secondary bg-secondary/10' : 'border-outline-variant/50 text-on-surface-variant hover:text-white hover:border-outline-variant'
                        }\`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>`;

const replacement = `                  <div className="flex gap-1.5">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Lang)}
                      className="text-[9px] px-2 py-1 uppercase border border-outline-variant/50 bg-transparent text-on-surface hover:border-secondary focus:border-secondary outline-none transition-colors cursor-pointer"
                    >
                      <option value="vi" className="bg-[#1a1512]">VI</option>
                      <option value="en" className="bg-[#1a1512]">EN</option>
                      <option value="zh" className="bg-[#1a1512]">ZH</option>
                    </select>
                  </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
