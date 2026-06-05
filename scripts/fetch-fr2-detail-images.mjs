/**
 * 문경 사과(fr2) 상세페이지용 스톡 이미지 다운로드
 * 실행: node scripts/fetch-fr2-detail-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'images', 'products', 'detail', 'fr2');

/** Pexels — 참고 쇼핑몰과 다른 연출·구도 */
const FILES = [
  ['orchard-hill.jpg', 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=960'],
  ['basket-fresh.jpg', 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=960'],
  ['apple-cut.jpg', 'https://images.pexels.com/photos/3936119/pexels-photo-3936119.jpeg?auto=compress&cs=tinysrgb&w=960'],
  ['branch-red.jpg', 'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=960'],
  ['crate-harvest.jpg', 'https://images.pexels.com/photos/4883149/pexels-photo-4883149.jpeg?auto=compress&cs=tinysrgb&w=960'],
  ['box-pack.jpg', 'https://images.pexels.com/photos/5945842/pexels-photo-5945842.jpeg?auto=compress&cs=tinysrgb&w=960'],
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, url] of FILES) {
    const dest = path.join(OUT, name);
    process.stdout.write(`${name} … `);
    await download(url, dest);
    console.log('OK');
  }
  console.log(`\n저장: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
