/**
 * 토스페이먼츠 결제위젯(카드·간편결제) 활성화
 * 실행: npx tsx scripts/enable-toss-payment.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: 'payment' } });
  const current = (row?.value as Record<string, unknown>) || {};
  const next = {
    ...current,
    provider: 'toss',
    testMode: false,
    enabledMethods: ['card', 'transfer', 'kakao'],
    notice: '토스페이먼츠 결제위젯으로 안전하게 결제됩니다. 무통장 입금도 이용 가능합니다.',
    transferGuide: current.transferGuide || '주문 후 24시간 이내 입금해 주세요. 미입금 시 주문이 자동 취소될 수 있습니다.',
    bankAccount: current.bankAccount || {
      bank: '국민은행',
      number: '문의: 010-4730-9269',
      holder: '리벤더(변창현)',
    },
  };

  await prisma.setting.upsert({
    where: { key: 'payment' },
    create: { key: 'payment', value: next as Prisma.InputJsonValue },
    update: { value: next as Prisma.InputJsonValue },
  });

  console.log('✓ 결제 설정: 온라인(카드·간편결제) + 무통장 활성화');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
