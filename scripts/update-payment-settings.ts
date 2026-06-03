import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const paymentValue = {
  provider: 'toss',
  testMode: false,
  enabledMethods: ['card', 'transfer', 'kakao'],
  notice: '토스페이먼츠로 안전하게 결제됩니다.',
  bankAccount: {
    bank: '국민은행',
    number: '문의: 010-4730-9269',
    holder: '리벤더(변창현)',
  },
};

async function main() {
  await prisma.setting.upsert({
    where: { key: 'payment' },
    create: { key: 'payment', value: paymentValue as Prisma.InputJsonValue },
    update: { value: paymentValue as Prisma.InputJsonValue },
  });
  console.log('Payment settings updated: testMode=false, provider=toss');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
