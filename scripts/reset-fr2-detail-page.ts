/**
 * 문경 사과(fr2) 상세페이지 초기화
 * 실행: npx tsx scripts/reset-fr2-detail-page.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const root = process.cwd();
const PRODUCT_ID = 'fr2';

function buildFr2Reset(existing: Record<string, unknown>): Record<string, unknown> {
  const {
    detailHtml: _dh,
    detailBlocks: _db,
    shippingGuide: _sg,
    returnGuide: _rg,
    ...rest
  } = existing;
  return {
    ...rest,
    id: PRODUCT_ID,
    description: '아삭하고 달콤한 문경 사과. 산지에서 바로 보내 드립니다.',
    details: ['산지 직송'],
    adminImages: [
      {
        id: 'fr2-a1',
        url: '/images/products/fr2.png',
        label: '대표 상품컷',
      },
    ],
  };
}

async function syncJson(list: Record<string, unknown>[]) {
  const json = JSON.stringify(list, null, 2) + '\n';
  fs.writeFileSync(path.join(root, 'data', 'products.json'), json, 'utf8');
  fs.writeFileSync(path.join(root, 'public', 'data-products.json'), json, 'utf8');
}

async function main() {
  const rows = await prisma.product.findMany();
  let list: Record<string, unknown>[] = rows.map((row) => {
    const data = row.data as Record<string, unknown>;
    return { ...data, id: String(data.id || row.id) };
  });

  const idx = list.findIndex((p) => p.id === PRODUCT_ID);
  if (idx < 0) {
    console.error(`상품 ${PRODUCT_ID} 없음`);
    process.exit(1);
  }

  const patched = buildFr2Reset(list[idx]);
  list[idx] = patched;

  const row = rows.find((r) => String((r.data as Record<string, unknown>).id || r.id) === PRODUCT_ID)!;
  await prisma.product.update({
    where: { id: row.id },
    data: { data: patched as Prisma.InputJsonValue },
  });

  await syncJson(list);

  const detailDir = path.join(root, 'public', 'images', 'products', 'detail', 'fr2');
  if (fs.existsSync(detailDir)) {
    fs.rmSync(detailDir, { recursive: true, force: true });
    console.log('삭제: public/images/products/detail/fr2/');
  }

  console.log(`✓ ${PRODUCT_ID} 상세페이지 초기화 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
