const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* dotenv optional */
}
const config = require('./config');
const { db, initDb, getSetting, setSetting } = require('./db');
const { getKakaoConfig, buildAuthorizeUrl, exchangeCodeForToken, fetchKakaoProfile } = require('./kakao');

const JWT_SECRET = config.jwtSecret;
const PORT = config.port;
const kakaoConfig = getKakaoConfig(config.siteUrl);

initDb();

const app = express();
if (config.trustProxy) app.set('trust proxy', 1);

app.use(
  cors({
    origin: config.isProduction
      ? [config.siteUrl, config.siteUrl.replace('https://', 'https://www.')]
      : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.startsWith('/server/') ||
    p === '/.env' ||
    p.endsWith('.db') ||
    p.includes('package-lock') ||
    p.startsWith('/node_modules/')
  ) {
    return res.status(404).end();
  }
  next();
});

if (config.isProduction) {
  app.use((req, res, next) => {
    const proto = req.get('x-forwarded-proto');
    const host = req.get('host') || '';
    if (proto === 'http' && !host.includes('localhost')) {
      return res.redirect(301, config.siteUrl + req.originalUrl);
    }
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, site: config.siteUrl, env: config.nodeEnv });
});

app.get('/api/site', (req, res) => {
  res.json({
    name: config.siteName,
    url: config.siteUrl,
    domain: 'susanfather.com',
  });
});

app.use(express.static(path.join(__dirname, '..')));

function tokenFrom(req) {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

function authRequired(req, res, next) {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '세션이 만료되었습니다.' });
  }
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    next();
  });
}

function maskEmail(email) {
  const [a, b] = email.split('@');
  return a.slice(0, 2) + '***@' + b;
}

function mapReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    author: row.author,
    rating: row.rating,
    date: (row.created_at || '').slice(0, 10),
    title: row.title,
    content: row.content,
    images: JSON.parse(row.images || '[]'),
    helpful: row.helpful,
    verified: !!row.verified,
  };
}

function userPurchasedProduct(userId, productId) {
  const rows = db.prepare('SELECT items FROM orders WHERE user_id = ?').all(userId);
  for (const row of rows) {
    try {
      const items = JSON.parse(row.items || '[]');
      if (items.some((i) => i.productId === productId)) return true;
    } catch {
      /* */
    }
  }
  return false;
}

function userReviewedProduct(userId, productId) {
  return !!db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(userId, productId);
}

function issueUserToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || '',
    role: user.role,
    provider: user.provider || 'email',
  };
}

function redirectAuthError(res, message) {
  const url = `/kakao-callback.html?error=${encodeURIComponent(message)}`;
  res.redirect(url);
}

function findOrCreateKakaoUser(profile) {
  const { kakaoId, nickname, email } = profile;
  let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get('kakao', kakaoId);
  if (user) return user;

  const userEmail = email || `kakao_${kakaoId}@kakao.local`;
  const emailTaken = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail);
  if (emailTaken) {
    throw new Error('이미 가입된 이메일입니다. 이메일 로그인을 이용해 주세요.');
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(uuidv4(), 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, phone, role, provider, provider_id) VALUES (?,?,?,?,?,?,?,?)'
  ).run(id, userEmail, hash, nickname, '', 'user', 'kakao', kakaoId);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/* ── Auth ── */
app.get('/api/auth/kakao/status', (req, res) => {
  res.json({ enabled: kakaoConfig.enabled, redirectUri: kakaoConfig.redirectUri });
});

app.get('/api/auth/kakao', (req, res) => {
  if (!kakaoConfig.enabled) {
    return res.status(503).send('카카오 로그인이 설정되지 않았습니다. KAKAO_REST_API_KEY를 설정해 주세요.');
  }
  res.redirect(buildAuthorizeUrl(kakaoConfig));
});

app.get('/api/auth/kakao/callback', async (req, res) => {
  if (!kakaoConfig.enabled) return redirectAuthError(res, '카카오 로그인 설정이 없습니다.');
  const { code, error, error_description } = req.query;
  if (error) return redirectAuthError(res, error_description || error);
  if (!code) return redirectAuthError(res, '카카오 인증 코드가 없습니다.');

  try {
    const accessToken = await exchangeCodeForToken(code, kakaoConfig);
    const profile = await fetchKakaoProfile(accessToken);
    const user = findOrCreateKakaoUser(profile);
    const token = issueUserToken(user);
    const userJson = encodeURIComponent(JSON.stringify(publicUser(user)));
    res.redirect(`/kakao-callback.html?token=${encodeURIComponent(token)}&user=${userJson}`);
  } catch (err) {
    redirectAuthError(res, err.message || '카카오 로그인 처리 중 오류');
  }
});
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: '필수 항목을 입력해 주세요.' });
  if (password.length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password_hash, name, phone, provider) VALUES (?,?,?,?,?,?)').run(
    id,
    email.toLowerCase(),
    hash,
    name,
    phone || '',
    'email'
  );
  const token = jwt.sign({ id, email: email.toLowerCase(), name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, email: email.toLowerCase(), name, phone, role: 'user' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  if (user.provider === 'kakao') {
    return res.status(400).json({ error: '카카오로 가입한 계정입니다. 카카오 로그인을 이용해 주세요.' });
  }
  if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  const token = issueUserToken(user);
  res.json({
    token,
    user: publicUser(user),
  });
});

app.post('/api/auth/find-email', (req, res) => {
  const { name, phone } = req.body;
  const user = db.prepare('SELECT email FROM users WHERE name = ? AND phone = ?').get(name, phone);
  if (!user) return res.json({ found: false, message: '일치하는 회원 정보가 없습니다.' });
  res.json({ found: true, email: maskEmail(user.email) });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: '비밀번호 8자 이상' });
  const user = db.prepare('SELECT id, provider FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user) return res.status(404).json({ error: '가입된 이메일이 없습니다.' });
  if (user.provider === 'kakao') {
    return res.status(400).json({ error: '카카오로 가입한 계정은 카카오 로그인을 이용해 주세요.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true, message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.' });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, email, name, phone, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

/* ── Settings (public shop info) ── */
app.get('/api/settings/shop', (req, res) => {
  res.json({
    shop: getSetting('shop'),
    customerCenter: getSetting('customerCenter'),
    order: getSetting('order'),
  });
});

app.get('/api/settings/payment-public', (req, res) => {
  const p = getSetting('payment');
  res.json({ provider: p?.provider, testMode: p?.testMode, notice: p?.notice });
});

/* ── Products ── */
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT data FROM products').all();
  if (rows.length) return res.json(rows.map((r) => JSON.parse(r.data)));
  try {
    const data = require('../js/data.js');
    return res.json(data.PRODUCTS);
  } catch {
    res.json([]);
  }
});

/* ── Reviews ── */
app.get('/api/reviews', (req, res) => {
  const { productId } = req.query;
  let rows;
  if (productId) {
    rows = db
      .prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY helpful DESC, created_at DESC')
      .all(productId);
  } else {
    rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 200').all();
  }
  res.json(rows.map(mapReview));
});

app.get('/api/reviews/can-write', authRequired, (req, res) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ error: '상품 정보가 필요합니다.' });
  if (userReviewedProduct(req.user.id, productId)) {
    return res.json({ canWrite: false, alreadyReviewed: true, reason: 'already_reviewed' });
  }
  if (!userPurchasedProduct(req.user.id, productId)) {
    return res.json({ canWrite: false, alreadyReviewed: false, reason: 'not_purchased' });
  }
  res.json({ canWrite: true, alreadyReviewed: false });
});

app.post('/api/reviews', authRequired, (req, res) => {
  const { productId, rating, title, content, images } = req.body;
  if (!productId || !rating || !content) return res.status(400).json({ error: '필수 항목을 입력해 주세요.' });
  if (userReviewedProduct(req.user.id, productId)) {
    return res.status(409).json({ error: '이미 리뷰를 작성하셨습니다.' });
  }
  if (!userPurchasedProduct(req.user.id, productId)) {
    return res.status(403).json({ error: '상품을 구매한 고객만 리뷰를 작성할 수 있습니다.' });
  }
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  const author = (user?.name || '회원').slice(0, 1) + '*';
  const id = 'rv-' + uuidv4().slice(0, 8);
  db.prepare(
    `INSERT INTO reviews (id, product_id, user_id, author, rating, title, content, images, verified) VALUES (?,?,?,?,?,?,?,?,1)`
  ).run(id, productId, req.user.id, author, rating, title || '', content, JSON.stringify(images || []));
  res.json({ ok: true, review: mapReview(db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)) });
});

/* ── Orders ── */
app.post('/api/orders', (req, res) => {
  const body = req.body;
  const orderSettings = getSetting('order') || {};
  const id = 'GH' + Date.now().toString().slice(-8);
  const token = tokenFrom(req);
  let userId = null;
  if (token) {
    try {
      userId = jwt.verify(token, JWT_SECRET).id;
    } catch {
      /* guest */
    }
  }
  db.prepare(
    `INSERT INTO orders (id, user_id, guest_name, guest_phone, guest_email, zipcode, address, address_detail, memo, payment_method, subtotal, shipping, total, items, status, payment_status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    userId,
    body.name,
    body.phone,
    body.email || '',
    body.zipcode || '',
    body.address || '',
    body.addressDetail || '',
    body.memo || '',
    body.payment || 'card',
    body.subtotal,
    body.shipping,
    body.total,
    JSON.stringify(body.items || []),
    'paid',
    getSetting('payment')?.testMode ? 'test_paid' : 'paid'
  );
  res.json({ ok: true, orderId: id, testMode: getSetting('payment')?.testMode });
});

app.get('/api/orders/my', authRequired, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(rows.map((o) => ({ ...o, items: JSON.parse(o.items || '[]') })));
});

/* ── Inquiries ── */
app.post('/api/inquiries', (req, res) => {
  const { name, email, phone, category, title, content } = req.body;
  if (!name || !email || !title || !content) return res.status(400).json({ error: '필수 항목을 입력해 주세요.' });
  const id = uuidv4();
  let userId = null;
  const token = tokenFrom(req);
  if (token) {
    try {
      userId = jwt.verify(token, JWT_SECRET).id;
    } catch {
      /* */
    }
  }
  db.prepare(
    `INSERT INTO inquiries (id, user_id, name, email, phone, category, title, content) VALUES (?,?,?,?,?,?,?,?)`
  ).run(id, userId, name, email, phone || '', category || '기타', title, content);
  res.json({ ok: true, message: '문의가 접수되었습니다.' });
});

/* ── Admin ── */
app.get('/api/admin/stats', adminRequired, (req, res) => {
  res.json({
    users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c,
    orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    reviews: db.prepare('SELECT COUNT(*) as c FROM reviews').get().c,
    inquiries: db.prepare("SELECT COUNT(*) as c FROM inquiries WHERE status = 'pending'").get().c,
  });
});

app.get('/api/admin/settings', adminRequired, (req, res) => {
  res.json({
    shop: getSetting('shop'),
    payment: getSetting('payment'),
    order: getSetting('order'),
    customerCenter: getSetting('customerCenter'),
  });
});

app.put('/api/admin/settings/:key', adminRequired, (req, res) => {
  const { key } = req.params;
  if (!['shop', 'payment', 'order', 'customerCenter'].includes(key)) {
    return res.status(400).json({ error: '잘못된 설정 키' });
  }
  setSetting(key, req.body);
  res.json({ ok: true });
});

app.get('/api/admin/orders', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(rows.map((o) => ({ ...o, items: JSON.parse(o.items || '[]') })));
});

app.patch('/api/admin/orders/:id', adminRequired, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/reviews', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(rows.map(mapReview));
});

app.delete('/api/admin/reviews/:id', adminRequired, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/inquiries', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json(rows);
});

app.patch('/api/admin/inquiries/:id', adminRequired, (req, res) => {
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(req.body.status || 'done', req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/users', adminRequired, (req, res) => {
  const rows = db
    .prepare('SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`[${config.nodeEnv}] ${config.siteName} — ${config.siteUrl} (port ${PORT})`);
  if (!config.isProduction) {
    console.log('로컬: http://localhost:' + PORT);
    console.log('관리자: admin@greenharvest.kr / admin1234');
  }
  if (kakaoConfig.enabled) {
    console.log('카카오 Redirect:', kakaoConfig.redirectUri);
  }
});
