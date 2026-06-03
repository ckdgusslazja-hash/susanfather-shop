import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const root = process.cwd();
const jsonPath = path.join(root, 'data', 'products.json');
const publicJsonPath = path.join(root, 'public', 'data-products.json');

interface ProductRow {
  id: string;
  adminImages?: Array<{ id: string; url: string; label: string }>;
  [key: string]: unknown;
}

function updateImageUrls(list: ProductRow[]): ProductRow[] {
  return list.map((p) => ({
    ...p,
    adminImages: [
      {
        id: `${p.id}-a1`,
        url: `/images/products/${p.id}.png`,
        label: '대표 상품컷',
      },
    ],
  }));
}

async function main() {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const list = JSON.parse(raw) as ProductRow[];
  const updated = updateImageUrls(list);

  fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  fs.writeFileSync(publicJsonPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`Updated ${updated.length} products in JSON files.`);

  let dbCount = 0;
  for (const p of updated) {
    const existing = await prisma.product.findUnique({ where: { id: p.id } });
    if (existing) {
      await prisma.product.update({
        where: { id: p.id },
        data: { data: p as Prisma.InputJsonValue },
      });
      dbCount++;
    } else {
      await prisma.product.create({
        data: { id: p.id, data: p as Prisma.InputJsonValue },
      });
      dbCount++;
    }
  }
  console.log(`Synced ${dbCount} products to database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
