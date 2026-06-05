/** 문경 사과(fr2) 상세페이지 HTML — scripts/set-fr2-detail-page.ts */
const D = '/images/products/detail/fr2';
const PRODUCT_IMG = '/images/products/fr2.png';

export const FR2_DETAIL_HTML = `
<div class="mall-detail mall-detail--apple">
  <figure class="mall-detail__hero">
    <img src="${PRODUCT_IMG}" alt="수산아빠 문경 사과 대표 상품" loading="eager" />
    <figcaption class="mall-detail__hero-cap">수산아빠 · 경북 문경 산지직송 사과</figcaption>
  </figure>

  <div class="mall-detail__intro">
    <p class="mall-detail__eyebrow">경북 문경 · 산지직송</p>
    <h2 class="mall-detail__headline">아삭한 식감,<br>달콤한 햇 문경 사과</h2>
    <p class="mall-detail__lead">큰 일교차와 청정 산간 기후에서 자란 <b>문경 사과</b>를 산지에서 선별·포장해 보내 드립니다. 1kg·2kg·4kg 중 선택 가능합니다.</p>
  </div>

  <ul class="mall-detail__points">
    <li><strong>문경 산지</strong><span>경북 사과 주산지</span></li>
    <li><strong>당일 선별</strong><span>크기·색·상처 검수</span></li>
    <li><strong>낱개 포장</strong><span>충격 완충 포장</span></li>
    <li><strong>중량 3종</strong><span>1kg / 2kg / 4kg</span></li>
  </ul>

  <blockquote class="mall-detail__quote">
    <p><span class="mall-detail__quote-mark">'문경 사과'</span>는</p>
    <p>맑은 공기와 일교차가 큰 산간에서 익어</p>
    <p><b>아삭한 식감</b>과 <b>은은한 단맛</b>이 조화를 이루는</p>
    <p>가을·겨울 제철 사과입니다.</p>
  </blockquote>

  <figure class="mall-detail__figure mall-detail__figure--lg">
    <img src="${D}/basket-fresh.jpg" alt="신선한 사과 바구니" loading="lazy" />
    <figcaption>선별된 문경 사과 — 당도·색·결점을 확인한 뒤 포장합니다</figcaption>
  </figure>

  <div class="mall-detail__band">
    <p class="mall-detail__band-label">WHY 수산아빠</p>
    <p class="mall-detail__band-text">사과는 <b>수확 시점과 보관</b>이 맛을 좌우합니다.<br>산지 선별부터 포장·배송까지 신선도를 지킵니다.</p>
  </div>

  <div class="mall-detail__strip">
    <figure>
      <img src="${D}/orchard-hill.jpg" alt="사과 농원 전경" loading="lazy" />
      <figcaption>① 문경 산간 사과밭 — 일교차로 당도가 쌓입니다</figcaption>
    </figure>
    <figure>
      <img src="${D}/branch-red.jpg" alt="나무에 달린 사과" loading="lazy" />
      <figcaption>② 익은 시기에 수확 — 색·경도 기준으로 선별</figcaption>
    </figure>
    <figure>
      <img src="${D}/apple-cut.jpg" alt="사과 단면" loading="lazy" />
      <figcaption>③ 아삭한 과육 — 저장성·식감 우수</figcaption>
    </figure>
    <figure>
      <img src="${D}/crate-harvest.jpg" alt="수확 사과 상자" loading="lazy" />
      <figcaption>④ 당일·익일 출고 — 산지에서 바로 포장</figcaption>
    </figure>
  </div>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title mall-detail__title--center">어디서 생산하나요?</h3>
    <p class="mall-detail__center-text">전국 사과 생산의 중심 <b>경북 문경</b> 일대에서 재배합니다. 산간 청정 지역의 맑은 공기와 큰 일교차, 배수가 잘 되는 사질양토에서 자란 <b>햇 문경 사과</b>입니다.</p>
    <figure class="mall-detail__figure">
      <img src="${D}/orchard-hill.jpg" alt="문경 사과 산지" loading="lazy" />
    </figure>
  </section>

  <div class="mall-detail__split mall-detail__split--reverse">
    <div class="mall-detail__split-text">
      <h3 class="mall-detail__title">당일 수확 · 당일 발송</h3>
      <p>미리 떼어 두지 않고, 주문·산지 상황에 맞춰 수확한 사과를 선별해 발송합니다.</p>
      <ul>
        <li>평일 <b>오전 11시 이전</b> 결제 시 당일 출고 (산지·기상에 따라 ±1일)</li>
        <li>크기·색·흠집 기준 1차·2차 선별</li>
        <li>과일끼리 마찰 최소화 포장</li>
      </ul>
      <p class="mall-detail__fine">*기상 악화·산지 사정으로 하루 정도 지연될 수 있습니다.</p>
    </div>
    <figure class="mall-detail__split-media">
      <img src="${D}/crate-harvest.jpg" alt="수확·선별 사과" loading="lazy" />
    </figure>
  </div>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">포장 및 배송 방법</h3>
    <p>배송 중 파손을 줄이기 위해 <b>완충재·낱개 분리 포장</b> 후 박스에 담아 보냅니다.</p>
    <div class="mall-detail__gallery">
      <figure>
        <img src="${D}/box-pack.jpg" alt="사과 포장 박스" loading="lazy" />
        <figcaption>완충 포장</figcaption>
      </figure>
      <figure>
        <img src="${PRODUCT_IMG}" alt="수산아빠 문경 사과 실제 상품" loading="lazy" />
        <figcaption>실제 판매 상품</figcaption>
      </figure>
    </div>
    <p class="mall-detail__fine">*포장 방식은 산지·수량에 따라 일부 달라질 수 있습니다.</p>
  </section>

  <ul class="mall-detail__features">
    <li><span class="mall-detail__feat-icon">🚚</span><strong>산지직송</strong><span>문경 → 택배 출고</span></li>
    <li><span class="mall-detail__feat-icon">🍎</span><strong>2단 선별</strong><span>크기·결점 검수</span></li>
    <li><span class="mall-detail__feat-icon">📦</span><strong>안전 포장</strong><span>충격·압력 완화</span></li>
    <li><span class="mall-detail__feat-icon">✅</span><strong>품질 A/S</strong><span>파손·변질 접수</span></li>
  </ul>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">② 마트 사과와 무엇이 다른가요?</h3>
    <table class="mall-detail__compare">
      <thead>
        <tr><th>구분</th><th>대형마트</th><th>수산아빠 문경 사과</th></tr>
      </thead>
      <tbody>
        <tr><td>선별</td><td>물량·등급 혼합</td><td><b>산지 2단 선별</b></td></tr>
        <tr><td>출고</td><td>물류센터 경유</td><td><b>산지 직송</b></td></tr>
        <tr><td>중량</td><td>고정 팩 위주</td><td>1kg / 2kg / 4kg</td></tr>
        <tr><td>신선도</td><td>진열·유통일수에 따라 편차</td><td>수확 후 빠른 출고</td></tr>
      </tbody>
    </table>
  </section>

  <section class="mall-detail__section mall-detail__section--process">
    <h3 class="mall-detail__title">주문부터 식탁까지 4단계</h3>
    <ol class="mall-detail__steps">
      <li><span class="mall-detail__step-no">01</span><strong>주문·결제</strong><p>중량(1kg/2kg/4kg) 선택</p></li>
      <li><span class="mall-detail__step-no">02</span><strong>산지 선별</strong><p>문경 사과 크기·색·결점 검수</p></li>
      <li><span class="mall-detail__step-no">03</span><strong>완충 포장</strong><p>낱개 분리·박스 포장</p></li>
      <li><span class="mall-detail__step-no">04</span><strong>택배 배송</strong><p>수령 후 서늘한 곳 보관</p></li>
    </ol>
  </section>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">보관 방법</h3>
    <ul>
      <li>직사광선을 피하고 <b>서늘한 곳</b>에 보관하세요.</li>
      <li>장기 보관 시 <b>냉장(0~4℃)</b>에 넣되, 다른 과일과 분리해 주세요. (에틸렌 가스)</li>
      <li>가급적 <b>1~2주 이내</b> 드시는 것을 권장합니다.</li>
    </ul>
  </section>

  <section class="mall-detail__section">
    <h3 class="mall-detail__title">상품 정보</h3>
    <table class="mall-detail__table">
      <tbody>
        <tr><th>상품명</th><td>문경 사과</td></tr>
        <tr><th>원산지</th><td>경북 문경 (국내산)</td></tr>
        <tr><th>중량 옵션</th><td>1kg / 2kg / 4kg</td></tr>
        <tr><th>품종</th><td>부사·홍로 등 산지 출하 시기 품종 (혼합 가능)</td></tr>
        <tr><th>보관</th><td>서늘한 곳 또는 냉장 (다른 과일과 분리)</td></tr>
        <tr><th>배송</th><td>택배 · 산지직송</td></tr>
      </tbody>
    </table>
  </section>

  <dl class="mall-detail__qa">
    <dt>사진과 받는 사과가 같나요?</dt>
    <dd>상단 <b>대표 상품컷(fr2.png)</b>과 같은 문경 사과를 보내 드립니다. 계절·품종에 따라 색·크기는 다소 달라질 수 있습니다. 본문 스톡 사진은 산지·품질 이해를 돕는 <b>연출 참고</b>입니다.</dd>
    <dt>껍질째 먹어도 되나요?</dt>
    <dd>세척 후 드시면 됩니다. 알레르기·위장이 예민하신 분은 껍질을 벗겨 드세요.</dd>
    <dt>파손·썩음이 있으면?</dt>
    <dd>수령 후 <b>24시간 이내</b> 사진과 함께 고객센터로 연락 주시면 교환·환불 안내드립니다.</dd>
  </dl>

  <div class="mall-detail__notice">
    <strong>신선 과일 안내</strong>
    <p>신선 과일은 단순 변심 반품이 어렵습니다. 파손·변질·오배송은 수령 후 24시간 이내 사진과 함께 접수해 주세요. 맛·당도 차이만으로는 교환·환불이 어렵습니다.</p>
  </div>
</div>
`.trim();

export const FR2_ADMIN_IMAGES = [
  { id: 'fr2-a1', url: PRODUCT_IMG, label: '실제 상품 (대표)' },
  { id: 'fr2-a2', url: `${D}/basket-fresh.jpg`, label: '선별 사과' },
  { id: 'fr2-a3', url: `${D}/orchard-hill.jpg`, label: '문경 산지' },
  { id: 'fr2-a4', url: `${D}/apple-cut.jpg`, label: '과육 단면' },
];
