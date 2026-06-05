/**
 * 문경 사과(fr2) 상세페이지 등록 + DB/JSON 동기화
 * 실행: node scripts/fetch-fr2-detail-images.mjs && npx tsx scripts/set-fr2-detail-page.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { FR2_ADMIN_IMAGES, FR2_DETAIL_HTML } from './fr2-detail-html';

const prisma = new PrismaClient();
const root = process.cwd();
const PRODUCT_ID = 'fr2';

const FR2_SHIPPING_GUIDE = `【 배송 안내 · 신선 과일 】
· 입금·결제 확인 후 1~2일 내 산지에서 출고합니다. (평일 오전 11시 이전 결제 시 당일 출고 목표)
· 문경 사과는 완충재·낱개 분리 포장 후 박스에 담아 택배 발송합니다.
· 제주·도서·산간 지역은 1~2일 추가 소요될 수 있습니다.
· 기상·산지 수확량에 따라 출고가 하루 조정될 수 있으며, 변경 시 알림으로 안내드립니다.`;

const FR2_RETURN_GUIDE = `【 교환·반품 안내 (신선 과일) 】
· 신선 과일은 재판매가 불가하여 단순 변심·주문 실수에 의한 교환·반품은 어렵습니다.
· 아래 사유에 해당할 때만 접수해 주세요.
  - 배송 중 파손·눌림·변질·내부 썩음
  - 주문과 다른 중량·품목 오배송
· 수령 후 24시간 이내, 상품·포장·송장 사진과 함께 고객센터 또는 마이페이지로 접수해 주세요.
· 확인 후 재발송·환불 처리하며, 회사 귀책 시 배송비는 수산아빠가 부담합니다.
· 맛·당도·크기·색 차이만으로는 교환·환불이 어렵습니다.`;

function buildFr2Patch(existing: Record<string, unknown>) {
  return {
    ...existing,
    id: PRODUCT_ID,
    useOptions: true,
    optionLabel: '중량',
    description:
      '경북 문경 산지에서 자란 햇 사과. 아삭한 식감과 달콤한 맛, 1kg·2kg·4kg 중 선택 가능. 산지 선별·완충 포장 후 직송합니다.',
    detailHtml: FR2_DETAIL_HTML,
    detailBlocks: [],
    shippingGuide: FR2_SHIPPING_GUIDE,
    returnGuide: FR2_RETURN_GUIDE,
    details: [
      '경북 문경 산지직송',
      '2단 선별·완충 포장',
      '1kg / 2kg / 4kg 선택',
      '당일·익일 출고',
      '파손·변질 A/S',
    ],
    adminImages: FR2_ADMIN_IMAGES,
  };
}

async function syncJson(list: Record<string, unknown>[]) {
  const json = JSON.stringify(list, null, 2) + '\n';
  fs.writeFileSync(path.join(root, 'data', 'products.json'), json, 'utf8');
  fs.writeFileSync(path.join(root, 'public', 'data-products.json'), json, 'utf8');
  console.log('JSON 동기화: data/products.json, public/data-products.json');
}

async function main() {
  const rows = await prisma.product.findMany();
  let list: Record<string, unknown>[] = rows.map((row) => {
    const data = row.data as Record<string, unknown>;
    return { ...data, id: String(data.id || row.id) };
  });

  const idx = list.findIndex((p) => p.id === PRODUCT_ID);
  if (idx < 0) {
    console.error(`상품 ${PRODUCT_ID} 없음`);
    process.exit(1);
  }

  const patched = buildFr2Patch(list[idx]);
  list[idx] = patched;

  await prisma.product.update({
    where: { id: rows.find((r) => String((r.data as Record<string, unknown>).id || r.id) === PRODUCT_ID)!.id },
    data: { data: patched as Prisma.InputJsonValue },
  });

  await syncJson(list);
  console.log(`✓ ${PRODUCT_ID} 상세페이지(detailHtml) 등록 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
