import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export function getDefaultSettings(): Record<string, unknown> {
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
      testMode: false,
      enabledMethods: ['transfer'],
      notice: '무통장 입금 주문입니다. 입금 확인 후 순차 발송됩니다.',
      transferGuide: '주문 후 24시간 이내 입금해 주세요. 미입금 시 주문이 취소될 수 있습니다.',
      bankAccount: {
        bank: '국민은행',
        number: '문의: 010-4730-9269',
        holder: '리벤더(변창현)',
      },
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
    announcements: [
      {
        id: '1',
        title: '산지직송 신선 배송 안내',
        body: '주문하신 농수산물은 산지에서 직접 포장·발송됩니다. 제주·도서 지역은 1~2일 추가 소요될 수 있습니다.',
        createdAt: '2026-06-01T09:00:00.000Z',
      },
      {
        id: '2',
        title: '5만원 이상 무료배송',
        body: '5만원 이상 결제 시 배송비가 무료입니다. 햅쌀·곡물 등 일부 상품은 상품별 무료배송이 적용됩니다.',
        createdAt: '2026-06-02T09:00:00.000Z',
      },
    ],
  };
}

interface SeedReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title?: string;
  content?: string;
  images?: unknown[];
  helpful?: number;
  verified?: boolean;
  date?: string;
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function getSampleReviews(): SeedReview[] {
  const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
  return readJsonFile<SeedReview[]>(reviewsPath) || [];
}

async function seedSettings() {
  const defaults = getDefaultSettings();
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }
}

async function seedAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (existing) return;

  const hash = bcrypt.hashSync('admin1234', 10);
  await prisma.user.create({
    data: {
      id: 'admin-1',
      email: 'admin@greenharvest.kr',
      passwordHash: hash,
      name: '관리자',
      phone: '010-0000-0000',
      role: 'admin',
      provider: 'email',
    },
  });
}

async function seedProducts() {
  const count = await prisma.product.count();
  if (count > 0) return;

  const jsonPath = path.join(process.cwd(), 'data', 'products.json');
  const list = readJsonFile<Array<{ id: string }>>(jsonPath);
  if (!list?.length) return;

  await prisma.product.createMany({
    data: list.map((p) => ({
      id: p.id,
      data: p as Prisma.InputJsonValue,
    })),
    skipDuplicates: true,
  });
}

async function seedReviews() {
  const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
  let reviews = readJsonFile<SeedReview[]>(reviewsPath);
  if (!reviews?.length) reviews = getSampleReviews();
  if (!reviews?.length) return;

  for (const r of reviews) {
    const createdAt = r.date ? new Date(r.date) : undefined;
    await prisma.review.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        productId: r.productId,
        author: r.author,
        rating: r.rating,
        title: r.title || '',
        content: r.content || '',
        images: (r.images || []) as Prisma.InputJsonValue,
        helpful: r.helpful ?? 0,
        verified: !!r.verified,
        ...(createdAt ? { createdAt } : {}),
      },
      update: {},
    });
  }
}

async function main() {
  await seedSettings();
  await seedAdmin();
  await seedProducts();
  await seedReviews();
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
