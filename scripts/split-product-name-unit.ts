import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const root = process.cwd();
const jsonPath = path.join(root, 'data', 'products.json');
const publicJsonPath = path.join(root, 'public', 'data-products.json');

type ProductRow = Record<string, unknown> & {
  id: string;
  name?: string;
  unit?: string;
  categoryPath?: string[];
};

function stripUnitFromName(name: string, unit: string): string | null {
  const n = name.trim();
  const u = unit.trim();
  if (!n || !u) return null;

  if (n.endsWith(u)) {
    return n.slice(0, -u.length).replace(/[\s,·\-]+$/, '').trim();
  }

  const unitHead = u.split(/\s+/)[0];
  if (unitHead.length >= 2 && n.endsWith(unitHead)) {
    return n.slice(0, -unitHead.length).replace(/[\s,·\-]+$/, '').trim();
  }

  const re = /\s*[\d.]+\s*(?:kg|g|ml|l|개|입|마리|포|팩|박스|봉|송이|망|상자|세트|구)$/i;
  const m = n.match(re);
  if (!m) return null;
  const suffix = m[0].trim();
  const compact = suffix.replace(/\s/g, '');
  if (u.replace(/\s/g, '').includes(compact) || u.includes(suffix.split(/\s+/).pop() || '')) {
    return n.slice(0, m.index).trim();
  }
  return null;
}

function normalizeProduct(p: ProductRow): { product: ProductRow; changed: boolean } {
  const oldName = String(p.name || '').trim();
  const unit = String(p.unit || '').trim();
  const newName = stripUnitFromName(oldName, unit);
  if (!newName || newName === oldName) {
    return { product: p, changed: false };
  }

  const next: ProductRow = { ...p, name: newName };
  if (Array.isArray(p.categoryPath) && p.categoryPath.length) {
    const pathCopy = [...p.categoryPath];
    const lastIdx = pathCopy.length - 1;
    if (pathCopy[lastIdx] === oldName) pathCopy[lastIdx] = newName;
    next.categoryPath = pathCopy;
  }
  return { product: next, changed: true };
}

async function loadProducts(): Promise<ProductRow[]> {
  const rows = await prisma.product.findMany();
  if (rows.length) {
    return rows.map((r) => ({ ...(r.data as ProductRow), id: r.id }));
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(raw) as ProductRow[];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const list = await loadProducts();
  const updated: ProductRow[] = [];
  let changedCount = 0;

  for (const p of list) {
    const { product, changed } = normalizeProduct(p);
    updated.push(product);
    if (changed) {
      changedCount++;
      console.log(`${p.id}: "${p.name}" → "${product.name}" (단위: ${product.unit})`);
    }
  }

  if (!changedCount) {
    console.log('변경할 상품이 없습니다.');
    return;
  }

  if (dryRun) {
    console.log(`\n--dry-run: ${changedCount}건 미반영`);
    return;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  fs.writeFileSync(publicJsonPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`JSON ${changedCount}건 저장 완료`);

  let dbCount = 0;
  for (const p of updated) {
    const { id, ...data } = p;
    await prisma.product.upsert({
      where: { id },
      create: { id, data: data as Prisma.InputJsonValue },
      update: { data: data as Prisma.InputJsonValue },
    });
    dbCount++;
  }
  console.log(`DB ${dbCount}건 동기화 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
