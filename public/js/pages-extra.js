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
      phone: '010 4730 9269',
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
        { q: '교환/반품은 어떻게 하나요?', a: '신선·냉장·냉동 농수산물은 단순 변심 교환·반품이 불가합니다. 파손·변질·오배송 등 품질 이상은 수령 후 24시간 이내 사진과 함께 마이페이지 또는 고객센터로 접수해 주세요.' },
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
        <p class="footer__meta">연락처 ${shop.phone || '010 4730 9269'}</p>
        <p class="footer__meta">영업시간 ${shop.hours || ''}</p>
      </div>
      <nav class="footer__links" aria-label="쇼핑몰 정보">
        <a href="#" onclick="navigate('shop-info');return false">쇼핑몰 정보</a>
        <a href="#" onclick="navigate('order-lookup');return false">주문·배송 조회</a>
        <a href="#" onclick="navigate('terms');return false">이용약관</a>
        <a href="#" onclick="navigate('privacy');return false">개인정보처리방침</a>
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
     <a href="#" onclick="navigate('order-lookup');return false">비회원 주문조회</a>
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

function renderChangePassword() {
  if (!API.user) {
    navigate('login');
    return '';
  }
  return renderAuthWrap(
    '비밀번호 변경',
    `${state.passwordMessage ? `<p class="auth-msg">${state.passwordMessage}</p>` : ''}
    <form class="auth-form" onsubmit="handleChangePassword(event)">
      <div class="form-group"><label>현재 비밀번호</label><input type="password" name="currentPassword" required minlength="8" autocomplete="current-password" /></div>
      <div class="form-group"><label>새 비밀번호 (8자+)</label><input type="password" name="newPassword" required minlength="8" autocomplete="new-password" /></div>
      <div class="form-group"><label>새 비밀번호 확인</label><input type="password" name="newPassword2" required minlength="8" autocomplete="new-password" /></div>
      <button type="submit" class="btn btn--primary btn--block">비밀번호 변경</button>
    </form>`,
    `<a href="#" onclick="navigate('mypage');return false">마이메뉴</a>
     <a href="#" onclick="navigate('home');return false">홈으로</a>`
  );
}

async function handleChangePassword(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (fd.get('newPassword') !== fd.get('newPassword2')) {
    state.passwordMessage = '새 비밀번호가 일치하지 않습니다.';
    render();
    return;
  }
  try {
    const res = await API.changePassword({
      currentPassword: fd.get('currentPassword'),
      newPassword: fd.get('newPassword'),
    });
    state.passwordMessage = '';
    showToast(res.message || '비밀번호가 변경되었습니다.');
    navigate('mypage');
  } catch (err) {
    state.passwordMessage = err.message;
    render();
  }
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

const ORDER_STATUS_LABELS = {
  awaiting_deposit: '입금 대기',
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비 중',
  shipping: '배송 중',
  done: '배송 완료',
  cancelled: '주문 취소',
};

const ORDER_STATUS_STEPS = ['awaiting_deposit', 'paid', 'preparing', 'shipping', 'done'];

function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || '처리 중';
}

function getPaymentLabel(method) {
  return { card: '신용/체크카드', transfer: '무통장 입금', kakao: '간편결제' }[method] || method || '-';
}

function canCancelOrder(status) {
  return ['awaiting_deposit', 'pending', 'paid', 'preparing'].includes(status);
}

function getTrackingUrl(company, number) {
  if (!number) return '';
  const c = (company || '').toLowerCase();
  if (c.includes('cj') || c.includes('대한통운')) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${encodeURIComponent(number)}`;
  }
  if (c.includes('우체') || c.includes('epost')) {
    return `https://service.epost.go.kr/trace.RetrieveDomRi498.parcel?sid1=${encodeURIComponent(number)}`;
  }
  return `https://tracker.delivery/#/${encodeURIComponent(company || 'kr.cjlogistics')}/${encodeURIComponent(number)}`;
}

function formatOrderDate(iso) {
  if (!iso) return '-';
  return iso.slice(0, 16).replace('T', ' ').replace(/-/g, '.');
}

function parseOrderItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return [];
}

function renderOrderStatusSteps(status) {
  if (status === 'cancelled') {
    return `<p class="order-detail__cancelled">주문이 취소되었습니다.</p>`;
  }
  const activeIdx = ORDER_STATUS_STEPS.indexOf(status);
  const labels = {
    awaiting_deposit: '입금확인',
    paid: '결제완료',
    preparing: '상품준비',
    shipping: '배송중',
    done: '배송완료',
  };
  return `
    <ol class="order-steps ${status === 'pending' ? 'order-steps--pending' : ''}">
      ${ORDER_STATUS_STEPS.map((step, i) => {
        const done = activeIdx >= i || (status === 'pending' && step === 'paid');
        const current = status === step || (status === 'pending' && step === 'paid');
        return `<li class="order-steps__item ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}"><span>${labels[step]}</span></li>`;
      }).join('')}
    </ol>`;
}

function renderOrderItemsList(items) {
  const list = parseOrderItems(items);
  if (!list.length) return '<p class="text-muted">상품 정보 없음</p>';
  return `
    <ul class="order-items">
      ${list
        .map((item) => {
          const product = getProduct(item.productId);
          const qty = item.quantity || 1;
          const opt = product ? getCartItemOption(product, item) : null;
          const unitPrice = product ? getOptionSalePrice(product, opt) : 0;
          const price = unitPrice * qty;
          const optLabel = opt?.label ? ` · ${opt.label}` : '';
          const thumb = product
            ? renderProductThumbHtml(product, 'order-items__thumb')
            : '<div class="order-items__thumb order-items__thumb--empty">📦</div>';
          return `
        <li class="order-items__row">
          ${thumb}
          <div class="order-items__info">
            <p class="order-items__name">${escapeHtml(product?.name || '상품')}${escapeHtml(optLabel)}</p>
            <p class="order-items__meta">수량 ${qty}${product ? ` · ${formatPrice(price)}` : ''}</p>
          </div>
          ${product ? `<button type="button" class="btn btn--ghost btn--sm" onclick="navigate('detail',{productId:'${product.id}'})">상품보기</button>` : ''}
        </li>`;
        })
        .join('')}
    </ul>`;
}

function renderOrderDetailBody(order, { showBack = true, backLabel = '목록', backAction = "navigate('mypage')" } = {}) {
  const status = order.status || 'paid';
  const statusLabel = getOrderStatusLabel(status);
  const trackingUrl = getTrackingUrl(order.tracking_company, order.tracking_number);
  const zip = order.zipcode || '';
  const addr = [zip ? `[${zip}]` : '', order.address, order.address_detail].filter(Boolean).join(' ');

  return `
    <div class="order-detail">
      <div class="order-detail__head">
        <div>
          <p class="order-detail__id">주문번호 <strong>${escapeHtml(order.id)}</strong></p>
          <p class="order-detail__date">${formatOrderDate(order.created_at)}</p>
        </div>
        <span class="order-detail__badge order-detail__badge--${status}">${statusLabel}</span>
      </div>

      ${renderOrderStatusSteps(status)}

      ${
        order.tracking_number
          ? `<div class="order-detail__tracking">
              <strong>배송 조회</strong>
              <p>${escapeHtml(order.tracking_company || '택배')} · ${escapeHtml(order.tracking_number)}</p>
              ${trackingUrl ? `<a class="btn btn--outline btn--sm" href="${trackingUrl}" target="_blank" rel="noopener">택배 조회</a>` : ''}
            </div>`
          : ''
      }

      <section class="order-detail__section">
        <h3 class="order-detail__title">주문 상품</h3>
        ${renderOrderItemsList(order.items)}
      </section>

      <section class="order-detail__section">
        <h3 class="order-detail__title">배송 정보</h3>
        <dl class="order-detail__dl">
          <dt>받는 분</dt><dd>${escapeHtml(order.guest_name || '-')}</dd>
          <dt>연락처</dt><dd>${escapeHtml(order.guest_phone || '-')}</dd>
          <dt>주소</dt><dd>${escapeHtml(addr || '-')}</dd>
          ${order.memo ? `<dt>요청사항</dt><dd>${escapeHtml(order.memo)}</dd>` : ''}
        </dl>
      </section>

      <section class="order-detail__section">
        <h3 class="order-detail__title">결제 정보</h3>
        <dl class="order-detail__dl">
          <dt>결제수단</dt><dd>${escapeHtml(getPaymentLabel(order.payment_method))}</dd>
          <dt>상품금액</dt><dd>${formatPrice(order.subtotal)}</dd>
          <dt>배송비</dt><dd>${order.shipping ? formatPrice(order.shipping) : '무료'}</dd>
          <dt>총 결제</dt><dd><strong>${formatPrice(order.total)}</strong></dd>
        </dl>
      </section>

      <div class="order-detail__actions">
        ${showBack ? `<button type="button" class="btn btn--outline" onclick="${backAction}">${backLabel}</button>` : ''}
        ${
          API.user && canCancelOrder(status)
            ? `<button type="button" class="btn btn--ghost order-detail__cancel" onclick="handleCancelOrder('${order.id}')">주문 취소</button>`
            : ''
        }
        <button type="button" class="btn btn--primary" onclick="navigate('inquiry')">문의하기</button>
      </div>
    </div>`;
}

function goOrderDetail(orderId) {
  if (!orderId) return;
  const fromList = (state.myOrders || []).find((o) => o.id === orderId);
  if (fromList) {
    state.orderDetailCache = state.orderDetailCache || {};
    state.orderDetailCache[orderId] = fromList;
  }
  navigate('order-detail', { orderId });
}

async function loadOrderDetailPage(orderId) {
  try {
    let order;
    if (API.user) {
      order = await API.getOrder(orderId);
    } else if (state.guestOrderView?.id === orderId) {
      order = state.guestOrderView;
    } else {
      state.orderLookupPrefill = orderId;
      navigate('order-lookup');
      return;
    }
    state.orderDetailCache = state.orderDetailCache || {};
    state.orderDetailCache[orderId] = order;
    render();
  } catch (err) {
    showToast(err.message || '주문 정보를 불러올 수 없습니다.');
    navigate(API.user ? 'mypage' : 'order-lookup');
  }
}

function renderOrderDetail() {
  const orderId = state.orderId;
  if (!orderId) {
    navigate(API.user ? 'mypage' : 'order-lookup');
    return '';
  }
  const cached = state.orderDetailCache?.[orderId];
  if (!cached) {
    loadOrderDetailPage(orderId);
    return '<p class="mypage-empty" style="padding:24px">주문 정보 불러오는 중…</p>';
  }
  const back = API.user
    ? `<nav class="breadcrumb"><a href="#" onclick="navigate('mypage');return false">마이페이지</a> / 주문 상세</nav>`
    : `<nav class="breadcrumb"><a href="#" onclick="navigate('order-lookup');return false">주문 조회</a> / 상세</nav>`;
  return (
    back +
    `<h2 class="section-title">주문 상세</h2>` +
    renderOrderDetailBody(cached, {
      showBack: true,
      backLabel: API.user ? '주문 목록' : '다시 조회',
      backAction: API.user ? "navigate('mypage')" : "navigate('order-lookup')",
    })
  );
}

function renderOrderLookup() {
  const prefill = state.orderLookupPrefill || '';
  state.orderLookupPrefill = '';
  const result = state.orderLookupResult;
  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('home');return false">홈</a> / 주문·배송 조회</nav>
    <h2 class="section-title">주문·배송 조회</h2>
    <p class="text-muted" style="margin-bottom:20px">주문번호와 주문 시 입력한 연락처로 조회할 수 있습니다. 회원은 <a href="#" onclick="navigate('login');return false">로그인</a> 후 마이페이지에서도 확인할 수 있습니다.</p>
    <form class="auth-form order-lookup-form" onsubmit="handleOrderLookup(event)">
      <div class="form-group"><label>주문번호</label><input name="orderId" required placeholder="예: GH12345678" value="${escapeHtml(prefill)}" /></div>
      <div class="form-group"><label>연락처</label><input name="phone" type="tel" required placeholder="주문 시 입력한 휴대폰 번호" /></div>
      <button type="submit" class="btn btn--primary btn--lg btn--block">조회하기</button>
    </form>
    ${result ? `<div class="order-lookup-result">${renderOrderDetailBody(result, { showBack: false })}</div>` : ''}
  `;
}

async function handleOrderLookup(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const order = await API.lookupOrder({
      orderId: fd.get('orderId'),
      phone: fd.get('phone'),
    });
    state.guestOrderView = order;
    state.orderLookupResult = order;
    state.orderDetailCache = state.orderDetailCache || {};
    state.orderDetailCache[order.id] = order;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    state.orderLookupResult = null;
    showToast(err.message || '조회에 실패했습니다.');
  }
}

async function handleCancelOrder(orderId) {
  if (!API.user) {
    navigate('login');
    return;
  }
  if (!confirm('주문을 취소하시겠습니까? 입금 완료 건은 환불 처리 후 취소됩니다.')) return;
  try {
    const res = await API.cancelOrder(orderId);
    const order = res.order;
    state.orderDetailCache = state.orderDetailCache || {};
    state.orderDetailCache[orderId] = order;
    state.myOrders = (state.myOrders || []).map((o) => (o.id === orderId ? order : o));
    showToast('주문이 취소되었습니다.');
    render();
  } catch (err) {
    showToast(err.message || '취소에 실패했습니다.');
  }
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
  const isDone = ['done', 'delivered', 'completed'].includes(order.status);
  const dateStr = (order.created_at || '').slice(0, 10).replace(/-/g, '.');
  const thumb = product
    ? renderProductThumbHtml(product, 'mypage-order-card__thumb')
    : `<div class="mypage-order-card__thumb mypage-order-card__thumb--empty">📦</div>`;
  const reorderBtn = product
    ? `<button type="button" class="mypage-order-card__reorder" title="다시 담기" onclick="event.stopPropagation();addToCart('${product.id}')">🛒<span>+</span></button>`
    : '';

  return `
    <article class="mypage-order-card" onclick="goOrderDetail('${order.id}')">
      <div class="mypage-order-card__top">
        <span class="mypage-order-card__ship">🚚 산지직송</span>
        ${dateStr ? `<span class="mypage-order-card__eta">${dateStr}</span>` : ''}
      </div>
      <p class="mypage-order-card__status ${isDone ? 'is-done' : ''}">${statusLabel}</p>
      <p class="mypage-order-card__id">${escapeHtml(order.id)}</p>
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
            ${renderProductThumbHtml(p, 'mypage-product-card__thumb')}
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
        <button type="button" class="mypage-menu-item" onclick="navigate('order-lookup')">주문·배송 조회</button>
        <button type="button" class="mypage-menu-item" onclick="navigate('addresses')">배송지 관리</button>
        <button type="button" class="mypage-menu-item" onclick="navigate('change-password')">비밀번호 변경</button>
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

function renderLegalPage(title, bodyHtml) {
  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('home');return false">홈</a> / ${title}</nav>
    <h2 class="section-title">${title}</h2>
    <article class="legal-doc">${bodyHtml}</article>
  `;
}

function renderTerms() {
  const s = getShopInfo();
  const site = s.name || '수산아빠';
  const company = s.company || '리벤더';
  const ceo = s.ceo || '변창현';
  return renderLegalPage(
    '이용약관',
    `
    <p class="legal-doc__date">시행일: 2026년 6월 4일</p>
    <p>${site}(이하 "몰")은 ${company}(이하 "회사")가 운영하는 인터넷 쇼핑몰 서비스입니다. 본 약관은 회사와 이용자 간 권리·의무 및 책임사항을 규정합니다.</p>

    <h3>제1조 (목적)</h3>
    <p>본 약관은 ${site}(${window.location.origin || 'https://susanfather.com'})에서 제공하는 전자상거래 관련 서비스 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.</p>

    <h3>제2조 (정의)</h3>
    <ol>
      <li>"몰"이란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
      <li>"이용자"란 몰에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
      <li>"회원"이란 몰에 개인정보를 제공하여 회원등록을 한 자로서, 몰의 정보를 지속적으로 제공받으며 몰이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
    </ol>

    <h3>제3조 (약관의 명시·개정)</h3>
    <ol>
      <li>회사는 본 약관의 내용과 상호, 대표자 성명, 사업장 주소, 연락처 등을 이용자가 알 수 있도록 몰 초기화면에 게시합니다.</li>
      <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 적용일 7일 전부터 공지합니다.</li>
      <li>이용자가 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
    </ol>

    <h3>제4조 (회원가입)</h3>
    <ol>
      <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관 및 개인정보처리방침에 동의함으로써 회원가입을 신청합니다.</li>
      <li>회사는 다음 각 호에 해당하는 경우 가입을 거부하거나 사후에 이용계약을 해지할 수 있습니다: 타인의 정보 도용, 허위 정보 기재, 만 14세 미만, 기타 회사가 부적절하다고 판단하는 경우.</li>
      <li>회원은 가입 시 등록한 정보에 변경이 있는 경우 즉시 수정해야 합니다.</li>
    </ol>

    <h3>제5조 (서비스의 제공 및 변경)</h3>
    <ol>
      <li>회사는 다음과 같은 업무를 수행합니다: 재화 등에 대한 정보 제공 및 구매계약 체결, 구매계약에 따른 재화 배송, 기타 회사가 정하는 업무.</li>
      <li>회사는 상품 품절, 산지 사정, 기술적 사유 등으로 인해 서비스 내용을 변경할 수 있으며, 변경 시 사전에 공지합니다.</li>
    </ol>

    <h3>제6조 (구매신청 및 계약 성립)</h3>
    <ol>
      <li>이용자는 몰에서 다음 방법에 의하여 구매를 신청합니다: 상품 선택, 배송지·연락처 입력, 결제수단 선택, 약관 동의 및 결제·구매 확인.</li>
      <li>회사는 이용자의 구매신청에 대하여 승낙의 의사표시를 결제 완료 통지 등의 형태로 이용자에게 전달함으로써 계약이 성립합니다.</li>
      <li>미성년자가 법정대리인의 동의 없이 구매한 경우, 법정대리인은 계약을 취소할 수 있습니다.</li>
    </ol>

    <h3>제7조 (결제)</h3>
    <ol>
      <li>상품 대금은 신용카드, 간편결제, 계좌이체, 무통장입금 등 회사가 제공하는 방법으로 결제할 수 있습니다.</li>
      <li>결제는 토스페이먼츠 등 결제대행사(PG)를 통해 처리되며, 결제 과정에서 발생하는 수수료는 PG사 정책에 따릅니다.</li>
      <li>무통장입금의 경우 입금 확인 후 배송이 시작됩니다.</li>
    </ol>

    <h3>제8조 (배송)</h3>
    <ol>
      <li>회사는 이용자가 청약한 재화를 배송지에 맞게 배송합니다. 배송비는 상품 페이지 또는 주문서에 표시된 기준에 따릅니다.</li>
      <li>신선·냉장·냉동 수산물 및 농산물은 산지 직송 특성상 출고·배송 일정이 변동될 수 있으며, 회사는 지연 시 이용자에게 안내합니다.</li>
      <li>제주·도서·산간 지역은 추가 배송일이 소요될 수 있습니다.</li>
    </ol>

    <h3>제9조 (청약철회·교환·반품·환불)</h3>
    <ol>
      <li>본 몰에서 판매하는 신선·냉장·냉동 농수산물은 신선도 유지 및 재판매 불가 특성상, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 단순 변심에 의한 청약철회(교환·반품)가 제한됩니다.</li>
      <li>다음의 경우 교환·반품이 불가합니다: 이용자의 책임 있는 사유로 재화가 멸실·훼손된 경우, 포장을 개봉하여 재판매가 곤란한 신선식품의 경우, 시간 경과로 재판매가 어려운 경우, 냉장·냉동 보관 의무를 이행하지 않아 변질된 경우.</li>
      <li>다음의 경우에 한하여 교환·환불을 접수합니다: 상품 파손·누수·변질·부패 등 품질 이상, 주문과 다른 상품의 오배송·누락·수량 불일, 배송 중 파손으로 섭취가 어려운 경우.</li>
      <li>품질 이상에 해당하는 경우 수령 후 24시간 이내 상품·포장·송장 사진과 함께 고객센터 또는 마이페이지로 접수해 주시면 확인 후 교환·환불 처리합니다. 고객 과실이 없는 경우 배송비는 회사가 부담합니다.</li>
      <li>가공·건조 등 상품 페이지에 별도 반품 안내가 표시된 상품은 해당 안내를 따릅니다.</li>
      <li>환불은 원결제수단으로 처리되며, PG사·금융기관 사정에 따라 영업일 기준 3~7일 소요될 수 있습니다.</li>
    </ol>

    <h3>제10조 (회원의 의무)</h3>
    <ol>
      <li>회원은 관계 법령, 본 약관, 몰의 이용안내를 준수해야 합니다.</li>
      <li>회원은 아이디·비밀번호를 제3자에게 이용하게 해서는 안 되며, 도용·유출 시 즉시 회사에 알려야 합니다.</li>
      <li>회원은 몰을 이용하여 법령 또는 공서양속에 반하는 행위, 타인의 권리를 침해하는 행위를 하여서는 안 됩니다.</li>
    </ol>

    <h3>제11조 (회사의 의무)</h3>
    <ol>
      <li>회사는 관련 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적·안정적으로 서비스를 제공하기 위해 노력합니다.</li>
      <li>회사는 이용자의 개인정보를 「개인정보처리방침」에 따라 보호합니다.</li>
      <li>회사는 이용자가 제기하는 정당한 의견·불만을 처리하기 위해 고객센터를 운영합니다.</li>
    </ol>

    <h3>제12조 (저작권)</h3>
    <p>몰에 게시된 모든 콘텐츠(문구, 이미지, 로고 등)에 대한 저작권은 회사 또는 정당한 권리자에게 귀속되며, 이용자는 회사의 사전 서면 동의 없이 이를 복제·전송·배포할 수 없습니다.</p>

    <h3>제13조 (면책)</h3>
    <ol>
      <li>회사는 천재지변, 시스템 장애, 통신 두절 등 불가항력으로 인한 서비스 제공 불능에 대해 책임을 지지 않습니다.</li>
      <li>회사는 이용자의 귀책사유로 인한 손해에 대해 책임을 지지 않습니다.</li>
    </ol>

    <h3>제14조 (분쟁 해결)</h3>
    <ol>
      <li>회사와 이용자 간 분쟁이 발생한 경우 상호 협의하여 해결합니다.</li>
      <li>협의가 이루어지지 않을 경우 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령 및 소비자분쟁조정위원회 조정 절차에 따릅니다.</li>
      <li>소송이 제기되는 경우 회사 본점 소재지 관할 법원을 전속 관할로 합니다.</li>
    </ol>

    <h3>부칙</h3>
    <p>상호: ${site} · 회사명: ${company} · 대표: ${ceo}<br>
    사업자등록번호: ${s.businessNo || ''} · 통신판매업: ${s.mailOrderNo || ''}<br>
    주소: ${s.address || ''} · 이메일: ${s.email || ''} · 연락처: ${s.phone || ''}</p>
    `
  );
}

function renderPrivacy() {
  const s = getShopInfo();
  const site = s.name || '수산아빠';
  const company = s.company || '리벤더';
  const ceo = s.ceo || '변창현';
  return renderLegalPage(
    '개인정보처리방침',
    `
    <p class="legal-doc__date">시행일: 2026년 6월 4일</p>
    <p>${company}(이하 "회사")는 ${site}(${window.location.origin || 'https://susanfather.com'}) 서비스 이용과 관련하여 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>

    <h3>1. 개인정보의 처리 목적</h3>
    <p>회사는 다음 목적을 위해 개인정보를 처리합니다. 처리한 개인정보는 아래 목적 이외의 용도로 이용되지 않으며, 목적이 변경되는 경우 별도의 동의를 받습니다.</p>
    <ul>
      <li><strong>회원 가입 및 관리:</strong> 회원 식별, 가입 의사 확인, 본인 확인, 부정 이용 방지, 고지·통지</li>
      <li><strong>재화·서비스 제공:</strong> 상품 주문·결제·배송, 맞춤 서비스 제공, 요금 정산</li>
      <li><strong>고객 문의:</strong> 1:1 문의 접수·답변, 불만 처리, 분쟁 조정</li>
      <li><strong>마케팅·광고(선택):</strong> 이벤트·할인 정보 제공 (동의한 회원에 한함)</li>
    </ul>

    <h3>2. 처리하는 개인정보 항목</h3>
    <p><strong>회원가입 시 (필수)</strong></p>
    <ul>
      <li>이름, 이메일, 비밀번호(암호화 저장), 휴대전화번호(선택 입력 시)</li>
    </ul>
    <p><strong>주문·결제·배송 시 (필수)</strong></p>
    <ul>
      <li>수령인 이름, 연락처, 배송지 주소(우편번호 포함), 주문·결제 내역</li>
      <li>결제 시: PG사(토스페이먼츠)를 통한 결제 정보 — 회사는 카드번호 전체를 저장하지 않습니다.</li>
    </ul>
    <p><strong>서비스 이용 과정에서 자동 수집될 수 있는 항목</strong></p>
    <ul>
      <li>IP 주소, 쿠키, 접속 일시, 서비스 이용 기록, 기기 정보</li>
    </ul>

    <h3>3. 개인정보의 보유 및 이용 기간</h3>
    <ul>
      <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간)</li>
      <li><strong>주문·결제 기록:</strong> 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년</li>
      <li><strong>소비자 불만·분쟁 처리 기록:</strong> 3년</li>
      <li><strong>접속 로그:</strong> 「통신비밀보호법」에 따라 3개월</li>
    </ul>

    <h3>4. 개인정보의 제3자 제공</h3>
    <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우 예외로 합니다.</p>
    <ul>
      <li>이용자가 사전에 동의한 경우</li>
      <li>법령에 특별한 규정이 있거나 수사·조사 목적으로 법령에 정해진 절차에 따라 요청받은 경우</li>
    </ul>

    <h3>5. 개인정보 처리 위탁</h3>
    <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁할 수 있습니다.</p>
    <ul>
      <li><strong>토스페이먼츠(주):</strong> 신용카드·간편결제 등 결제 처리</li>
      <li><strong>택배·배송 업체:</strong> 상품 배송 (수령인 이름, 연락처, 주소)</li>
      <li><strong>Vercel Inc. 등 호스팅·인프라:</strong> 웹사이트 운영 및 데이터 저장 (해외 이전 시 관련 법령 준수)</li>
    </ul>
    <p>위탁 시 회사는 위탁계약 등을 통해 개인정보가 안전하게 관리되도록 필요한 사항을 규정합니다.</p>

    <h3>6. 이용자의 권리·의무 및 행사 방법</h3>
    <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
    <ul>
      <li>개인정보 열람·정정·삭제·처리정지 요구</li>
      <li>회원 탈퇴 (마이페이지 또는 고객센터 문의)</li>
    </ul>
    <p>권리 행사는 ${s.email || 'reven9269@naver.com'} 또는 고객센터(${s.phone || '010-4730-9269'})로 서면·이메일·전화 등을 통해 요청할 수 있으며, 회사는 지체 없이 조치합니다.</p>

    <h3>7. 개인정보의 파기</h3>
    <p>회사는 개인정보 보유기간 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때 지체 없이 해당 정보를 파기합니다.</p>
    <ul>
      <li><strong>전자적 파일:</strong> 복구·재생이 불가능한 방법으로 영구 삭제</li>
      <li><strong>종이 문서:</strong> 분쇄 또는 소각</li>
    </ul>

    <h3>8. 개인정보의 안전성 확보 조치</h3>
    <ul>
      <li>비밀번호 등 중요 정보의 암호화 저장</li>
      <li>접근 권한 관리 및 접근 통제</li>
      <li>보안 프로그램 설치 및 주기적 점검</li>
      <li>개인정보 취급자 최소화 및 교육</li>
    </ul>

    <h3>9. 쿠키의 사용</h3>
    <p>회사는 로그인 유지, 장바구니 등 서비스 제공을 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다.</p>

    <h3>10. 개인정보 보호책임자</h3>
    <ul>
      <li>성명: ${ceo}</li>
      <li>직책: 대표</li>
      <li>연락처: ${s.phone || '010-4730-9269'}</li>
      <li>이메일: ${s.email || 'reven9269@naver.com'}</li>
    </ul>
    <p>개인정보 침해 신고·상담: 개인정보침해신고센터(privacy.kisa.or.kr / 국번 없이 118), 대검찰청 사이버수사과(1301), 경찰청 사이버수사국(182)</p>

    <h3>11. 개인정보처리방침 변경</h3>
    <p>본 방침은 법령·정책 또는 보안기술 변경에 따라 수정될 수 있으며, 변경 시 시행일 7일 전부터 몰 공지사항 또는 본 페이지를 통해 고지합니다.</p>

    <p><strong>${company}</strong> · ${site}<br>
    ${s.address || ''}</p>
    `
  );
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
      <dt>연락처</dt><dd>${s.phone || '010 4730 9269'}</dd>
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
      <button class="btn btn--primary" type="button" onclick="navigate('order-lookup')">주문·배송 조회</button>
      <button class="btn btn--outline" type="button" onclick="navigate('inquiry')">문의하기</button>
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
    if (typeof loadNotifications === 'function') await loadNotifications();
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
  if (typeof loadNotifications === 'function') loadNotifications().then(() => render());
  showToast('로그아웃되었습니다');
  navigate('home');
}

const EXTRA_PAGES = {
  login: renderLogin,
  signup: renderSignup,
  'find-id': renderFindId,
  'find-pw': renderFindPw,
  'change-password': renderChangePassword,
  mypage: renderMypage,
  addresses: renderAddressBook,
  'shop-info': renderShopInfo,
  terms: renderTerms,
  privacy: renderPrivacy,
  'order-detail': renderOrderDetail,
  'order-lookup': renderOrderLookup,
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
  if (page === 'order-lookup') state.orderLookupResult = null;
  if (page === 'order-detail' && params.orderId) {
    state.orderId = params.orderId;
    if (state.orderDetailCache?.[params.orderId]) {
      /* cached */
    }
  }
  if (page === 'mypage') state.mypageTab = state.mypageTab || 'orders';
  if (page !== 'change-password') state.passwordMessage = '';
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
