import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany();
  let fixed = 0;
  for (const row of rows) {
    const data = (row.data || {}) as Record<string, unknown>;
    if (data.id === row.id) continue;
    await prisma.product.update({
      where: { id: row.id },
      data: { data: { ...data, id: row.id } as Prisma.InputJsonValue },
    });
    fixed++;
    console.log(`fixed id in data: ${row.id}`);
  }
  console.log(`Done. ${fixed} / ${rows.length} products updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
