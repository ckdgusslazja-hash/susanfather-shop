const STORAGE_KEY = 'greenharvest_cart';

let state = {
  page: 'home',
  category: 'all',
  selectedProductId: null,
  selectedOptionId: null,
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
};

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

function getDeliveryLabel() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `내일(${days[tomorrow.getDay()]}) 새벽 7시 전 도착`;
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function formatPrice(n) {
  return n.toLocaleString('ko-KR') + '원';
}

function getProduct(id) {
  const list = window.PRODUCTS_FROM_API || PRODUCTS;
  return list.find((p) => p.id === id);
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => {
    const p = getProduct(item.productId);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);
}

function getShippingFee(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function navigate(page, params = {}) {
  state.page = page;
  if (params.category) state.category = params.category;
  if (params.productId) {
    state.selectedProductId = params.productId;
    state.reviewProductId = params.productId;
    state.quantity = 1;
    state.carouselIndex = 0;
    const p = getProduct(params.productId);
    if (p) {
      state.selectedOptionId = getDefaultOptionId(p);
      saveRecentProduct(p.id);
    }
  }
  if (params.reviewProductId) {
    state.reviewProductId = params.reviewProductId;
  }
  if (params.reviewFilter) state.reviewFilter = params.reviewFilter;

  const needReviews = ['reviews', 'detail', 'write-review'].includes(page);
  const pid =
    params.reviewProductId || params.productId || state.reviewProductId || state.selectedProductId;
  if (needReviews && pid && typeof ensureReviews === 'function') {
    const tasks = [ensureReviews(pid)];
    if (typeof ensureReviewEligibility === 'function') tasks.push(ensureReviewEligibility(pid));
    Promise.all(tasks).then(() => {
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const existing = state.cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ productId, quantity });
  }
  saveCart();
  showToast('장바구니에 담았습니다');
  render();
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find((i) => i.productId === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((i) => i.productId !== productId);
  }
  saveCart();
  render();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((i) => i.productId !== productId);
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
    btn.classList.toggle('active', btn.dataset.nav === 'home' && state.page === 'home');
  });
}

function focusHomeSearch() {
  navigate('home');
  setTimeout(() => document.getElementById('home-search')?.focus(), 100);
}

function scrollToHomeCategories() {
  navigate('home');
  setTimeout(() => document.getElementById('home-categories')?.scrollIntoView({ behavior: 'smooth' }), 100);
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

function getShortDeliveryLabel() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return `내일(${days[t.getDay()]}) 도착`;
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
          <span class="h-card__ship-date">${getShortDeliveryLabel()}</span>
        </p>
        <p class="h-card__rating">
          <span class="h-card__stars">${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}</span>
          <span class="h-card__reviews">(${reviewCount > 999 ? '999+' : reviewCount})</span>
        </p>
      </button>
    </article>
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
  return `
    <article class="product-card">
      <div class="product-card__visual" style="background:${product.gradient}">
        <span class="product-card__badge">${product.badge}</span>
        ${product.emoji}
      </div>
      <div class="product-card__body">
        <p class="product-card__origin">${product.origin}</p>
        <h3 class="product-card__name">${product.name}</h3>
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
          <button type="button" class="home-header__bell" onclick="showToast('알림 3건 (데모)')" title="알림">
            🔔
            <span class="home-header__bell-badge">3</span>
          </button>
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
      ${renderHomeScrollSection('🛍️ 이 상품 놓치지 마세요!', PRODUCTS, "selectCategory('all')")}
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

function renderDetail() {
  const product = getProduct(state.selectedProductId);
  if (!product) return renderHome();

  const option = getSelectedOption(product);
  const price = option?.price ?? product.price;
  const originalPrice = option?.originalPrice ?? product.originalPrice;
  const discount = Math.round((1 - price / originalPrice) * 100);
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

  const optionsHtml = (product.options || [])
    .map(
      (opt) => `
      <button type="button"
        class="pdp-option-pill ${state.selectedOptionId === opt.id ? 'active' : ''}"
        onclick="selectOption('${opt.id}')">${escapeHtml(opt.label)}</button>
    `
    )
    .join('');

  return `
    <div class="pdp">
      <section class="pdp-hero">
        <div class="pdp-hero__top">
          <button type="button" class="pdp-hero__btn" onclick="navigate('home')" aria-label="뒤로">←</button>
          <button type="button" class="pdp-hero__btn ${isWished ? 'is-wished' : ''}" onclick="toggleWishlist('${product.id}')" aria-label="찜">${isWished ? '♥' : '♡'}</button>
        </div>
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
            <span class="pdp-shipping__arrival">${getDeliveryLabel()}</span>
          </div>
          <div class="pdp-shipping__row pdp-shipping__row--sub">
            <span>🚚 ${freeShip ? '무료배송' : `배송비 ${formatPrice(SHIPPING_FEE)}`}</span>
            <span>↩ 7일 이내 무료 반품</span>
          </div>
        </div>

        <hr class="pdp-divider" />

        ${product.options?.length ? `
        <div class="pdp-options">
          <p class="pdp-options__label">${escapeHtml(product.optionLabel || '옵션')}: <strong>${escapeHtml(option?.label || '')}</strong></p>
          <div class="pdp-option-pills">${optionsHtml}</div>
          <p class="pdp-options__note">이 상품은 <strong>무료 교환</strong>이 가능한 상품입니다.</p>
        </div>
        <hr class="pdp-divider" />
        ` : ''}

        <section class="pdp-info" id="pdp-info">
          <h2 class="pdp-info__title">상품 정보</h2>
          <p class="pdp-desc">${escapeHtml(product.description)}</p>
          <ul class="pdp-details">
            ${product.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
          <span class="pdp-stock">재고 ${product.stock}개 남음</span>
        </section>
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
      return `
        <div class="cart-item">
          <div class="cart-item__visual" style="background:${p.gradient}">${p.emoji}</div>
          <div class="cart-item__info">
            <h3 class="cart-item__name">${p.name}</h3>
            <p class="cart-item__unit">${p.unit}</p>
            <p class="cart-item__price">${formatPrice(p.price * item.quantity)}</p>
          </div>
          <div class="cart-item__actions">
            <div class="quantity-control__btns">
              <button class="quantity-control__btn" type="button" onclick="updateCartQuantity('${p.id}', -1)">−</button>
              <span class="quantity-control__value">${item.quantity}</span>
              <button class="quantity-control__btn" type="button" onclick="updateCartQuantity('${p.id}', 1)">+</button>
            </div>
            <button class="btn btn--ghost btn--sm" onclick="removeFromCart('${p.id}')">삭제</button>
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
      return `<div class="cart-summary__row"><span>${p.name} × ${item.quantity}</span><span>${formatPrice(p.price * item.quantity)}</span></div>`;
    })
    .join('');

  return `
    <nav class="breadcrumb"><a href="#" onclick="navigate('cart');return false">장바구니</a> / 주문·결제</nav>
    <h2 class="section-title">주문 / 결제</h2>
    <div class="checkout-layout">
      <form class="checkout-form" id="checkout-form" onsubmit="submitOrder(event)">
        <section class="form-section">
          <h3 class="form-section__title">배송 정보</h3>
          <div class="form-grid">
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
            <div class="form-group form-group--full">
              <label>배송 메모</label>
              <textarea name="memo" placeholder="문 앞에 놓아주세요"></textarea>
            </div>
          </div>
        </section>
        <section class="form-section">
          <h3 class="form-section__title">결제 수단 (데모)</h3>
          <div class="payment-methods">
            <label class="payment-option selected">
              <input type="radio" name="payment" value="card" checked />
              <span class="payment-option__icon">💳</span>
              <span class="payment-option__info"><strong>신용/체크카드</strong><span>실제 결제는 연동 예정</span></span>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="transfer" />
              <span class="payment-option__icon">🏦</span>
              <span class="payment-option__info"><strong>무통장 입금</strong><span>입금 확인 후 발송</span></span>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="kakao" />
              <span class="payment-option__icon">💬</span>
              <span class="payment-option__info"><strong>간편결제</strong><span>카카오/네이버페이 등</span></span>
            </label>
          </div>
          <p class="mock-notice">⚠️ 현재는 데모 결제 화면입니다. 「결제하기」를 누르면 주문 완료 화면으로 이동하며, 실제 결제는 진행되지 않습니다.</p>
        </section>
        <button type="submit" class="btn btn--primary btn--lg">결제하기 ${formatPrice(total)}</button>
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

function renderComplete() {
  const order = state.lastOrder;
  if (!order) {
    navigate('home');
    return '';
  }

  return `
    <div class="order-complete">
      <div class="order-complete__icon">✓</div>
      <h1 class="order-complete__title">주문이 완료되었습니다</h1>
      <p class="order-complete__order-id">주문번호 ${order.id}</p>
      <p class="order-complete__desc">
        ${order.name}님, 주문해 주셔서 감사합니다.<br>
        배송지: ${order.address}<br>
        결제수단: ${order.paymentLabel} (데모)
      </p>
      <div class="order-complete__summary">
        <div><span>상품금액</span><span>${formatPrice(order.subtotal)}</span></div>
        <div><span>배송비</span><span>${order.shipping ? formatPrice(order.shipping) : '무료'}</span></div>
        <div><strong>총 결제</strong><strong>${formatPrice(order.total)}</strong></div>
      </div>
      <button class="btn btn--primary btn--lg" onclick="navigate('home')">쇼핑 계속하기</button>
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
  renderHeader();
  renderBottomNav();
  bindPaymentOptions();
  if (typeof renderSiteFooter === 'function') renderSiteFooter();
  if (state.page === 'checkout' && typeof bindCheckoutAddress === 'function') bindCheckoutAddress();
}

function bindPaymentOptions() {
  document.querySelectorAll('.payment-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
}

function selectCategory(id) {
  state.category = id;
  state.searchQuery = '';
  state.searchDraft = '';
  if (state.page !== 'home') {
    navigate('home', { category: id });
    return;
  }
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
  render();
}

function buyNow(productId) {
  const product = getProduct(productId);
  if (!product) return;
  state.cart = [{ productId, quantity: state.quantity }];
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
    items: state.cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  };

  let orderId = 'GH' + Date.now().toString().slice(-8);
  let testMode = true;
  try {
    const res = await API.createOrder(orderPayload);
    orderId = res.orderId || orderId;
    testMode = !!res.testMode;
  } catch {
    /* 오프라인·서버 미실행 시 로컬 완료 */
  }

  state.lastOrder = {
    id: orderId,
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
    testMode,
  };

  state.cart = [];
  saveCart();
  if (typeof state.reviewEligibility === 'object') state.reviewEligibility = {};
  navigate('complete');
  showToast(testMode ? '주문이 완료되었습니다 (테스트 결제)' : '주문이 완료되었습니다');
}

function goMypage() {
  navigate(typeof API !== 'undefined' && API.user ? 'mypage' : 'login');
}

async function initApp() {
  loadCart();
  if (typeof API !== 'undefined') {
    await Promise.all([API.loadShopSettings(), API.loadProducts()]);
  }
  render();
}

/* initApp()는 pages-extra.js에서 호출 */
