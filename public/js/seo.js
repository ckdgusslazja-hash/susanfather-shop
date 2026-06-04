/** 페이지별 title·description·OG·구조화 데이터 (검색엔진) */
const SEO_SITE = {
  name: '수산아빠',
  host: 'https://susanfather.com',
  defaultTitle: '수산아빠 | 신선 농수산물 온라인 쇼핑몰',
  defaultDescription:
    '수산아빠(susanfather.com) — 제철 과일, 신선 채소, 수산물, 쌀·곡물을 산지에서 직송하는 농수산물 쇼핑몰입니다.',
  defaultKeywords:
    '수산아빠, susanfather, 농수산물, 산지직송, 제철과일, 신선채소, 수산물, 온라인 쇼핑몰, 유기농, 햅쌀',
  logo: '/images/logo.png',
};

const SEO_NOINDEX = new Set([
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
  'order-detail',
  'order-lookup',
  'write-review',
  'admin',
]);

function seoAbsUrl(path) {
  if (!path) return SEO_SITE.host + SEO_SITE.logo;
  if (/^https?:\/\//i.test(path)) return path;
  return SEO_SITE.host + (path.startsWith('/') ? path : '/' + path);
}

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLinkRel(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function getProductImage(product) {
  if (!product) return SEO_SITE.logo;
  const imgs =
    typeof getAdminProductImages === 'function' ? getAdminProductImages(product) : product.adminImages;
  const url = imgs?.[0]?.url || (product.id ? `/images/products/${product.id}.png` : SEO_SITE.logo);
  return url;
}

function updatePageSeo() {
  const page = typeof state !== 'undefined' ? state.page : 'home';
  const noindex = SEO_NOINDEX.has(page);
  let title = SEO_SITE.defaultTitle;
  let description = SEO_SITE.defaultDescription;
  let canonical = SEO_SITE.host + '/';
  let image = seoAbsUrl(SEO_SITE.logo);
  let keywords = SEO_SITE.defaultKeywords;

  if (page === 'detail' && state.selectedProductId) {
    const product = typeof getProduct === 'function' ? getProduct(state.selectedProductId) : null;
    if (product) {
      title = `${product.name} | ${SEO_SITE.name}`;
      description =
        (product.description || '').slice(0, 155) ||
        `${product.name} — ${product.origin || '국내산'} 산지직송. ${SEO_SITE.name}에서 주문하세요.`;
      canonical = `${SEO_SITE.host}/p/${product.id}`;
      image = seoAbsUrl(getProductImage(product));
      keywords = `${product.name}, ${SEO_SITE.name}, 농수산물, 산지직송, ${product.origin || ''}`;
      setJsonLd('seo-jsonld-product', {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || description,
        image: image,
        sku: product.id,
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'KRW',
          price: String(product.price || 0),
          availability:
            (product.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        aggregateRating:
          product.rating && product.reviews
            ? {
                '@type': 'AggregateRating',
                ratingValue: String(product.rating),
                reviewCount: String(product.reviews),
              }
            : undefined,
      });
    } else {
      setJsonLd('seo-jsonld-product', null);
    }
  } else {
    setJsonLd('seo-jsonld-product', null);
    if (page === 'home') {
      title = SEO_SITE.defaultTitle;
      canonical = SEO_SITE.host + '/';
    } else if (page === 'terms') {
      title = `이용약관 | ${SEO_SITE.name}`;
      canonical = `${SEO_SITE.host}/terms`;
    } else if (page === 'privacy') {
      title = `개인정보처리방침 | ${SEO_SITE.name}`;
      canonical = `${SEO_SITE.host}/privacy`;
    } else if (page === 'shop-info') {
      title = `쇼핑몰 정보 | ${SEO_SITE.name}`;
      canonical = `${SEO_SITE.host}/shop-info`;
    } else if (page === 'customer-center') {
      title = `고객센터 | ${SEO_SITE.name}`;
      canonical = `${SEO_SITE.host}/customer-center`;
    } else if (page === 'reviews' && (state.reviewProductId || state.selectedProductId)) {
      const pid = state.reviewProductId || state.selectedProductId;
      const product = typeof getProduct === 'function' ? getProduct(pid) : null;
      if (product) {
        title = `${product.name} 구매후기 | ${SEO_SITE.name}`;
        canonical = `${SEO_SITE.host}/p/${product.id}`;
      }
    }
  }

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'keywords', keywords);
  setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  setLinkRel('canonical', canonical);

  setMeta('property', 'og:type', page === 'detail' ? 'product' : 'website');
  setMeta('property', 'og:site_name', SEO_SITE.name);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:locale', 'ko_KR');

  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);
}

window.updatePageSeo = updatePageSeo;
