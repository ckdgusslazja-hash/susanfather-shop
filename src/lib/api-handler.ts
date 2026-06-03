import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import type { User, Review, Order, Inquiry, UserAddress, Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { jwtSecret, siteUrl, siteName, nodeEnv } from './config';
import {
  getKakaoConfig,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchKakaoProfile,
} from './kakao';
import {
  confirmTossPayment,
  getTossKeys,
  isPaymentEnabled,
  type PaymentSetting,
} from './toss-payments';

interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

type OrderItem = { productId?: string };

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function redirect(location: string, request: Request, status = 302): Response {
  return Response.redirect(new URL(location, request.url).toString(), status);
}

function tokenFrom(request: Request): string | null {
  const h = request.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
}

function verifyToken(request: Request): JwtPayload | null {
  const token = tokenFrom(request);
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

async function parseBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

function maskEmail(email: string): string {
  const [a, b] = email.split('@');
  return a.slice(0, 2) + '***@' + b;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const s = d instanceof Date ? d.toISOString() : String(d);
  return s.slice(0, 10);
}

function parseImages(images: unknown): unknown[] {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      return JSON.parse(images) as unknown[];
    } catch {
      return [];
    }
  }
  return [];
}

function mapReview(row: Review) {
  return {
    id: row.id,
    productId: row.productId,
    author: row.author,
    rating: row.rating,
    date: formatDate(row.createdAt),
    title: row.title,
    content: row.content,
    images: parseImages(row.images),
    helpful: row.helpful,
    verified: !!row.verified,
  };
}

function mapOrder(o: Order) {
  return {
    id: o.id,
    user_id: o.userId,
    guest_name: o.guestName,
    guest_phone: o.guestPhone,
    guest_email: o.guestEmail,
    zipcode: o.zipcode,
    address: o.address,
    address_detail: o.addressDetail,
    memo: o.memo,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    status: o.status,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    items: parseImages(o.items),
    created_at: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
  };
}

function mapInquiry(i: Inquiry) {
  return {
    id: i.id,
    user_id: i.userId,
    name: i.name,
    email: i.email,
    phone: i.phone,
    category: i.category,
    title: i.title,
    content: i.content,
    status: i.status,
    created_at: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
  };
}

function mapUserAddress(a: UserAddress) {
  return {
    id: a.id,
    label: a.label,
    recipient_name: a.recipientName,
    phone: a.phone,
    zipcode: a.zipcode,
    address: a.address,
    address_detail: a.addressDetail,
    is_default: a.isDefault,
  };
}

async function clearUserDefaultAddresses(userId: string) {
  await prisma.userAddress.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
}

function mapAdminUser(u: Pick<User, 'id' | 'email' | 'name' | 'phone' | 'role' | 'createdAt'>) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    created_at: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  };
}

async function getSetting(key: string): Promise<unknown> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

function defaultSettingsBundle() {
  return {
    shop: {
      name: siteName,
      company: '리벤더',
      ceo: '변창현',
      businessNo: '423-39-00727',
      mailOrderNo: '2020-부산북구-0891',
      address: '부산광역시 북구 금곡대로470번길 29',
      email: 'reven9269@naver.com',
      phone: '010 4730 9269',
      hours: '09:00~18:00',
    },
    customerCenter: {
      faq: [
        { q: '배송은 며칠 걸리나요?', a: '산지 직송 상품은 1~2일, 일부 지역은 2~3일 소요됩니다.' },
        { q: '반품은 어떻게 하나요?', a: '수령 후 7일 이내 고객센터로 문의해 주세요.' },
      ],
    },
    order: {
      shippingFee: 3000,
      freeShippingThreshold: 50000,
      autoConfirmDays: 7,
      returnDays: 7,
    },
    announcements: getDefaultAnnouncements(),
  };
}

function getDefaultAnnouncements() {
  return [
    {
      id: 'ann-1',
      title: '산지직송 신선 배송 안내',
      body: '주문하신 농수산물은 산지에서 직접 포장·발송됩니다. 제주·도서 지역은 1~2일 추가 소요될 수 있습니다.',
      createdAt: '2026-06-01T09:00:00.000Z',
    },
    {
      id: 'ann-2',
      title: '5만원 이상 무료배송',
      body: '5만원 이상 결제 시 배송비가 무료입니다. 햅쌀·곡물 등 일부 상품은 상품별 무료배송이 적용됩니다.',
      createdAt: '2026-06-02T09:00:00.000Z',
    },
  ];
}

function mapAnnouncement(row: { id: string; title: string; body?: string; createdAt: string }) {
  return {
    id: `ann-${row.id}`,
    type: 'notice',
    title: row.title,
    body: row.body || '',
    link: 'home',
    createdAt: row.createdAt,
  };
}

const ORDER_STATUS_NOTICES: Record<string, { title: string; body: (id: string) => string }> = {
  awaiting_deposit: {
    title: '입금 대기',
    body: (id) => `주문번호 ${id} — 입금 확인 후 발송됩니다.`,
  },
  pending: {
    title: '결제 진행 중',
    body: (id) => `주문번호 ${id} — 결제를 완료해 주세요.`,
  },
  paid: {
    title: '결제 완료',
    body: (id) => `주문번호 ${id} — 결제가 완료되었습니다.`,
  },
  preparing: {
    title: '상품 준비 중',
    body: (id) => `주문번호 ${id} — 상품을 준비하고 있습니다.`,
  },
  shipping: {
    title: '배송 시작',
    body: (id) => `주문번호 ${id} — 배송이 시작되었습니다.`,
  },
  done: {
    title: '배송 완료',
    body: (id) => `주문번호 ${id} — 배송이 완료되었습니다.`,
  },
  cancelled: {
    title: '주문 취소',
    body: (id) => `주문번호 ${id} — 주문이 취소되었습니다.`,
  },
};

function mapOrderNotification(order: Order) {
  const status = order.status || 'paid';
  const meta = ORDER_STATUS_NOTICES[status] || ORDER_STATUS_NOTICES.paid;
  return {
    id: `order-${order.id}-${status}`,
    type: 'order',
    title: meta.title,
    body: meta.body(order.id),
    link: 'mypage',
    orderId: order.id,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
  };
}

async function setSetting(key: string, value: unknown): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  });
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || '',
    role: user.role,
    provider: user.provider || 'email',
  };
}

function issueUserToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

function redirectAuthError(message: string, request: Request): Response {
  return redirect(`/kakao-callback.html?error=${encodeURIComponent(message)}`, request);
}

async function userPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const rows = await prisma.order.findMany({
    where: { userId },
    select: { items: true },
  });
  for (const row of rows) {
    const items = parseImages(row.items) as OrderItem[];
    if (items.some((i) => i.productId === productId)) return true;
  }
  return false;
}

async function userReviewedProduct(userId: string, productId: string): Promise<boolean> {
  const row = await prisma.review.findFirst({
    where: { userId, productId },
    select: { id: true },
  });
  return !!row;
}

async function findOrCreateKakaoUser(profile: {
  kakaoId: string;
  nickname: string;
  email: string | null;
}): Promise<User> {
  const { kakaoId, nickname, email } = profile;
  let user = await prisma.user.findFirst({
    where: { provider: 'kakao', providerId: kakaoId },
  });
  if (user) return user;

  const userEmail = email || `kakao_${kakaoId}@kakao.local`;
  const emailTaken = await prisma.user.findUnique({ where: { email: userEmail } });
  if (emailTaken) {
    throw new Error('이미 가입된 이메일입니다. 이메일 로그인을 이용해 주세요.');
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(uuidv4(), 10);
  user = await prisma.user.create({
    data: {
      id,
      email: userEmail,
      passwordHash: hash,
      name: nickname,
      phone: '',
      role: 'user',
      provider: 'kakao',
      providerId: kakaoId,
    },
  });
  return user;
}

async function loadProductsFallback(): Promise<unknown[]> {
  const jsonPath = path.join(process.cwd(), 'data', 'products.json');
  if (!fs.existsSync(jsonPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as unknown[];
  } catch {
    return [];
  }
}

const kakaoConfig = getKakaoConfig(siteUrl);

export async function handleApi(request: Request, pathSegments: string[]): Promise<Response> {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const [a, b, c, d] = pathSegments;

  /* ── Health & site ── */
  if (method === 'GET' && a === 'health') {
    let db = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }
    return json({ ok: true, site: siteUrl, env: nodeEnv, db });
  }

  if (method === 'GET' && a === 'site') {
    return json({
      name: siteName,
      url: siteUrl,
      domain: 'susanfather.com',
    });
  }

  /* ── Auth ── */
  if (a === 'auth') {
    if (method === 'GET' && b === 'kakao' && c === 'status') {
      return json({ enabled: kakaoConfig.enabled, redirectUri: kakaoConfig.redirectUri });
    }

    if (method === 'GET' && b === 'kakao' && !c) {
      if (!kakaoConfig.enabled) {
        return text('카카오 로그인이 설정되지 않았습니다. KAKAO_REST_API_KEY를 설정해 주세요.', 503);
      }
      return Response.redirect(buildAuthorizeUrl(kakaoConfig), 302);
    }

    if (method === 'GET' && b === 'kakao' && c === 'callback') {
      if (!kakaoConfig.enabled) return redirectAuthError('카카오 로그인 설정이 없습니다.', request);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');
      if (error) return redirectAuthError(errorDescription || error, request);
      if (!code) return redirectAuthError('카카오 인증 코드가 없습니다.', request);

      try {
        const accessToken = await exchangeCodeForToken(code, kakaoConfig);
        const profile = await fetchKakaoProfile(accessToken);
        const user = await findOrCreateKakaoUser(profile);
        const token = issueUserToken(user);
        const userJson = encodeURIComponent(JSON.stringify(publicUser(user)));
        return redirect(
          `/kakao-callback.html?token=${encodeURIComponent(token)}&user=${userJson}`,
          request
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : '카카오 로그인 처리 중 오류';
        return redirectAuthError(message, request);
      }
    }

    if (method === 'POST' && b === 'signup') {
      const body = await parseBody<{
        email?: string;
        password?: string;
        name?: string;
        phone?: string;
      }>(request);
      const { email, password, name, phone } = body;
      if (!email || !password || !name) {
        return json({ error: '필수 항목을 입력해 주세요.' }, 400);
      }
      if (password.length < 8) {
        return json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400);
      }
      try {
        const normalized = email.toLowerCase();
        const exists = await prisma.user.findUnique({ where: { email: normalized } });
        if (exists) return json({ error: '이미 가입된 이메일입니다.' }, 409);

        const id = uuidv4();
        const hash = bcrypt.hashSync(password, 10);
        await prisma.user.create({
          data: {
            id,
            email: normalized,
            passwordHash: hash,
            name,
            phone: phone || '',
            provider: 'email',
          },
        });
        const token = jwt.sign(
          { id, email: normalized, name, role: 'user' },
          jwtSecret,
          { expiresIn: '7d' }
        );
        return json({ token, user: { id, email: normalized, name, phone, role: 'user' } });
      } catch {
        return json({ error: '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 503);
      }
    }

    if (method === 'POST' && b === 'login') {
      const body = await parseBody<{ email?: string; password?: string }>(request);
      const user = await prisma.user.findUnique({
        where: { email: (body.email || '').toLowerCase() },
      });
      if (!user) {
        return json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
      }
      if (user.provider === 'kakao') {
        return json({ error: '다른 방식으로 가입한 계정입니다. 고객센터로 문의해 주세요.' }, 400);
      }
      if (!user.passwordHash || !bcrypt.compareSync(body.password || '', user.passwordHash)) {
        return json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
      }
      return json({ token: issueUserToken(user), user: publicUser(user) });
    }

    if (method === 'POST' && b === 'find-email') {
      const body = await parseBody<{ name?: string; phone?: string }>(request);
      const user = await prisma.user.findFirst({
        where: { name: body.name, phone: body.phone },
        select: { email: true },
      });
      if (!user) return json({ found: false, message: '일치하는 회원 정보가 없습니다.' });
      return json({ found: true, email: maskEmail(user.email) });
    }

    if (method === 'POST' && b === 'reset-password') {
      const body = await parseBody<{ email?: string; newPassword?: string }>(request);
      if (!body.newPassword || body.newPassword.length < 8) {
        return json({ error: '비밀번호 8자 이상' }, 400);
      }
      const user = await prisma.user.findUnique({
        where: { email: (body.email || '').toLowerCase() },
      });
      if (!user) return json({ error: '가입된 이메일이 없습니다.' }, 404);
      if (user.provider === 'kakao') {
        return json({ error: '다른 방식으로 가입한 계정입니다. 고객센터로 문의해 주세요.' }, 400);
      }
      const hash = bcrypt.hashSync(body.newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
      return json({ ok: true, message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.' });
    }

    if (method === 'POST' && b === 'change-password') {
      const auth = verifyToken(request);
      if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);
      const body = await parseBody<{ currentPassword?: string; newPassword?: string }>(request);
      if (!body.currentPassword || !body.newPassword) {
        return json({ error: '현재 비밀번호와 새 비밀번호를 입력해 주세요.' }, 400);
      }
      if (body.newPassword.length < 8) {
        return json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, 400);
      }
      if (body.currentPassword === body.newPassword) {
        return json({ error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' }, 400);
      }
      const user = await prisma.user.findUnique({ where: { id: auth.id } });
      if (!user) return json({ error: '로그인이 필요합니다.' }, 401);
      if (user.provider === 'kakao') {
        return json({ error: '다른 방식으로 가입한 계정입니다. 고객센터로 문의해 주세요.' }, 400);
      }
      if (!user.passwordHash || !bcrypt.compareSync(body.currentPassword, user.passwordHash)) {
        return json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 401);
      }
      const hash = bcrypt.hashSync(body.newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
      return json({ ok: true, message: '비밀번호가 변경되었습니다.' });
    }

    if (method === 'GET' && b === 'me') {
      const auth = verifyToken(request);
      if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);
      const user = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
      if (!user) return json({ error: '로그인이 필요합니다.' }, 401);
      return json({ user });
    }
  }

  /* ── Notifications ── */
  if (a === 'notifications' && method === 'GET' && !b) {
    const auth = verifyToken(request);
    const rawAnnouncements =
      (await getSetting('announcements')) ?? defaultSettingsBundle().announcements;
    const announcements = (Array.isArray(rawAnnouncements) ? rawAnnouncements : []).map(
      (row: { id: string; title: string; body?: string; createdAt: string }) =>
        mapAnnouncement(row)
    );

    const items = [...announcements];

    if (auth) {
      const [orders, inquiries] = await Promise.all([
        prisma.order.findMany({
          where: { userId: auth.id },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        prisma.inquiry.findMany({
          where: { userId: auth.id, status: 'done' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      orders.forEach((order) => items.push(mapOrderNotification(order)));
      inquiries.forEach((inq) => {
        items.push({
          id: `inquiry-${inq.id}`,
          type: 'inquiry',
          title: '문의 답변 완료',
          body: inq.title,
          link: 'mypage',
          createdAt: inq.createdAt instanceof Date ? inq.createdAt.toISOString() : String(inq.createdAt),
        });
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return json(items.slice(0, 50));
  }

  /* ── Settings ── */
  if (a === 'settings') {
    if (method === 'GET' && b === 'shop') {
      const defaults = defaultSettingsBundle();
      const shop = (await getSetting('shop')) ?? defaults.shop;
      const customerCenter = (await getSetting('customerCenter')) ?? defaults.customerCenter;
      const order = (await getSetting('order')) ?? defaults.order;
      return json({ shop, customerCenter, order });
    }
    if (method === 'GET' && b === 'payment-public') {
      const p = (await getSetting('payment')) as PaymentSetting | null;
      const testMode = p?.testMode ?? false;
      const keys = getTossKeys(testMode);
      const enabled = isPaymentEnabled(p);
      return json({
        provider: p?.provider ?? 'toss',
        testMode,
        enabled,
        clientKey: keys?.clientKey ?? null,
        notice: p?.notice ?? (enabled ? '토스페이먼츠로 안전하게 결제됩니다.' : '결제 설정을 확인 중입니다.'),
        enabledMethods: p?.enabledMethods ?? ['card', 'transfer', 'kakao'],
        bankAccount: p?.bankAccount ?? {
          bank: '국민은행',
          number: '문의: 010-4730-9269',
          holder: '리벤더(변창현)',
        },
      });
    }
  }

  /* ── Payments (Toss) ── */
  if (a === 'payments') {
    type OrderBody = {
      name?: string;
      phone?: string;
      email?: string;
      zipcode?: string;
      address?: string;
      addressDetail?: string;
      memo?: string;
      payment?: string;
      subtotal?: number;
      shipping?: number;
      total?: number;
      items?: unknown[];
      orderName?: string;
    };

    async function resolveUserId(request: Request): Promise<string | null> {
      const token = tokenFrom(request);
      if (!token) return null;
      try {
        return (jwt.verify(token, jwtSecret) as JwtPayload).id;
      } catch {
        return null;
      }
    }

    function makeOrderId() {
      return 'GH' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 6);
    }

    if (method === 'POST' && b === 'prepare') {
      const body = await parseBody<OrderBody>(request);
      if (!body.name || !body.phone || !body.address || !body.total) {
        return json({ error: '주문 정보를 확인해 주세요.' }, 400);
      }

      const paymentSetting = (await getSetting('payment')) as PaymentSetting | null;
      const testMode = paymentSetting?.testMode ?? false;
      const paymentMethod = body.payment || 'card';
      const userId = await resolveUserId(request);
      const id = makeOrderId();

      if (paymentMethod === 'transfer') {
        await prisma.order.create({
          data: {
            id,
            userId,
            guestName: body.name,
            guestPhone: body.phone,
            guestEmail: body.email || '',
            zipcode: body.zipcode || '',
            address: body.address || '',
            addressDetail: body.addressDetail || '',
            memo: body.memo || '',
            paymentMethod,
            subtotal: body.subtotal,
            shipping: body.shipping,
            total: body.total,
            items: (body.items || []) as Prisma.InputJsonValue,
            status: 'awaiting_deposit',
            paymentStatus: 'awaiting_deposit',
          },
        });
        return json({
          ok: true,
          orderId: id,
          transfer: true,
          bankAccount: paymentSetting?.bankAccount ?? {
            bank: '국민은행',
            number: '문의: 010-4730-9269',
            holder: '리벤더(변창현)',
          },
        });
      }

      const keys = getTossKeys(testMode);
      if (!keys) {
        return json({ error: '결제 시스템 키가 설정되지 않았습니다. Vercel 환경변수 TOSS_CLIENT_KEY, TOSS_SECRET_KEY를 확인해 주세요.' }, 503);
      }

      await prisma.order.create({
        data: {
          id,
          userId,
          guestName: body.name,
          guestPhone: body.phone,
          guestEmail: body.email || '',
          zipcode: body.zipcode || '',
          address: body.address || '',
          addressDetail: body.addressDetail || '',
          memo: body.memo || '',
          paymentMethod,
          subtotal: body.subtotal,
          shipping: body.shipping,
          total: body.total,
          items: (body.items || []) as Prisma.InputJsonValue,
          status: 'pending',
          paymentStatus: 'ready',
        },
      });

      return json({
        ok: true,
        orderId: id,
        clientKey: keys.clientKey,
        amount: body.total,
        orderName: body.orderName || '수산아빠 주문',
        testMode,
      });
    }

    if (method === 'POST' && b === 'confirm') {
      const body = await parseBody<{ paymentKey?: string; orderId?: string; amount?: number }>(request);
      const { paymentKey, orderId, amount } = body;
      if (!paymentKey || !orderId || !amount) {
        return json({ error: '결제 정보가 올바르지 않습니다.' }, 400);
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return json({ error: '주문을 찾을 수 없습니다.' }, 404);
      if (order.paymentStatus === 'paid') {
        return json({ ok: true, order: mapOrder(order), alreadyPaid: true });
      }
      if (order.total !== amount) {
        return json({ error: '결제 금액이 일치하지 않습니다.' }, 400);
      }

      const paymentSetting = (await getSetting('payment')) as PaymentSetting | null;
      const testMode = paymentSetting?.testMode ?? false;
      const keys = getTossKeys(testMode);
      if (!keys) return json({ error: '결제 시스템 설정 오류' }, 503);

      try {
        await confirmTossPayment(paymentKey, orderId, amount, keys.secretKey);
      } catch (err) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'cancelled', paymentStatus: 'failed' },
        });
        return json({ error: err instanceof Error ? err.message : '결제 승인 실패' }, 402);
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid', paymentStatus: 'paid' },
      });
      return json({ ok: true, order: mapOrder(updated), testMode });
    }

    if (method === 'POST' && b === 'fail') {
      const body = await parseBody<{ orderId?: string; message?: string }>(request);
      if (body.orderId) {
        await prisma.order.updateMany({
          where: { id: body.orderId, paymentStatus: { in: ['ready', 'pending'] } },
          data: { status: 'cancelled', paymentStatus: 'cancelled' },
        });
      }
      return json({ ok: true });
    }
  }

  /* ── Products ── */
  if (method === 'GET' && a === 'products') {
    try {
      const rows = await prisma.product.findMany();
      if (rows.length) {
        return json(rows.map((r) => r.data));
      }
    } catch {
      /* DB 미연결 시 JSON 폴백 */
    }
    const fallback = await loadProductsFallback();
    return json(fallback);
  }

  /* ── Reviews ── */
  if (a === 'reviews') {
    if (method === 'GET' && b === 'can-write') {
      const auth = verifyToken(request);
      if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);
      const productId = url.searchParams.get('productId');
      if (!productId) return json({ error: '상품 정보가 필요합니다.' }, 400);
      if (await userReviewedProduct(auth.id, productId)) {
        return json({ canWrite: false, alreadyReviewed: true, reason: 'already_reviewed' });
      }
      if (!(await userPurchasedProduct(auth.id, productId))) {
        return json({ canWrite: false, alreadyReviewed: false, reason: 'not_purchased' });
      }
      return json({ canWrite: true, alreadyReviewed: false });
    }

    if (method === 'GET' && !b) {
      const productId = url.searchParams.get('productId');
      let rows: Review[];
      if (productId) {
        rows = await prisma.review.findMany({
          where: { productId },
          orderBy: [{ helpful: 'desc' }, { createdAt: 'desc' }],
        });
      } else {
        rows = await prisma.review.findMany({
          orderBy: { createdAt: 'desc' },
          take: 200,
        });
      }
      return json(rows.map(mapReview));
    }

    if (method === 'POST' && !b) {
      const auth = verifyToken(request);
      if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);
      const body = await parseBody<{
        productId?: string;
        rating?: number;
        title?: string;
        content?: string;
        images?: unknown[];
      }>(request);
      const { productId, rating, title, content, images } = body;
      if (!productId || !rating || !content) {
        return json({ error: '필수 항목을 입력해 주세요.' }, 400);
      }
      if (await userReviewedProduct(auth.id, productId)) {
        return json({ error: '이미 리뷰를 작성하셨습니다.' }, 409);
      }
      if (!(await userPurchasedProduct(auth.id, productId))) {
        return json({ error: '상품을 구매한 고객만 리뷰를 작성할 수 있습니다.' }, 403);
      }
      const user = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { name: true },
      });
      const author = (user?.name || '회원').slice(0, 1) + '*';
      const id = 'rv-' + uuidv4().slice(0, 8);
      await prisma.review.create({
        data: {
          id,
          productId,
          userId: auth.id,
          author,
          rating,
          title: title || '',
          content,
          images: (images || []) as Prisma.InputJsonValue,
          verified: true,
        },
      });
      const review = await prisma.review.findUnique({ where: { id } });
      return json({ ok: true, review: mapReview(review!) });
    }
  }

  /* ── User addresses ── */
  if (a === 'addresses') {
    const auth = verifyToken(request);
    if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);

    if (method === 'GET' && !b) {
      const rows = await prisma.userAddress.findMany({
        where: { userId: auth.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      return json(rows.map(mapUserAddress));
    }

    if (method === 'POST' && !b) {
      const body = await parseBody<{
        label?: string;
        recipientName?: string;
        phone?: string;
        zipcode?: string;
        address?: string;
        addressDetail?: string;
        isDefault?: boolean;
      }>(request);
      if (!body.recipientName || !body.phone || !body.zipcode || !body.address) {
        return json({ error: '받는 분, 연락처, 주소를 모두 입력해 주세요.' }, 400);
      }
      const count = await prisma.userAddress.count({ where: { userId: auth.id } });
      if (count >= 10) {
        return json({ error: '배송지는 최대 10개까지 등록할 수 있습니다.' }, 400);
      }
      const isDefault = body.isDefault ?? count === 0;
      if (isDefault) await clearUserDefaultAddresses(auth.id);
      const row = await prisma.userAddress.create({
        data: {
          id: uuidv4(),
          userId: auth.id,
          label: (body.label || '집').trim(),
          recipientName: body.recipientName.trim(),
          phone: body.phone.trim(),
          zipcode: body.zipcode.trim(),
          address: body.address.trim(),
          addressDetail: (body.addressDetail || '').trim(),
          isDefault,
        },
      });
      return json(mapUserAddress(row));
    }

    if (b) {
      const existing = await prisma.userAddress.findFirst({
        where: { id: b, userId: auth.id },
      });
      if (!existing) return json({ error: '배송지를 찾을 수 없습니다.' }, 404);

      if (method === 'PUT') {
        const body = await parseBody<{
          label?: string;
          recipientName?: string;
          phone?: string;
          zipcode?: string;
          address?: string;
          addressDetail?: string;
          isDefault?: boolean;
        }>(request);
        if (!body.recipientName || !body.phone || !body.zipcode || !body.address) {
          return json({ error: '받는 분, 연락처, 주소를 모두 입력해 주세요.' }, 400);
        }
        if (body.isDefault) await clearUserDefaultAddresses(auth.id);
        const row = await prisma.userAddress.update({
          where: { id: b },
          data: {
            label: (body.label || '집').trim(),
            recipientName: body.recipientName.trim(),
            phone: body.phone.trim(),
            zipcode: body.zipcode.trim(),
            address: body.address.trim(),
            addressDetail: (body.addressDetail || '').trim(),
            isDefault: !!body.isDefault,
          },
        });
        return json(mapUserAddress(row));
      }

      if (method === 'DELETE') {
        await prisma.userAddress.delete({ where: { id: b } });
        if (existing.isDefault) {
          const next = await prisma.userAddress.findFirst({
            where: { userId: auth.id },
            orderBy: { createdAt: 'desc' },
          });
          if (next) {
            await prisma.userAddress.update({
              where: { id: next.id },
              data: { isDefault: true },
            });
          }
        }
        return json({ ok: true });
      }

      if (method === 'PATCH' && c === 'default') {
        await clearUserDefaultAddresses(auth.id);
        const row = await prisma.userAddress.update({
          where: { id: b },
          data: { isDefault: true },
        });
        return json(mapUserAddress(row));
      }
    }
  }

  /* ── Orders ── */
  if (a === 'orders') {
    if (method === 'POST' && !b) {
      const body = await parseBody<{
        name?: string;
        phone?: string;
        email?: string;
        zipcode?: string;
        address?: string;
        addressDetail?: string;
        memo?: string;
        payment?: string;
        subtotal?: number;
        shipping?: number;
        total?: number;
        items?: unknown[];
      }>(request);
      const paymentSetting = (await getSetting('payment')) as { testMode?: boolean } | null;
      const id = 'GH' + Date.now().toString().slice(-8);
      let userId: string | null = null;
      const token = tokenFrom(request);
      if (token) {
        try {
          userId = (jwt.verify(token, jwtSecret) as JwtPayload).id;
        } catch {
          /* guest */
        }
      }
      await prisma.order.create({
        data: {
          id,
          userId,
          guestName: body.name,
          guestPhone: body.phone,
          guestEmail: body.email || '',
          zipcode: body.zipcode || '',
          address: body.address || '',
          addressDetail: body.addressDetail || '',
          memo: body.memo || '',
          paymentMethod: body.payment || 'card',
          subtotal: body.subtotal,
          shipping: body.shipping,
          total: body.total,
          items: (body.items || []) as Prisma.InputJsonValue,
          status: 'paid',
          paymentStatus: paymentSetting?.testMode ? 'test_paid' : 'paid',
        },
      });
      return json({ ok: true, orderId: id, testMode: paymentSetting?.testMode });
    }

    if (method === 'GET' && b === 'my') {
      const auth = verifyToken(request);
      if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);
      const rows = await prisma.order.findMany({
        where: { userId: auth.id },
        orderBy: { createdAt: 'desc' },
      });
      return json(rows.map(mapOrder));
    }
  }

  /* ── Inquiries ── */
  if (method === 'POST' && a === 'inquiries') {
    const body = await parseBody<{
      name?: string;
      email?: string;
      phone?: string;
      category?: string;
      title?: string;
      content?: string;
    }>(request);
    const { name, email, phone, category, title, content } = body;
    if (!name || !email || !title || !content) {
      return json({ error: '필수 항목을 입력해 주세요.' }, 400);
    }
    const id = uuidv4();
    let userId: string | null = null;
    const token = tokenFrom(request);
    if (token) {
      try {
        userId = (jwt.verify(token, jwtSecret) as JwtPayload).id;
      } catch {
        /* */
      }
    }
    await prisma.inquiry.create({
      data: {
        id,
        userId,
        name,
        email,
        phone: phone || '',
        category: category || '기타',
        title,
        content,
      },
    });
    return json({ ok: true, message: '문의가 접수되었습니다.' });
  }

  /* ── Admin ── */
  if (a === 'admin') {
    const auth = verifyToken(request);
    if (!auth) return json({ error: '로그인이 필요합니다.' }, 401);
    if (auth.role !== 'admin') return json({ error: '관리자 권한이 필요합니다.' }, 403);

    if (method === 'GET' && b === 'stats') {
      const [users, orders, reviews, inquiries] = await Promise.all([
        prisma.user.count({ where: { role: 'user' } }),
        prisma.order.count(),
        prisma.review.count(),
        prisma.inquiry.count({ where: { status: 'pending' } }),
      ]);
      return json({ users, orders, reviews, inquiries });
    }

    if (method === 'GET' && b === 'settings') {
      return json({
        shop: await getSetting('shop'),
        payment: await getSetting('payment'),
        order: await getSetting('order'),
        customerCenter: await getSetting('customerCenter'),
      });
    }

    if (method === 'PUT' && b === 'settings' && c) {
      const key = c;
      if (!['shop', 'payment', 'order', 'customerCenter'].includes(key)) {
        return json({ error: '잘못된 설정 키' }, 400);
      }
      const body = await parseBody(request);
      await setSetting(key, body);
      return json({ ok: true });
    }

    if (method === 'GET' && b === 'orders') {
      const rows = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
      return json(rows.map(mapOrder));
    }

    if (method === 'PATCH' && b === 'orders' && c) {
      const body = await parseBody<{ status?: string }>(request);
      await prisma.order.update({
        where: { id: c },
        data: { status: body.status },
      });
      return json({ ok: true });
    }

    if (method === 'GET' && b === 'reviews') {
      const rows = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
      return json(rows.map(mapReview));
    }

    if (method === 'DELETE' && b === 'reviews' && c) {
      await prisma.review.delete({ where: { id: c } });
      return json({ ok: true });
    }

    if (method === 'GET' && b === 'inquiries') {
      const rows = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } });
      return json(rows.map(mapInquiry));
    }

    if (method === 'PATCH' && b === 'inquiries' && c) {
      const body = await parseBody<{ status?: string }>(request);
      await prisma.inquiry.update({
        where: { id: c },
        data: { status: body.status || 'done' },
      });
      return json({ ok: true });
    }

    if (method === 'GET' && b === 'users') {
      const rows = await prisma.user.findMany({
        select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      return json(rows.map(mapAdminUser));
    }
  }

  return json({ error: 'Not found' }, 404);
}
