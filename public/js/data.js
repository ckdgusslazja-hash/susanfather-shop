/** 메인 홈 카테고리 (농수산물·식품, 2행×5열) */
const HOME_CATEGORIES = [
  { id: 'all', name: '전체', icon: '🏠' },
  { id: 'fruit', name: '제철과일', icon: '🍊' },
  { id: 'veg', name: '신선채소', icon: '🥬' },
  { id: 'seafood', name: '수산물', icon: '🐟' },
  { id: 'dried', name: '건어물', icon: '🦑' },
  { id: 'meat', name: '정육·계란', icon: '🥚' },
  { id: 'grain', name: '곡물·쌀', icon: '🌾' },
  { id: 'organic', name: '유기농', icon: '🌱' },
  { id: 'local', name: '산지직송', icon: '🚚' },
  { id: 'sale', name: '특가할인', icon: '🔥' },
];

const CATEGORIES = HOME_CATEGORIES;

const PRODUCT_CAT_NAMES = {
  fruit: '제철과일',
  veg: '신선채소',
  seafood: '수산물',
  dried: '건어물',
  meat: '정육·계란',
  grain: '곡물·쌀',
  processed: '가공식품',
};

const HOME_BANNERS = [
  {
    id: 'b1',
    title: '제주 감귤 산지직송',
    subtitle: '당일 수확 · 17% 할인',
    emoji: '🍊',
    bg: 'linear-gradient(120deg, #ff6b35 0%, #f7931e 100%)',
    productId: 'fr1',
  },
  {
    id: 'b2',
    title: '완도 광어회 특가',
    subtitle: '당일 손질 · 신선배송',
    emoji: '🐟',
    bg: 'linear-gradient(120deg, #0077b6 0%, #00b4d8 100%)',
    productId: 'sf1',
  },
  {
    id: 'b3',
    title: '이천 유기농 햅쌀',
    subtitle: '무료배송 · 가족용 10kg',
    emoji: '🌾',
    bg: 'linear-gradient(120deg, #2d6a4f 0%, #52b788 100%)',
    productId: 'gr1',
  },
];

const HOME_PROMO = {
  title: '농어촌 직거래 장터',
  subtitle: '이번 주 산지 특가 · 선착순 100명',
  emoji: '🌿',
  bg: 'linear-gradient(90deg, #1a6b4a 0%, #e8a838 100%)',
};

function P(cfg) {
  return {
    id: cfg.id,
    name: cfg.name,
    category: cfg.category,
    categoryPath: cfg.path || ['식품', PRODUCT_CAT_NAMES[cfg.category], cfg.name],
    price: cfg.price,
    originalPrice: cfg.originalPrice,
    unit: cfg.unit,
    origin: cfg.origin,
    badge: cfg.badge || '신선',
    rating: cfg.rating || 4.8,
    reviews: 0,
    stock: cfg.stock ?? 35,
    recentBuyers: cfg.buyers ?? 80,
    couponNote: cfg.coupon || '',
    emoji: cfg.emoji,
    gradient: cfg.gradient,
    organic: !!cfg.organic,
    localDirect: !!cfg.localDirect,
    freeShipping: !!cfg.freeShipping,
    adminImages: [{ id: `${cfg.id}-a1`, url: `/images/products/${cfg.id}.png`, label: '대표 상품컷' }],
    options: cfg.options || [
      { id: `${cfg.id}-o1`, label: cfg.unit, price: cfg.price, originalPrice: cfg.originalPrice },
    ],
    optionLabel: cfg.optLabel || '용량',
    description: cfg.desc,
    details: cfg.details || ['산지 직송', '신선 포장 배송'],
  };
}

const PRODUCTS = [
  /* 제철과일 5 */
  P({
    id: 'fr1',
    category: 'fruit',
    name: '제주 감귤 5kg',
    price: 28900,
    originalPrice: 35000,
    unit: '5kg 박스',
    origin: '제주 서귀포',
    badge: '베스트',
    rating: 4.9,
    buyers: 142,
    coupon: '첫구매 -1,000원 적용',
    emoji: '🍊',
    gradient: 'linear-gradient(135deg, #ff9a56, #ff6b35)',
    img: 'https://images.unsplash.com/photo-1603833666108-5631e94968dd?w=800&q=85',
    localDirect: true,
    desc: '제주 청정 해풍 감귤. 당도 높고 껍질이 얇아 가족과 함께 즐기기 좋습니다.',
    details: ['당도 12브릭스 이상', '무농약 인증', '당일 수확·포장', '산지 직송'],
    options: [
      { id: 'fr1-o1', label: '3kg', price: 19900, originalPrice: 24000 },
      { id: 'fr1-o2', label: '5kg', price: 28900, originalPrice: 35000 },
      { id: 'fr1-o3', label: '10kg', price: 49900, originalPrice: 59000 },
    ],
  }),
  P({
    id: 'fr2',
    category: 'fruit',
    name: '문경 사과 2kg',
    price: 15900,
    originalPrice: 19800,
    unit: '2kg',
    origin: '경북 문경',
    badge: '제철',
    emoji: '🍎',
    gradient: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
    img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=85',
    localDirect: true,
    desc: '아삭하고 달콤한 문경 사과. 산지에서 바로 보내 드립니다.',
  }),
  P({
    id: 'fr3',
    category: 'fruit',
    name: '상주 샤인머스켓 1.5kg',
    price: 24900,
    originalPrice: 32000,
    unit: '1.5kg',
    origin: '경북 상주',
    badge: '인기',
    emoji: '🍇',
    gradient: 'linear-gradient(135deg, #b197fc, #7950f2)',
    img: 'https://images.unsplash.com/photo-1596364725244-9a57304a851a?w=800&q=85',
    localDirect: true,
    desc: '알이 굵고 당도 높은 샤인머스켓. 선물용으로도 인기입니다.',
  }),
  P({
    id: 'fr4',
    category: 'fruit',
    name: '국산 딸기 750g',
    price: 12900,
    originalPrice: 16500,
    unit: '750g',
    origin: '충남 논산',
    emoji: '🍓',
    gradient: 'linear-gradient(135deg, #ff8787, #fa5252)',
    img: 'https://images.unsplash.com/photo-1464960350973-80274653fd1b?w=800&q=85',
    localDirect: true,
    desc: '당일 수확 딸기. 비타민 가득한 제철 과일입니다.',
  }),
  P({
    id: 'fr5',
    category: 'fruit',
    name: '필리핀 망고 2입',
    price: 18900,
    originalPrice: 24000,
    unit: '2입',
    origin: '수입 필리핀',
    emoji: '🥭',
    gradient: 'linear-gradient(135deg, #ffd43b, #fab005)',
    img: 'https://images.unsplash.com/photo-1553279768-8654a6e1f83f?w=800&q=85',
    desc: '부드럽고 달콤한 노란 망고. 아이 간식으로 좋아요.',
  }),

  /* 신선채소 5 */
  P({
    id: 'vg1',
    category: 'veg',
    name: '유기농 대파 1kg',
    price: 4900,
    originalPrice: 6500,
    unit: '1kg',
    origin: '전남 해남',
    badge: '유기농',
    organic: true,
    emoji: '🧅',
    gradient: 'linear-gradient(135deg, #8ce99a, #37b24d)',
    img: 'https://images.unsplash.com/photo-1618375569909-3c861aa813cbc?w=800&q=85',
    localDirect: true,
    desc: '유기농 인증 대파. 국물 요리에 최적입니다.',
    details: ['유기농 인증', '산지 직송', '당일 포장'],
  }),
  P({
    id: 'vg2',
    category: 'veg',
    name: '제철 시금치 300g',
    price: 3500,
    originalPrice: 4500,
    unit: '300g',
    origin: '경기 광주',
    emoji: '🥬',
    gradient: 'linear-gradient(135deg, #69db7c, #2f9e44)',
    img: 'https://images.unsplash.com/photo-1576045057995-568b1c34970b?w=800&q=85',
    localDirect: true,
    desc: '잎이 넓고 신선한 시금치. 나물·국에 좋습니다.',
  }),
  P({
    id: 'vg3',
    category: 'veg',
    name: '못난이 당근 3kg',
    price: 8900,
    originalPrice: 12000,
    unit: '3kg',
    origin: '제주',
    badge: '특가',
    emoji: '🥕',
    gradient: 'linear-gradient(135deg, #ffa94d, #fd7e14)',
    img: 'https://images.unsplash.com/photo-1447175008436-1701707538da?w=800&q=85',
    localDirect: true,
    desc: '모양은 못나도 맛은 그대로. 가성비 채소입니다.',
  }),
  P({
    id: 'vg4',
    category: 'veg',
    name: '국산 애호박 2개',
    price: 5900,
    originalPrice: 7500,
    unit: '2개',
    origin: '강원 평창',
    emoji: '🥒',
    gradient: 'linear-gradient(135deg, #a9e34b, #74b816)',
    img: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab46a?w=800&q=85',
    desc: '쫄깃한 국산 애호박. 찌개·볶음에 활용하세요.',
  }),
  P({
    id: 'vg5',
    category: 'veg',
    name: '양파 5kg 망',
    price: 7900,
    originalPrice: 9900,
    unit: '5kg',
    origin: '경북 무안',
    emoji: '🧅',
    gradient: 'linear-gradient(135deg, #dee2e6, #868e96)',
    img: 'https://images.unsplash.com/photo-1518977956811-c09f28524b10?w=800&q=85',
    localDirect: true,
    desc: '저장이 잘 되는 국산 양파. 가정용 대용량입니다.',
  }),

  /* 수산물 5 */
  P({
    id: 'sf1',
    category: 'seafood',
    name: '국내산 광어회 500g',
    price: 45000,
    originalPrice: 52000,
    unit: '500g',
    origin: '전남 완도',
    badge: '신선',
    rating: 4.8,
    buyers: 89,
    coupon: '카드즉시할인 -2,000원',
    emoji: '🐟',
    gradient: 'linear-gradient(135deg, #4facfe, #00c6fb)',
    img: 'https://images.unsplash.com/photo-1534043464124-3be1887ad4c8?w=800&q=85',
    localDirect: true,
    desc: '당일 손질 광어회. 아이스팩 포장으로 신선도 유지.',
    details: ['당일 손질·출하', 'HACCP 인증', '냉장 배송', '산지 직송'],
    options: [
      { id: 'sf1-o1', label: '300g', price: 28000, originalPrice: 33000 },
      { id: 'sf1-o2', label: '500g', price: 45000, originalPrice: 52000 },
      { id: 'sf1-o3', label: '1kg', price: 85000, originalPrice: 98000 },
    ],
  }),
  P({
    id: 'sf2',
    category: 'seafood',
    name: '통영 생굴 1kg',
    price: 16900,
    originalPrice: 21000,
    unit: '1kg',
    origin: '경남 통영',
    emoji: '🦪',
    gradient: 'linear-gradient(135deg, #adb5bd, #495057)',
    img: 'https://images.unsplash.com/photo-1626207007320-0cceb0e5f43a?w=800&q=85',
    localDirect: true,
    desc: '통영 바다의 싱싱한 생굴. 비빔밥·국에 제철 맛.',
  }),
  P({
    id: 'sf3',
    category: 'seafood',
    name: '제주 고등어 2마리',
    price: 11900,
    originalPrice: 15000,
    unit: '2마리',
    origin: '제주',
    emoji: '🐟',
    gradient: 'linear-gradient(135deg, #339af0, #1864ab)',
    img: 'https://images.unsplash.com/photo-1544943910-04c54f1fc26c?w=800&q=85',
    localDirect: true,
    desc: '제주산 고등어. 구이·조림 모두 좋습니다.',
  }),
  P({
    id: 'sf4',
    category: 'seafood',
    name: '보리 새우 500g',
    price: 13900,
    originalPrice: 17500,
    unit: '500g',
    origin: '전남 여수',
    emoji: '🦐',
    gradient: 'linear-gradient(135deg, #ff8787, #e03131)',
    img: 'https://images.unsplash.com/photo-1565680018434-b5133045b5f5?w=800&q=85',
    localDirect: true,
    desc: '탱탱한 보리 새우. 찜·볶음용으로 인기.',
  }),
  P({
    id: 'sf5',
    category: 'seafood',
    name: '연어 스테이크 300g',
    price: 21900,
    originalPrice: 28000,
    unit: '300g',
    origin: '노르웨이',
    badge: '프리미엄',
    emoji: '🍣',
    gradient: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
    img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b9a2?w=800&q=85',
    desc: '노르웨이산 연어. 오븐·팬 구이에 최적.',
  }),

  /* 건어물 5 */
  P({
    id: 'dr1',
    category: 'dried',
    name: '국산 멸치볶음 500g',
    price: 12900,
    originalPrice: 16000,
    unit: '500g',
    origin: '전남 신안',
    emoji: '🐟',
    gradient: 'linear-gradient(135deg, #ffd8a8, #e67700)',
    img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55c?w=800&q=85',
    desc: '바삭한 멸치볶음. 반찬·도시락에 제격.',
  }),
  P({
    id: 'dr2',
    category: 'dried',
    name: '건오징어 5마리',
    price: 18900,
    originalPrice: 24000,
    unit: '5마리',
    origin: '경북 포항',
    emoji: '🦑',
    gradient: 'linear-gradient(135deg, #e599f7, #9c36b5)',
    img: 'https://images.unsplash.com/photo-1559737558-16eb06613f60?w=800&q=85',
    localDirect: true,
    desc: '쫄깃한 건오징어. 안주·캠핑용으로 좋아요.',
  }),
  P({
    id: 'dr3',
    category: 'dried',
    name: '건다시마 500g',
    price: 9900,
    originalPrice: 12500,
    unit: '500g',
    origin: '강원 속초',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #2b8a3e, #087f5b)',
    img: 'https://images.unsplash.com/photo-1548550025-0fd350f8b8f1?w=800&q=85',
    desc: '국물 내기 좋은 건다시마. 된장찌개에 필수.',
  }),
  P({
    id: 'dr4',
    category: 'dried',
    name: '말린 미역 200g',
    price: 7900,
    originalPrice: 9900,
    unit: '200g',
    origin: '전남 진도',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #3bc9db, #1098ad)',
    img: 'https://images.unsplash.com/photo-1625943553852-781c6dd09797?w=800&q=85',
    localDirect: true,
    desc: '진도 무척 미역. 미역국·salad용.',
  }),
  P({
    id: 'dr5',
    category: 'dried',
    name: '건새우 300g',
    price: 14900,
    originalPrice: 18500,
    unit: '300g',
    origin: '인천',
    emoji: '🦐',
    gradient: 'linear-gradient(135deg, #ffa8a8, #f03e3e)',
    img: 'https://images.unsplash.com/photo-1565557623267-4af3a83d6591?w=800&q=85',
    desc: '고소한 건새우. 떡국·볶음밥 토핑.',
  }),

  /* 정육·계란 5 */
  P({
    id: 'mt1',
    category: 'meat',
    name: '한우 1+ 등심 300g',
    price: 48900,
    originalPrice: 58000,
    unit: '300g',
    origin: '국내산',
    badge: '프리미엄',
    emoji: '🥩',
    gradient: 'linear-gradient(135deg, #ffc9c9, #e03131)',
    img: 'https://images.unsplash.com/photo-1603048588665-791a8bf8bbda?w=800&q=85',
    localDirect: true,
    desc: '마블링 좋은 한우 등심. 특별한 날 구이용.',
    details: ['1+ 등급', '냉장 포장', '산지 직송'],
  }),
  P({
    id: 'mt2',
    category: 'meat',
    name: '국내산 돼지 뒷고기 600g',
    price: 9900,
    originalPrice: 13000,
    unit: '600g',
    origin: '경기',
    emoji: '🥓',
    gradient: 'linear-gradient(135deg, #ffc9c9, #f06595)',
    img: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3ad?w=800&q=85',
    desc: '삼겹살·목살 겸용. 가정 BBQ에 인기.',
  }),
  P({
    id: 'mt3',
    category: 'meat',
    name: '무항생제 닭가슴살 1kg',
    price: 11900,
    originalPrice: 14900,
    unit: '1kg',
    origin: '충북',
    badge: '건강',
    organic: true,
    emoji: '🍗',
    gradient: 'linear-gradient(135deg, #ffe066, #fab005)',
    img: 'https://images.unsplash.com/photo-1604503468505-8be8dfc8b54e?w=800&q=85',
    desc: '단백질 가득 닭가슴살. 다이어트 식단용.',
    details: ['무항생제', '유기농 사료', '냉장 배송'],
  }),
  P({
    id: 'mt4',
    category: 'meat',
    name: '유정란 30구',
    price: 8900,
    originalPrice: 11000,
    unit: '30구',
    origin: '전북',
    badge: '유기농',
    organic: true,
    emoji: '🥚',
    gradient: 'linear-gradient(135deg, #fff3bf, #fcc419)',
    img: 'https://images.unsplash.com/photo-1582722872405-2c03fb27ecc7?w=800&q=85',
    localDirect: true,
    desc: '노른자 색이 진한 유정란. 반찬·베이킹용.',
  }),
  P({
    id: 'mt5',
    category: 'meat',
    name: '오리 훈제 슬라이스 200g',
    price: 12900,
    originalPrice: 16500,
    unit: '200g',
    origin: '충남',
    emoji: '🦆',
    gradient: 'linear-gradient(135deg, #b197fc, #7048e8)',
    img: 'https://images.unsplash.com/photo-1432136556937-370e5f6a5047?w=800&q=85',
    desc: '향긋한 훈제 오리. 샐러드·안주로 좋습니다.',
  }),

  /* 곡물·쌀 5 */
  P({
    id: 'gr1',
    category: 'grain',
    name: '유기농 햅쌀 10kg',
    price: 38500,
    originalPrice: 42000,
    unit: '10kg',
    origin: '경기 이천',
    badge: '유기농',
    rating: 4.9,
    buyers: 256,
    organic: true,
    freeShipping: true,
    coupon: '무료배송 쿠폰 적용',
    emoji: '🌾',
    gradient: 'linear-gradient(135deg, #a8e063, #56ab2f)',
    img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=85',
    localDirect: true,
    desc: '이천 유기농 햅쌀. 쫄깃하고 고소한 밥맛.',
    details: ['유기농 인증', '당해산', '진공 포장', '무료배송', '산지 직송'],
    options: [
      { id: 'gr1-o1', label: '5kg', price: 21000, originalPrice: 24000 },
      { id: 'gr1-o2', label: '10kg', price: 38500, originalPrice: 42000 },
      { id: 'gr1-o3', label: '20kg', price: 72000, originalPrice: 78000 },
    ],
  }),
  P({
    id: 'gr2',
    category: 'grain',
    name: '국산 찹쌀 4kg',
    price: 14900,
    originalPrice: 18000,
    unit: '4kg',
    origin: '강원',
    emoji: '🍚',
    gradient: 'linear-gradient(135deg, #ffe066, #fab005)',
    img: 'https://images.unsplash.com/photo-1586201375767-b5aca44feeb0?w=800&q=85',
    desc: '떡·진과용 찹쌀. 찰기 좋고 윤기 있습니다.',
  }),
  P({
    id: 'gr3',
    category: 'grain',
    name: '국산 콩 2kg',
    price: 16900,
    originalPrice: 21000,
    unit: '2kg',
    origin: '경북 안동',
    emoji: '🫘',
    gradient: 'linear-gradient(135deg, #d8f5a2, #66a80f)',
    img: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=800&q=85',
    localDirect: true,
    desc: '단백질 풍부 국산 콩. 두부·콩자반용.',
  }),
  P({
    id: 'gr4',
    category: 'grain',
    name: '보리쌀 5kg',
    price: 12900,
    originalPrice: 16000,
    unit: '5kg',
    origin: '전남',
    emoji: '🌾',
    gradient: 'linear-gradient(135deg, #e9ecef, #868e96)',
    img: 'https://images.unsplash.com/photo-1536304997881-eca99e64d77e?w=800&q=85',
    desc: '고소한 보리밥용 쌀. 건강 식단에 추천.',
  }),
  P({
    id: 'gr5',
    category: 'grain',
    name: '혼합 15곡 2kg',
    price: 11900,
    originalPrice: 15000,
    unit: '2kg',
    origin: '국내산',
    badge: '건강',
    organic: true,
    emoji: '🥣',
    gradient: 'linear-gradient(135deg, #8ce99a, #2b8a3e)',
    img: 'https://images.unsplash.com/photo-1489282693131-a68384dcac86?w=800&q=85',
    organic: true,
    desc: '잡곡 밥용 15곡 믹스. 영양 균형 식사.',
  }),

  /* 가공식품 5 */
  P({
    id: 'pr1',
    category: 'processed',
    name: '전통 재래식 된장 2kg',
    price: 18900,
    originalPrice: 24000,
    unit: '2kg',
    origin: '전남 담양',
    emoji: '🫙',
    gradient: 'linear-gradient(135deg, #a68a64, #6f4e37)',
    img: 'https://images.unsplash.com/photo-1609501676725-7186abf8a524?w=800&q=85',
    localDirect: true,
    desc: '2년 숙성 된장. 찌개·쌈장으로 활용.',
  }),
  P({
    id: 'pr2',
    category: 'processed',
    name: '순창 고추장 1.2kg',
    price: 15900,
    originalPrice: 19500,
    unit: '1.2kg',
    origin: '전북 순창',
    badge: '명품',
    emoji: '🌶️',
    gradient: 'linear-gradient(135deg, #ff6b6b, #c92a2a)',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=85',
    localDirect: true,
    desc: '순창 전통 고추장. 매콤달콤 양념의 기본.',
  }),
  P({
    id: 'pr3',
    category: 'processed',
    name: '포기김치 3kg',
    price: 22900,
    originalPrice: 28000,
    unit: '3kg',
    origin: '경북',
    emoji: '🥬',
    gradient: 'linear-gradient(135deg, #ff8787, #fa5252)',
    img: 'https://images.unsplash.com/photo-1626804475297-41608ea09b8d?w=800&q=85',
    localDirect: true,
    desc: '아삭한 포기김치. 숙성 맛이 깊습니다.',
  }),
  P({
    id: 'pr4',
    category: 'processed',
    name: '국산 들기름 300ml',
    price: 17900,
    originalPrice: 22000,
    unit: '300ml',
    origin: '경남',
    organic: true,
    emoji: '🫒',
    gradient: 'linear-gradient(135deg, #94d82d, #5c940d)',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=85',
    desc: '고소한 국산 들기름. 나물·비빔밥용.',
    details: ['유기농 원료', '저온 압착'],
  }),
  P({
    id: 'pr5',
    category: 'processed',
    name: '딸기잼 500g',
    price: 8900,
    originalPrice: 11500,
    unit: '500g',
    origin: '충남',
    emoji: '🍓',
    gradient: 'linear-gradient(135deg, #ffc9c9, #f06595)',
    img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=85',
    desc: '과일 함량 높은 딸기잼. 빵·요거트 토핑.',
  }),
];

function getCategoryName(categoryId) {
  const home = CATEGORIES.find((c) => c.id === categoryId);
  if (home) return home.name;
  return PRODUCT_CAT_NAMES[categoryId] || '';
}

function getAllProducts() {
  return window.PRODUCTS_FROM_API?.length ? window.PRODUCTS_FROM_API : PRODUCTS;
}

function filterProductsByCategory(categoryId, searchQuery = '') {
  let list = [...getAllProducts()];
  switch (categoryId) {
    case 'fruit':
      list = list.filter((p) => p.category === 'fruit');
      break;
    case 'veg':
      list = list.filter((p) => p.category === 'veg');
      break;
    case 'seafood':
      list = list.filter((p) => p.category === 'seafood');
      break;
    case 'dried':
      list = list.filter((p) => p.category === 'dried');
      break;
    case 'meat':
      list = list.filter((p) => p.category === 'meat');
      break;
    case 'grain':
      list = list.filter((p) => p.category === 'grain');
      break;
    case 'processed':
      list = list.filter((p) => p.category === 'processed');
      break;
    case 'organic':
      list = list.filter((p) => p.organic);
      break;
    case 'local':
      list = list.filter((p) => p.localDirect);
      break;
    case 'sale':
      list = list.filter((p) => 1 - p.price / p.originalPrice >= 0.12);
      break;
    case 'all':
    default:
      break;
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.origin.toLowerCase().includes(q) ||
        getCategoryName(p.category).includes(q)
    );
  }
  return list;
}

/** 옵션 사용 여부 — useOptions가 true일 때만 옵션 UI 표시 */
function productHasOptions(product) {
  if (!product) return false;
  return product.useOptions === true && (product.options || []).length > 0;
}

/** 예전 데이터: 옵션 price에 판매가 전체가 저장된 경우 → 추가금(차액)으로 변환 */
function normalizeLegacyProductOptions(product) {
  if (!product || !product.useOptions || !(product.options || []).length) return product;
  const basePrice = Number(product.price) || 0;
  const baseOrig = Number(product.originalPrice) || basePrice;
  if (basePrice <= 0) return product;
  const opts = product.options;
  const looksLegacy = opts.some((o) => Number(o.price) >= basePrice && Number(o.price) > 0);
  if (!looksLegacy) return product;
  return {
    ...product,
    options: opts.map((o) => {
      let optOrig = Number(o.originalPrice) || 0;
      if (optOrig > 0 && optOrig < baseOrig) optOrig = baseOrig + optOrig;
      return {
        ...o,
        price: Math.max(0, (Number(o.price) || 0) - basePrice),
        originalPrice: optOrig,
      };
    }),
  };
}

function getProductOption(product, optionId) {
  if (!productHasOptions(product)) return null;
  const opts = product.options || [];
  if (!opts.length) return null;
  return opts.find((o) => o.id === optionId) || opts.find((o) => !o.price) || opts[0];
}

function getDefaultOptionId(product) {
  if (!productHasOptions(product)) return null;
  const opts = product.options || [];
  const zero = opts.find((o) => !o.price);
  return zero ? zero.id : opts[0]?.id;
}

/** 옵션 추가금액을 기본 판매가에 더한 최종 판매가 */
function getOptionSalePrice(product, option) {
  const base = Number(product?.price) || 0;
  const add = Number(option?.price) || 0;
  return base + add;
}

/** 옵션별 정가(절대값). 미입력 시 기본 정가 사용 */
function getOptionOriginalPrice(product, option) {
  const optOrig = Number(option?.originalPrice) || 0;
  if (optOrig > 0) return optOrig;
  return Number(product?.originalPrice ?? product?.price) || 0;
}

function getCartItemOption(product, cartItem) {
  if (!product) return null;
  const id = cartItem.optionId || getDefaultOptionId(product);
  return getProductOption(product, id);
}

function getCartItemUnitPrice(cartItem) {
  const p = getProduct(cartItem.productId);
  if (!p) return 0;
  return getOptionSalePrice(p, getCartItemOption(p, cartItem));
}

const REVIEW_ONLY_IMAGE_URLS = new Set();
const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;

const REVIEW_IMG = {
  fruit: [
    'https://images.unsplash.com/photo-1547514704-5ce6f96618df?w=600&q=80',
    'https://images.unsplash.com/photo-1557800634-7bf3edea8808?w=600&q=80',
  ],
  veg: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'],
  seafood: [
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    'https://images.unsplash.com/photo-1564489568509-70e53b853148?w=600&q=80',
  ],
  dried: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55c?w=600&q=80'],
  meat: ['https://images.unsplash.com/photo-1603048588665-791a8bf8bbda?w=600&q=80'],
  grain: [
    'https://images.unsplash.com/photo-1586201375767-b5aca44feeb0?w=600&q=80',
    'https://images.unsplash.com/photo-1536304997881-eca99e64d77e?w=600&q=80',
  ],
  processed: ['https://images.unsplash.com/photo-1626804475297-41608ea09b8d?w=600&q=80'],
};

Object.values(REVIEW_IMG)
  .flat()
  .forEach((url) => REVIEW_ONLY_IMAGE_URLS.add(url.split('?')[0]));

function getAdminProductImages(product) {
  if (!product?.adminImages?.length) {
    if (product?.id) {
      return [{ url: `/images/products/${product.id}.png`, label: '대표 상품컷' }];
    }
    return [];
  }
  return product.adminImages
    .map((img) => (typeof img === 'string' ? { url: img, label: '' } : img))
    .filter((img) => img.url);
}

function renderProductThumbHtml(product, className) {
  const img = getAdminProductImages(product)[0];
  if (!img?.url) {
    return `<div class="${className}" style="background:${product.gradient}">${product.emoji}</div>`;
  }
  return `<div class="${className}" style="background:${product.gradient}">
    <img src="${img.url}" alt="" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
    <span class="${className}__fallback" style="display:none">${product.emoji}</span>
  </div>`;
}

function buildReviews() {
  const seeds =
    typeof REVIEW_SEED_DATA !== 'undefined' && REVIEW_SEED_DATA.length
      ? REVIEW_SEED_DATA
      : [];
  const out = seeds.map((r) => ({
    id: r.id,
    productId: r.productId,
    author: r.author,
    rating: r.rating,
    date: r.date,
    title: r.title,
    content: r.content,
    images: r.images || [],
    helpful: r.helpful ?? 0,
    verified: !!r.verified,
  }));

  PRODUCTS.forEach((product) => {
    const productReviews = out.filter((r) => r.productId === product.id);
    product.reviews = productReviews.length;
    if (productReviews.length) {
      const avg = productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length;
      product.rating = Math.round(avg * 10) / 10;
    }
  });

  return out;
}

const REVIEWS = buildReviews();

function getReviewsByProduct(productId) {
  return REVIEWS.filter((r) => r.productId === productId);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTS,
    HOME_CATEGORIES,
    SHIPPING_FEE,
    FREE_SHIPPING_THRESHOLD,
    REVIEWS,
    getReviewsByProduct,
    filterProductsByCategory,
    getAdminProductImages,
  };
}
