import fs from 'fs';
import path from 'path';

const root = process.cwd();
const json = JSON.parse(fs.readFileSync(path.join(root, 'public', 'data-products.json'), 'utf8'));
let s = fs.readFileSync(path.join(root, 'public', 'js', 'data.js'), 'utf8');
let count = 0;

for (const p of json) {
  const re = new RegExp(`(id:\\s*'${p.id}'[\\s\\S]*?name:\\s*)'[^']*'`, 'm');
  const next = s.replace(re, (full, pre) => {
    count++;
    return `${pre}'${String(p.name).replace(/'/g, "\\'")}'`;
  });
  s = next;
}

fs.writeFileSync(path.join(root, 'public', 'js', 'data.js'), s);
console.log(`data.js name fields synced: ${count}`);
