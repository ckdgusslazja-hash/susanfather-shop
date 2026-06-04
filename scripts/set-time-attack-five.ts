import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const root = process.cwd();

/** 메인 타임어택 노출 5종 */
const TIME_ATTACK_IDS = ['fr1', 'sf1', 'mt1', 'pr3', 'fr3'];

async function main() {
  const rows = await prisma.product.findMany();
  for (const row of rows) {
    const data = row.data as Record<string, unknown>;
    const id = String(data.id || row.id);
    const on = TIME_ATTACK_IDS.includes(id);
    const order = on ? TIME_ATTACK_IDS.indexOf(id) : undefined;
    const next = {
      ...data,
      id,
      timeAttack: on,
      timeAttackOrder: on ? order : undefined,
    };
    await prisma.product.update({
      where: { id: row.id },
      data: { data: next as Prisma.InputJsonValue },
    });
    console.log(on ? `ON  ${id}` : `off ${id}`);
  }
  console.log(`타임어택 ${TIME_ATTACK_IDS.length}개: ${TIME_ATTACK_IDS.join(', ')}`);

  const list = rows.map((row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(data.id || row.id);
    const on = TIME_ATTACK_IDS.includes(id);
    return {
      ...data,
      id,
      timeAttack: on,
      timeAttackOrder: on ? TIME_ATTACK_IDS.indexOf(id) : undefined,
    };
  });
  const json = JSON.stringify(list, null, 2) + '\n';
  fs.writeFileSync(path.join(root, 'data', 'products.json'), json, 'utf8');
  fs.writeFileSync(path.join(root, 'public', 'data-products.json'), json, 'utf8');
  console.log('JSON 동기화 완료');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
