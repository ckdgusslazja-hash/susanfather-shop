state.reviewsCache = state.reviewsCache || {};
state.reviewEligibility = state.reviewEligibility || {};
state.authMessage = '';

const _origGetReviews = typeof getReviewsByProduct === 'function' ? getReviewsByProduct : () => [];

window.getReviewsByProduct = function (productId) {
  if (state.reviewsCache[productId]?.length) return state.reviewsCache[productId];
  return _origGetReviews(productId);
};

async function ensureReviewEligibility(productId) {
  if (!productId) return;
  if (!API.user) {
    state.reviewEligibility[productId] = { canWrite: false, reason: 'login' };
    return;
  }
  try {
    state.reviewEligibility[productId] = await API.canWriteReview(productId);
  } catch {
    state.reviewEligibility[productId] = { canWrite: false, reason: 'error' };
  }
}

function goWriteReview(productId) {
  if (!API.user) {
    state.authMessage = '리뷰 작성은 로그인 후 가능합니다.';
    navigate('login');
    return;
  }
  const el = state.reviewEligibility?.[productId];
  if (el?.alreadyReviewed) {
    showToast('이미 리뷰를 작성하셨습니다.');
    return;
  }
  if (!el?.canWrite) {
    showToast('상품을 구매한 고객만 리뷰를 작성할 수 있습니다.');
    return;
  }
  navigate('write-review', { reviewProductId: productId });
}

function getReviewWriteButtonHtml(productId) {
  if (!API.user) {
    return `<button type="button" class="rp-header__write" onclick="goWriteReview('${productId}')">리뷰쓰기</button>`;
  }
  const el = state.reviewEligibility?.[productId];
  if (el === undefined) return '';
  if (el.alreadyReviewed) {
    return `<span class="rp-header__write rp-header__write--muted">작성완료</span>`;
  }
  if (!el.canWrite) return '';
  return `<button type="button" class="rp-header__write" onclick="goWriteReview('${productId}')">리뷰쓰기</button>`;
}

async function ensureReviews(productId) {
  if (!productId) return;
  try {
    state.reviewsCache[productId] = await API.getReviews(productId);
  } catch {
    state.reviewsCache[productId] = _origGetReviews(productId);
  }
}

function getShopInfo() {
  return (
    API.shopSettings || {
      name: '수산아빠',
      company: '리벤더',
      ceo: '변창현',
      businessNo: '423-39-00727',
      mailOrderNo: '2020-부산북구-0891',
      address: '부산광역시 북구 금곡대로470번길 29',
      email: 'reven9269@naver.com',
      hours: '09:00~18:00',
    }
  );
}

function getCustomerCenter() {
  return (
    API.customerCenter || {
      phone: '1588-0000',
      hours: '평일 09:00 ~ 18:00 (점심 12:00~13:00)',
      email: 'help@greenharvest.kr',
      faq: [
        { q: '배송은 얼마나 걸리나요?', a: '결제 완료 후 1~3일 내 출고됩니다. 제주·도서는 1~2일 추가 소요될 수 있습니다.' },
        { q: '교환/반품은 어떻게 하나요?', a: '마이페이지 주문내역 또는 고객센터로 접수해 주세요. 신선식품은 수령 후 24시간 이내 사진과 함께 접수해 주세요.' },
      ],
    }
  );
}

function renderSiteFooter() {
  const shop = getShopInfo();
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="footer__grid">
      <div>
        <p class="footer__brand">${shop.name || '수산아빠'}</p>
        <p class="footer__meta">대표 ${shop.ceo || ''}</p>
        <p class="footer__meta">회사명 : ${shop.company || '리벤더'}</p>
        <p class="footer__meta">사업자등록번호 ${shop.businessNo || ''}</p>
        <p class="footer__meta">통신판매업 ${shop.mailOrderNo || ''}</p>
        <p class="footer__meta">${shop.address || ''}</p>
        <p class="footer__meta">이메일 ${shop.email || ''}</p>
        <p class="footer__meta">영업시간 ${shop.hours || ''}</p>
      </div>
      <nav class="footer__links" aria-label="쇼핑몰 정보">
        <a href="#" onclick="navigate('shop-info');return false">쇼핑몰 정보</a>
        <a href="#" onclick="navigate('inquiry');return false">문의함</a>
      </nav>
    </div>
    <p class="footer__copy">© ${new Date().getFullYear()} ${shop.name || '수산아빠'}. All rights reserved.</p>
  `;
}

function renderAuthWrap(title, body, linksHtml) {
  return `
    <div class="auth-page">
      <h2 class="section-title">${title}</h2>
      ${state.authMessage ? `<p class="auth-msg">${state.authMessage}</p>` : ''}
      ${body}
      <div class="auth-links">${linksHtml}</div>
    </div>
  `;
}

function renderLogin() {
  const u = API.user;
  if (u && u.role !== 'admin') {
    return renderMypage();
  }
  return renderAuthWrap(
    '로그인',
    `<form class="auth-form" onsubmit="handleLogin(event)">
      <div class="form-group"><label>이메일</label><input type="email" name="email" required placeholder="you@email.com" /></div>
      <div class="form-group"><label>비밀번호</label><input type="password" name="password" required minlength="8" /></div>
      <button type="submit" class="btn btn--primary btn--lg btn--block">로그인</button>
    </form>`,
    `<a href="#" onclick="navigate('signup');return false">회원가입</a>
     <a href="#" onclick="navigate('find-id');return false">아이디 찾기</a>
     <a href="#" onclick="navigate('find-pw');return false">비밀번호 찾기</a>
     <a href="#" onclick="navigate('home');return false">홈으로</a>`
  );
}

function renderSignup() {
  return renderAuthWrap(
    '회원가입',
    `<form class="auth-form" onsubmit="handleSignup(event)">
      <div class="form-group"><label>이름 <span class="required">*</span></label><input name="name" required /></div>
      <div class="form-group"><label>이메일 <span class="required">*</span></label><input type="email" name="email" required /></div>
      <div class="form-group"><label>휴대폰</label><input type="tel" name="phone" placeholder="010-0000-0000" /></div>
      <div class="form-group"><label>비밀번호 (8자+) <span class="required">*</span></label><input type="password" name="password" required minlength="8" /></div>
      <div class="form-group"><label>비밀번호 확인</label><input type="password" name="password2" required minlength="8" /></div>
      <button type="submit" class="btn btn--primary btn--lg btn--block">가입하기</button>
    </form>`,
    `<a href="#" onclick="navigate('login');return false">로그인</a>
     <a href="#" onclick="navigate('home');return false">홈으로</a>`
  );
}

function renderFindId() {
  return renderAuthWrap(
    '아이디 찾기',
    `<form class="auth-form" onsubmit="handleFindEmail(event)">
      <div class="form-group"><label>이름</label><input name="name" required /></div>
      <div class="form-group"><label>휴대폰 (가입 시 입력)</label><input name="phone" required placeholder="010-0000-0000" /></div>
      <button type="submit" class="btn btn--primary btn--block">찾기</button>
    </form>`,
    `<a href="#" onclick="navigate('login');return false">로그인</a>`
  );
}

function renderFindPw() {
  return renderAuthWrap(
    '비밀번호 재설정',
    `<form class="auth-form" onsubmit="handleResetPassword(event)">
      <div class="form-group"><label>가입 이메일</label><input type="email" name="email" required /></div>
      <div class="form-group"><label>새 비밀번호 (8자+)</label><input type="password" name="newPassword" required minlength="8" /></div>
      <button type="submit" class="btn btn--primary btn--block">변경하기</button>
    </form>`,
    `<a href="#" onclick="navigate('login');return false">로그인</a>`
  );
}

function renderMypage() {
  const u = API.user;
  if (!u) {
    navigate('login');
    return '';
  }
  const tab = state.mypageTab || 'orders';
  return `
    <div class="mypage-wrap">
      <div class="mypage-profile">
        <p class="mypage-profile__name"><strong>${escapeHtml(u.name)}</strong>님</p>
        <p class="mypage-profile__email">${escapeHtml(u.email)}</p>
      </div>
      ${renderMypageQuickNav(tab)}
      <div class="mypage-panel">
        ${tab === 'orders' ? renderMypageOrdersSection() : ''}
        ${tab === 'wishlist' ? renderMypageProductPanel('찜리스트', getWishlistProducts()) : ''}
        ${tab === 'recent' ? renderMypageProductPanel('최근 본 상품', getRecentProducts()) : ''}
        ${tab === 'frequent' ? renderMypageProductPanel('자주 산 상품', getFrequentProducts(state.myOrders)) : ''}
        ${tab === 'menu' ? renderMypageAllMenu() : ''}
      </div>
    </div>
  `;
}

function setMypageTab(tab) {
  state.mypageTab = tab;
  render();
  if (tab === 'orders') initMypageOrders();
}

function getWishlistProducts() {
  return state.wishlist.map((id) => getProduct(id)).filter(Boolean);
}

function getFrequentProducts(orders) {
  const counts = {};
  (orders || []).forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item) => {
      if (!item?.productId) return;
      counts[item.productId] = (counts[item.productId] || 0) + (item.quantity || 1);
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id]) => getProduct(id))
    .filter(Boolean);
}

function getOrderStatusLabel(status) {
  const map = {
    paid: '배송준비',
    shipping: '배송중',
    delivered: '배송완료',
    completed: '배송완료',
    test_paid: '주문완료',
  };
  return map[status] || '주문완료';
}

function renderMypageQuickNav(active) {
  const items = [
    { id: 'orders', icon: '📋', label: '주문내역' },
    { id: 'wishlist', icon: '♥', label: '찜리스트' },
    { id: 'recent', icon: '👁', label: '최근본상품' },
    { id: 'frequent', icon: '🔁', label: '자주산상품' },
    { id: 'menu', icon: '▦', label: '전체메뉴' },
  ];
  return `
    <nav class="mypage-quick-nav" aria-label="마이페이지 메뉴">
      ${items
        .map(
          (item) => `
        <button type="button" class="mypage-quick-nav__item ${active === item.id ? 'is-active' : ''}"
          onclick="setMypageTab('${item.id}')">
          <span class="mypage-quick-nav__icon">${item.icon}</span>
          <span class="mypage-quick-nav__label">${item.label}</span>
        </button>`
        )
        .join('')}
    </nav>
  `;
}

function renderMypageOrdersSection() {
  return `
    <section class="mypage-section" id="mypage-orders-section">
      <div class="mypage-section__head">
        <h2 class="mypage-section__title">주문 내역</h2>
        <button type="button" class="mypage-section__more" onclick="initMypageOrders(true)">전체 보기 ›</button>
      </div>
      <div class="mypage-orders-scroll" id="mypage-orders-scroll">
        <p class="mypage-empty">주문 내역 불러오는 중…</p>
      </div>
    </section>
  `;
}

function renderMypageOrderCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const product = items[0]?.productId ? getProduct(items[0].productId) : null;
  const statusLabel = getOrderStatusLabel(order.status);
  const isDone = ['delivered', 'completed', 'paid'].includes(order.status);
  const dateStr = (order.created_at || '').slice(0, 10).replace(/-/g, '.');
  const thumb = product
    ? `<div class="mypage-order-card__thumb" style="background:${product.gradient}">${product.emoji}</div>`
    : `<div class="mypage-order-card__thumb mypage-order-card__thumb--empty">📦</div>`;
  const reorderBtn = product
    ? `<button type="button" class="mypage-order-card__reorder" title="다시 담기" onclick="event.stopPropagation();addToCart('${product.id}')">🛒<span>+</span></button>`
    : '';

  return `
    <article class="mypage-order-card" onclick="showToast('주문번호 ${escapeHtml(order.id)}')">
      <div class="mypage-order-card__top">
        <span class="mypage-order-card__ship">🚚 산지직송</span>
        ${dateStr ? `<span class="mypage-order-card__eta">${dateStr}</span>` : ''}
      </div>
      <p class="mypage-order-card__status ${isDone ? 'is-done' : ''}">${statusLabel}</p>
      <div class="mypage-order-card__body">
        ${thumb}
        ${reorderBtn}
      </div>
      ${items.length > 1 ? `<p class="mypage-order-card__more">외 ${items.length - 1}건</p>` : ''}
      <p class="mypage-order-card__price">${formatPrice(order.total)}</p>
    </article>
  `;
}

function renderMypageOrdersHtml(orders) {
  if (!orders.length) {
    return `<p class="mypage-empty">주문 내역이 없습니다.<br><button type="button" class="btn btn--primary btn--sm" style="margin-top:12px" onclick="navigate('home')">쇼핑하러 가기</button></p>`;
  }
  return orders.map(renderMypageOrderCard).join('');
}

function renderMypageProductPanel(title, products) {
  if (!products.length) {
    return `
      <section class="mypage-section">
        <div class="mypage-section__head"><h2 class="mypage-section__title">${title}</h2></div>
        <p class="mypage-empty">${title === '찜리스트' ? '찜한 상품이 없습니다.' : title === '최근 본 상품' ? '최근 본 상품이 없습니다.' : '자주 구매한 상품이 없습니다.'}</p>
      </section>`;
  }
  return `
    <section class="mypage-section">
      <div class="mypage-section__head"><h2 class="mypage-section__title">${title}</h2></div>
      <div class="mypage-product-scroll">
        ${products
          .map(
            (p) => `
          <button type="button" class="mypage-product-card" onclick="navigate('detail',{productId:'${p.id}'})">
            <div class="mypage-product-card__thumb" style="background:${p.gradient}">${p.emoji}</div>
            <p class="mypage-product-card__name">${escapeHtml(p.name)}</p>
            <p class="mypage-product-card__price">${formatPrice(p.price)}</p>
          </button>`
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderMypageAllMenu() {
  return `
    <section class="mypage-section">
      <div class="mypage-section__head"><h2 class="mypage-section__title">전체 메뉴</h2></div>
      <div class="mypage-menu-list">
        <button type="button" class="mypage-menu-item" onclick="navigate('addresses')">배송지 관리</button>
        <button type="button" class="mypage-menu-item" onclick="navigate('inquiry')">1:1 문의</button>
        <button type="button" class="mypage-menu-item mypage-menu-item--muted" onclick="doLogout()">로그아웃</button>
      </div>
    </section>
  `;
}

async function initMypageOrders(forceReload) {
  const el = document.getElementById('mypage-orders-scroll');
  if (!el) return;
  if (!forceReload && state.myOrders.length) {
    el.innerHTML = renderMypageOrdersHtml(state.myOrders);
    return;
  }
  el.innerHTML = '<p class="mypage-empty">주문 내역 불러오는 중…</p>';
  try {
    state.myOrders = await API.myOrders();
    el.innerHTML = renderMypageOrdersHtml(state.myOrders);
    if (state.mypageTab === 'frequent') render();
  } catch (e) {
    el.innerHTML = `<p class="mypage-empty">${escapeHtml(e.message)}</p>`;
  }
}

async function loadMyOrders() {
  state.mypageTab = 'orders';
  await initMypageOrders(true);
  render();
}

function renderShopInfo() {
  const s = getShopInfo();
  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('home');return false">홈</a> / 쇼핑몰 정보</nav>
    <h2 class="section-title">쇼핑몰 정보</h2>
    <dl class="info-dl">
      <dt>상호</dt><dd>${s.name || ''}</dd>
      <dt>회사명</dt><dd>${s.company || ''}</dd>
      <dt>대표자</dt><dd>${s.ceo || ''}</dd>
      <dt>사업자등록번호</dt><dd>${s.businessNo || ''}</dd>
      <dt>통신판매업</dt><dd>${s.mailOrderNo || ''}</dd>
      <dt>주소</dt><dd>${s.address || ''}</dd>
      <dt>이메일</dt><dd>${s.email || ''}</dd>
      <dt>영업시간</dt><dd>${s.hours || ''}</dd>
    </dl>
  `;
}

function renderCustomerCenter() {
  const c = getCustomerCenter();
  const faq = (c.faq || [])
    .map((f) => `<details class="faq-item"><summary>${f.q}</summary><p>${f.a}</p></details>`)
    .join('');
  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('home');return false">홈</a> / 고객센터</nav>
    <h2 class="section-title">고객센터</h2>
    <div class="cs-box">
      <p class="cs-phone">📞 ${c.phone}</p>
      <p>${c.hours}</p>
      <p>이메일: ${c.email}</p>
      <button class="btn btn--primary" type="button" onclick="navigate('inquiry')">문의하기</button>
    </div>
    <h3 class="form-section__title">자주 묻는 질문</h3>
    ${faq}
  `;
}

function renderInquiry() {
  const u = API.user;
  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('customer-center');return false">고객센터</a> / 문의함</nav>
    <h2 class="section-title">1:1 문의</h2>
    <form class="auth-form" onsubmit="handleInquiry(event)">
      <div class="form-grid">
        <div class="form-group"><label>이름</label><input name="name" required value="${u?.name || ''}" /></div>
        <div class="form-group"><label>이메일</label><input type="email" name="email" required value="${u?.email || ''}" /></div>
        <div class="form-group"><label>연락처</label><input name="phone" value="${u?.phone || ''}" /></div>
        <div class="form-group"><label>유형</label>
          <select name="category">
            <option>배송</option><option>교환/반품</option><option>상품</option><option>결제</option><option>기타</option>
          </select>
        </div>
        <div class="form-group form-group--full"><label>제목</label><input name="title" required /></div>
        <div class="form-group form-group--full"><label>내용</label><textarea name="content" required rows="6"></textarea></div>
      </div>
      <button type="submit" class="btn btn--primary btn--lg">문의 접수</button>
    </form>
  `;
}

function renderWriteReview() {
  const pid = state.reviewProductId || state.selectedProductId;
  const product = getProduct(pid);
  if (!product) {
    navigate('home');
    return '';
  }
  if (!API.user) {
    state.authMessage = '리뷰 작성은 로그인 후 가능합니다.';
    navigate('login');
    return '';
  }
  const el = state.reviewEligibility?.[product.id];
  if (el?.alreadyReviewed) {
    return `
      <nav class="breadcrumb"><a href="#" onclick="navigate('reviews',{reviewProductId:'${product.id}'});return false">리뷰</a> / 작성</nav>
      <p class="auth-msg">이미 이 상품에 대한 리뷰를 작성하셨습니다.</p>
      <button class="btn btn--outline" type="button" onclick="navigate('reviews',{reviewProductId:'${product.id}'})">리뷰 목록으로</button>`;
  }
  if (el && !el.canWrite) {
    return `
      <nav class="breadcrumb"><a href="#" onclick="navigate('reviews',{reviewProductId:'${product.id}'});return false">리뷰</a> / 작성</nav>
      <p class="auth-msg">상품을 구매한 고객만 리뷰를 작성할 수 있습니다.</p>
      <button class="btn btn--outline" type="button" onclick="navigate('detail',{productId:'${product.id}'})">상품으로 돌아가기</button>`;
  }
  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('reviews',{reviewProductId:'${product.id}'});return false">리뷰</a> / 작성</nav>
    <h2 class="section-title">리뷰 작성 · ${product.name}</h2>
    <form class="auth-form" onsubmit="handleWriteReview(event)">
      <input type="hidden" name="productId" value="${product.id}" />
      <div class="form-group"><label>별점</label>
        <select name="rating" required>
          <option value="5">★★★★★ (5)</option>
          <option value="4">★★★★☆ (4)</option>
          <option value="3">★★★☆☆ (3)</option>
          <option value="2">★★☆☆☆ (2)</option>
          <option value="1">★☆☆☆☆ (1)</option>
        </select>
      </div>
      <div class="form-group"><label>제목</label><input name="title" placeholder="한 줄 요약" /></div>
      <div class="form-group"><label>내용</label><textarea name="content" required rows="5" placeholder="상품 후기를 작성해 주세요"></textarea></div>
      <button type="submit" class="btn btn--primary btn--lg">등록</button>
    </form>
  `;
}

function openDaumPostcode(targetIds) {
  if (!window.daum?.Postcode) {
    showToast('주소 API 로딩 중입니다. 잠시 후 다시 시도해 주세요.');
    return;
  }
  const ids = {
    zip: (targetIds && targetIds.zip) || 'zipcode',
    addr: (targetIds && targetIds.addr) || 'address-base',
    detail: (targetIds && targetIds.detail) || 'address-detail',
  };
  new daum.Postcode({
    oncomplete(data) {
      const zip = document.getElementById(ids.zip);
      const addr = document.getElementById(ids.addr);
      const detail = document.getElementById(ids.detail);
      if (zip) zip.value = data.zonecode;
      if (addr) addr.value = data.roadAddress || data.jibunAddress;
      if (detail) detail.focus();
    },
  }).open();
}

function fillCheckoutForm(addr) {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  const set = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = val || '';
  };
  set('name', addr.recipient_name);
  set('phone', addr.phone);
  set('zipcode', addr.zipcode);
  set('addressBase', addr.address);
  set('addressDetail', addr.address_detail);
}

function selectCheckoutAddress(id) {
  state.selectedAddressId = id;
  const addr = state.savedAddresses.find((a) => a.id === id);
  if (addr) fillCheckoutForm(addr);
  document.querySelectorAll('.address-card').forEach((el) => {
    el.classList.toggle('address-card--selected', el.dataset.id === id);
  });
  const saveWrap = document.getElementById('save-address-wrap');
  if (saveWrap) saveWrap.hidden = true;
}

function renderCheckoutAddressPicker() {
  const picker = document.getElementById('saved-address-picker');
  const saveWrap = document.getElementById('save-address-wrap');
  if (!picker || !API.user) return;

  if (!state.savedAddresses.length) {
    picker.hidden = true;
    if (saveWrap) saveWrap.hidden = false;
    return;
  }

  picker.hidden = false;
  if (saveWrap) saveWrap.hidden = true;

  const defaultId =
    state.selectedAddressId ||
    state.savedAddresses.find((a) => a.is_default)?.id ||
    state.savedAddresses[0]?.id;
  if (defaultId) state.selectedAddressId = defaultId;

  picker.innerHTML = `
    <p class="saved-address-picker__title">저장된 배송지</p>
    <div class="address-list">
      ${state.savedAddresses
        .map(
          (a) => `
        <button type="button" class="address-card ${a.id === state.selectedAddressId ? 'address-card--selected' : ''}"
          data-id="${a.id}" onclick="selectCheckoutAddress('${a.id}')">
          <span class="address-card__label">${escapeHtml(a.label)}${a.is_default ? ' · 기본' : ''}</span>
          <strong>${escapeHtml(a.recipient_name)}</strong>
          <span class="address-card__phone">${escapeHtml(a.phone)}</span>
          <span class="address-card__addr">[${escapeHtml(a.zipcode)}] ${escapeHtml(a.address)} ${escapeHtml(a.address_detail || '')}</span>
        </button>`
        )
        .join('')}
      <button type="button" class="address-card address-card--new" onclick="showNewCheckoutAddress()">
        + 새 배송지 입력
      </button>
    </div>
  `;

  const selected = state.savedAddresses.find((a) => a.id === state.selectedAddressId);
  if (selected) fillCheckoutForm(selected);
}

function showNewCheckoutAddress() {
  state.selectedAddressId = '';
  const form = document.getElementById('checkout-form');
  if (form) {
    ['name', 'phone', 'zipcode', 'addressBase', 'addressDetail'].forEach((name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = '';
    });
  }
  document.querySelectorAll('.address-card').forEach((el) => el.classList.remove('address-card--selected'));
  const saveWrap = document.getElementById('save-address-wrap');
  if (saveWrap) saveWrap.hidden = false;
}

async function bindCheckoutAddress() {
  const btn = document.getElementById('btn-search-address');
  if (btn) btn.onclick = () => openDaumPostcode();

  if (!API.user) {
    const saveWrap = document.getElementById('save-address-wrap');
    if (saveWrap) saveWrap.hidden = true;
    return;
  }

  try {
    state.savedAddresses = await API.getAddresses();
  } catch {
    state.savedAddresses = [];
  }
  renderCheckoutAddressPicker();
}

const addressBookState = { editingId: null, list: [] };
let addressBookLoaded = false;

function renderAddressForm() {
  const editing = addressBookState.list.find((a) => a.id === addressBookState.editingId);
  const v = editing || {
    label: '집',
    recipient_name: API.user?.name || '',
    phone: API.user?.phone || '',
    zipcode: '',
    address: '',
    address_detail: '',
    is_default: addressBookState.list.length === 0,
  };
  return `
    <form class="auth-form address-form" id="address-form" onsubmit="handleSaveAddress(event)">
      <div class="form-group"><label>배송지 이름</label>
        <input name="label" value="${escapeHtml(v.label)}" placeholder="집, 회사 등" required /></div>
      <div class="form-group"><label>받는 분</label>
        <input name="recipientName" value="${escapeHtml(v.recipient_name)}" required /></div>
      <div class="form-group"><label>연락처</label>
        <input name="phone" type="tel" value="${escapeHtml(v.phone)}" required /></div>
      <div class="form-group">
        <label>우편번호</label>
        <div class="address-row">
          <input type="text" id="addr-zipcode" name="zipcode" value="${escapeHtml(v.zipcode)}" readonly required />
          <button type="button" class="btn btn--outline" onclick="openDaumPostcode({zip:'addr-zipcode',addr:'addr-base',detail:'addr-detail'})">주소 검색</button>
        </div>
      </div>
      <div class="form-group"><label>주소</label>
        <input type="text" id="addr-base" name="address" value="${escapeHtml(v.address)}" readonly required /></div>
      <div class="form-group"><label>상세주소</label>
        <input type="text" id="addr-detail" name="addressDetail" value="${escapeHtml(v.address_detail)}" required /></div>
      <div class="form-group">
        <label class="checkbox-inline">
          <input type="checkbox" name="isDefault" ${v.is_default ? 'checked' : ''} /> 기본 배송지로 설정
        </label>
      </div>
      <div class="address-form__actions">
        <button type="submit" class="btn btn--primary">${addressBookState.editingId ? '수정' : '추가'}</button>
        ${addressBookState.editingId ? `<button type="button" class="btn btn--ghost" onclick="cancelEditAddress()">취소</button>` : ''}
      </div>
    </form>
  `;
}

function renderAddressBook() {
  if (!API.user) {
    navigate('login');
    return '';
  }
  if (!addressBookLoaded) {
    loadAddressBook().then(() => {
      addressBookLoaded = true;
      render();
    });
    return '<p class="text-muted" style="padding:24px">배송지 불러오는 중…</p>';
  }
  const listHtml = addressBookState.list.length
    ? addressBookState.list
        .map(
          (a) => `
      <div class="address-book-item">
        <div class="address-book-item__head">
          <strong>${escapeHtml(a.label)}${a.is_default ? ' <span class="badge-default">기본</span>' : ''}</strong>
          <span>${escapeHtml(a.recipient_name)} · ${escapeHtml(a.phone)}</span>
        </div>
        <p class="address-book-item__addr">[${escapeHtml(a.zipcode)}] ${escapeHtml(a.address)} ${escapeHtml(a.address_detail || '')}</p>
        <div class="address-book-item__actions">
          ${!a.is_default ? `<button type="button" class="btn btn--ghost btn--sm" onclick="setDefaultUserAddress('${a.id}')">기본 설정</button>` : ''}
          <button type="button" class="btn btn--outline btn--sm" onclick="startEditAddress('${a.id}')">수정</button>
          <button type="button" class="btn btn--ghost btn--sm" onclick="deleteUserAddress('${a.id}')">삭제</button>
        </div>
      </div>`
        )
        .join('')
    : '<p class="text-muted">등록된 배송지가 없습니다. 아래에서 추가해 주세요.</p>';

  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('mypage');return false">마이페이지</a> / 배송지 관리</nav>
    <h2 class="section-title">배송지 관리</h2>
    <p class="text-muted" style="margin-bottom:16px">최대 10개까지 저장할 수 있습니다.</p>
    <div class="address-book-list">${listHtml}</div>
    <h3 class="form-section__title">${addressBookState.editingId ? '배송지 수정' : '새 배송지 추가'}</h3>
    ${renderAddressForm()}
  `;
}

async function loadAddressBook() {
  if (!API.user) return;
  try {
    addressBookState.list = await API.getAddresses();
  } catch (e) {
    showToast(e.message);
    addressBookState.list = [];
  }
}

function startEditAddress(id) {
  addressBookState.editingId = id;
  render();
}

function cancelEditAddress() {
  addressBookState.editingId = null;
  render();
}

async function handleSaveAddress(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    label: fd.get('label'),
    recipientName: fd.get('recipientName'),
    phone: fd.get('phone'),
    zipcode: fd.get('zipcode'),
    address: fd.get('address'),
    addressDetail: fd.get('addressDetail'),
    isDefault: fd.get('isDefault') === 'on',
  };
  try {
    if (addressBookState.editingId) {
      await API.updateAddress(addressBookState.editingId, body);
      showToast('배송지가 수정되었습니다');
    } else {
      await API.createAddress(body);
      showToast('배송지가 추가되었습니다');
    }
    addressBookState.editingId = null;
    await loadAddressBook();
    render();
  } catch (err) {
    showToast(err.message);
  }
}

async function deleteUserAddress(id) {
  if (!confirm('이 배송지를 삭제할까요?')) return;
  try {
    await API.deleteAddress(id);
    if (addressBookState.editingId === id) addressBookState.editingId = null;
    await loadAddressBook();
    render();
    showToast('삭제되었습니다');
  } catch (err) {
    showToast(err.message);
  }
}

async function setDefaultUserAddress(id) {
  try {
    await API.setDefaultAddress(id);
    await loadAddressBook();
    render();
    showToast('기본 배송지로 설정되었습니다');
  } catch (err) {
    showToast(err.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await API.login({ email: fd.get('email'), password: fd.get('password') });
    API.setAuth(data.token, data.user);
    state.authMessage = '';
    state.reviewEligibility = {};
    showToast('로그인되었습니다');
    navigate('mypage');
  } catch (err) {
    state.authMessage = err.message;
    render();
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (fd.get('password') !== fd.get('password2')) {
    state.authMessage = '비밀번호가 일치하지 않습니다.';
    render();
    return;
  }
  try {
    const data = await API.signup({
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      password: fd.get('password'),
    });
    API.setAuth(data.token, data.user);
    showToast('가입을 환영합니다!');
    state.reviewEligibility = {};
    navigate('mypage');
  } catch (err) {
    state.authMessage = err.message;
    render();
  }
}

async function handleFindEmail(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const r = await API.findEmail({ name: fd.get('name'), phone: fd.get('phone') });
    state.authMessage = r.found ? `등록 이메일: ${r.email}` : r.message;
  } catch (err) {
    state.authMessage = err.message;
  }
  render();
}

async function handleResetPassword(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const r = await API.resetPassword({ email: fd.get('email'), newPassword: fd.get('newPassword') });
    state.authMessage = r.message;
    showToast(r.message);
  } catch (err) {
    state.authMessage = err.message;
  }
  render();
}

async function handleInquiry(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await API.postInquiry({
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      category: fd.get('category'),
      title: fd.get('title'),
      content: fd.get('content'),
    });
    showToast('문의가 접수되었습니다');
    navigate('customer-center');
  } catch (err) {
    showToast(err.message);
  }
}

async function handleWriteReview(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await API.postReview({
      productId: fd.get('productId'),
      rating: Number(fd.get('rating')),
      title: fd.get('title'),
      content: fd.get('content'),
    });
    delete state.reviewsCache[fd.get('productId')];
    state.reviewEligibility[fd.get('productId')] = { canWrite: false, alreadyReviewed: true };
    await ensureReviews(fd.get('productId'));
    showToast('리뷰가 등록되었습니다');
    navigate('reviews', { reviewProductId: fd.get('productId') });
  } catch (err) {
    showToast(err.message);
  }
}

function doLogout() {
  API.logout();
  state.reviewEligibility = {};
  showToast('로그아웃되었습니다');
  navigate('home');
}

const EXTRA_PAGES = {
  login: renderLogin,
  signup: renderSignup,
  'find-id': renderFindId,
  'find-pw': renderFindPw,
  mypage: renderMypage,
  addresses: renderAddressBook,
  'shop-info': renderShopInfo,
  'customer-center': renderCustomerCenter,
  inquiry: renderInquiry,
  'write-review': renderWriteReview,
};

function updateNavAuth() {
  const el = document.getElementById('nav-auth');
  if (!el) return;
  el.textContent = API.user ? '마이메뉴' : '로그인';
  el.dataset.page = API.user ? 'mypage' : 'login';
  const bottomMypage = document.querySelector('.bottom-nav__item[data-nav="mypage"]');
  if (bottomMypage) {
    const spans = bottomMypage.querySelectorAll('span');
    const label = spans[spans.length - 1];
    if (label && !label.classList.contains('bottom-nav__icon') && !label.classList.contains('bottom-nav__badge')) {
      label.textContent = API.user ? '마이메뉴' : '마이';
    }
  }
}

const _navigateOrig = navigate;
window.navigate = function (page, params = {}) {
  if (page === 'addresses') addressBookLoaded = false;
  if (page === 'checkout') state.selectedAddressId = '';
  if (page === 'mypage') state.mypageTab = state.mypageTab || 'orders';
  return _navigateOrig(page, params);
};

const _renderOrig = render;
window.render = function () {
  _renderOrig();
  updateNavAuth();
  if (state.page === 'mypage' && (state.mypageTab || 'orders') === 'orders') {
    initMypageOrders();
  }
};

initApp();
