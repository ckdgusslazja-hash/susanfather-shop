/** 광어회(sf1) 상세페이지 HTML — scripts/set-sf1-detail-page.ts 에서 import */
const D = '/images/products/detail/sf1';
const PRODUCT_IMG = '/images/products/sf1.png';

export const SF1_DETAIL_HTML = `
<div class="mall-detail">
  <figure class="mall-detail__hero">
    <img src="${PRODUCT_IMG}" alt="수산아빠 국내산 광어회 실제 상품" loading="eager" />
    <figcaption class="mall-detail__hero-cap">수산아빠 판매 상품 · 국내산 광어 당일 손질 회</figcaption>
  </figure>

  <div class="mall-detail__intro">
    <p class="mall-detail__eyebrow">전남 완도 · 산지직송</p>
    <h2 class="mall-detail__headline">집에서 즐기는<br>프리미엄 광어회 코스</h2>
    <p class="mall-detail__lead">아래 사진은 <b>실제 판매하는 국내산 광어회</b>입니다. 주문 확인 후 당일 손질·냉장 출고하며, 선택하신 용량(300g·500g·1kg)으로 보내드립니다.</p>
  </div>

  <ul class="mall-detail__points">
    <li><strong>당일 손질</strong><span>주문·재고 기준 가공</span></li>
    <li><strong>완도 산지</strong><span>국내산 광어</span></li>
    <li><strong>냉장 배송</strong><span>아이스팩·보냉제</span></li>
    <li><strong>용량 3종</strong><span>300g·500g·1kg</span></li>
  </ul>

  <figure class="mall-detail__figure mall-detail__figure--lg">
    <img src="${PRODUCT_IMG}" alt="국내산 광어회 구성" loading="lazy" />
    <figcaption><b>실제 상품</b> · 광어회 슬라이스 구성 (용량 옵션에 따라 중량이 달라집니다)</figcaption>
  </figure>

  <div class="mall-detail__band">
    <p class="mall-detail__band-label">WHY 수산아빠</p>
    <p class="mall-detail__band-text">광어회는 <b>신선도가 맛의 90%</b>입니다.<br>손질 시점·보관·배송까지 한 번에 관리합니다.</p>
  </div>

  <div class="mall-detail__split">
    <div class="mall-detail__split-text">
      <h3 class="mall-detail__title">① 당일 손질 국내산 광어회</h3>
      <p>완도·남해안 권역 국내산 광어를 주문 후 손질합니다. 가시·비늘을 제거하고 회에 맞는 두께로 슬라이스해 냉장 포장합니다.</p>
      <ul>
        <li>수입 필렛 혼용 없음 (국내산 원물)</li>
        <li>HACCP 인증 가공 시설</li>
        <li>잔가시가 남을 수 있으니 드실 때 유의</li>
      </ul>
    </div>
    <figure class="mall-detail__split-media">
      <img src="${PRODUCT_IMG}" alt="광어회 실제 상품 클로즈업" loading="lazy" />
      <figcaption><b>실제 상품</b></figcaption>
    </figure>
  </div>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">② 마트 회와 무엇이 다른가요?</h3>
    <table class="mall-detail__compare">
      <thead>
        <tr><th>구분</th><th>대형마트 회</th><th>수산아빠 광어회</th></tr>
      </thead>
      <tbody>
        <tr><td>손질 시점</td><td>전일·당일 오전 일괄</td><td><b>주문 후 당일 손질</b></td></tr>
        <tr><td>용량</td><td>고정 중량 위주</td><td>300g / 500g / 1kg 선택</td></tr>
        <tr><td>배송</td><td>매장 픽업·일반 택배</td><td>냉장·아이스팩 포장</td></tr>
        <tr><td>신선도</td><td>진열 시간에 따라 편차</td><td>출고 직후 냉장 유통</td></tr>
      </tbody>
    </table>
  </section>

  <p class="mall-detail__ref-note">아래 3장은 <b>광어회 이해를 돕기 위한 참고 사진</b>입니다. (타 생선·연출 컷이 포함될 수 있습니다)</p>

  <div class="mall-detail__gallery mall-detail__gallery--refs">
    <figure>
      <img src="${D}/ref-sashimi-plate.jpg" alt="회 플레이팅 참고" loading="lazy" />
      <figcaption>참고 · 회 플레이팅 예시</figcaption>
    </figure>
    <figure>
      <img src="${D}/ref-raw-sashimi.jpg" alt="생선회 참고" loading="lazy" />
      <figcaption>참고 · 생선회 식탁 예시</figcaption>
    </figure>
    <figure>
      <img src="${D}/ref-fish-on-ice.jpg" alt="냉장 생선 유통 참고" loading="lazy" />
      <figcaption>참고 · 냉장·보냉 유통</figcaption>
    </figure>
  </div>

  <section class="mall-detail__section mall-detail__section--process">
    <h3 class="mall-detail__title">③ 주문부터 식탁까지 4단계</h3>
    <ol class="mall-detail__steps">
      <li><span class="mall-detail__step-no">01</span><strong>주문·결제</strong><p>용량(300g/500g/1kg) 선택</p></li>
      <li><span class="mall-detail__step-no">02</span><strong>당일 손질</strong><p>국내산 광어 → 회 가공</p></li>
      <li><span class="mall-detail__step-no">03</span><strong>냉장 포장</strong><p>스티로폼·아이스팩·비닐 이중 포장</p></li>
      <li><span class="mall-detail__step-no">04</span><strong>신선 배송</strong><p>수령 후 즉시 냉장 보관</p></li>
    </ol>
  </section>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">상품 정보</h3>
    <table class="mall-detail__table">
      <tbody>
        <tr><th>상품명</th><td>국내산 광어회</td></tr>
        <tr><th>원산지</th><td>전남 완도 (국내산)</td></tr>
        <tr><th>용량 옵션</th><td>300g / 500g(기본) / 1kg</td></tr>
        <tr><th>가공</th><td>회용 슬라이스 (가시·비늘 제거)</td></tr>
        <tr><th>보관</th><td>수령 즉시 냉장(0~5℃), 당일~익일 섭취 권장</td></tr>
        <tr><th>배송</th><td>냉장 택배 · 산지직송</td></tr>
      </tbody>
    </table>
  </section>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">맛있게 드시는 법</h3>
    <ul>
      <li>택배 수령 후 <b>30분 이내 냉장</b> 보관해 주세요.</li>
      <li>드시기 10~15분 전에 꺼내면 식감이 살아납니다.</li>
      <li>초장·와사비·깻잎·양파·마늘을 곁들여 보세요.</li>
      <li>2인 기준 500g, 가족·모임은 1kg을 추천드립니다.</li>
    </ul>
  </section>

  <dl class="mall-detail__qa">
    <dt>사진과 받는 상품이 같나요?</dt>
    <dd><b>실제 상품 사진</b>은 상단·본문의 광어회 이미지이며, 선택하신 용량·손질 상태에 맞게 발송됩니다. 참고 사진은 연출용입니다.</dd>
    <dt>냉동으로 오나요?</dt>
    <dd>아닙니다. <b>냉장 상태</b>로 발송하며, 아이스팩이 함께 동봉됩니다.</dd>
    <dt>가시는 없나요?</dt>
    <dd>손질 시 대부분 제거하지만, <b>잔가시가 남을 수 있습니다</b>.</dd>
  </dl>

  <div class="mall-detail__notice">
    <strong>신선 수산물 안내</strong>
    <p>신선 회는 단순 변심 반품이 어렵습니다. 변질·파손·오배송은 수령 후 24시간 이내 사진과 함께 고객센터로 연락해 주세요.</p>
  </div>
</div>
`.trim();

export const SF1_ADMIN_IMAGES = [
  { id: 'sf1-a1', url: PRODUCT_IMG, label: '실제 상품 (대표)' },
  { id: 'sf1-a2', url: PRODUCT_IMG, label: '실제 상품 (구성)' },
  { id: 'sf1-a3', url: `${D}/ref-sashimi-plate.jpg`, label: '참고: 회 플레이팅' },
  { id: 'sf1-a4', url: `${D}/ref-raw-sashimi.jpg`, label: '참고: 생선회' },
];
