/**
 * 국내산 광어회(sf1) 한국형 쇼핑몰 상세페이지 등록 + DB/JSON 동기화
 * 실행: npx tsx scripts/set-sf1-detail-page.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { SF1_ADMIN_IMAGES, SF1_DETAIL_HTML } from './sf1-detail-html';

const prisma = new PrismaClient();
const root = process.cwd();
const PRODUCT_ID = 'sf1';

const SF1_SHIPPING_GUIDE = `【 배송 안내 · 신선 수산물 】
· 입금 확인(또는 결제 완료) 후 1~2일 내 출고하며, 수도권은 보통 수령 후 1~2일 이내 도착합니다.
· 광어회는 당일 손질 후 아이스팩·보냉제를 넣어 냉장(0~5℃) 상태로 발송합니다.
· 배송 중 신선도 유지를 위해 전용 스티로폼·비닐 이중 포장을 사용합니다.
· 제주·도서·산간 지역은 1~2일 추가 소요될 수 있습니다.
· 기상·어획·물량에 따라 출고일이 하루 조정될 수 있으며, 변경 시 문자·알림으로 안내드립니다.`;

const SF1_RETURN_GUIDE = `【 교환·반품 안내 (신선 회·수산물) 】
· 신선 회·냉장 수산물은 재판매가 불가한 상품으로, 단순 변심·주문 실수에 의한 교환·반품은 어렵습니다.
· 아래 사유에 해당할 때만 접수해 주세요.
  - 상품 변질·이취·파손·누수 등 품질 이상
  - 주문과 다른 상품·용량 오배송
  - 배송 지연으로 신선도가 현저히 떨어진 경우
· 수령 후 24시간 이내, 상품·포장·송장 사진과 함께 고객센터 또는 마이페이지로 접수해 주세요.
· 확인 후 재발송·환불 처리하며, 회사 귀책 시 배송비는 수산아빠가 부담합니다.
· 개봉 후 상온 방치, 냉장 보관 지연으로 인한 변질은 교환·환불 대상에서 제외됩니다.`;

function buildSf1Patch(existing: Record<string, unknown>) {
  return {
    ...existing,
    id: PRODUCT_ID,
    useOptions: true,
    optionLabel: '용량',
    description:
      '완도 산지 국내산 광어를 주문 후 당일 손질해 보내드립니다. 300g·500g·1kg 중 선택 가능하며, 아이스팩 냉장 배송으로 신선하게 도착합니다.',
    detailHtml: SF1_DETAIL_HTML,
    detailBlocks: [],
    shippingGuide: SF1_SHIPPING_GUIDE,
    returnGuide: SF1_RETURN_GUIDE,
    details: [
      '당일 손질·출하',
      'HACCP 인증 가공',
      '냉장·아이스팩 포장',
      '완도 산지 직송',
      '300g / 500g / 1kg 선택',
    ],
    adminImages: SF1_ADMIN_IMAGES,
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

  const patched = buildSf1Patch(list[idx]);
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
