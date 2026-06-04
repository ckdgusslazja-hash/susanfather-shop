const STORAGE_KEY = 'greenharvest_cart';
const LAST_ORDER_KEY = 'greenharvest_last_order';
const ROUTE_SESSION_KEY = 'greenharvest_route';

const APP_PAGES = new Set([
  'home',
  'detail',
  'reviews',
  'cart',
  'checkout',
  'complete',
  'login',
  'signup',
  'find-id',
  'find-pw',
  'change-password',
  'mypage',
  'addresses',
  'shop-info',
  'terms',
  'privacy',
  'order-detail',
  'order-lookup',
  'customer-center',
  'inquiry',
  'write-review',
]);

let state = {
  page: 'home',
  category: 'all',
  selectedProductId: null,
  selectedOptionId: null,
  orderId: null,
  carouselIndex: 0,
  quantity: 1,
  cart: [],
  lastOrder: null,
  reviewProductId: null,
  reviewFilter: 'all',
  reviewSort: 'best',
  reviewPhotoOnly: false,
  reviewAttrsOpen: false,
  lightbox: { images: [], index: 0 },
  wishlist: [],
  homeBannerIndex: 0,
  searchQuery: '',
  searchDraft: '',
  savedAddresses: [],
  selectedAddressId: '',
  mypageTab: 'orders',
  myOrders: [],
  passwordMessage: '',
  notifications: [],
  notificationsOpen: false,
  categoryMenuOpen: false,
  inquiryOrderId: '',
};

const NOTIF_READ_KEY = 'greenharvest_notif_read';

function loadNotificationsRead() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveNotificationsRead(set) {
  localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...set]));
}

function getUnreadNotificationCount() {
  const read = loadNotificationsRead();
  return (state.notifications || []).filter((n) => !read.has(n.id)).length;
}

async function loadNotifications() {
  if (typeof API === 'undefined' || !API.getNotifications) return;
  try {
    state.notifications = await API.getNotifications();
  } catch {
    state.notifications = [];
  }
}

function toggleNotificationPanel(e) {
  if (e) e.stopPropagation();
  state.notificationsOpen = !state.notificationsOpen;
  updateNotificationPanel();
}

function closeNotificationPanel() {
  state.notificationsOpen = false;
  updateNotificationPanel();
}

function markNotificationRead(id) {
  const read = loadNotificationsRead();
  read.add(id);
  saveNotificationsRead(read);
  updateNotificationPanel();
  updateNotificationBellBadge();
}

function markAllNotificationsRead() {
  const read = loadNotificationsRead();
  (state.notifications || []).forEach((n) => read.add(n.id));
  saveNotificationsRead(read);
  updateNotificationPanel();
  updateNotificationBellBadge();
}

function handleNotificationClick(id) {
  const n = (state.notifications || []).find((item) => item.id === id);
  if (!n) return;
  markNotificationRead(n.id);
  closeNotificationPanel();
  if (n.link === 'mypage') {
    if (typeof API !== 'undefined' && API.user) {
      if (n.orderId) {
        navigate('order-detail', { orderId: n.orderId });
      } else {
        state.mypageTab = n.type === 'inquiry' ? 'menu' : 'orders';
        navigate('mypage');
      }
    } else if (n.orderId) {
      navigate('order-lookup');
    } else {
      navigate('login');
    }
    return;
  }
  navigate(n.link || 'home');
}

function formatNotifDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return '오늘';
  if (diff < 172800000) return '어제';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function updateNotificationBellBadge() {
  const badge = document.querySelector('.home-header__bell-badge');
  const unread = getUnreadNotificationCount();
  if (!badge) return;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function updateNotificationPanel() {
  let panel = document.getElementById('notif-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.className = 'notif-panel';
    panel.setAttribute('hidden', '');
    document.body.appendChild(panel);
    document.addEventListener('click', (ev) => {
      if (state.notificationsOpen && !ev.target.closest('.notif-panel') && !ev.target.closest('.home-header__bell')) {
        closeNotificationPanel();
      }
    });
  }

  const read = loadNotificationsRead();
  const list = state.notifications || [];
  const unread = getUnreadNotificationCount();

  if (!state.notificationsOpen) {
    panel.setAttribute('hidden', '');
    panel.innerHTML = '';
    return;
  }

  panel.removeAttribute('hidden');
  panel.innerHTML = `
    <div class="notif-panel__head">
      <h2 class="notif-panel__title">알림 ${unread ? `<span class="notif-panel__count">${unread}</span>` : ''}</h2>
      <div class="notif-panel__actions">
        ${unread ? `<button type="button" class="notif-panel__read-all" onclick="markAllNotificationsRead()">모두 읽음</button>` : ''}
        <button type="button" class="notif-panel__close" onclick="closeNotificationPanel()" aria-label="닫기">✕</button>
      </div>
    </div>
    <div class="notif-panel__list">
      ${
        list.length
          ? list
              .map((n) => {
                const isRead = read.has(n.id);
                const icon = n.type === 'order' ? '📦' : n.type === 'inquiry' ? '💬' : '📢';
                return `
          <button type="button" class="notif-item ${isRead ? 'is-read' : ''}" onclick="handleNotificationClick('${n.id}')">
            <span class="notif-item__icon">${icon}</span>
            <span class="notif-item__body">
              <strong class="notif-item__title">${escapeHtml(n.title)}</strong>
              <span class="notif-item__text">${escapeHtml(n.body || '')}</span>
              <span class="notif-item__date">${formatNotifDate(n.createdAt)}</span>
            </span>
            ${isRead ? '' : '<span class="notif-item__dot" aria-hidden="true"></span>'}
          </button>`;
              })
              .join('')
          : `<p class="notif-panel__empty">${API.user ? '새 알림이 없습니다.' : '로그인하면 주문·문의 알림을 받을 수 있습니다.'}</p>`
      }
    </div>
  `;
}

function renderNotificationBell() {
  const unread = getUnreadNotificationCount();
  return `
    <button type="button" class="home-header__bell" onclick="toggleNotificationPanel(event)" title="알림" aria-label="알림 ${unread}건">
      🔔
      ${unread ? `<span class="home-header__bell-badge">${unread > 99 ? '99+' : unread}</span>` : ''}
    </button>`;
}

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state.cart = JSON.parse(saved);
    const wish = localStorage.getItem('greenharvest_wishlist');
    if (wish) state.wishlist = JSON.parse(wish);
  } catch {
    state.cart = [];
  }
}

function saveWishlist() {
  localStorage.setItem('greenharvest_wishlist', JSON.stringify(state.wishlist));
}

function getSelectedOption(product) {
  const id = state.selectedOptionId || getDefaultOptionId(product);
  return getProductOption(product, id);
}

const KST_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const ORDER_CUTOFF_HOUR_KST = 11;

function getKstDateTimeParts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function kstWeekday(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addKstCalendarDays(year, month, day, addDays) {
  const next = new Date(Date.UTC(year, month - 1, day + addDays));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

function kstCalendarDayDiff(y1, m1, d1, y2, m2, d2) {
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

/** 11시 전 주문 → +1일, 11시 이후 → +2일. 도착일이 일요일이면 월요일로 (일요일 택배 없음) */
function computeDefaultArrival(now = new Date()) {
  const kst = getKstDateTimeParts(now);
  const leadDays = kst.hour < ORDER_CUTOFF_HOUR_KST ? 1 : 2;
  let arrival = addKstCalendarDays(kst.year, kst.month, kst.day, leadDays);
  let weekday = kstWeekday(arrival.year, arrival.month, arrival.day);
  while (weekday === 0) {
    arrival = addKstCalendarDays(arrival.year, arrival.month, arrival.day, 1);
    weekday = kstWeekday(arrival.year, arrival.month, arrival.day);
  }
  const diffDays = kstCalendarDayDiff(kst.year, kst.month, kst.day, arrival.year, arrival.month, arrival.day);
  return {
    arrival,
    diffDays,
    dayName: KST_DAY_NAMES[weekday],
  };
}

function formatDefaultArrivalLabel(detailed = false) {
  const { diffDays, dayName } = computeDefaultArrival();
  if (diffDays === 1) {
    return detailed ? `내일(${dayName}) 새벽 7시 전 도착` : `내일(${dayName}) 도착`;
  }
  if (diffDays === 2) {
    return `이틀 뒤(${dayName}) 도착`;
  }
  return `${diffDays}일 후(${dayName}) 도착`;
}

function getDeliveryLabel() {
  return formatDefaultArrivalLabel(true);
}

function getShortDeliveryLabel() {
  return formatDefaultArrivalLabel(false);
}

function getProductArrivalLabel(product, detailed = false) {
  const raw = product?.deliveryDays;
  if (raw != null && raw !== '' && Number.isFinite(Number(raw))) {
    const n = Math.max(1, Math.min(30, Math.floor(Number(raw))));
    return `${n}일 이내 도착`;
  }
  return formatDefaultArrivalLabel(detailed);
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원';
}

function getProduct(id) {
  const list = window.PRODUCTS_FROM_API || PRODUCTS;
  const p = list.find((p) => p.id === id);
  return p ? normalizeLegacyProductOptions(p) : undefined;
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => sum + getCartItemUnitPrice(item) * item.quantity, 0);
}

function getShippingFee(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

function saveLastOrder(order) {
  state.lastOrder = order || null;
  try {
    if (order) sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    else sessionStorage.removeItem(LAST_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

function loadLastOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (raw) state.lastOrder = JSON.parse(raw);
  } catch {
    state.lastOrder = null;
  }
}

let _restoringHash = false;
let _routeSyncing = false;

function persistRouteSession() {
  try {
    sessionStorage.setItem(
      ROUTE_SESSION_KEY,
      JSON.stringify({
        page: state.page,
        selectedProductId: state.selectedProductId,
        selectedOptionId: state.selectedOptionId,
        reviewProductId: state.reviewProductId,
        category: state.category,
        searchQuery: state.searchQuery,
        orderId: state.orderId,
        mypageTab: state.mypageTab,
        quantity: state.quantity,
      })
    );
  } catch {
    /* ignore */
  }
}

function readRouteSession() {
  try {
    const raw = sessionStorage.getItem(ROUTE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const SEO_PATH_PAGES = {
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/shop-info': 'shop-info',
  '/customer-center': 'customer-center',
  '/inquiry': 'inquiry',
};

function parsePathRoute() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const search = new URLSearchParams(window.location.search);
  if (path === '/') {
    const params = {};
    if (search.get('category')) params.category = search.get('category');
    if (search.get('q')) params.q = search.get('q');
    return { page: 'home', params };
  }
  const productMatch = path.match(/^\/p\/([^/]+)$/i);
  if (productMatch) {
    const params = { productId: productMatch[1] };
    if (search.get('optionId')) params.optionId = search.get('optionId');
    if (search.get('qty')) params.qty = search.get('qty');
    return { page: 'detail', params };
  }
  const page = SEO_PATH_PAGES[path];
  if (page) return { page, params: {} };
  return null;
}

function serializeRoute() {
  const q = new URLSearchParams();
  switch (state.page) {
    case 'home':
      if (state.category && state.category !== 'all') q.set('category', state.category);
      if (state.searchQuery?.trim()) q.set('q', state.searchQuery.trim());
      break;
    case 'detail':
      if (state.selectedOptionId) q.set('optionId', state.selectedOptionId);
      if (state.quantity > 1) q.set('qty', String(state.quantity));
      break;
    case 'reviews':
    case 'write-review':
      if (state.reviewProductId || state.selectedProductId) {
        q.set('productId', state.reviewProductId || state.selectedProductId);
      }
      break;
    case 'mypage':
      if (state.mypageTab && state.mypageTab !== 'orders') q.set('tab', state.mypageTab);
      break;
    case 'order-detail':
      if (state.orderId) q.set('orderId', state.orderId);
      break;
    default:
      break;
  }
  const qs = q.toString();

  if (state.page === 'detail' && state.selectedProductId) {
    return `/p/${state.selectedProductId}${qs ? `?${qs}` : ''}`;
  }
  if (state.page === 'home') {
    return `/${qs ? `?${qs}` : ''}`;
  }
  const staticPath = Object.entries(SEO_PATH_PAGES).find(([, p]) => p === state.page)?.[0];
  if (staticPath) return staticPath;

  return `#/${state.page}${qs ? `?${qs}` : ''}`;
}

function getCurrentRouteUrl() {
  const route = serializeRoute();
  if (route.startsWith('#')) return `/${route}`;
  return route;
}

function syncHashFromState(replace = false) {
  if (_restoringHash || _routeSyncing) return;
  const url = getCurrentRouteUrl();
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` === url) {
    persistRouteSession();
    return;
  }
  _routeSyncing = true;
  try {
    if (replace) history.replaceState({ ghRoute: true }, '', url);
    else history.pushState({ ghRoute: true }, '', url);
    persistRouteSession();
  } finally {
    _routeSyncing = false;
  }
}

function parseRoute() {
  const pathRoute = parsePathRoute();
  if (pathRoute) return pathRoute;

  const hash = window.location.hash.replace(/^#/, '').trim();
  if (hash) {
    const raw = hash.replace(/^\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { page: path || 'home', params: Object.fromEntries(new URLSearchParams(query)) };
  }
  const saved = readRouteSession();
  if (saved?.page) {
    const params = {};
    if (saved.selectedProductId) params.productId = saved.selectedProductId;
    if (saved.selectedOptionId) params.optionId = saved.selectedOptionId;
    if (saved.reviewProductId) params.productId = saved.reviewProductId;
    if (saved.category && saved.category !== 'all') params.category = saved.category;
    if (saved.searchQuery) params.q = saved.searchQuery;
    if (saved.orderId) params.orderId = saved.orderId;
    if (saved.mypageTab && saved.mypageTab !== 'orders') params.tab = saved.mypageTab;
    if (saved.quantity > 1) params.qty = String(saved.quantity);
    return { page: saved.page, params };
  }
  return { page: 'home', params: {} };
}

function buildNavigateParams(page, routeParams = {}) {
  const params = { restore: true, skipScroll: true };
  if (page === 'home') {
    if (routeParams.category) params.category = routeParams.category;
    if (routeParams.q) params.q = routeParams.q;
    return params;
  }
  if (page === 'detail') {
    if (routeParams.productId) params.productId = routeParams.productId;
    if (routeParams.optionId) params.optionId = routeParams.optionId;
    if (routeParams.qty) params.qty = routeParams.qty;
    return params;
  }
  if (page === 'reviews' || page === 'write-review') {
    if (routeParams.productId) params.reviewProductId = routeParams.productId;
    return params;
  }
  if (page === 'mypage') {
    if (routeParams.tab) params.mypageTab = routeParams.tab;
    return params;
  }
  if (page === 'order-detail') {
    if (routeParams.orderId) params.orderId = routeParams.orderId;
    return params;
  }
  if (page === 'complete') loadLastOrder();
  return params;
}

async function restoreFromHash() {
  const { page, params } = parseRoute();
  if (!APP_PAGES.has(page)) {
    navigate('home', { skipScroll: true, replaceHash: true });
    return;
  }
  if (page === 'detail' && params.productId && !getProduct(params.productId) && typeof API !== 'undefined') {
    await API.loadProducts();
  }
  _restoringHash = true;
  try {
    await navigate(page, buildNavigateParams(page, params));
    syncHashFromState(true);
  } finally {
    _restoringHash = false;
  }
}

function onRouteHashChange() {
  if (_restoringHash || _routeSyncing) return;
  _restoringHash = true;
  restoreFromHash().finally(() => {
    _restoringHash = false;
  });
}

function onRoutePopState() {
  if (_restoringHash || _routeSyncing) return;
  onRouteHashChange();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function navigate(page, params = {}) {
  state.page = page;
  if (page !== 'home') state.categoryMenuOpen = false;
  if (params.category) state.category = params.category;
  if (params.q || params.searchQuery) {
    const query = String(params.q || params.searchQuery).trim();
    state.searchQuery = query;
    state.searchDraft = query;
  }
  if (params.mypageTab) state.mypageTab = params.mypageTab;
  if (params.productId) {
    state.selectedProductId = params.productId;
    if (!params.reviewProductId) state.reviewProductId = params.productId;
    if (params.restore) {
      if (params.qty) state.quantity = Math.max(1, Number(params.qty) || 1);
      const p = getProduct(params.productId);
      if (p) {
        state.selectedOptionId = params.optionId || getDefaultOptionId(p);
        if (params.qty) state.quantity = Math.min(state.quantity, p.stock || state.quantity);
      }
    } else {
      state.reviewProductId = params.productId;
      state.quantity = 1;
      state.carouselIndex = 0;
      const p = getProduct(params.productId);
      if (p) {
        state.selectedOptionId = getDefaultOptionId(p);
        saveRecentProduct(p.id);
      }
    }
  }
  if (params.reviewProductId) {
    state.reviewProductId = params.reviewProductId;
  }
  if (params.reviewFilter) state.reviewFilter = params.reviewFilter;
  if (params.orderId) state.orderId = params.orderId;
  if (page === 'complete' && !state.lastOrder) loadLastOrder();

  if (!params.restore) syncHashFromState(!!params.replaceHash);
  else persistRouteSession();

  const needReviews = ['reviews', 'detail', 'write-review'].includes(page);
  const pid =
    params.reviewProductId || params.productId || state.reviewProductId || state.selectedProductId;
  if (needReviews && pid && typeof ensureReviews === 'function') {
    const tasks = [ensureReviews(pid)];
    if (typeof ensureReviewEligibility === 'function') tasks.push(ensureReviewEligibility(pid));
    return Promise.all(tasks).then(() => {
      render();
      if (!params.skipScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (page === 'checkout' && typeof API !== 'undefined' && typeof API.loadPaymentSettings === 'function') {
    return API.loadPaymentSettings().then(() => {
      render();
      if (!params.skipScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  render();
  if (!params.skipScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  return Promise.resolve();
}

function renderStars(rating, max = 5) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  let s = '';
  for (let i = 0; i < max; i++) {
    if (i < full) s += '★';
    else if (i === full && half) s += '★';
    else s += '☆';
  }
  return `<span class="stars">${s}</span>`;
}

function getReviewSummary(productId) {
  const list = getReviewsByProduct(productId);
  const counts = [0, 0, 0, 0, 0];
  list.forEach((r) => {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    counts[idx]++;
  });
  const total = list.length || 1;
  return {
    list,
    counts,
    bars: counts.map((c, i) => ({ star: 5 - i, pct: Math.round((c / total) * 100), count: c })),
    photoCount: list.filter((r) => r.images && r.images.length).length,
  };
}

function getAllReviewImages(productId) {
  return getReviewsByProduct(productId).flatMap((r) => r.images || []);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderReviewPhotos(images, reviewId, maxShow = 4) {
  if (!images || !images.length) return '';
  const shown = images.slice(0, maxShow);
  const extra = images.length - maxShow;
  return `
    <div class="review-card__photos">
      ${shown
        .map(
          (_, i) => `
        <button type="button" class="review-photo" onclick="openLightboxForReview('${reviewId}', ${i})">
          <img src="${images[i]}" alt="구매자 후기 사진 ${i + 1}" loading="lazy" />
        </button>
      `
        )
        .join('')}
      ${
        extra > 0
          ? `<button type="button" class="review-photo review-photo--more" onclick="openLightboxForReview('${reviewId}', ${maxShow})">+${extra}</button>`
          : ''
      }
    </div>
  `;
}

function renderReviewCard(review) {
  return `
    <article class="review-card" id="review-${review.id}">
      <div class="review-card__header">
        <span class="review-card__author">${escapeHtml(review.author)}</span>
        ${review.verified ? '<span class="review-card__badge">구매확정</span>' : ''}
        <span class="review-card__stars">${renderStars(review.rating)}</span>
        <span class="review-card__date">${review.date}</span>
      </div>
      <h4 class="review-card__title">${escapeHtml(review.title)}</h4>
      <p class="review-card__content">${escapeHtml(review.content)}</p>
      ${renderReviewPhotos(review.images, review.id)}
      <div class="review-card__footer">
        <button type="button" class="review-card__helpful" onclick="showToast('도움이 됐어요! (데모)')">👍 도움돼요 ${review.helpful}</button>
      </div>
    </article>
  `;
}

function renderReviewsSummaryBlock(productId) {
  const product = getProduct(productId);
  const { list, bars, photoCount } = getReviewSummary(productId);
  if (!product || !list.length) return '';

  return `
    <div class="reviews-summary">
      <div class="reviews-summary__score">
        <div class="reviews-summary__score-num">${product.rating}</div>
        <div class="reviews-summary__score-stars">${renderStars(product.rating)}</div>
        <p class="reviews-summary__count">리뷰 ${list.length}개 · 포토 ${photoCount}개</p>
      </div>
      <div class="reviews-bars">
        ${bars
          .map(
            (b) => `
          <div class="review-bar">
            <span class="review-bar__label">${b.star}점</span>
            <div class="review-bar__track"><div class="review-bar__fill" style="width:${b.pct}%"></div></div>
            <span class="review-bar__pct">${b.pct}%</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderReviewsSection(productId, limit) {
  const product = getProduct(productId);
  const { list } = getReviewSummary(productId);
  if (!product || !list.length) return '';

  const display = limit ? list.slice(0, limit) : list;
  const filtered =
    state.reviewFilter === 'photo' ? display.filter((r) => r.images && r.images.length) : display;

  return `
    <section class="reviews-section" id="reviews">
      <h2 class="section-title">구매후기</h2>
      ${renderReviewsSummaryBlock(productId)}
      <div class="reviews-toolbar">
        <div class="reviews-filters">
          <button type="button" class="reviews-filter-btn ${state.reviewFilter === 'all' ? 'active' : ''}"
            onclick="setReviewFilter('all')">전체 ${list.length}</button>
          <button type="button" class="reviews-filter-btn ${state.reviewFilter === 'photo' ? 'active' : ''}"
            onclick="setReviewFilter('photo')">포토리뷰</button>
        </div>
        ${
          limit
            ? `<button type="button" class="link-review" onclick="navigate('reviews',{reviewProductId:'${productId}'})">리뷰 전체보기 (${list.length}) →</button>`
            : ''
        }
      </div>
      <div class="review-list">
        ${filtered.length ? filtered.map(renderReviewCard).join('') : '<p style="color:var(--color-text-muted);padding:24px 0">포토리뷰가 없습니다.</p>'}
      </div>
    </section>
  `;
}

const REVIEW_ATTR_LABELS = {
  fruit: [
    { key: 'sweet', label: '당도', top: '달아요', pct: 78 },
    { key: 'fresh', label: '신선도', top: '아주 신선해요', pct: 82 },
    { key: 'pack', label: '포장', top: '깔끔해요', pct: 71 },
  ],
  veg: [
    { key: 'fresh', label: '신선도', top: '싱싱해요', pct: 85 },
    { key: 'size', label: '크기', top: '적당해요', pct: 68 },
    { key: 'pack', label: '포장', top: '좋아요', pct: 74 },
  ],
  seafood: [
    { key: 'fresh', label: '신선도', top: '매우 신선', pct: 88 },
    { key: 'taste', label: '식감', top: '탱탱해요', pct: 76 },
    { key: 'pack', label: '포장', top: '꼼꼼해요', pct: 80 },
  ],
  default: [
    { key: 'taste', label: '맛·품질', top: '만족해요', pct: 79 },
    { key: 'fresh', label: '신선도', top: '좋아요', pct: 72 },
    { key: 'value', label: '가성비', top: '괜찮아요', pct: 65 },
  ],
};

function getReviewAttrLabels(product) {
  return REVIEW_ATTR_LABELS[product?.category] || REVIEW_ATTR_LABELS.default;
}

function getReviewsForPage(productId) {
  let list = [...getReviewsByProduct(productId)];
  if (state.reviewPhotoOnly) {
    list = list.filter((r) => r.images?.length);
  }
  if (state.reviewSort === 'latest') {
    list.sort((a, b) => b.date.localeCompare(a.date));
  } else {
    list.sort((a, b) => b.helpful - a.helpful || b.rating - a.rating);
  }
  return list;
}

function setReviewSort(sort) {
  state.reviewSort = sort;
  render();
}

function toggleReviewPhotoOnly(checked) {
  state.reviewPhotoOnly = checked;
  render();
}

function toggleReviewAttrs() {
  state.reviewAttrsOpen = !state.reviewAttrsOpen;
  render();
}

function renderRpMediaGallery(productId, images) {
  if (!images.length) return '';
  const show = images.slice(0, 5);
  const more = images.length - show.length;

  return `
    <div class="rp-media-scroll">
      ${show
        .map((url, i) => {
          if (i === 0) {
            return `
            <button type="button" class="rp-media-item rp-media-item--video" onclick="openLightboxForProduct('${productId}', 0)">
              <img src="${url}" alt="" loading="lazy" onerror="this.style.opacity='0'" />
              <span class="rp-media-play">▶ 0:12</span>
            </button>`;
          }
          if (i === 4 && more > 0) {
            return `
            <button type="button" class="rp-media-item rp-media-item--more" onclick="openLightboxForProduct('${productId}', ${i})">
              <img src="${url}" alt="" loading="lazy" />
              <span class="rp-media-more">› ${images.length}</span>
            </button>`;
          }
          return `
            <button type="button" class="rp-media-item" onclick="openLightboxForProduct('${productId}', ${i})">
              <img src="${url}" alt="" loading="lazy" onerror="this.style.opacity='0'" />
            </button>`;
        })
        .join('')}
    </div>
  `;
}

function renderRpReviewItem(review, product) {
  const initial = review.author.charAt(0);
  const avatarColors = ['#1a6b4a', '#228be6', '#e67700', '#9c36b5', '#2f9e44'];
  const avatarBg = avatarColors[review.author.length % avatarColors.length];

  return `
    <article class="rp-item">
      <div class="rp-item__head">
        <span class="rp-item__avatar" style="background:${avatarBg}">${initial}</span>
        <div class="rp-item__meta">
          <div class="rp-item__row">
            <strong class="rp-item__user">${escapeHtml(review.author)}</strong>
            <span class="rp-item__stars">${renderStars(review.rating)}</span>
            <span class="rp-item__date">${review.date}</span>
          </div>
          <p class="rp-item__seller">수산아빠 · ${escapeHtml(product.name)}</p>
        </div>
      </div>
      ${review.images?.length ? `
        <div class="rp-item__photos">
          ${review.images
            .slice(0, 4)
            .map(
              (url, i) => `
            <button type="button" class="rp-item__photo" onclick="openLightboxForReview('${review.id}', ${i})">
              <img src="${url}" alt="" loading="lazy" onerror="this.parentElement.style.background='${product.gradient}'" />
            </button>`
            )
            .join('')}
        </div>
      ` : ''}
      <p class="rp-item__title">${escapeHtml(review.title)}</p>
      <p class="rp-item__body">${escapeHtml(review.content)}</p>
      <button type="button" class="rp-item__helpful" onclick="showToast('도움이 됐어요! (데모)')">👍 도움돼요 ${review.helpful}</button>
    </article>
  `;
}

function renderReviewsPage() {
  const productId = state.reviewProductId;
  const product = getProduct(productId);
  if (!product) {
    navigate('home');
    return '';
  }

  const { list, photoCount } = getReviewSummary(productId);
  const filtered = getReviewsForPage(productId);
  const allImages = getAllReviewImages(productId);
  const attrs = getReviewAttrLabels(product);
  const satisfied = Math.min(300, Math.max(50, list.length * 12));
  const fullStars = Math.floor(product.rating);
  const halfStar = product.rating % 1 >= 0.5;

  const starsBig =
    '★'.repeat(fullStars) + (halfStar ? '★' : '') + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));

  return `
    <div class="rp">
      <header class="rp-header">
        <button type="button" class="rp-header__back" onclick="navigate('detail',{productId:'${product.id}'})" aria-label="뒤로">←</button>
        <h1 class="rp-header__title">상품 리뷰</h1>
        ${typeof getReviewWriteButtonHtml === 'function' ? getReviewWriteButtonHtml(product.id) : ''}
      </header>

      <section class="rp-summary">
        <div class="rp-summary__top">
          <div class="rp-summary__score">
            <span class="rp-summary__stars">${starsBig}</span>
            <span class="rp-summary__num">${product.rating}</span>
          </div>
          <button type="button" class="rp-summary__detail" onclick="toggleReviewAttrs()">
            리뷰 ${list.length} · 자세히 보기 ${state.reviewAttrsOpen ? '∧' : '∨'}
          </button>
        </div>
        <div class="rp-trust">
          <span>😊</span> ${satisfied}명 이상 만족했어요
        </div>
      </section>

      ${allImages.length ? renderRpMediaGallery(productId, allImages) : ''}

      ${
        state.reviewAttrsOpen
          ? `
      <section class="rp-attrs">
        ${attrs
          .map(
            (a) => `
          <div class="rp-attr">
            <span class="rp-attr__label">${a.label}</span>
            <span class="rp-attr__value">${a.top}</span>
            <span class="rp-attr__pct">${a.pct}%</span>
          </div>`
          )
          .join('')}
        <button type="button" class="rp-attrs__more" onclick="toggleReviewAttrs()">접기 ∧</button>
      </section>
      `
          : ''
      }

      <section class="rp-ai">
        <p class="rp-ai__label">고객들은 이렇게 리뷰했어요 <span class="rp-ai__beta">BETA</span></p>
        <p class="rp-ai__text">
          ${escapeHtml(product.name)} 구매 고객들은 <strong>신선도</strong>와 <strong>맛</strong>에 만족한다는 평가가 많습니다.
          산지 직송 포장이 꼼꼼하다는 의견도 자주 보입니다. 재구매 의사가 높은 인기 상품입니다.
        </p>
        <p class="rp-ai__foot">수산아빠 AI 요약 · <button type="button" onclick="showToast('피드백 감사합니다')">👍</button> <button type="button" onclick="showToast('피드백 감사합니다')">👎</button></p>
      </section>

      <div class="rp-toolbar">
        <div class="rp-sort">
          <button type="button" class="rp-sort__btn ${state.reviewSort === 'best' ? 'active' : ''}" onclick="setReviewSort('best')">베스트순</button>
          <span class="rp-sort__div">|</span>
          <button type="button" class="rp-sort__btn ${state.reviewSort === 'latest' ? 'active' : ''}" onclick="setReviewSort('latest')">최신순</button>
        </div>
        <label class="rp-photo-check">
          <input type="checkbox" ${state.reviewPhotoOnly ? 'checked' : ''} onchange="toggleReviewPhotoOnly(this.checked)" />
          사진/동영상 ${photoCount}
        </label>
        <button type="button" class="rp-filter-btn" onclick="showToast('필터 (데모)')">⚙ 필터</button>
      </div>

      <div class="rp-list">
        ${filtered.length ? filtered.map((r) => renderRpReviewItem(r, product)).join('') : '<p class="rp-empty">조건에 맞는 리뷰가 없습니다.</p>'}
      </div>

      <div class="rp-sticky">
        <button type="button" class="rp-sticky__cart" onclick="addToCart('${product.id}');navigate('cart')">장바구니 담기</button>
        <button type="button" class="rp-sticky__buy" onclick="state.selectedProductId='${product.id}';state.quantity=1;buyNow('${product.id}')">바로구매</button>
      </div>
    </div>
  `;
}

function setReviewFilter(filter) {
  state.reviewFilter = filter;
  render();
}

function openLightboxForReview(reviewId, index) {
  const review =
    getReviewsByProduct(state.reviewProductId || state.selectedProductId).find((r) => r.id === reviewId) ||
    REVIEWS.find((r) => r.id === reviewId);
  if (review?.images?.length) openLightbox(review.images, index);
}

function openLightboxForProduct(productId, index) {
  const images = getAllReviewImages(productId);
  if (images.length) openLightbox(images, index);
}

function openLightbox(images, index) {
  const list = Array.isArray(images) ? images : [];
  if (!list.length) return;
  state.lightbox = { images: list, index: index || 0 };
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const counter = document.getElementById('lightbox-counter');
  img.src = list[state.lightbox.index];
  counter.textContent = `${state.lightbox.index + 1} / ${list.length}`;
  const showNav = list.length > 1;
  box.querySelector('.lightbox__nav--prev').style.display = showNav ? '' : 'none';
  box.querySelector('.lightbox__nav--next').style.display = showNav ? '' : 'none';
  box.hidden = false;
  box.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const box = document.getElementById('lightbox');
  box.hidden = true;
  box.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function lightboxPrev() {
  const { images } = state.lightbox;
  if (!images.length) return;
  state.lightbox.index = (state.lightbox.index - 1 + images.length) % images.length;
  openLightbox(images, state.lightbox.index);
}

function lightboxNext() {
  const { images } = state.lightbox;
  if (!images.length) return;
  state.lightbox.index = (state.lightbox.index + 1) % images.length;
  openLightbox(images, state.lightbox.index);
}

document.addEventListener('keydown', (e) => {
  const box = document.getElementById('lightbox');
  if (box?.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});

function addToCart(productId, quantity = 1) {
  const product = getProduct(productId);
  const optionId =
    state.selectedProductId === productId && state.selectedOptionId
      ? state.selectedOptionId
      : product
        ? getDefaultOptionId(product)
        : null;
  const existing = state.cart.find(
    (i) => i.productId === productId && (i.optionId || null) === (optionId || null)
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ productId, quantity, optionId: optionId || undefined });
  }
  saveCart();
  showToast('장바구니에 담았습니다');
  render();
}

function updateCartQuantity(productId, delta, optionId) {
  const item = state.cart.find(
    (i) => i.productId === productId && (i.optionId || null) === (optionId || null)
  );
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(
      (i) => !(i.productId === productId && (i.optionId || null) === (optionId || null))
    );
  }
  saveCart();
  render();
}

function removeFromCart(productId, optionId) {
  state.cart = state.cart.filter(
    (i) => !(i.productId === productId && (i.optionId || null) === (optionId || null))
  );
  saveCart();
  render();
}

function saveRecentProduct(productId) {
  let ids = [];
  try {
    const raw = localStorage.getItem('greenharvest_recent');
    if (raw) {
      const parsed = JSON.parse(raw);
      ids = Array.isArray(parsed) ? parsed : [raw];
    }
  } catch {
    /* ignore */
  }
  ids = [productId, ...ids.filter((id) => id !== productId)].slice(0, 10);
  localStorage.setItem('greenharvest_recent', JSON.stringify(ids));
}

function getRecentProducts() {
  try {
    const raw = localStorage.getItem('greenharvest_recent');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed) ? parsed : [raw];
    return ids.map((id) => getProduct(id)).filter(Boolean);
  } catch {
    return [];
  }
}

function filterProducts() {
  return filterProductsByCategory(state.category, state.searchQuery);
}

function renderHeader() {
  const count = getCartCount();
  const navPage = state.page === 'reviews' ? 'home' : state.page;
  document.querySelectorAll('.nav__link').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === navPage);
  });
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = count;
    badge.dataset.count = count;
  }
  const bottomBadge = document.getElementById('bottom-cart-badge');
  if (bottomBadge) {
    bottomBadge.textContent = count;
    bottomBadge.dataset.count = count;
  }
}

function renderBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  const show = state.page === 'home';
  nav.classList.toggle('is-visible', show);
  nav.querySelectorAll('.bottom-nav__item').forEach((btn) => {
    const navId = btn.dataset.nav;
    const active =
      (navId === 'home' && state.page === 'home' && !state.categoryMenuOpen) ||
      (navId === 'categories' && state.categoryMenuOpen);
    btn.classList.toggle('active', active);
  });
  syncCategoryMenuPanel();
}

function renderCategoryMenuItems() {
  return HOME_CATEGORIES.map(
    (cat) => `
    <button type="button" class="category-menu__item ${state.category === cat.id ? 'is-active' : ''}"
      onclick="selectCategoryFromMenu('${cat.id}')">
      <span class="category-menu__icon">${cat.icon}</span>
      <span class="category-menu__name">${escapeHtml(cat.name)}</span>
    </button>`
  ).join('');
}

function syncCategoryMenuPanel() {
  const menu = document.getElementById('category-menu');
  const grid = document.getElementById('category-menu-grid');
  if (!menu) return;
  menu.classList.toggle('is-open', !!state.categoryMenuOpen);
  menu.hidden = !state.categoryMenuOpen;
  menu.setAttribute('aria-hidden', state.categoryMenuOpen ? 'false' : 'true');
  document.body.classList.toggle('is-category-menu-open', !!state.categoryMenuOpen);
  const catBtn = document.getElementById('bottom-nav-categories');
  if (catBtn) catBtn.setAttribute('aria-expanded', state.categoryMenuOpen ? 'true' : 'false');
  if (grid) grid.innerHTML = renderCategoryMenuItems();
}

function toggleCategoryMenu() {
  if (state.page !== 'home') {
    state.categoryMenuOpen = true;
    navigate('home');
    return;
  }
  state.categoryMenuOpen = !state.categoryMenuOpen;
  syncCategoryMenuPanel();
}

function closeCategoryMenu() {
  if (!state.categoryMenuOpen) return;
  state.categoryMenuOpen = false;
  syncCategoryMenuPanel();
}

function selectCategoryFromMenu(id) {
  closeCategoryMenu();
  selectCategory(id);
}

function focusHomeSearch() {
  closeCategoryMenu();
  navigate('home');
  setTimeout(() => document.getElementById('home-search')?.focus(), 100);
}

function scrollToHomeCategories() {
  toggleCategoryMenu();
}

/** 입력만 저장 — 검색은 버튼·돋보기·Enter 시 실행 */
function onHomeSearchType(inputEl) {
  state.searchDraft = inputEl.value;
}

function submitHomeSearch() {
  const input = document.getElementById('home-search');
  const q = (input?.value ?? state.searchDraft ?? '').trim();
  state.searchQuery = q;
  state.searchDraft = q;
  if (input) input.value = q;
  if (state.page === 'home') {
    syncHashFromState(true);
    updateHomeProductList();
    showToast(q ? `"${q}" 검색했습니다` : '전체 상품을 보여드립니다');
  }
}

function renderHomeListTitle() {
  const catName = HOME_CATEGORIES.find((c) => c.id === state.category)?.name || '추천';
  if (state.searchQuery.trim()) {
    return `"${escapeHtml(state.searchQuery)}" 검색결과`;
  }
  return `${catName} 상품`;
}

function updateHomeProductList() {
  if (state.page !== 'home') return;
  render();
  setTimeout(() => {
    document.getElementById('home-product-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

function setHomeBanner(index) {
  state.homeBannerIndex = index;
  render();
}

function homeBannerPrev() {
  state.homeBannerIndex = (state.homeBannerIndex - 1 + HOME_BANNERS.length) % HOME_BANNERS.length;
  render();
}

function homeBannerNext() {
  state.homeBannerIndex = (state.homeBannerIndex + 1) % HOME_BANNERS.length;
  render();
}

function renderHomeCategories() {
  return HOME_CATEGORIES.map(
    (cat) => `
    <button class="home-cat ${state.category === cat.id ? 'active' : ''}"
            onclick="selectCategory('${cat.id}')" type="button">
      <span class="home-cat__icon">${cat.icon}</span>
      <span class="home-cat__name">${cat.name}</span>
    </button>
  `
  ).join('');
}

function getUnitPriceLabel(product) {
  const m = product.unit.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
  if (!m) return '';
  const amount = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  let per100g = 0;
  if (u === 'kg') per100g = product.price / amount / 10;
  else if (u === 'g') per100g = (product.price / amount) * 100;
  if (per100g > 0) return `(100g당 ${Math.round(per100g).toLocaleString()}원)`;
  return '';
}

function renderHomeScrollCard(product) {
  const img = getAdminProductImages(product)[0];
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const reviewCount = getReviewsByProduct(product.id).length;
  const saleLabel = product.badge === '유기농' ? '유기농특가' : '산지특가';
  const unitLabel = getUnitPriceLabel(product);
  const fullStars = Math.round(product.rating);

  return `
    <article class="h-card">
      <button type="button" class="h-card__inner" onclick="navigate('detail',{productId:'${product.id}'})">
        <div class="h-card__img">
          ${
            img?.url
              ? `<img src="${img.url}" alt="" loading="lazy"
                  onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
                 <span class="h-card__img-fallback" style="display:none;background:${product.gradient}">${product.emoji}</span>`
              : `<span class="h-card__img-fallback" style="background:${product.gradient}">${product.emoji}</span>`
          }
        </div>
        <p class="h-card__name">${escapeHtml(product.name)}, ${escapeHtml(product.unit)}</p>
        <p class="h-card__orig">
          <span class="h-card__orig-label">${saleLabel}</span>
          <span class="h-card__orig-price">${formatPrice(product.originalPrice)}</span>
        </p>
        <p class="h-card__price">
          <span class="h-card__pct">${discount}%</span>
          <span class="h-card__amount">${formatPrice(product.price)}</span>
        </p>
        ${unitLabel ? `<p class="h-card__unit">${unitLabel}</p>` : ''}
        <p class="h-card__ship">
          <span class="h-card__ship-badge">🚀 산지직송</span>
          <span class="h-card__ship-date">${getProductArrivalLabel(product)}</span>
        </p>
        <p class="h-card__rating">
          <span class="h-card__stars">${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}</span>
          <span class="h-card__reviews">(${reviewCount > 999 ? '999+' : reviewCount})</span>
        </p>
      </button>
    </article>
  `;
}

function getKstDayEndMs() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  );
  const y = Number(parts.year);
  const mo = Number(parts.month);
  const da = Number(parts.day);
  return Date.UTC(y, mo - 1, da + 1, 0, 0, 0) - 9 * 60 * 60 * 1000;
}

function getTimeAttackRemainingMs() {
  return Math.max(0, getKstDayEndMs() - Date.now());
}

function formatTimeAttackCountdown(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

let timeAttackTimerId = null;

function stopTimeAttackTimer() {
  if (timeAttackTimerId) {
    clearInterval(timeAttackTimerId);
    timeAttackTimerId = null;
  }
}

function tickTimeAttackTimer() {
  const el = document.getElementById('time-attack-timer');
  if (!el) return;
  const ms = getTimeAttackRemainingMs();
  el.textContent = formatTimeAttackCountdown(ms);
  if (ms <= 0) stopTimeAttackTimer();
}

function startTimeAttackTimer() {
  stopTimeAttackTimer();
  tickTimeAttackTimer();
  timeAttackTimerId = setInterval(tickTimeAttackTimer, 1000);
}

function getTimeAttackProducts() {
  return getAllProducts()
    .filter((p) => p.timeAttack === true)
    .sort((a, b) => {
      const oa = Number(a.timeAttackOrder);
      const ob = Number(b.timeAttackOrder);
      if (Number.isFinite(oa) && Number.isFinite(ob) && oa !== ob) return oa - ob;
      if (Number.isFinite(oa) && !Number.isFinite(ob)) return -1;
      if (!Number.isFinite(oa) && Number.isFinite(ob)) return 1;
      return String(a.id).localeCompare(String(b.id));
    });
}

function renderTimeAttackSection() {
  const products = getTimeAttackProducts();
  if (!products.length) return '';
  const countdown = formatTimeAttackCountdown(getTimeAttackRemainingMs());
  return `
    <section class="home-row-section home-time-attack" aria-label="타임어택 특가">
      <div class="home-row-section__head home-time-attack__head">
        <h2 class="home-row-section__title home-time-attack__title">
          <span class="home-time-attack__label">타임어택</span>
          <span class="time-attack-timer" id="time-attack-timer" aria-live="polite">${countdown}</span>
        </h2>
        <button type="button" class="home-row-section__more" onclick="selectCategory('sale')">더보기 ›</button>
      </div>
      <p class="home-time-attack__sub">오늘 자정까지 · 선착순 특가</p>
      <div class="home-scroll">${products.map(renderHomeScrollCard).join('')}</div>
    </section>
  `;
}

function renderHomeScrollSection(title, products, moreOnClick) {
  if (!products.length) return '';
  return `
    <section class="home-row-section">
      <div class="home-row-section__head">
        <h2 class="home-row-section__title">${title}</h2>
        ${
          moreOnClick
            ? `<button type="button" class="home-row-section__more" onclick="${moreOnClick}">더보기 ›</button>`
            : ''
        }
      </div>
      <div class="home-scroll">${products.map(renderHomeScrollCard).join('')}</div>
    </section>
  `;
}

function renderProductCard(product) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const img = getAdminProductImages(product)[0];
  return `
    <article class="product-card">
      <div class="product-card__visual" style="background:${product.gradient}">
        <span class="product-card__badge">${product.badge}</span>
        ${
          img?.url
            ? `<img src="${img.url}" alt="" class="product-card__img" loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='inline'" />
               <span class="product-card__emoji" style="display:none">${product.emoji}</span>`
            : product.emoji
        }
      </div>
      <div class="product-card__body">
        <p class="product-card__origin">${product.origin}</p>
        <h3 class="product-card__name">${escapeHtml(product.name)}${product.unit ? `, ${escapeHtml(product.unit)}` : ''}</h3>
        <button type="button" class="product-card__rating product-card__rating--link"
          onclick="navigate('reviews',{reviewProductId:'${product.id}'})">
          <span>★ ${product.rating}</span> · 리뷰 ${getReviewsByProduct(product.id).length}개 보기
        </button>
        <div class="product-card__price">
          <span class="product-card__price-current">${formatPrice(product.price)}</span>
          <span class="product-card__price-original">${formatPrice(product.originalPrice)}</span>
          <span style="font-size:0.8rem;color:var(--color-danger);font-weight:600">${discount}%</span>
        </div>
        <div class="product-card__actions">
          <button class="btn btn--outline btn--sm btn-flex-1" onclick="navigate('detail',{productId:'${product.id}'})">상세보기</button>
          <button class="btn btn--primary btn--sm btn-flex-1" onclick="addToCart('${product.id}')">담기</button>
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const products = filterProducts();
  const recentAll = getRecentProducts();
  const recentProducts =
    state.category === 'all'
      ? recentAll
      : recentAll.filter((p) => products.some((fp) => fp.id === p.id));
  const catName = HOME_CATEGORIES.find((c) => c.id === state.category)?.name || '전체';
  const isCategoryView = state.category !== 'all';
  const banner = HOME_BANNERS[state.homeBannerIndex];
  const searchValue = state.searchDraft !== undefined && state.page === 'home'
    ? state.searchDraft
    : state.searchQuery;
  const bannerDots = HOME_BANNERS.map(
    (_, i) =>
      `<button type="button" class="home-banner__dot ${i === state.homeBannerIndex ? 'active' : ''}" onclick="setHomeBanner(${i})" aria-label="배너 ${i + 1}"></button>`
  ).join('');

  return `
    <div class="home">
      <header class="home-header">
        <a class="home-header__logo" href="#" onclick="navigate('home');return false">
          <img class="home-header__logo-img" src="images/logo.png" alt="" width="44" height="44" />
          <span class="home-header__logo-text">수산아빠</span>
        </a>
        <div class="home-header__actions">
          ${renderNotificationBell()}
        </div>
      </header>

      <div class="home-search-wrap">
        <div class="home-search">
          <button type="button" class="home-search__icon-btn" onclick="submitHomeSearch()" aria-label="검색">🔍</button>
          <input type="search" id="home-search" placeholder="농수산물을 검색하세요!"
            value="${escapeHtml(searchValue)}"
            autocomplete="off"
            oninput="onHomeSearchType(this)"
            onkeydown="if(event.key==='Enter'){event.preventDefault();submitHomeSearch()}" />
          <button type="button" class="home-search__submit" onclick="submitHomeSearch()">검색</button>
        </div>
      </div>

      <section class="home-banner" style="background:${banner.bg}">
        <button type="button" class="home-banner__arrow home-banner__arrow--prev" onclick="homeBannerPrev()">‹</button>
        <button type="button" class="home-banner__content" onclick="navigate('detail',{productId:'${banner.productId}'})">
          <span class="home-banner__emoji">${banner.emoji}</span>
          <div>
            <h2 class="home-banner__title">${escapeHtml(banner.title)}</h2>
            <p class="home-banner__sub">${escapeHtml(banner.subtitle)}</p>
          </div>
        </button>
        <button type="button" class="home-banner__arrow home-banner__arrow--next" onclick="homeBannerNext()">›</button>
        <div class="home-banner__dots">${bannerDots}</div>
      </section>

      <nav class="home-categories" id="home-categories" aria-label="식품 카테고리">
        ${renderHomeCategories()}
      </nav>

      <button type="button" class="home-promo" style="background:${HOME_PROMO.bg}" onclick="selectCategory('local')">
        <span class="home-promo__emoji">${HOME_PROMO.emoji}</span>
        <div class="home-promo__text">
          <strong>${escapeHtml(HOME_PROMO.title)}</strong>
          <span>${escapeHtml(HOME_PROMO.subtitle)}</span>
        </div>
        <span class="home-promo__arrow">›</span>
      </button>

      ${
        !isCategoryView
          ? `
      ${renderHomeScrollSection(
        '👀 최근 본 상품',
        recentAll,
        recentAll.length ? "document.getElementById('home-product-list')?.scrollIntoView({behavior:'smooth'})" : null
      )}
      ${renderTimeAttackSection()}
      ${renderHomeScrollSection('🛍️ 이 상품 놓치지 마세요!', getAllProducts(), "selectCategory('all')")}
      ${renderHomeScrollSection(
        '🔥 고민하는 사이 품절! 산지 마감특가',
        filterProductsByCategory('sale'),
        "selectCategory('sale')"
      )}
      `
          : `
      ${renderHomeScrollSection(
        `📂 ${catName}`,
        products,
        null
      )}
      ${recentProducts.length ? renderHomeScrollSection('👀 최근 본 상품', recentProducts, null) : ''}
      `
      }

      <section class="home-section home-section--list" id="home-product-list-section">
        <h2 class="home-section__title">
          <span id="home-list-title">${isCategoryView ? `${escapeHtml(catName)} 상품` : renderHomeListTitle()}</span>
          <span class="home-section__count" id="home-list-count">${products.length}개</span>
        </h2>
        ${
          isCategoryView
            ? `<p class="home-list-filter-hint">선택한 카테고리 상품만 표시 중 · <button type="button" class="link-review" onclick="selectCategory('all')">전체 보기</button></p>`
            : ''
        }
        <div class="products-grid products-grid--home" id="home-product-list">
          ${products.length ? products.map(renderProductCard).join('') : '<div class="home-empty"><p>해당 카테고리 상품을 준비 중입니다.</p><button type="button" class="btn btn--primary btn--sm" style="margin-top:12px" onclick="selectCategory(\'all\')">전체 상품 보기</button></div>'}
        </div>
      </section>
    </div>
  `;
}

function renderProductDetailBlocks(product) {
  if (product.detailHtml && String(product.detailHtml).trim()) {
    return `<div class="pdp-detail-blocks pdp-detail-html">${sanitizeDetailHtml(product.detailHtml)}</div>`;
  }
  const blocks = product.detailBlocks?.length
    ? product.detailBlocks
    : (product.details || []).map((t) => ({ type: 'text', text: String(t) }));
  if (!blocks.length) return '';
  return `
    <div class="pdp-detail-blocks">
      ${blocks
        .map((b) => {
          if (b.type === 'image' && b.url) {
            return `<figure class="pdp-detail-block pdp-detail-block--img">
              <img src="${b.url}" alt="" loading="lazy" />
              ${b.text ? `<figcaption>${escapeHtml(b.text)}</figcaption>` : ''}
            </figure>`;
          }
          if (b.text) return `<p class="pdp-detail-block pdp-detail-block--text">${escapeHtml(b.text)}</p>`;
          return '';
        })
        .join('')}
    </div>`;
}

function sanitizeDetailHtml(html) {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function renderProductPolicySections(product) {
  if (!product.shippingGuide && !product.returnGuide) return '';
  const nl = (s) => escapeHtml(String(s)).replace(/\n/g, '<br>');
  return `
    <section class="pdp-policies">
      ${product.shippingGuide ? `<div class="pdp-policy"><h3 class="pdp-policy__title">배송 안내</h3><div class="pdp-policy__body">${nl(product.shippingGuide)}</div></div>` : ''}
      ${product.returnGuide ? `<div class="pdp-policy"><h3 class="pdp-policy__title">교환·반품 안내</h3><div class="pdp-policy__body">${nl(product.returnGuide)}</div></div>` : ''}
    </section>`;
}

let _detailProductLoadToken = 0;

function retryLoadDetailProduct() {
  const pid = state.selectedProductId;
  if (!pid || typeof API === 'undefined' || typeof API.loadProducts !== 'function') return;
  const token = ++_detailProductLoadToken;
  API.loadProducts().then(() => {
    if (token !== _detailProductLoadToken || state.page !== 'detail' || state.selectedProductId !== pid) return;
    render();
  });
}

function renderDetail() {
  const product = getProduct(state.selectedProductId);
  if (!product) {
    retryLoadDetailProduct();
    return `
      <div class="empty-state" style="padding:48px 16px">
        <div class="empty-state__icon">📦</div>
        <h3 class="empty-state__title">상품을 불러오는 중입니다</h3>
        <p class="empty-state__desc">잠시만 기다려 주세요.</p>
        <button class="btn btn--outline" type="button" onclick="navigate('home')">홈으로</button>
      </div>`;
  }

  const option = getSelectedOption(product);
  const price = getOptionSalePrice(product, option);
  const originalPrice = getOptionOriginalPrice(product, option);
  const discount = originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
  const reviewCount = getReviewsByProduct(product.id).length;
  const adminImages = getAdminProductImages(product);
  const slides = adminImages.length ? adminImages : [{ url: null, label: '이미지 없음' }];
  const isWished = state.wishlist.includes(product.id);
  const crumbs = product.categoryPath || ['식품', getCategoryName(product.category), product.name];
  const freeShip = product.freeShipping || price >= FREE_SHIPPING_THRESHOLD;

  const slidesHtml = slides
    .map(
      (img, i) => `
      <div class="pdp-carousel__slide ${i === state.carouselIndex ? 'active' : ''}">
        ${
          img.url
            ? `<img src="${img.url}" alt="${escapeHtml(img.label || product.name)} - 관리자 등록 상품 이미지" />`
            : `<div class="pdp-carousel__fallback" style="background:${product.gradient}">${product.emoji}</div>`
        }
      </div>
    `
    )
    .join('');

  const dotsHtml = slides
    .map(
      (_, i) =>
        `<button type="button" class="pdp-carousel__dot ${i === state.carouselIndex ? 'active' : ''}" aria-label="이미지 ${i + 1}" onclick="setCarouselSlide(${i})"></button>`
    )
    .join('');

  const optionsHtml = productHasOptions(product)
    ? (product.options || [])
        .map((opt) => {
          const addLabel = opt.price > 0 ? ` (+${formatPrice(opt.price)})` : '';
          return `
      <button type="button"
        class="pdp-option-pill ${state.selectedOptionId === opt.id ? 'active' : ''}"
        onclick="selectOption('${opt.id}')">${escapeHtml(opt.label)}${addLabel}</button>
    `;
        })
        .join('')
    : '';

  return `
    <div class="pdp">
      <header class="pdp-topbar" aria-label="상품 상세">
        <button type="button" class="pdp-topbar__btn" onclick="navigate('home')" aria-label="뒤로">←</button>
        <p class="pdp-topbar__title">${escapeHtml(product.name)}</p>
        <button type="button" class="pdp-topbar__btn ${isWished ? 'is-wished' : ''}" onclick="toggleWishlist('${product.id}')" aria-label="찜">${isWished ? '♥' : '♡'}</button>
      </header>
      <section class="pdp-hero">
        <p class="pdp-hero__crumb">${crumbs.map((c) => escapeHtml(c)).join(' › ')}</p>
        <div class="pdp-carousel" id="pdp-carousel">
          <div class="pdp-carousel__track" style="transform:translateX(-${state.carouselIndex * 100}%)">
            ${slidesHtml}
          </div>
          ${slides.length > 1 ? `<div class="pdp-carousel__dots">${dotsHtml}</div>` : ''}
          ${slides.length > 1 ? `
            <button type="button" class="pdp-carousel__arrow pdp-carousel__arrow--prev" onclick="carouselPrev()">‹</button>
            <button type="button" class="pdp-carousel__arrow pdp-carousel__arrow--next" onclick="carouselNext()">›</button>
          ` : ''}
        </div>
        <button type="button" class="pdp-hero__detail-link" onclick="scrollToPdpInfo()">상세보기 ›</button>
      </section>

      <div class="pdp-body">
        <div class="pdp-social">
          <span class="pdp-social__buyers">🛍 지난 한 달간 <strong>${product.recentBuyers || 100}명</strong> 이상 구매</span>
          <div class="pdp-social__actions">
            <button type="button" class="pdp-icon-btn" onclick="shareProduct()" title="공유">↗</button>
          </div>
        </div>

        <button type="button" class="pdp-rating" onclick="navigate('reviews',{reviewProductId:'${product.id}'})">
          ${renderStars(product.rating)}
          <span class="pdp-rating__count">(${reviewCount})</span>
        </button>

        <h1 class="pdp-title">${escapeHtml(product.name)}</h1>
        <p class="pdp-meta">${escapeHtml(product.origin)} · ${escapeHtml(option?.label || product.unit)}</p>

        <div class="pdp-price">
          <span class="pdp-price__badge">${discount}%</span>
          <div class="pdp-price__main">
            <span class="pdp-price__current">${formatPrice(price)}</span>
            <span class="pdp-price__original">${formatPrice(originalPrice)}</span>
          </div>
          ${product.couponNote ? `<p class="pdp-price__note">${escapeHtml(product.couponNote)}</p>` : ''}
        </div>

        <hr class="pdp-divider" />

        <div class="pdp-shipping">
          <div class="pdp-shipping__row">
            <span class="pdp-shipping__badge">🚀 산지직송</span>
            <span class="pdp-shipping__arrival">${getProductArrivalLabel(product, true)}</span>
          </div>
          <div class="pdp-shipping__row pdp-shipping__row--sub">
            <span>🚚 ${freeShip ? '무료배송' : `배송비 ${formatPrice(SHIPPING_FEE)}`}</span>
            <span class="pdp-shipping__fresh-notice">⚠ 신선식품 · 단순변심 교환·반품 불가</span>
          </div>
        </div>

        <hr class="pdp-divider" />

        ${productHasOptions(product) ? `
        <div class="pdp-options">
          <p class="pdp-options__label">${escapeHtml(product.optionLabel || '옵션')}: <strong>${escapeHtml(option?.label || '')}</strong></p>
          <div class="pdp-option-pills">${optionsHtml}</div>
          <p class="pdp-options__note">신선 농·수산물은 <strong>품질 이상(파손·변질·오배송)</strong> 시에만 교환·환불이 가능합니다.</p>
        </div>
        <hr class="pdp-divider" />
        ` : ''}

        <section class="pdp-info" id="pdp-info">
          <h2 class="pdp-info__title">상품 정보</h2>
          <p class="pdp-desc">${escapeHtml(product.description)}</p>
          ${renderProductDetailBlocks(product)}
          <span class="pdp-stock">재고 ${product.stock}개 남음</span>
        </section>
        ${renderProductPolicySections(product)}
      </div>

      <div class="pdp-sticky">
        <div class="pdp-sticky__qty">
          <button type="button" class="pdp-sticky__qty-btn" onclick="changeQty(-1)">−</button>
          <span id="qty-display">${state.quantity}</span>
          <button type="button" class="pdp-sticky__qty-btn" onclick="changeQty(1)">+</button>
        </div>
        <button type="button" class="pdp-sticky__cart" onclick="addToCart('${product.id}', state.quantity)">장바구니</button>
        <button type="button" class="pdp-sticky__buy" onclick="buyNow('${product.id}')">바로구매</button>
      </div>
    </div>
  `;
}

function selectOption(optionId) {
  state.selectedOptionId = optionId;
  syncHashFromState(true);
  render();
}

function setCarouselSlide(index) {
  state.carouselIndex = index;
  render();
}

function carouselPrev() {
  const product = getProduct(state.selectedProductId);
  const len = getAdminProductImages(product).length || 1;
  state.carouselIndex = (state.carouselIndex - 1 + len) % len;
  render();
}

function carouselNext() {
  const product = getProduct(state.selectedProductId);
  const len = getAdminProductImages(product).length || 1;
  state.carouselIndex = (state.carouselIndex + 1) % len;
  render();
}

function scrollToPdpInfo() {
  document.getElementById('pdp-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleWishlist(productId) {
  const idx = state.wishlist.indexOf(productId);
  if (idx >= 0) {
    state.wishlist.splice(idx, 1);
    showToast('찜 목록에서 제거했습니다');
  } else {
    state.wishlist.push(productId);
    showToast('찜 목록에 추가했습니다');
  }
  saveWishlist();
  render();
}

function shareProduct() {
  const product = getProduct(state.selectedProductId);
  if (!product) return;
  const text = `${product.name} - 수산아빠`;
  if (navigator.share) {
    navigator.share({ title: product.name, text }).catch(() => showToast('공유가 취소되었습니다'));
  } else {
    showToast('링크가 복사되었습니다 (데모)');
  }
}

function renderCart() {
  if (!state.cart.length) {
    return `
      <h2 class="section-title">장바구니</h2>
      <div class="empty-state">
        <div class="empty-state__icon">🛒</div>
        <h3 class="empty-state__title">장바구니가 비어 있습니다</h3>
        <p class="empty-state__desc">신선한 농수산물을 담아보세요.</p>
        <button class="btn btn--primary" onclick="navigate('home')">쇼핑 계속하기</button>
      </div>
    `;
  }

  const subtotal = getCartSubtotal();
  const shipping = getShippingFee(subtotal);
  const total = subtotal + shipping;

  const itemsHtml = state.cart
    .map((item) => {
      const p = getProduct(item.productId);
      if (!p) return '';
      const opt = getCartItemOption(p, item);
      const unitPrice = getCartItemUnitPrice(item);
      const optId = item.optionId || '';
      return `
          <div class="cart-item">
          ${renderProductThumbHtml(p, 'cart-item__visual')}
          <div class="cart-item__info">
            <h3 class="cart-item__name">${p.name}</h3>
            <p class="cart-item__unit">${escapeHtml(opt?.label || p.unit)}</p>
            <p class="cart-item__price">${formatPrice(unitPrice * item.quantity)}</p>
          </div>
          <div class="cart-item__actions">
            <div class="quantity-control__btns">
              <button class="quantity-control__btn" type="button" onclick="updateCartQuantity('${p.id}', -1, '${optId}')">−</button>
              <span class="quantity-control__value">${item.quantity}</span>
              <button class="quantity-control__btn" type="button" onclick="updateCartQuantity('${p.id}', 1, '${optId}')">+</button>
            </div>
            <button class="btn btn--ghost btn--sm" onclick="removeFromCart('${p.id}', '${optId}')">삭제</button>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <h2 class="section-title">장바구니</h2>
    <div class="cart-layout">
      <div class="cart-items">${itemsHtml}</div>
      <aside class="cart-summary">
        <div class="cart-summary__row"><span>상품금액</span><span>${formatPrice(subtotal)}</span></div>
        <div class="cart-summary__row"><span>배송비</span><span>${shipping ? formatPrice(shipping) : '무료'}</span></div>
        ${subtotal < FREE_SHIPPING_THRESHOLD ? `<p style="font-size:0.85rem;color:var(--color-text-muted);margin-top:8px">${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} 더 담으면 무료배송</p>` : ''}
        <div class="cart-summary__row cart-summary__row--total"><span>결제 예정</span><span>${formatPrice(total)}</span></div>
        <button class="btn btn--primary btn--lg" onclick="navigate('checkout')">주문하기</button>
      </aside>
    </div>
  `;
}

function renderCheckout() {
  if (!state.cart.length) {
    navigate('cart');
    return '';
  }

  const subtotal = getCartSubtotal();
  const shipping = getShippingFee(subtotal);
  const total = subtotal + shipping;

  const orderItems = state.cart
    .map((item) => {
      const p = getProduct(item.productId);
      if (!p) return '';
      const opt = getCartItemOption(p, item);
      const label = opt?.label ? `${p.name} (${opt.label})` : p.name;
      const unitPrice = getCartItemUnitPrice(item);
      return `<div class="cart-summary__row"><span>${escapeHtml(label)} × ${item.quantity}</span><span>${formatPrice(unitPrice * item.quantity)}</span></div>`;
    })
    .join('');

  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('cart');return false">장바구니</a> / 주문·결제</nav>
    <h2 class="section-title">주문 / 결제</h2>
    <div class="checkout-layout">
      <form class="checkout-form" id="checkout-form" onsubmit="submitOrder(event)">
        <section class="form-section">
          <h3 class="form-section__title">배송 정보</h3>
          <div id="saved-address-picker" class="saved-address-picker" hidden></div>
          <div class="form-grid" id="checkout-address-fields">
            <div class="form-group">
              <label>받는 분 <span class="required">*</span></label>
              <input type="text" name="name" required placeholder="홍길동" />
            </div>
            <div class="form-group">
              <label>연락처 <span class="required">*</span></label>
              <input type="tel" name="phone" required placeholder="010-0000-0000" pattern="[0-9\\-]+" />
            </div>
            <div class="form-group form-group--full">
              <label>우편번호 <span class="required">*</span></label>
              <div class="address-row">
                <input type="text" id="zipcode" name="zipcode" readonly required placeholder="우편번호" />
                <button type="button" class="btn btn--outline" id="btn-search-address">주소 검색</button>
              </div>
            </div>
            <div class="form-group form-group--full">
              <label>주소 <span class="required">*</span></label>
              <input type="text" id="address-base" name="addressBase" readonly required placeholder="주소 검색 버튼을 눌러 입력하세요" />
            </div>
            <div class="form-group form-group--full">
              <label>상세주소 <span class="required">*</span></label>
              <input type="text" id="address-detail" name="addressDetail" required placeholder="동·호수·공동현관 비밀번호 등" />
            </div>
            <div class="form-group form-group--full" id="save-address-wrap" hidden>
              <label class="checkbox-inline">
                <input type="checkbox" name="saveAddress" id="save-address-check" />
                이 배송지를 목록에 저장
              </label>
            </div>
            <div class="form-group form-group--full">
              <label>배송 메모</label>
              <textarea name="memo" placeholder="문 앞에 놓아주세요"></textarea>
            </div>
          </div>
        </section>
        <section class="form-section">
          <h3 class="form-section__title">결제 수단</h3>
          ${renderCheckoutBankBox()}
          <div class="payment-methods" id="payment-methods">
            ${renderPaymentMethodOptions()}
          </div>
          <p class="mock-notice" id="payment-notice">${escapeHtml(getPaymentNotice())}</p>
        </section>
        <button type="submit" class="btn btn--primary btn--lg" id="checkout-submit-btn">${isTransferOnlyCheckout() ? '주문하기' : '결제하기'} ${formatPrice(total)}</button>
      </form>
      <aside class="cart-summary">
        <h3 style="font-weight:700;margin-bottom:16px">주문 상품</h3>
        ${orderItems}
        <div class="cart-summary__row" style="margin-top:12px"><span>배송비</span><span>${shipping ? formatPrice(shipping) : '무료'}</span></div>
        <div class="cart-summary__row cart-summary__row--total"><span>총 결제금액</span><span>${formatPrice(total)}</span></div>
      </aside>
    </div>
  `;
}

function getCheckoutPaymentMethods() {
  const p = API.paymentSettings || {};
  let methods = p.enabledMethods || ['card', 'transfer', 'kakao'];
  if (!p.enabled || p.transferOnly) {
    methods = methods.filter((m) => m === 'transfer');
    if (!methods.length) methods = ['transfer'];
  }
  return methods;
}

function isTransferOnlyCheckout() {
  return getCheckoutPaymentMethods().length === 1 && getCheckoutPaymentMethods()[0] === 'transfer';
}

function getPaymentNotice() {
  const p = API.paymentSettings || {};
  if (p.notice) return p.notice;
  if (p.enabled) return p.testMode ? '테스트 결제 모드입니다. 실제로 청구되지 않습니다.' : '토스페이먼츠로 안전하게 결제됩니다.';
  const bank = p.bankAccount;
  const bankLine = bank?.bank && bank?.number ? `${bank.bank} ${bank.number} (${bank.holder || ''})` : '';
  return `무통장 입금으로 주문합니다. 입금 확인 후 배송됩니다.${bankLine ? ` 계좌: ${bankLine}` : ''}`;
}

function getPaymentBankAccount(fallback) {
  const fromSettings = (typeof API !== 'undefined' && API.paymentSettings?.bankAccount) || {};
  const fromOrder = fallback || {};
  return {
    bank: fromOrder.bank || fromSettings.bank || '',
    number: fromOrder.number || fromSettings.number || '',
    holder: fromOrder.holder || fromSettings.holder || '',
  };
}

function getBankCopyText(bank) {
  const b = getPaymentBankAccount(bank);
  const num = String(b.number || '').trim();
  if (!num) return '';
  return b.bank ? `${b.bank} ${num}` : num;
}

function copyBankAccountFromEl(btn) {
  let text = btn?.dataset?.copy || '';
  try {
    if (btn?.dataset?.copyEnc) text = decodeURIComponent(btn.dataset.copyEnc);
  } catch {
    /* use raw copy */
  }
  if (!text) {
    showToast('복사할 계좌 정보가 없습니다.');
    return;
  }
  const done = () => showToast('계좌 정보가 복사되었습니다.');
  const fail = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch {
      showToast('복사에 실패했습니다. 계좌번호를 직접 선택해 주세요.');
    }
    ta.remove();
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fail);
  } else {
    fail();
  }
}

function renderBankAccountPanel(bank, opts = {}) {
  const b = getPaymentBankAccount(bank);
  const copyText = getBankCopyText(b);
  const guide = opts.guide || '';
  const title = opts.title || '입금 계좌';
  const extraClass = opts.className || '';
  const hasAccount = !!(String(b.number || '').trim() || String(b.bank || '').trim());
  if (!hasAccount) return '';
  const copyEnc = copyText ? encodeURIComponent(copyText) : '';
  return `
    <div class="bank-copy-panel ${extraClass}">
      <p class="bank-copy-panel__title">${escapeHtml(title)}</p>
      <div class="bank-copy-panel__row">
        <div class="bank-copy-panel__info">
          <span class="bank-copy-panel__bank">${escapeHtml(b.bank || '')}</span>
          <span class="bank-copy-panel__number">${escapeHtml(b.number || '')}</span>
        </div>
        <button type="button" class="bank-copy-panel__btn" data-copy="${escapeHtml(copyText)}" data-copy-enc="${copyEnc}" onclick="copyBankAccountFromEl(this)">계좌 복사</button>
      </div>
      ${b.holder ? `<p class="bank-copy-panel__holder">예금주: ${escapeHtml(b.holder)}</p>` : ''}
      ${guide ? `<p class="bank-copy-panel__guide">${escapeHtml(guide)}</p>` : ''}
      ${opts.footer ? `<p class="bank-copy-panel__footer">${opts.footer}</p>` : ''}
    </div>`;
}

function checkoutHasTransferMethod() {
  return getCheckoutPaymentMethods().includes('transfer');
}

function renderCheckoutBankBox() {
  if (!checkoutHasTransferMethod()) return '';
  const p = API.paymentSettings || {};
  const bank = getPaymentBankAccount(p.bankAccount);
  const guide = p.transferGuide || '주문 후 24시간 이내 입금해 주세요.';
  return `<div id="checkout-bank-box" class="checkout-bank-box-wrap">${renderBankAccountPanel(bank, {
    className: 'bank-copy-panel--checkout',
    guide,
    footer: '입금자명은 주문자명과 동일하게 입력해 주세요.',
  })}</div>`;
}

function syncCheckoutBankBoxVisibility() {
  const wrap = document.getElementById('checkout-bank-box');
  if (!wrap) return;
  const selected = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';
  const show = selected === 'transfer' || isTransferOnlyCheckout();
  wrap.style.display = show ? '' : 'none';
}

function renderPaymentMethodOptions() {
  const p = API.paymentSettings || {};
  const methods = getCheckoutPaymentMethods();
  const defs = {
    card: { icon: '💳', title: '신용/체크카드', desc: p.enabled ? '토스페이먼츠 카드 결제' : '카드 결제' },
    transfer: { icon: '🏦', title: '무통장 입금', desc: '입금 확인 후 발송' },
    kakao: { icon: '💬', title: '간편결제', desc: p.enabled ? '카카오페이·토스페이 등' : '간편결제' },
  };
  return methods
    .filter((m) => defs[m])
    .map(
      (m, i) => `
    <label class="payment-option ${i === 0 ? 'selected' : ''}">
      <input type="radio" name="payment" value="${m}" ${i === 0 ? 'checked' : ''} />
      <span class="payment-option__icon">${defs[m].icon}</span>
      <span class="payment-option__info"><strong>${defs[m].title}</strong><span>${defs[m].desc}</span></span>
    </label>`
    )
    .join('');
}

function buildOrderName() {
  if (!state.cart.length) return '수산아빠 주문';
  const first = getProduct(state.cart[0].productId);
  const name = first?.name || '수산아빠 상품';
  return state.cart.length > 1 ? `${name} 외 ${state.cart.length - 1}건` : name;
}

function buildLastOrderFromApi(order, extra = {}) {
  const zip = order.zipcode || '';
  const base = order.address || '';
  const detail = order.address_detail || order.addressDetail || '';
  const labels = { card: '신용/체크카드', transfer: '무통장 입금', kakao: '간편결제' };
  return {
    id: order.id,
    name: order.guest_name || order.guestName,
    phone: order.guest_phone || order.guestPhone,
    address: (zip ? `[${zip}] ` : '') + base + (detail ? ' ' + detail : ''),
    memo: order.memo,
    payment: order.payment_method || order.paymentMethod,
    paymentLabel: labels[order.payment_method || order.paymentMethod] || order.payment_method,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    items: parseImagesSafe(order.items),
    date: order.created_at || new Date().toISOString(),
    testMode: !!extra.testMode,
    transfer: !!extra.transfer,
    bankAccount: extra.bankAccount || null,
  };
}

function parseImagesSafe(items) {
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

function renderComplete() {
  const order = state.lastOrder;
  if (!order) {
    navigate('home');
    return '';
  }

  const isTransfer = order.transfer || order.payment === 'transfer';
  const bankPanel = renderBankAccountPanel(getPaymentBankAccount(order.bankAccount), {
    className: 'bank-copy-panel--complete',
    guide: (API.paymentSettings || {}).transferGuide || '주문 후 24시간 이내 입금해 주세요.',
    footer: '입금 확인 후 배송이 시작됩니다.',
  });
  const statusNote = isTransfer
    ? bankPanel ||
      `<div class="order-complete__bank"><p>입금 계좌 정보를 불러오는 중입니다. 관리자에게 문의해 주세요.</p></div>`
    : order.testMode
      ? '<p class="order-complete__desc-note">(테스트 결제 — 실제 청구 없음)</p>'
      : '';

  return `
    <div class="order-complete">
      <div class="order-complete__icon">✓</div>
      <h1 class="order-complete__title">${isTransfer ? '주문 접수 완료' : '결제가 완료되었습니다'}</h1>
      <p class="order-complete__order-id">주문번호 ${order.id}</p>
      <p class="order-complete__desc">
        ${order.name}님, 주문해 주셔서 감사합니다.<br>
        배송지: ${escapeHtml(order.address)}<br>
        결제수단: ${escapeHtml(order.paymentLabel || '')}
      </p>
      ${statusNote}
      <div class="order-complete__summary">
        <div><span>상품금액</span><span>${formatPrice(order.subtotal)}</span></div>
        <div><span>배송비</span><span>${order.shipping ? formatPrice(order.shipping) : '무료'}</span></div>
        <div><strong>총 결제</strong><strong>${formatPrice(order.total)}</strong></div>
      </div>
      <div class="order-complete__actions">
        <button class="btn btn--primary btn--lg" type="button" onclick="goOrderDetail('${order.id}')">주문 조회</button>
        <button class="btn btn--outline btn--lg" type="button" onclick="navigate('home')">쇼핑 계속하기</button>
      </div>
    </div>
  `;
}

function render() {
  const main = document.getElementById('main-content');
  let html = '';

  switch (state.page) {
    case 'home':
      html = renderHome();
      break;
    case 'detail':
      html = renderDetail();
      break;
    case 'reviews':
      html = renderReviewsPage();
      break;
    case 'cart':
      html = renderCart();
      break;
    case 'checkout':
      html = renderCheckout();
      break;
    case 'complete':
      html = renderComplete();
      break;
    default:
      if (typeof EXTRA_PAGES !== 'undefined' && EXTRA_PAGES[state.page]) {
        html = EXTRA_PAGES[state.page]();
      } else {
        html = renderHome();
      }
  }

  main.innerHTML = html;
  document.body.classList.toggle('is-pdp', state.page === 'detail');
  document.body.classList.toggle('is-reviews', state.page === 'reviews');
  document.body.classList.toggle('is-home', state.page === 'home');
  document.body.classList.toggle('is-mypage', state.page === 'mypage');
  renderHeader();
  renderBottomNav();
  if (typeof updatePageSeo === 'function') updatePageSeo();
  bindPaymentOptions();
  if (typeof renderSiteFooter === 'function') renderSiteFooter();
  if (state.page === 'checkout' && typeof bindCheckoutAddress === 'function') bindCheckoutAddress();
  updateNotificationPanel();
  if (state.page === 'home' && state.category === 'all') startTimeAttackTimer();
  else stopTimeAttackTimer();
}

function bindPaymentOptions() {
  document.querySelectorAll('.payment-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      syncCheckoutBankBoxVisibility();
    });
  });
  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', syncCheckoutBankBoxVisibility);
  });
  syncCheckoutBankBoxVisibility();
}

window.copyBankAccountFromEl = copyBankAccountFromEl;

function selectCategory(id) {
  state.category = id;
  state.searchQuery = '';
  state.searchDraft = '';
  state.categoryMenuOpen = false;
  if (state.page !== 'home') {
    navigate('home', { category: id });
    return;
  }
  syncHashFromState(true);
  render();
  const catName = HOME_CATEGORIES.find((c) => c.id === id)?.name || '상품';
  setTimeout(() => {
    document.getElementById('home-product-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(id === 'all' ? '전체 상품을 보여드립니다' : `${catName} 상품만 표시합니다`);
  }, 80);
}

function changeQty(delta) {
  const product = getProduct(state.selectedProductId);
  if (!product) return;
  state.quantity = Math.max(1, Math.min(product.stock, state.quantity + delta));
  const el = document.getElementById('qty-display');
  if (el) el.textContent = state.quantity;
  if (state.page === 'detail') syncHashFromState(true);
  render();
}

function buyNow(productId) {
  const product = getProduct(productId);
  if (!product) return;
  const optionId =
    state.selectedProductId === productId && state.selectedOptionId
      ? state.selectedOptionId
      : getDefaultOptionId(product);
  state.cart = [{ productId, quantity: state.quantity, optionId: optionId || undefined }];
  saveCart();
  navigate('checkout');
}

async function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const payment = fd.get('payment');
  const labels = { card: '신용/체크카드', transfer: '무통장 입금', kakao: '간편결제' };

  const subtotal = getCartSubtotal();
  const shipping = getShippingFee(subtotal);
  const total = subtotal + shipping;
  const zip = fd.get('zipcode') || '';
  const base = fd.get('addressBase') || '';
  const detail = fd.get('addressDetail') || '';
  const fullAddress = (zip ? `[${zip}] ` : '') + base + (detail ? ' ' + detail : '');

  const orderPayload = {
    name: fd.get('name'),
    phone: fd.get('phone'),
    email: API.user?.email || '',
    zipcode: zip,
    address: base,
    addressDetail: detail,
    memo: fd.get('memo'),
    payment,
    subtotal,
    shipping,
    total,
    orderName: buildOrderName(),
    items: state.cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      optionId: i.optionId || null,
    })),
  };

  const btn = document.getElementById('checkout-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '처리 중…';
  }

  try {
    if (typeof API.loadPaymentSettings === 'function' && !API.paymentSettings) {
      await API.loadPaymentSettings();
    }

    const prepare = await API.preparePayment(orderPayload);

    if (API.user && fd.get('saveAddress') === 'on') {
      try {
        await API.createAddress({
          label: '배송지',
          recipientName: String(fd.get('name') || ''),
          phone: String(fd.get('phone') || ''),
          zipcode: zip,
          address: base,
          addressDetail: detail,
          isDefault: state.savedAddresses.length === 0,
        });
      } catch {
        /* ignore */
      }
    }

    if (prepare.transfer) {
      saveLastOrder({
        id: prepare.orderId,
        name: fd.get('name'),
        phone: fd.get('phone'),
        address: fullAddress,
        memo: fd.get('memo'),
        payment,
        paymentLabel: labels[payment] || payment,
        subtotal,
        shipping,
        total,
        items: [...state.cart],
        date: new Date().toISOString(),
        testMode: false,
        transfer: true,
        bankAccount: prepare.bankAccount,
      });
      if (!API.user) {
        state.guestOrderView = {
          id: prepare.orderId,
          guest_name: String(fd.get('name') || ''),
          guest_phone: String(fd.get('phone') || ''),
          zipcode: zip,
          address: base,
          address_detail: detail,
          memo: fd.get('memo'),
          payment_method: payment,
          status: 'awaiting_deposit',
          subtotal,
          shipping,
          total,
          items: state.cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      optionId: i.optionId || null,
    })),
          created_at: new Date().toISOString(),
        };
      }
      state.cart = [];
      saveCart();
      if (typeof state.reviewEligibility === 'object') state.reviewEligibility = {};
      navigate('complete');
      showToast('주문이 접수되었습니다. 입금 확인 후 배송됩니다.');
      return;
    }

    if (typeof TossPayments === 'undefined') {
      throw new Error('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
    }

    const tossPayments = TossPayments(prepare.clientKey);
    const paymentWidget = tossPayments.payment({ customerKey: TossPayments.ANONYMOUS });
    const siteOrigin = window.location.origin;
    const req = {
      method: payment === 'kakao' ? 'EASY_PAY' : 'CARD',
      amount: { currency: 'KRW', value: prepare.amount },
      orderId: prepare.orderId,
      orderName: prepare.orderName,
      successUrl: siteOrigin + '/?payment=success',
      failUrl: siteOrigin + '/?payment=fail',
      customerEmail: orderPayload.email || 'guest@susanfather.com',
      customerName: String(orderPayload.name),
      customerMobilePhone: String(orderPayload.phone).replace(/\D/g, ''),
    };
    if (payment === 'kakao') {
      req.easyPay = { easyPayProvider: 'KAKAOPAY' };
    }

    await paymentWidget.requestPayment(req);
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = `${isTransferOnlyCheckout() ? '주문하기' : '결제하기'} ${formatPrice(total)}`;
    }
    if (err?.code === 'USER_CANCEL') {
      showToast('결제가 취소되었습니다.');
      return;
    }
    showToast(err?.message || '결제 처리에 실패했습니다.');
  }
}

async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  if (!payment) return;

  window.history.replaceState({}, '', window.location.pathname || '/');

  if (payment === 'success') {
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));
    if (!paymentKey || !orderId || !amount) {
      showToast('결제 정보가 올바르지 않습니다.');
      return;
    }
    try {
      const res = await API.confirmPayment({ paymentKey, orderId, amount });
      saveLastOrder(buildLastOrderFromApi(res.order, { testMode: res.testMode }));
      if (!API.user) state.guestOrderView = res.order;
      state.cart = [];
      saveCart();
      if (typeof state.reviewEligibility === 'object') state.reviewEligibility = {};
      if (typeof loadNotifications === 'function') await loadNotifications();
      navigate('complete');
      showToast('결제가 완료되었습니다.');
    } catch (err) {
      showToast(err.message || '결제 승인에 실패했습니다.');
      navigate('checkout');
    }
    return;
  }

  if (payment === 'fail') {
    const orderId = params.get('orderId');
    const message = params.get('message') || '결제가 취소되었습니다.';
    if (orderId) {
      API.failPayment({ orderId, message }).catch(() => {});
    }
    showToast(decodeURIComponent(message));
    navigate('checkout');
  }
}

function goMypage() {
  navigate(typeof API !== 'undefined' && API.user ? 'mypage' : 'login');
}

async function initApp() {
  try {
    loadCart();
    if (typeof API !== 'undefined') {
      await Promise.all([API.loadShopSettings(), API.loadProducts(), API.loadPaymentSettings(), loadNotifications()]);
    }
    const hadPaymentReturn = window.location.search.includes('payment=');
    await handlePaymentReturn();
    if (!hadPaymentReturn) {
      const pathRoute = parsePathRoute();
      const hasRoute = pathRoute || window.location.hash || readRouteSession()?.page;
      if (hasRoute && (pathRoute || hasRoute !== 'home' || window.location.hash)) {
        await restoreFromHash();
      } else {
        syncHashFromState(true);
      }
    }
    render();
  } finally {
    hideAppLoader();
  }
}

function hideAppLoader() {
  const el = document.getElementById('app-loader');
  if (!el) return;
  document.body.classList.remove('is-app-loading');
  el.classList.add('is-hiding');
  el.setAttribute('aria-busy', 'false');
  const remove = () => {
    el.remove();
  };
  el.addEventListener('transitionend', remove, { once: true });
  setTimeout(remove, 500);
}

/* initApp()는 pages-extra.js에서 호출 */
window.addEventListener('hashchange', onRouteHashChange);
window.addEventListener('popstate', onRoutePopState);
