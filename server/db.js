const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const config = require('./config');
const dbPath = config.dbPath;
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      guest_name TEXT,
      guest_phone TEXT,
      guest_email TEXT,
      zipcode TEXT,
      address TEXT,
      address_detail TEXT,
      memo TEXT,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'paid',
      status TEXT DEFAULT 'paid',
      subtotal INTEGER,
      shipping INTEGER,
      total INTEGER,
      items TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      images TEXT,
      helpful INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      category TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  migrateUsers();
}

function migrateUsers() {
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!cols.includes('provider')) {
    db.exec("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'email'");
  }
  if (!cols.includes('provider_id')) {
    db.exec('ALTER TABLE users ADD COLUMN provider_id TEXT');
  }
  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_kakao ON users(provider, provider_id) WHERE provider_id IS NOT NULL'
  );
}

function getDefaultSettings() {
  return {
    shop: {
      name: '수산아빠',
      company: '리벤더',
      ceo: '변창현',
      businessNo: '423-39-00727',
      mailOrderNo: '2020-부산북구-0891',
      address: '부산광역시 북구 금곡대로470번길 29',
      email: 'reven9269@naver.com',
      phone: '010 4730 9269',
      hours: '09:00~18:00',
    },
    payment: {
      provider: 'toss',
      testMode: true,
      enabledMethods: ['card', 'transfer', 'kakao'],
      notice: 'PG사 연동 후 실결제가 활성화됩니다. 현재는 테스트 결제입니다.',
    },
    order: {
      shippingFee: 3000,
      freeShippingThreshold: 50000,
      autoConfirmDays: 7,
      returnDays: 7,
    },
    customerCenter: {
      faq: [
        { q: '배송은 며칠 걸리나요?', a: '산지 직송 상품은 1~2일, 일부 지역은 2~3일 소요됩니다.' },
        { q: '반품·교환은 어떻게 하나요?', a: '신선·냉장·냉동 농수산물은 단순 변심 교환·반품이 불가합니다. 파손·변질·오배송 등 품질 이상은 수령 후 24시간 이내 사진과 함께 고객센터로 접수해 주세요.' },
      ],
    },
  };
}

function seedSettings() {
  const defaults = getDefaultSettings();
  const ins = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(defaults).forEach(([k, v]) => ins.run(k, JSON.stringify(v)));
}

function seedAdmin() {
  const row = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (row) return;
  const hash = bcrypt.hashSync('admin1234', 10);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)`
  ).run('admin-1', 'admin@greenharvest.kr', hash, '관리자', '010-0000-0000', 'admin');
}

function seedProductsFromFile() {
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (count > 0) return;
  const jsonPath = path.join(__dirname, '..', 'data', 'products.json');
  if (!fs.existsSync(jsonPath)) return;
  const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const ins = db.prepare('INSERT INTO products (id, data) VALUES (?, ?)');
  list.forEach((p) => ins.run(p.id, JSON.stringify(p)));
}

function seedSampleReviews() {
  const count = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
  if (count > 0) return;
  const samples = [
    {
      id: 'rv-seed-1',
      product_id: 'fr1',
      author: '김*연',
      rating: 5,
      title: '당도 최고',
      content: '배송 빠르고 감귤이 신선해요. 재구매할게요.',
      images: '[]',
      helpful: 12,
      verified: 1,
    },
    {
      id: 'rv-seed-2',
      product_id: 'sf1',
      author: '이*수',
      rating: 5,
      title: '회 fresh',
      content: '포장 꼼꼼하고 싱싱합니다.',
      images: '[]',
      helpful: 8,
      verified: 1,
    },
  ];
  const ins = db.prepare(
    `INSERT INTO reviews (id, product_id, author, rating, title, content, images, helpful, verified) VALUES (?,?,?,?,?,?,?,?,?)`
  );
  samples.forEach((r) =>
    ins.run(r.id, r.product_id, r.author, r.rating, r.title, r.content, r.images, r.helpful, r.verified)
  );
}

function initDb() {
  initSchema();
  seedSettings();
  seedAdmin();
  seedProductsFromFile();
  seedSampleReviews();
}

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

module.exports = { db, initDb, getSetting, setSetting, getDefaultSettings };
