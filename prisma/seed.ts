import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export function getDefaultSettings(): Record<string, unknown> {
  return {
    shop: {
      name: '수산아빠',
      company: '수산아빠',
      ceo: '홍길동',
      businessNo: '123-45-67890',
      mailOrderNo: '2026-서울강남-0001',
      address: '서울특별시 강남구 테헤란로 123',
      phone: '1588-0000',
      email: 'help@greenharvest.kr',
      hours: '평일 09:00~18:00 (주말·공휴일 휴무)',
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
        { q: '반품은 어떻게 하나요?', a: '수령 후 7일 이내 고객센터로 문의해 주세요.' },
      ],
    },
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
  return [
    {
      id: 'rv-seed-1',
      productId: 'fr1',
      author: '김*연',
      rating: 5,
      title: '당도 최고',
      content: '배송 빠르고 감귤이 신선해요. 재구매할게요.',
      images: [],
      helpful: 12,
      verified: true,
    },
    {
      id: 'rv-seed-2',
      productId: 'sf1',
      author: '이*수',
      rating: 5,
      title: '회 fresh',
      content: '포장 꼼꼼하고 싱싱합니다.',
      images: [],
      helpful: 8,
      verified: true,
    },
  ];
}

async function seedSettings() {
  const defaults = getDefaultSettings();
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: {},
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
  const count = await prisma.review.count();
  if (count > 0) return;

  const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
  let reviews = readJsonFile<SeedReview[]>(reviewsPath);
  if (!reviews?.length) reviews = getSampleReviews();

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
