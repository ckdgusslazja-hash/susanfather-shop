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
      name: '그린하베스트',
      company: '(주)그린하베스트',
      ceo: '홍길동',
      businessNo: '123-45-67890',
      address: '서울특별시 강남구 테헤란로 123',
      email: 'help@greenharvest.kr',
      phone: '1588-0000',
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
        <p class="footer__brand">${shop.name || '그린하베스트'}</p>
        <p class="footer__meta">${shop.company || ''} · 대표 ${shop.ceo || ''}</p>
        <p class="footer__meta">사업자등록번호 ${shop.businessNo || ''}</p>
      </div>
      <nav class="footer__links" aria-label="쇼핑몰 정보">
        <a href="#" onclick="navigate('shop-info');return false">쇼핑몰 정보</a>
        <a href="#" onclick="navigate('customer-center');return false">고객센터</a>
        <a href="#" onclick="navigate('inquiry');return false">문의함</a>
        <a href="/admin/" target="_blank" rel="noopener">관리자</a>
      </nav>
    </div>
    <p class="footer__copy">© 2026 ${shop.name || '그린하베스트'} · 실서비스 데모</p>
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

function renderKakaoAuthBlock() {
  const hint = API.kakaoEnabled
    ? ''
    : '<p class="auth-social__hint">카카오 로그인 사용: 프로젝트 폴더 .env 파일에 KAKAO_REST_API_KEY를 설정하세요.</p>';
  return `
    <div class="auth-social">
      <p class="auth-social__or"><span>또는</span></p>
      ${hint}
      <button type="button" class="btn-kakao btn--block" onclick="startKakaoLogin()">카카오로 시작하기</button>
    </div>`;
}

function startKakaoLogin() {
  window.location.href = '/api/auth/kakao';
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
    </form>
    ${renderKakaoAuthBlock()}`,
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
    </form>
    ${renderKakaoAuthBlock()}`,
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
  return `
    <h2 class="section-title">마이페이지</h2>
    <div class="mypage-card">
      <p><strong>${u.name}</strong>님</p>
      <p class="text-muted">${u.email}</p>
      ${u.provider === 'kakao' ? '<p class="text-muted">카카오 연동 계정</p>' : ''}
      ${u.phone ? `<p>연락처 ${u.phone}</p>` : ''}
      <div class="mypage-actions">
        <button class="btn btn--outline" type="button" onclick="loadMyOrders()">주문 내역 불러오기</button>
        <button class="btn btn--outline" type="button" onclick="navigate('inquiry')">1:1 문의</button>
        <button class="btn btn--outline" type="button" onclick="doLogout()">로그아웃</button>
      </div>
    </div>
    <div id="my-orders-list"></div>
  `;
}

async function loadMyOrders() {
  const el = document.getElementById('my-orders-list');
  if (!el) return;
  el.innerHTML = '<p class="text-muted">불러오는 중…</p>';
  try {
    const orders = await API.myOrders();
    if (!orders.length) {
      el.innerHTML = '<p class="text-muted">주문 내역이 없습니다.</p>';
      return;
    }
    el.innerHTML = orders
      .map(
        (o) => `
      <div class="order-row">
        <div><strong>${o.id}</strong> · ${(o.created_at || '').slice(0, 10)}</div>
        <div>${formatPrice(o.total)} · ${o.status}</div>
        <div class="text-muted">${o.address} ${o.address_detail || ''}</div>
      </div>`
      )
      .join('');
  } catch (e) {
    el.innerHTML = `<p class="auth-msg">${e.message}</p>`;
  }
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
      <dt>통신판매업</dt><dd>${s.mailOrderNo || '제2026-서울강남-0000호'}</dd>
      <dt>주소</dt><dd>${s.address || ''}</dd>
      <dt>이메일</dt><dd>${s.email || ''}</dd>
      <dt>고객센터</dt><dd>${s.phone || ''}</dd>
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

function openDaumPostcode() {
  if (!window.daum?.Postcode) {
    showToast('주소 API 로딩 중입니다. 잠시 후 다시 시도해 주세요.');
    return;
  }
  new daum.Postcode({
    oncomplete(data) {
      const zip = document.getElementById('zipcode');
      const addr = document.getElementById('address-base');
      const detail = document.getElementById('address-detail');
      if (zip) zip.value = data.zonecode;
      if (addr) {
        addr.value = data.roadAddress || data.jibunAddress;
      }
      if (detail) detail.focus();
    },
  }).open();
}

function bindCheckoutAddress() {
  const btn = document.getElementById('btn-search-address');
  if (btn) btn.onclick = () => openDaumPostcode();
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
  'shop-info': renderShopInfo,
  'customer-center': renderCustomerCenter,
  inquiry: renderInquiry,
  'write-review': renderWriteReview,
};

function updateNavAuth() {
  const el = document.getElementById('nav-auth');
  if (!el) return;
  el.textContent = API.user ? '마이' : '로그인';
  el.dataset.page = API.user ? 'mypage' : 'login';
}

const _renderOrig = render;
window.render = function () {
  _renderOrig();
  updateNavAuth();
};

async function initAppWithAuth() {
  await initApp();
  const params = new URLSearchParams(location.search);
  if (params.get('authSuccess')) {
    API.token = localStorage.getItem('gh_token') || '';
    try {
      API.user = JSON.parse(localStorage.getItem('gh_user') || 'null');
    } catch {
      API.user = null;
    }
    state.reviewEligibility = {};
    history.replaceState({}, '', location.pathname);
    showToast('카카오 로그인되었습니다');
    navigate('mypage');
    return;
  }
  if (params.get('authError')) {
    const err = localStorage.getItem('gh_auth_error') || '카카오 로그인에 실패했습니다.';
    localStorage.removeItem('gh_auth_error');
    state.authMessage = err;
    history.replaceState({}, '', location.pathname);
    navigate('login');
  }
}

initAppWithAuth();
