/**
 * 결제 설정을 무통장 입금만으로 변경 (프로덕션 DB)
 * npx tsx scripts/set-payment-transfer-only.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = (await prisma.setting.findUnique({ where: { key: 'payment' } }))?.value as Record<
    string,
    unknown
  > | null;
  const next = {
    ...(existing || {}),
    provider: 'toss',
    testMode: false,
    enabledMethods: ['transfer'],
    notice: '무통장 입금 주문입니다. 입금 확인 후 순차 발송됩니다.',
    transferGuide: '주문 후 24시간 이내 입금해 주세요. 미입금 시 주문이 취소될 수 있습니다.',
    bankAccount: (existing?.bankAccount as object) || {
      bank: '국민은행',
      number: '문의: 010-4730-9269',
      holder: '리벤더(변창현)',
    },
  };
  await prisma.setting.upsert({
    where: { key: 'payment' },
    create: { key: 'payment', value: next },
    update: { value: next },
  });
  console.log('결제 설정: 무통장 입금만 사용');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
