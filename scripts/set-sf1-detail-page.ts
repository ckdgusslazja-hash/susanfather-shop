/**
 * 국내산 광어회(sf1) 한국형 쇼핑몰 상세페이지 등록 + DB/JSON 동기화
 * 실행: npx tsx scripts/set-sf1-detail-page.ts
 */
import { Prisma, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

const SF1_DETAIL_HTML = `
<div class="mall-detail">
  <p class="mall-detail__eyebrow">전남 완도 · 당일 손질</p>
  <h2 class="mall-detail__headline">산지에서 바로, 식탁까지<br>국내산 광어회</h2>
  <p class="mall-detail__lead">완도 항에서 선별한 국내산 광어를 주문 후 당일 손질해 회로 보내드립니다. 쫄깃한 식감과 담백한 맛을 집에서 회 코스처럼 즐겨 보세요.</p>

  <figure class="mall-detail__figure">
    <img src="/images/products/sf1.png" alt="국내산 광어회 상품 이미지" loading="lazy" />
    <figcaption>수산아빠 대표 상품컷 · 실제 발송 상품과 유사한 품질 기준으로 손질합니다.</figcaption>
  </figure>

  <ul class="mall-detail__points">
    <li><strong>당일 손질</strong><span>주문·재고 기준 당일 가공</span></li>
    <li><strong>완도 산지</strong><span>국내산 광어 직거래</span></li>
    <li><strong>냉장 배송</strong><span>아이스팩·보냉 포장</span></li>
    <li><strong>용량 선택</strong><span>300g · 500g · 1kg</span></li>
  </ul>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">왜 수산아빠 광어회인가요?</h3>
    <p>대형 마트 회와 달리 <b>주문 후 손질</b>해 보내기 때문에 신선도와 식감의 차이를 체감하실 수 있습니다. 광어 특유의 담백함과 쫄깃한 식감을 살리기 위해 불필요한 잔가시·비늘을 제거하고, 회에 적합한 두께로 썰어 드립니다.</p>
    <ul>
      <li>HACCP 인증 가공 시설에서 위생 관리</li>
      <li>가정·소규모 모임에 맞는 300g~1kg 용량 구성</li>
      <li>초장·김·야채만 준비하면 바로 회식 가능</li>
    </ul>
  </section>

  <section class="mall-detail__section mall-detail__section--process">
    <h3 class="mall-detail__title">주문부터 식탁까지</h3>
    <ol class="mall-detail__steps">
      <li><span class="mall-detail__step-no">01</span><strong>주문·결제</strong><p>용량(300g/500g/1kg) 선택 후 결제</p></li>
      <li><span class="mall-detail__step-no">02</span><strong>당일 손질</strong><p>완도 산지 연계 시설에서 회 가공</p></li>
      <li><span class="mall-detail__step-no">03</span><strong>냉장 포장</strong><p>아이스팩·보냉제 동봉 후 출고</p></li>
      <li><span class="mall-detail__step-no">04</span><strong>신선 배송</strong><p>수령 후 즉시 냉장 보관</p></li>
    </ol>
  </section>

  <figure class="mall-detail__figure">
    <img src="/images/products/sf1.png" alt="광어회 신선 포장 예시" loading="lazy" />
    <figcaption>냉장 유통을 전제로 한 포장·배송으로 신선도를 지킵니다.</figcaption>
  </figure>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">상품 정보</h3>
    <table class="mall-detail__table">
      <tbody>
        <tr><th>상품명</th><td>국내산 광어회</td></tr>
        <tr><th>원산지</th><td>전남 완도 (국내산)</td></tr>
        <tr><th>용량</th><td>300g / 500g(기본) / 1kg — 옵션 선택</td></tr>
        <tr><th>보관 방법</th><td>수령 즉시 냉장(0~5℃), 당일~익일 섭취 권장</td></tr>
        <tr><th>손질</th><td>회용 슬라이스 (가시·비늘 제거)</td></tr>
        <tr><th>배송</th><td>냉장 택배 · 산지직송</td></tr>
      </tbody>
    </table>
  </section>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">맛있게 드시는 법</h3>
    <ul>
      <li>수령 후 <b>30분 이내 냉장 보관</b>해 주세요.</li>
      <li>드시기 10분 전에 꺼내 식감이 살아납니다.</li>
      <li>초장·와사비·깻잎·양파와 함께 곁들이면 고급 회 코스 분위기를 낼 수 있습니다.</li>
      <li>남은 회는 밀폐 후 당일 섭취를 권장합니다.</li>
    </ul>
  </section>

  <div class="mall-detail__notice">
    <strong>신선 식품 안내</strong>
    <p>신선 수산물 특성상 단순 변심 반품은 어렵습니다. 품질 이상 시 수령 후 24시간 이내 고객센터로 연락해 주세요.</p>
  </div>
</div>
`.trim();

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
    adminImages: [
      {
        id: 'sf1-a1',
        url: '/images/products/sf1.png',
        label: '대표 상품컷',
      },
      {
        id: 'sf1-a2',
        url: '/images/products/sf1.png',
        label: '손질 회 슬라이스',
      },
    ],
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
