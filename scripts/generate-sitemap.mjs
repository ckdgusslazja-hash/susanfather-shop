/**
 * sitemap.xml 생성 — node scripts/generate-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SITE = 'https://susanfather.com';
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/shop-info', changefreq: 'monthly', priority: '0.6' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/customer-center', changefreq: 'monthly', priority: '0.5' },
];

const productsPath = path.join(root, 'public', 'data-products.json');
let products = [];
if (fs.existsSync(productsPath)) {
  products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
}

const urls = [
  ...staticPages,
  ...products.map((p) => ({
    loc: `/p/${p.id}`,
    changefreq: 'weekly',
    priority: '0.8',
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const out = path.join(root, 'public', 'sitemap.xml');
fs.writeFileSync(out, xml, 'utf8');
console.log(`sitemap.xml — URL ${urls.length}개 (${products.length}개 상품)`);
