/**
 * 카카오채널 Public ID 설정
 * 실행: npx tsx scripts/set-kakao-channel-id.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';

const KAKAO_CHANNEL_ID = '_pFQGX';

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: 'shop' } });
  const current = (row?.value as Record<string, unknown>) || {};
  const next = {
    ...current,
    kakaoChannelId: KAKAO_CHANNEL_ID,
  };

  await prisma.setting.upsert({
    where: { key: 'shop' },
    create: { key: 'shop', value: next as Prisma.InputJsonValue },
    update: { value: next as Prisma.InputJsonValue },
  });

  console.log(`✓ 카카오채널 ID 설정: ${KAKAO_CHANNEL_ID}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
