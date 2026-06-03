import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const announcements = [
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
];

async function main() {
  await prisma.setting.upsert({
    where: { key: 'announcements' },
    create: { key: 'announcements', value: announcements as Prisma.InputJsonValue },
    update: { value: announcements as Prisma.InputJsonValue },
  });
  console.log('Announcements settings updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
