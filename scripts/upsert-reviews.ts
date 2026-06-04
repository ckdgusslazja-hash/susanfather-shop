/**
 * 프로덕션 DB 리뷰를 data/reviews.json 기준으로 교체
 * 실행: npx tsx scripts/upsert-reviews.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

type SeedReview = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  helpful?: number;
  verified?: boolean;
  date?: string;
};

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'data', 'reviews.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('data/reviews.json 없음 — 먼저 node scripts/generate-review-seeds.mjs 실행');
    process.exit(1);
  }
  const reviews = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as SeedReview[];
  if (!reviews.length) {
    console.error('리뷰 데이터가 비어 있습니다.');
    process.exit(1);
  }

  const deleted = await prisma.review.deleteMany({});
  console.log(`기존 리뷰 ${deleted.count}건 삭제`);

  for (const r of reviews) {
    const createdAt = r.date ? new Date(r.date) : undefined;
    await prisma.review.create({
      data: {
        id: r.id,
        productId: r.productId,
        author: r.author,
        rating: r.rating,
        title: r.title || '',
        content: r.content || '',
        images: r.images || [],
        helpful: r.helpful ?? 0,
        verified: !!r.verified,
        ...(createdAt ? { createdAt } : {}),
      },
    });
  }

  console.log(`리뷰 ${reviews.length}건 등록 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
