const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminPanel.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const stateTarget = `  const [roots, setRoots] = useState<any[]>(cs.spiritual_roots ?? []);`;
const stateReplacement = `  const [qiRefinementMultiplier, setQiRefinementMultiplier] = useState(cs.qi_refinement_layer_multiplier ?? 1.3);\n  const [roots, setRoots] = useState<any[]>(cs.spiritual_roots ?? []);`;

let foundState = false;
if (content.includes(stateTarget)) {
  console.log('Found state insertion point!');
  content = content.split(stateTarget).join(stateReplacement);
  foundState = true;
} else {
  console.log('State insertion point NOT found!');
}

const submitTarget = `      bottlenecks: bottlenecks.map(b => ({
        ...b,
        threshold: Number(b.threshold),
        next_cult: Number(b.next_cult),
      })),`;

const submitReplacement = `      bottlenecks: bottlenecks.map(b => ({
        ...b,
        threshold: Number(b.threshold),
        next_cult: Number(b.next_cult),
      })),
      qi_refinement_layer_multiplier: Number(qiRefinementMultiplier),`;

let foundSubmit = false;
if (content.includes(submitTarget)) {
  console.log('Found submit insertion point!');
  content = content.split(submitTarget).join(submitReplacement);
  foundSubmit = true;
} else {
  console.log('Submit insertion point NOT found!');
}

const normalized = content.replace(/\r\n/g, '\n');

const jsxTarget = `          </label>
        </div>
      </div>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">🌱 Hệ số Tư chất Linh Căn (Spiritual Roots multipliers)</h4>`;

const jsxReplacement = `          </label>
        </div>
      </div>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">⚡ Quy tắc Tăng trưởng Cảnh giới (Cultivation Progression)</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#847764]">Hệ số nhân tu vi Luyện Khí (x - mỗi tầng sau hơn tầng trước)</span>
            <input
              type="number"
              step="0.05"
              value={qiRefinementMultiplier}
              onChange={(e) => setQiRefinementMultiplier(Number(e.target.value))}
              className="w-full bg-[#14110f] border border-[#3e3328] rounded-sm px-4 py-2 text-lunar outline-none focus:border-[#c5a059]"
              required
            />
          </label>
        </div>
      </div>

      <div className="border border-[#3e3328]/60 p-4 space-y-4 rounded-sm bg-[#100e0c]">
        <h4 className="font-serif text-[#e5c17b] text-base uppercase tracking-widest border-b border-[#3e3328]/40 pb-2">🌱 Hệ số Tư chất Linh Căn (Spiritual Roots multipliers)</h4>`;

const cleanJsxTarget = jsxTarget.replace(/\r\n/g, '\n');
const cleanJsxReplacement = jsxReplacement.replace(/\r\n/g, '\n');

if (normalized.includes(cleanJsxTarget)) {
  console.log('Found JSX insertion point!');
  const updated = normalized.replace(cleanJsxTarget, cleanJsxReplacement);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Successfully updated AdminPanel.tsx!');
} else {
  console.log('JSX insertion point NOT found!');
  if (foundState || foundSubmit) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Wrote partial updates anyway.');
  }
}
