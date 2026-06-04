/**
 * 메인 타임어택 자동 노출(할인 특가) 상품을 DB timeAttack 플래그로 이전
 */
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type ProductRow = Record<string, unknown> & {
  id: string;
  price?: number;
  originalPrice?: number;
  category?: string;
  timeAttack?: boolean;
  timeAttackOrder?: number;
};

function discountRate(p: ProductRow) {
  const price = Number(p.price) || 0;
  const orig = Number(p.originalPrice) || price;
  if (orig <= 0) return 0;
  return 1 - price / orig;
}

function pickSaleCandidates(list: ProductRow[]) {
  let candidates = list.filter((p) => discountRate(p) >= 0.12);
  if (!candidates.length) candidates = [...list];
  return candidates.sort((a, b) => discountRate(b) - discountRate(a));
}

async function loadProducts(): Promise<ProductRow[]> {
  const rows = await prisma.product.findMany();
  if (rows.length) {
    return rows.map((r) => {
      const data = r.data as ProductRow;
      return { ...data, id: String(data.id || r.id) };
    });
  }
  const jsonPath = path.join(process.cwd(), 'public', 'data-products.json');
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as ProductRow[];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const all = await loadProducts();
  const already = all.filter((p) => p.timeAttack === true);
  if (already.length) {
    console.log(`이미 타임어택 등록 ${already.length}건 — 스킵 (강제: --force)`);
    if (!process.argv.includes('--force')) return;
  }

  const candidates = pickSaleCandidates(all);
  console.log(`타임어택 후보 ${candidates.length}건 (할인 특가 기준)`);

  if (dryRun) {
    candidates.forEach((p, i) => console.log(`${i + 1}. ${p.id} ${p.name}`));
    return;
  }

  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    const data = { ...p, timeAttack: true, timeAttackOrder: i };
    await prisma.product.upsert({
      where: { id: p.id },
      create: { id: p.id, data: data as Prisma.InputJsonValue },
      update: { data: data as Prisma.InputJsonValue },
    });
    console.log(`등록: ${p.id} — ${p.name}`);
  }
  console.log(`완료: ${candidates.length}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
