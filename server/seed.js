const fs = require('fs');
const path = require('path');
const { db, initDb } = require('./db');

const data = require('../js/data.js');
const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'products.json'), JSON.stringify(data.PRODUCTS, null, 2));

initDb();
const ins = db.prepare('INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)');
data.PRODUCTS.forEach((p) => ins.run(p.id, JSON.stringify(p)));

const revIns = db.prepare(
  `INSERT OR IGNORE INTO reviews (id, product_id, user_id, author, rating, title, content, images, helpful, verified, created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?)`
);
data.REVIEWS.forEach((r) => {
  revIns.run(
    r.id,
    r.productId,
    null,
    r.author,
    r.rating,
    r.title,
    r.content,
    JSON.stringify(r.images || []),
    r.helpful || 0,
    r.verified ? 1 : 0,
    r.date || new Date().toISOString().slice(0, 10)
  );
});

console.log(`상품 ${data.PRODUCTS.length}개, 리뷰 ${data.REVIEWS.length}개 시드 완료`);
