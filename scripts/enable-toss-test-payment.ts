/**
 * 토스페이먼츠 테스트 모드 활성화 (test_gck / test_gsk 키 사용)
 * 실행: npx tsx scripts/enable-toss-test-payment.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: 'payment' } });
  const current = (row?.value as Record<string, unknown>) || {};
  const next = {
    ...current,
    provider: 'toss',
    testMode: true,
    enabledMethods: ['card', 'transfer', 'kakao'],
    notice: '테스트 결제 모드입니다. 실제로 청구되지 않습니다.',
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

  console.log('✓ 결제 설정: 토스 테스트 모드 활성화');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
