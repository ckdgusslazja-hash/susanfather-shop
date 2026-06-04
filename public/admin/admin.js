const Admin = {
  token: localStorage.getItem('gh_admin_token') || '',
  view: 'dashboard',
  msg: '',
  stats: null,
  sales: null,
  settings: null,
  products: [],
  orders: [],
  reviews: [],
  inquiries: [],
  members: [],
  productFilter: '',
  productCategoryFilter: '',
  productOrderIds: [],
  orderFilter: '',
  editingProduct: null,
  selectedOrderId: null,
  productDraft: null,
  policyTemplatesDraft: null,
  detailQuill: null,
  PRODUCT_DRAFT_KEY: 'gh_admin_product_draft',

  BADGES: ['신선', '베스트', '특가', 'NEW', '한정', '산지직송', '유기농', '할인'],
  OPTION_LABELS: ['용량', '중량', '수량', '규격', '옵션'],

  DEFAULT_PRODUCT_POLICIES: {
    shippingGuide: `【 배송 안내 】
· 산지에서 직접 포장·발송하는 신선 농수산물입니다.
· 결제 완료(또는 입금 확인) 후 1~2일 내 출고되며, 수령까지 1~3일 소요됩니다.
· 제주·도서·산간 지역은 1~2일 추가 소요될 수 있습니다.
· 기상 악화, 산지 수급 등으로 출고일이 변경될 수 있으며 개별 안내드립니다.
· 배송 조회는 마이페이지 또는 주문·배송 조회에서 확인할 수 있습니다.`,
    returnGuide: `【 교환·반품 안내 (신선 농·수산물) 】
· 본 몰의 농수산물·신선·냉장·냉동 식품은 신선도 유지 및 재판매 불가 특성상, 단순 변심에 의한 교환·반품(청약철회)이 불가합니다.
· 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 포장 개봉·시간 경과 등으로 재판매가 곤란한 신선식품은 청약철회가 제한될 수 있습니다.
· 아래 사유에 해당하는 경우에만 교환·환불을 접수합니다.
  - 상품 파손·누수·변질·부패 등 품질 이상
  - 주문과 다른 상품 오배송·누락·수량 불일
  - 배송 중 파손으로 섭취가 어려운 경우
· 위 사유는 상품 수령 후 24시간 이내, 상품·포장·송장 사진과 함께 고객센터 또는 마이페이지로 접수해 주세요.
· 회사 확인 후 재발송·환불 처리하며, 고객 과실이 없는 경우 배송비는 회사 부담합니다.
· 냉장·냉동 미보관, 개봉 후 방치 등 고객 보관 부주의로 인한 변질은 교환·환불 대상에서 제외됩니다.
· 환불 승인 후 3~7영업일 내 원결제수단으로 환불됩니다.`,
  },

  CATEGORIES: {
    fruit: '제철과일',
    veg: '신선채소',
    seafood: '수산물',
    dried: '건어물',
    meat: '정육·계란',
    grain: '곡물·쌀',
    processed: '가공식품',
  },

  STATUS: {
    awaiting_deposit: '입금대기',
    pending: '결제대기',
    paid: '결제완료',
    preparing: '상품준비',
    shipping: '배송중',
    done: '배송완료',
    cancelled: '취소',
  },

  PAYMENT: { card: '카드', transfer: '무통장', kakao: '간편결제' },

  PAYMENT_STATUS: {
    ready: '결제 대기',
    pending: '결제 진행 중',
    paid: '결제 완료',
    awaiting_deposit: '입금 대기',
    test_paid: '테스트 결제',
    failed: '결제 실패',
    cancelled: '결제 취소',
    refund_pending: '환불 대기',
  },

  paymentStatusLabel(status) {
    return this.PAYMENT_STATUS[status] || status || '-';
  },

  esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  },

  fmt(n) {
    return Number(n || 0).toLocaleString('ko-KR') + '원';
  },

  fmtDate(iso) {
    if (!iso) return '-';
    return iso.slice(0, 16).replace('T', ' ');
  },

  badge(status) {
    const cls =
      { paid: 'paid', preparing: 'preparing', shipping: 'shipping', done: 'done', awaiting_deposit: 'awaiting', cancelled: 'cancel', pending: 'pending' }[
        status
      ] || 'pending';
    return `<span class="badge badge--${cls}">${this.STATUS[status] || status}</span>`;
  },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '요청 실패');
    return data;
  },

  setToken(t) {
    this.token = t || '';
    if (t) localStorage.setItem('gh_admin_token', t);
    else localStorage.removeItem('gh_admin_token');
  },

  go(view) {
    if (this.view === 'product-form') this.syncProductFormState();
    this.view = view;
    this.render();
  },

  async login(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      });
      if (data.user?.role !== 'admin') {
        this.msg = '관리자 계정이 아닙니다.';
        this.render();
        return;
      }
      this.setToken(data.token);
      this.msg = '';
      this.view = 'dashboard';
      this.render();
      await this.loadDashboard();
    } catch (err) {
      this.msg = err.message;
      this.render();
    }
  },

  logout() {
    this.setToken('');
    this.render();
  },

  async loadDashboard() {
    [this.stats, this.sales] = await Promise.all([
      this.request('/api/admin/stats'),
      this.request('/api/admin/sales?days=14'),
    ]);
    this.view = 'dashboard';
    this.render();
  },

  async loadProducts() {
    const fetched = await this.request('/api/admin/products');
    this.products = this.applyProductOrder(fetched);
    this.view = 'products';
    this.render();
  },

  applyProductOrder(list) {
    const items = Array.isArray(list) ? list : [];
    if (!this.productOrderIds?.length) {
      this.productOrderIds = items.map((p) => p.id);
      return items;
    }
    const map = new Map(items.map((p) => [p.id, p]));
    const ordered = this.productOrderIds.map((id) => map.get(id)).filter(Boolean);
    const extras = items.filter((p) => !this.productOrderIds.includes(p.id));
    if (extras.length) this.productOrderIds = [...this.productOrderIds, ...extras.map((p) => p.id)];
    return [...ordered, ...extras];
  },

  matchProductSearch(p, q) {
    if (!q) return true;
    const hay = [
      p.name,
      p.unit,
      p.origin,
      p.badge,
      p.id,
      this.CATEGORIES[p.category] || p.category,
    ]
      .map((v) => String(v || '').toLowerCase())
      .join(' ');
    return hay.includes(q);
  },

  getFilteredProducts() {
    const q = (this.productFilter || '').trim().toLowerCase();
    const cat = this.productCategoryFilter || '';
    return (this.products || []).filter((p) => {
      if (cat && p.category !== cat) return false;
      return this.matchProductSearch(p, q);
    });
  },

  setProductSearch(value) {
    this.productFilter = value;
    this.render();
  },

  setProductCategoryFilter(value) {
    this.productCategoryFilter = value;
    this.render();
  },

  clearProductSearch() {
    this.productFilter = '';
    this.productCategoryFilter = '';
    this.render();
  },

  openProductForm(id) {
    const open = async () => {
      if (id) {
        try {
          const p = await this.request('/api/admin/products/' + encodeURIComponent(id));
          this.editingProduct = p ? { ...p } : null;
        } catch {
          const p = (this.products || []).find((x) => x.id === id);
          this.editingProduct = p ? { ...p } : null;
        }
      } else {
        this.editingProduct = {
          name: '',
          category: 'fruit',
          price: '',
          originalPrice: '',
          unit: '',
          origin: '',
          stock: 50,
          badge: '신선',
          emoji: '🛒',
          description: '',
          organic: false,
          localDirect: true,
          freeShipping: false,
          optionLabel: '용량',
        };
      }
      this.initProductDraft(this.editingProduct || {});
      await this.ensurePolicies();
      this.view = 'product-form';
      this.render();
    };
    open().catch((err) => alert(err.message || '상품을 불러오지 못했습니다.'));
  },

  initProductDraft(p) {
    const product = p || {};
    let detailBlocks = Array.isArray(product.detailBlocks) ? [...product.detailBlocks] : [];
    if (!detailBlocks.length && Array.isArray(product.details)) {
      detailBlocks = product.details.map((t) => ({ type: 'text', text: String(t) }));
    }
    if (!detailBlocks.length) detailBlocks = [{ type: 'text', text: '' }];

    const basePrice = Number(product.price) || 0;
    const baseOrig = Number(product.originalPrice) || basePrice;
    const rawOpts = product.options || [];
    const looksLegacy = rawOpts.some((o) => Number(o.price) >= basePrice && Number(o.price) > 0);
    const useOptions = product.useOptions === true;

    let options = rawOpts.map((o) => {
      let addPrice = Number(o.price) || 0;
      let origPrice = Number(o.originalPrice) || 0;
      if (looksLegacy) {
        addPrice = Math.max(0, addPrice - basePrice);
        if (origPrice > 0 && origPrice < baseOrig) {
          origPrice = baseOrig + origPrice;
        }
      }
      return {
        label: o.label || '',
        price: addPrice,
        originalPrice: origPrice > 0 ? origPrice : '',
      };
    });
    if (useOptions && !options.length) {
      options = [{ label: product.unit || '', price: 0, originalPrice: '' }];
    }

    this.productDraft = {
      mainImage: product.adminImages?.[0]?.url || '',
      useOptions: product.useOptions === true,
      options,
      optionLabel: product.optionLabel || '용량',
      detailBlocks,
      detailHtml: product.detailHtml || this.detailBlocksToHtml(detailBlocks),
      shippingGuide: product.shippingGuide || '',
      returnGuide: product.returnGuide || '',
    };
  },

  detailBlocksToHtml(blocks) {
    return (blocks || [])
      .map((b) => {
        if (b.type === 'image' && b.url) {
          const cap = String(b.text || b.caption || '').trim();
          return `<p><img src="${b.url}" alt="${this.esc(cap)}"></p>${cap ? `<p>${this.esc(cap)}</p>` : ''}`;
        }
        const text = String(b.text || '').trim();
        if (!text) return '';
        return `<p>${this.esc(text).replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
  },

  detailHtmlToBlocks(html) {
    const raw = String(html || '').trim();
    if (!raw) return [];
    const wrap = document.createElement('div');
    wrap.innerHTML = raw;
    const blocks = [];
    wrap.querySelectorAll('img').forEach((img) => {
      const url = String(img.getAttribute('src') || '').trim();
      if (!url) return;
      blocks.push({
        type: 'image',
        url,
        text: String(img.getAttribute('alt') || '').trim(),
      });
    });
    wrap.querySelectorAll('p, li, h1, h2, h3, blockquote').forEach((el) => {
      if (el.querySelector('img')) return;
      const text = el.innerHTML.trim();
      if (text) blocks.push({ type: 'text', text });
    });
    if (!blocks.length && wrap.textContent.trim()) {
      blocks.push({ type: 'text', text: wrap.textContent.trim() });
    }
    return blocks;
  },

  syncDetailEditorToDraft() {
    if (this.detailQuill && this.productDraft) {
      this.productDraft.detailHtml = this.detailQuill.root.innerHTML;
    }
  },

  updateDetailEditorCount() {
    const el = document.getElementById('detail-editor-count');
    if (!el || !this.detailQuill) return;
    const text = this.detailQuill.getText().replace(/\n$/, '');
    el.textContent = `문자 : ${text.length}`;
  },

  initDetailEditor() {
    if (typeof Quill === 'undefined') return;
    const host = document.getElementById('detail-editor-host');
    if (!host || !this.productDraft) return;

    this.detailQuill = null;
    host.innerHTML = '<div id="detail-editor"></div>';

    this.detailQuill = new Quill('#detail-editor', {
      theme: 'snow',
      placeholder: '상품 상세 설명을 입력하세요. 이미지는 여러 장 한 번에 첨부할 수 있습니다.',
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: () => this.pickDetailEditorImages(),
          },
        },
      },
    });

    const html = this.productDraft.detailHtml || this.detailBlocksToHtml(this.productDraft.detailBlocks);
    if (html) this.detailQuill.root.innerHTML = html;

    this.detailQuill.on('text-change', () => {
      if (this.productDraft) this.productDraft.detailHtml = this.detailQuill.root.innerHTML;
      this.updateDetailEditorCount();
    });
    this.updateDetailEditorCount();
  },

  pickDetailEditorImages() {
    const input = document.getElementById('detail-editor-images');
    if (!input) return;
    input.value = '';
    input.click();
  },

  onDetailEditorImagesPick(ev) {
    const files = [...(ev.target.files || [])];
    if (!files.length) return;
    if (!this.detailQuill) this.initDetailEditor();
    if (!this.detailQuill) return;

    let skipped = 0;
    const readNext = (idx) => {
      if (idx >= files.length) {
        if (skipped) alert(`${skipped}개 파일은 2MB 초과로 제외되었습니다.`);
        this.syncDetailEditorToDraft();
        this.updateDetailEditorCount();
        ev.target.value = '';
        return;
      }
      const file = files[idx];
      if (file.size > 2 * 1024 * 1024) {
        skipped += 1;
        readNext(idx + 1);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || '');
        const range = this.detailQuill.getSelection(true);
        const at = range ? range.index : this.detailQuill.getLength();
        this.detailQuill.insertEmbed(at, 'image', url, 'user');
        this.detailQuill.insertText(at + 1, '\n', 'user');
        this.detailQuill.setSelection(at + 2, 0);
        readNext(idx + 1);
      };
      reader.readAsDataURL(file);
    };
    readNext(0);
  },

  async ensurePolicies(force = false) {
    try {
      const pol = this.settings?.productPolicies;
      const hasTemplates =
        Array.isArray(pol?.shippingTemplates) &&
        pol.shippingTemplates.length &&
        Array.isArray(pol?.returnTemplates) &&
        pol.returnTemplates.length;
      if (force || !hasTemplates) {
        const data = await this.request('/api/admin/settings');
        this.settings = { ...(this.settings || {}), ...data };
      }
    } catch {
      /* API 실패 시 아래 기본값 사용 */
    }
    if (!this.settings) this.settings = {};
    this.settings.productPolicies = this.normalizePolicyTemplates(this.settings.productPolicies || {});
  },

  normalizePolicyTemplates(pol) {
    const src = pol || {};
    const defaults = this.DEFAULT_PRODUCT_POLICIES;
    let shippingTemplates = Array.isArray(src.shippingTemplates)
      ? src.shippingTemplates
          .map((t, i) => ({
            id: String(t.id || `ship-${i}`),
            name: String(t.name || `배송 안내 ${i + 1}`).trim() || `배송 안내 ${i + 1}`,
            body: String(t.body || t.text || '').trim(),
          }))
          .filter((t) => t.body)
      : [];
    let returnTemplates = Array.isArray(src.returnTemplates)
      ? src.returnTemplates
          .map((t, i) => ({
            id: String(t.id || `ret-${i}`),
            name: String(t.name || `교환·반품 안내 ${i + 1}`).trim() || `교환·반품 안내 ${i + 1}`,
            body: String(t.body || t.text || '').trim(),
          }))
          .filter((t) => t.body)
      : [];

    if (!shippingTemplates.length) {
      const legacy = String(src.shippingGuide || '').trim() || defaults.shippingGuide;
      shippingTemplates = [{ id: 'ship-default', name: '기본 배송 안내', body: legacy }];
    }
    if (!returnTemplates.length) {
      const legacy = String(src.returnGuide || '').trim() || defaults.returnGuide;
      returnTemplates = [{ id: 'ret-default', name: '신선식품 교환·반품', body: legacy }];
    }

    return {
      shippingTemplates,
      returnTemplates,
      shippingGuide: shippingTemplates[0].body,
      returnGuide: returnTemplates[0].body,
    };
  },

  getShippingTemplates() {
    return this.normalizePolicyTemplates(this.settings?.productPolicies).shippingTemplates;
  },

  getReturnTemplates() {
    return this.normalizePolicyTemplates(this.settings?.productPolicies).returnTemplates;
  },

  getProductPolicies() {
    return this.normalizePolicyTemplates(this.settings?.productPolicies || this.DEFAULT_PRODUCT_POLICIES);
  },

  newPolicyTemplateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  },

  initPolicyTemplatesDraft(pol) {
    const norm = this.normalizePolicyTemplates(pol);
    this.policyTemplatesDraft = {
      shipping: norm.shippingTemplates.map((t) => ({ ...t })),
      return: norm.returnTemplates.map((t) => ({ ...t })),
    };
  },

  syncPolicyTemplatesFromForm() {
    if (this.view !== 'settings-guides' || !this.policyTemplatesDraft) return;
    const form = document.getElementById('form-productPolicies');
    if (!form) return;
    ['shipping', 'return'].forEach((type) => {
      const list = type === 'shipping' ? this.policyTemplatesDraft.shipping : this.policyTemplatesDraft.return;
      list.forEach((t, i) => {
        const nameEl = form.querySelector(`[name="${type}TemplateName_${i}"]`);
        const bodyEl = form.querySelector(`[name="${type}TemplateBody_${i}"]`);
        if (nameEl) t.name = nameEl.value;
        if (bodyEl) t.body = bodyEl.value;
      });
    });
  },

  addPolicyTemplate(type) {
    this.syncPolicyTemplatesFromForm();
    const list = type === 'shipping' ? this.policyTemplatesDraft.shipping : this.policyTemplatesDraft.return;
    list.push({
      id: this.newPolicyTemplateId(type === 'shipping' ? 'ship' : 'ret'),
      name: type === 'shipping' ? '새 배송 안내' : '새 교환·반품 안내',
      body: '',
    });
    this.render();
  },

  removePolicyTemplate(type, i) {
    this.syncPolicyTemplatesFromForm();
    const list = type === 'shipping' ? this.policyTemplatesDraft.shipping : this.policyTemplatesDraft.return;
    if (list.length <= 1) {
      alert('최소 1개는 유지해야 합니다.');
      return;
    }
    if (!confirm('이 템플릿을 삭제할까요?')) return;
    list.splice(i, 1);
    this.render();
  },

  renderPolicyTemplatePicker(field) {
    const templates = field === 'shipping' ? this.getShippingTemplates() : this.getReturnTemplates();
    const selectId = field === 'shipping' ? 'policy-pick-shipping' : 'policy-pick-return';
    if (!templates.length) {
      return `<span class="admin-hint">등록된 템플릿 없음 · [배송·반품 안내]에서 추가</span>`;
    }
    return `<span class="policy-template-picker">
      <select id="${selectId}" class="policy-template-select">
        ${templates.map((t) => `<option value="${this.esc(t.id)}">${this.esc(t.name)}</option>`).join('')}
      </select>
      <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.applyPolicyTemplate('${field}')">안내 불러오기</button>
    </span>`;
  },

  renderPolicyTemplateCards(type) {
    const list =
      type === 'shipping' ? this.policyTemplatesDraft?.shipping || [] : this.policyTemplatesDraft?.return || [];
    const title = type === 'shipping' ? '배송 안내' : '교환·반품 안내';
    return list
      .map(
        (t, i) => `
      <div class="policy-template-card">
        <div class="policy-template-card__head">
          <input name="${type}TemplateName_${i}" value="${this.esc(t.name)}" placeholder="${title} 이름 (예: 기본 배송, 냉동 전용)" />
          <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.removePolicyTemplate('${type}', ${i})">삭제</button>
        </div>
        <textarea name="${type}TemplateBody_${i}" rows="8" placeholder="${title} 내용">${this.esc(t.body)}</textarea>
      </div>`
      )
      .join('');
  },

  syncProductOptionsFromForm() {
    if (!this.productDraft?.useOptions) return;
    document.querySelectorAll('.option-row[data-index]').forEach((row) => {
      const i = Number(row.getAttribute('data-index'));
      if (Number.isNaN(i) || !this.productDraft.options[i]) return;
      const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
      if (inputs[0]) this.productDraft.options[i].label = inputs[0].value;
      if (inputs[1]) this.productDraft.options[i].price = inputs[1].value;
      if (inputs[2]) this.productDraft.options[i].originalPrice = inputs[2].value;
    });
  },

  syncProductFormState() {
    if (this.view !== 'product-form') return;
    const form = document.getElementById('product-form');
    if (!form) return;
    const fd = new FormData(form);
    if (this.editingProduct) {
      this.editingProduct = {
        ...this.editingProduct,
        name: fd.get('name'),
        category: fd.get('category'),
        price: fd.get('price'),
        originalPrice: fd.get('originalPrice'),
        unit: fd.get('unit'),
        origin: fd.get('origin'),
        stock: fd.get('stock'),
        badge: fd.get('badge'),
        emoji: fd.get('emoji'),
        description: fd.get('description'),
        organic: fd.get('organic') === 'on',
        localDirect: fd.get('localDirect') === 'on',
        freeShipping: fd.get('freeShipping') === 'on',
      };
    }
    if (this.productDraft) {
      this.productDraft.useOptions = fd.get('useOptions') === 'on';
      this.productDraft.optionLabel = fd.get('optionLabel') || '용량';
      this.productDraft.shippingGuide = fd.get('shippingGuide') || '';
      this.productDraft.returnGuide = fd.get('returnGuide') || '';
      this.syncProductOptionsFromForm();
    }
  },

  readImageFile(ev, cb) {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('2MB 이하 이미지만 등록할 수 있습니다.');
      ev.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result || ''));
    reader.readAsDataURL(file);
  },

  onMainImagePick(ev) {
    this.readImageFile(ev, (url) => {
      this.syncProductFormState();
      this.productDraft.mainImage = url;
      this.render();
    });
  },

  onDetailBlockImagePick(index, ev) {
    this.readImageFile(ev, (url) => {
      this.syncProductFormState();
      this.productDraft.detailBlocks[index].url = url;
      this.productDraft.detailBlocks[index].type = 'image';
      this.render();
    });
  },

  renderDetailEditor() {
    return `
      <div class="detail-editor-wrap">
        <div id="detail-editor-host"></div>
        <input type="file" id="detail-editor-images" accept="image/*" multiple hidden onchange="Admin.onDetailEditorImagesPick(event)" />
        <div class="detail-editor-foot">
          <span id="detail-editor-count">문자 : 0</span>
          <span class="admin-hint">이미지 버튼 · 여러 장 선택 가능 (각 2MB 이하)</span>
        </div>
      </div>`;
  },

  addProductOption() {
    this.syncProductFormState();
    this.productDraft.options.push({ label: '', price: 0, originalPrice: '' });
    this.render();
  },

  toggleUseOptions(enabled) {
    this.syncProductFormState();
    this.productDraft.useOptions = enabled;
    if (enabled) {
      const form = document.getElementById('product-form');
      const unit = form ? String(new FormData(form).get('unit') || '').trim() : '';
      if (!this.productDraft.options?.length) {
        this.productDraft.options = [{ label: unit || '1kg', price: 0, originalPrice: '' }];
      }
    }
    this.render();
  },

  removeProductOption(i) {
    this.syncProductFormState();
    if (this.productDraft.options.length <= 1) return;
    this.productDraft.options.splice(i, 1);
    this.render();
  },

  addDetailTextBlock() {
    this.syncProductFormState();
    this.productDraft.detailBlocks.push({ type: 'text', text: '' });
    this.render();
  },

  addDetailImageBlock() {
    this.syncProductFormState();
    this.productDraft.detailBlocks.push({ type: 'image', url: '', text: '' });
    this.render();
  },

  removeDetailBlock(i) {
    this.syncProductFormState();
    if (this.productDraft.detailBlocks.length <= 1) return;
    this.productDraft.detailBlocks.splice(i, 1);
    this.render();
  },

  async applyPolicyTemplate(field) {
    this.syncProductFormState();
    if (!this.productDraft) this.initProductDraft(this.editingProduct || {});
    await this.ensurePolicies(true);

    const selectId = field === 'shipping' ? 'policy-pick-shipping' : 'policy-pick-return';
    const templateId = document.getElementById(selectId)?.value;
    const templates = field === 'shipping' ? this.getShippingTemplates() : this.getReturnTemplates();

    if (!templates.length) {
      alert('등록된 안내 문구가 없습니다. [배송·반품 안내] 메뉴에서 템플릿을 추가해 주세요.');
      return;
    }

    const tpl = templates.find((t) => t.id === templateId) || templates[0];
    const fieldName = field === 'shipping' ? 'shippingGuide' : 'returnGuide';
    this.productDraft[fieldName] = tpl.body;

    const form = document.getElementById('product-form');
    const ta = form?.querySelector(`[name="${fieldName}"]`);
    if (ta) {
      ta.value = tpl.body;
      return;
    }
    this.render();
  },

  getFormBasePrices() {
    const form = document.getElementById('product-form');
    if (!form) {
      const p = this.editingProduct || {};
      const basePrice = Number(p.price) || 0;
      return { basePrice, baseOrig: Number(p.originalPrice) || basePrice };
    }
    const fd = new FormData(form);
    const basePrice = Number(fd.get('price')) || 0;
    const baseOrig = Number(fd.get('originalPrice')) || basePrice;
    return { basePrice, baseOrig };
  },

  getOptionPreviewText(basePrice, baseOrig, addPrice, optOrig) {
    const sale = basePrice + (Number(addPrice) || 0);
    const orig = (Number(optOrig) || 0) > 0 ? Number(optOrig) : baseOrig;
    return `→ ${this.fmt(sale)} / ${this.fmt(orig)}`;
  },

  updateOptionPreview(i) {
    const row = document.querySelector(`.option-row[data-index="${i}"]`);
    if (!row) return;
    const preview = row.querySelector('.option-row__preview');
    if (!preview) return;
    const { basePrice, baseOrig } = this.getFormBasePrices();
    const inputs = row.querySelectorAll('input');
    preview.textContent = this.getOptionPreviewText(basePrice, baseOrig, inputs[1]?.value, inputs[2]?.value);
  },

  updateAllOptionPreviews() {
    const d = this.productDraft;
    if (!d?.useOptions) return;
    (d.options || []).forEach((_, i) => this.updateOptionPreview(i));
  },

  renderProductOptions() {
    const d = this.productDraft;
    if (!d?.useOptions) return '';
    const { basePrice, baseOrig } = this.getFormBasePrices();
    return `
      <div class="option-row option-row--head">
        <span>옵션명</span><span>추가 판매가</span><span>정가</span><span></span>
      </div>
      ${d.options
      .map((o, i) => {
        const addPrice = Number(o.price) || 0;
        const optOrig = Number(o.originalPrice) || 0;
        const previewText = this.getOptionPreviewText(basePrice, baseOrig, addPrice, optOrig);
        return `
      <div class="option-row" data-index="${i}">
        <input placeholder="예: 2kg" value="${this.esc(o.label)}" oninput="Admin.productDraft.options[${i}].label=this.value" />
        <input type="number" placeholder="0" value="${o.price === '' ? '' : o.price}" oninput="Admin.productDraft.options[${i}].price=this.value;Admin.updateOptionPreview(${i})" title="기본 판매가에 더해짐" />
        <input type="number" placeholder="${baseOrig || '기본 정가'}" value="${o.originalPrice === '' || o.originalPrice == null ? '' : o.originalPrice}" oninput="Admin.productDraft.options[${i}].originalPrice=this.value;Admin.updateOptionPreview(${i})" title="이 옵션의 정가(합산 아님)" />
        <span class="option-row__preview" title="적용 가격">${previewText}</span>
        <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.removeProductOption(${i})">삭제</button>
      </div>`;
      })
      .join('')}`;
  },

  renderDetailBlocks() {
    const d = this.productDraft;
    if (!d) return '';
    return d.detailBlocks
      .map((b, i) => {
        if (b.type === 'image') {
          return `
        <div class="detail-block detail-block--image">
          <div class="detail-block__head"><strong>이미지 + 설명</strong>
            <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.removeDetailBlock(${i})">삭제</button></div>
          ${b.url ? `<img class="img-preview" src="${b.url}" alt="" />` : ''}
          <input type="file" accept="image/*" onchange="Admin.onDetailBlockImagePick(${i}, event)" />
          <textarea rows="2" placeholder="이미지 설명 글" onchange="Admin.productDraft.detailBlocks[${i}].text=this.value">${this.esc(b.text || '')}</textarea>
        </div>`;
        }
        return `
        <div class="detail-block">
          <div class="detail-block__head"><strong>텍스트</strong>
            <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.removeDetailBlock(${i})">삭제</button></div>
          <textarea rows="2" placeholder="상세 설명" onchange="Admin.productDraft.detailBlocks[${i}].text=this.value">${this.esc(b.text || '')}</textarea>
        </div>`;
      })
      .join('');
  },

  onProductFormKeydown(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
  },

  formatDraftSavedAt(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('ko-KR');
  },

  getProductDraftInfo() {
    try {
      const raw = localStorage.getItem(this.PRODUCT_DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveProductDraftLocal() {
    const isEdit = !!(this.editingProduct?.id && this.products.some((p) => p.id === this.editingProduct.id));
    if (isEdit) {
      alert('상품 등록 화면에서만 임시 저장할 수 있습니다.');
      return;
    }
    this.syncProductFormState();
    const payload = {
      savedAt: new Date().toISOString(),
      editingProduct: { ...this.editingProduct },
      productDraft: JSON.parse(JSON.stringify(this.productDraft || {})),
    };
    delete payload.editingProduct.id;
    try {
      localStorage.setItem(this.PRODUCT_DRAFT_KEY, JSON.stringify(payload));
      alert('임시 저장되었습니다. (서버에는 저장되지 않습니다)');
      this.render();
    } catch (err) {
      alert(err.message || '임시 저장에 실패했습니다. 이미지 용량이 너무 크면 텍스트만 줄여 보세요.');
    }
  },

  loadProductDraftLocal() {
    const draft = this.getProductDraftInfo();
    if (!draft) {
      alert('불러올 임시 저장본이 없습니다.');
      return;
    }
    const hasInput =
      String(this.editingProduct?.name || '').trim() ||
      String(this.productDraft?.mainImage || '').trim() ||
      (this.productDraft?.detailBlocks || []).some((b) => String(b.text || b.url || '').trim());
    if (hasInput && !confirm('현재 작성 중인 내용을 덮어쓰고 임시 저장본을 불러올까요?')) return;
    this.editingProduct = { ...(draft.editingProduct || {}), id: undefined };
    this.productDraft = draft.productDraft || {};
    if (!Array.isArray(this.productDraft.options)) this.productDraft.options = [];
    if (!Array.isArray(this.productDraft.detailBlocks)) this.productDraft.detailBlocks = [{ type: 'text', text: '' }];
    this.view = 'product-form';
    this.render();
    alert(`임시 저장본을 불러왔습니다. (${this.formatDraftSavedAt(draft.savedAt)})`);
  },

  clearProductDraftLocal(silent) {
    localStorage.removeItem(this.PRODUCT_DRAFT_KEY);
    if (!silent) {
      alert('임시 저장본을 삭제했습니다.');
      this.render();
    }
  },

  saveProductClick() {
    this.syncDetailEditorToDraft();
    const form = document.getElementById('product-form');
    if (!form || !form.reportValidity()) return;
    this.saveProduct({ preventDefault() {}, target: form });
  },

  async saveProduct(e) {
    e.preventDefault();
    this.syncDetailEditorToDraft();
    this.syncProductFormState();
    const fd = new FormData(e.target);
    const d = this.productDraft || {};
    const useOptions = fd.get('useOptions') === 'on';
    d.useOptions = useOptions;
    if (useOptions && !(d.options || []).length) {
      alert('옵션 사용 시 옵션을 1개 이상 등록해 주세요.');
      return;
    }
    const body = {
      name: fd.get('name'),
      category: fd.get('category'),
      price: Number(fd.get('price')),
      originalPrice: Number(fd.get('originalPrice') || fd.get('price')),
      unit: String(fd.get('unit') || '1개'),
      origin: fd.get('origin'),
      stock: Number(fd.get('stock')),
      badge: fd.get('badge'),
      emoji: fd.get('emoji'),
      description: fd.get('description'),
      mainImage: d.mainImage || '',
      useOptions,
      optionLabel: d.optionLabel || fd.get('optionLabel') || '용량',
      options: useOptions
        ? (d.options || []).map((o) => ({
            label: o.label,
            price: Number(o.price) || 0,
            originalPrice: o.originalPrice === '' || o.originalPrice == null ? 0 : Number(o.originalPrice),
          }))
        : [],
      detailHtml: d.detailHtml || '',
      detailBlocks: this.detailHtmlToBlocks(d.detailHtml || ''),
      shippingGuide: d.shippingGuide || fd.get('shippingGuide') || '',
      returnGuide: d.returnGuide || fd.get('returnGuide') || '',
      organic: fd.get('organic') === 'on',
      localDirect: fd.get('localDirect') === 'on',
      freeShipping: fd.get('freeShipping') === 'on',
    };
    try {
      let res;
      const isEdit = !!(this.editingProduct?.id && this.products.some((p) => p.id === this.editingProduct.id));
      if (isEdit) {
        res = await this.request('/api/admin/products/' + encodeURIComponent(this.editingProduct.id), {
          method: 'PUT',
          body: JSON.stringify({ ...body, id: this.editingProduct.id }),
        });
      } else {
        res = await this.request('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
      }
      const saved = res?.product;
      if (saved) {
        this.editingProduct = { ...saved };
        this.initProductDraft(this.editingProduct);
        const idx = (this.products || []).findIndex((p) => p.id === saved.id);
        if (idx >= 0) {
          this.products[idx] = saved;
        } else {
          this.products = [...(this.products || []), saved];
          if (!this.productOrderIds.includes(saved.id)) this.productOrderIds.push(saved.id);
        }
      } else {
        await this.loadProducts();
      }
      if (!isEdit) this.clearProductDraftLocal(true);
      this.view = 'product-form';
      this.render();
      alert('상품이 저장되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteProduct(id) {
    if (!confirm('이 상품을 삭제할까요?')) return;
    try {
      await this.request('/api/admin/products/' + encodeURIComponent(id), { method: 'DELETE' });
      this.products = (this.products || []).filter((p) => p.id !== id);
      this.productOrderIds = (this.productOrderIds || []).filter((pid) => pid !== id);
      this.view = 'products';
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  productName(productId) {
    const p = (this.products || []).find((x) => x.id === productId);
    return p?.name || '-';
  },

  async ensureProducts() {
    if (!this.products?.length) {
      try {
        this.products = await this.request('/api/admin/products');
      } catch {
        this.products = this.products || [];
      }
    }
  },

  async loadOrders(status) {
    if (status !== undefined) this.orderFilter = status;
    const q = this.orderFilter ? '?status=' + encodeURIComponent(this.orderFilter) : '';
    try {
      this.orders = await this.request('/api/admin/orders' + q);
      await this.ensureProducts();
      this.view = 'orders';
      this.selectedOrderId = null;
      this.render();
    } catch (err) {
      alert(err.message || '주문 목록을 불러오지 못했습니다.');
    }
  },

  async openOrder(id) {
    try {
      await this.ensureProducts();
      const order = await this.request('/api/admin/orders/' + encodeURIComponent(id));
      const idx = this.orders.findIndex((o) => o.id === id);
      if (idx >= 0) this.orders[idx] = order;
      else this.orders.unshift(order);
      this.selectedOrderId = id;
      this.view = 'order-detail';
      this.render();
    } catch (err) {
      alert(err.message || '주문 정보를 불러오지 못했습니다.');
    }
  },

  async patchOrder(id, data) {
    await this.request('/api/admin/orders/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    alert('저장되었습니다.');
    await this.loadOrders(this.orderFilter);
    this.openOrder(id);
  },

  async saveOrderDetail(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    await this.patchOrder(fd.get('id'), {
      status: fd.get('status'),
      paymentStatus: fd.get('paymentStatus'),
      trackingCompany: fd.get('trackingCompany'),
      trackingNumber: fd.get('trackingNumber'),
    });
  },

  async loadSales() {
    this.sales = await this.request('/api/admin/sales?days=30');
    this.stats = await this.request('/api/admin/stats');
    this.view = 'sales';
    this.render();
  },

  async loadMembers() {
    this.members = await this.request('/api/admin/users');
    this.view = 'members';
    this.render();
  },

  async loadReviews() {
    this.reviews = await this.request('/api/admin/reviews');
    await this.ensureProducts();
    this.view = 'reviews';
    this.render();
  },

  async loadInquiries() {
    this.inquiries = await this.request('/api/admin/inquiries');
    this.view = 'inquiries';
    this.render();
  },

  async loadSettingsGuides() {
    this.settings = await this.request('/api/admin/settings');
    await this.ensurePolicies();
    this.initPolicyTemplatesDraft(this.settings.productPolicies);
    this.view = 'settings-guides';
    this.render();
  },

  async loadSettings() {
    this.settings = await this.request('/api/admin/settings');
    this.view = 'settings';
    this.render();
  },

  async deleteReview(id) {
    if (!confirm('삭제할까요?')) return;
    await this.request('/api/admin/reviews/' + id, { method: 'DELETE' });
    await this.loadReviews();
  },

  async patchInquiry(id) {
    await this.request('/api/admin/inquiries/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'done' }),
    });
    await this.loadInquiries();
  },

  async saveSetting(key) {
    const form = document.getElementById('form-' + key);
    if (!form) return;
    const fd = new FormData(form);
    try {
      if (key === 'shop') {
        await this.request('/api/admin/settings/shop', {
          method: 'PUT',
          body: JSON.stringify({
            name: fd.get('name'),
            company: fd.get('company'),
            ceo: fd.get('ceo'),
            businessNo: fd.get('businessNo'),
            address: fd.get('address'),
            email: fd.get('email'),
            phone: fd.get('phone'),
            mailOrderNo: fd.get('mailOrderNo'),
          }),
        });
      } else if (key === 'payment') {
        await this.request('/api/admin/settings/payment', {
          method: 'PUT',
          body: JSON.stringify({
            provider: fd.get('provider'),
            testMode: fd.get('testMode') === 'on',
            notice: fd.get('notice'),
            bankAccount: {
              bank: fd.get('bankName'),
              number: fd.get('bankNumber'),
              holder: fd.get('bankHolder'),
            },
          }),
        });
      } else if (key === 'order') {
        await this.request('/api/admin/settings/order', {
          method: 'PUT',
          body: JSON.stringify({
            shippingFee: Number(fd.get('shippingFee')),
            freeShippingThreshold: Number(fd.get('freeShippingThreshold')),
            autoConfirm: fd.get('autoConfirm') === 'on',
          }),
        });
      } else if (key === 'customerCenter') {
        await this.request('/api/admin/settings/customerCenter', {
          method: 'PUT',
          body: JSON.stringify({
            phone: fd.get('phone'),
            hours: fd.get('hours'),
            email: fd.get('email'),
          }),
        });
      } else if (key === 'productPolicies') {
        this.syncPolicyTemplatesFromForm();
        const empty = [...this.policyTemplatesDraft.shipping, ...this.policyTemplatesDraft.return].some(
          (t) => !String(t.body || '').trim()
        );
        if (empty) {
          alert('내용이 비어 있는 템플릿이 있습니다. 내용을 입력하거나 삭제해 주세요.');
          return;
        }
        await this.request('/api/admin/settings/productPolicies', {
          method: 'PUT',
          body: JSON.stringify({
            shippingTemplates: this.policyTemplatesDraft.shipping,
            returnTemplates: this.policyTemplatesDraft.return,
          }),
        });
      }
      alert('저장되었습니다');
      if (key === 'productPolicies') await this.loadSettingsGuides();
      else await this.loadSettings();
    } catch (e) {
      alert(e.message);
    }
  },

  renderLogin() {
    return `
      <div class="login-box">
        <h1>수산아빠 관리자</h1>
        <p class="msg">${this.msg}</p>
        <form onsubmit="Admin.login(event)">
          <div class="form-row"><label>이메일</label><input name="email" type="email" required value="admin@greenharvest.kr" /></div>
          <div class="form-row"><label>비밀번호</label><input name="password" type="password" required /></div>
          <button class="btn" type="submit" style="width:100%;margin-top:8px">로그인</button>
        </form>
        <p style="margin-top:16px;font-size:0.85rem;color:#666">admin@greenharvest.kr / admin1234</p>
        <p><a href="/">← 쇼핑몰</a></p>
      </div>`;
  },

  renderSidebar() {
    const items = [
      ['dashboard', '📊', '대시보드', () => 'Admin.loadDashboard()'],
      ['products', '📦', '상품관리', () => 'Admin.loadProducts()'],
      ['product-form', '➕', '상품등록', () => "Admin.openProductForm(null)"],
      ['orders', '🚚', '주문·배송', () => "Admin.loadOrders('')"],
      ['sales', '💰', '매출관리', () => 'Admin.loadSales()'],
      ['members', '👥', '회원관리', () => 'Admin.loadMembers()'],
      ['reviews', '⭐', '리뷰관리', () => 'Admin.loadReviews()'],
      ['inquiries', '💬', '문의함', () => 'Admin.loadInquiries()'],
      ['settings', '⚙️', '설정', () => 'Admin.loadSettings()'],
      ['settings-guides', '📋', '배송·반품 안내', () => 'Admin.loadSettingsGuides()'],
    ];
    const activeView =
      this.view === 'product-form'
        ? 'product-form'
        : this.view === 'order-detail'
          ? 'orders'
          : this.view;
    return `
      <aside class="admin-sidebar">
        <div class="admin-sidebar__brand">
          <img src="/images/logo.png" alt="" />
          <strong>수산아빠 Admin</strong>
        </div>
        <nav class="admin-nav">
          ${items
            .map(
              ([id, icon, label, fn]) =>
                `<button type="button" class="${activeView === id ? 'active' : ''}" onclick="${fn()}">${icon} ${label}</button>`
            )
            .join('')}
        </nav>
        <div class="admin-sidebar__foot">
          <a href="/" target="_blank">쇼핑몰 바로가기 →</a><br><br>
          <button class="btn btn--ghost btn--sm" style="width:100%;color:#fff;border-color:rgba(255,255,255,0.3)" onclick="Admin.logout()">로그아웃</button>
        </div>
      </aside>`;
  },

  renderDashboard() {
    const s = this.stats || {};
    const chart = this.sales?.chart || [];
    const maxRev = Math.max(...chart.map((c) => c.revenue), 1);
    const bars = chart
      .slice(-14)
      .map(
        (c) => `
      <div class="chart-bar">
        <div class="chart-bar__col" style="height:${Math.round((c.revenue / maxRev) * 140)}px" title="${this.fmt(c.revenue)}"></div>
        <span class="chart-bar__label">${c.date.slice(5)}</span>
      </div>`
      )
      .join('');

    const recent = (s.recentOrders || [])
      .map(
        (o) => `<tr>
        <td><a href="#" onclick="Admin.openOrder('${o.id}');return false">${o.id}</a></td>
        <td>${this.esc(o.guest_name)}</td>
        <td>${this.fmt(o.total)}</td>
        <td>${this.badge(o.status)}</td>
        <td>${this.fmtDate(o.created_at)}</td>
      </tr>`
      )
      .join('');

    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card__label">오늘 매출</div><div class="stat-card__value">${this.fmt(s.todayRevenue)}</div><div class="stat-card__sub">주문 ${s.todayOrders ?? 0}건</div></div>
        <div class="stat-card stat-card--blue"><div class="stat-card__label">이번 달 매출</div><div class="stat-card__value">${this.fmt(s.monthRevenue)}</div><div class="stat-card__sub">주문 ${s.monthOrders ?? 0}건</div></div>
        <div class="stat-card"><div class="stat-card__label">누적 매출</div><div class="stat-card__value">${this.fmt(s.totalRevenue)}</div><div class="stat-card__sub">전체 ${s.orders ?? 0}건</div></div>
        <div class="stat-card stat-card--warn"><div class="stat-card__label">배송 대기</div><div class="stat-card__value">${s.pendingShip ?? 0}건</div><div class="stat-card__sub">결제완료·준비중</div></div>
        <div class="stat-card"><div class="stat-card__label">등록 상품</div><div class="stat-card__value">${s.products ?? 0}개</div></div>
        <div class="stat-card"><div class="stat-card__label">회원</div><div class="stat-card__value">${s.users ?? 0}명</div><div class="stat-card__sub">미답변 문의 ${s.inquiries ?? 0}건</div></div>
      </div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel__head"><h2>최근 14일 매출</h2></div>
          <div class="chart-bars">${bars || '<p class="empty-msg">데이터 없음</p>'}</div>
        </div>
        <div class="panel">
          <div class="panel__head"><h2>주문 상태</h2></div>
          ${Object.entries(s.byStatus || {})
            .map(([k, v]) => `<p>${this.badge(k)} <strong>${v}</strong>건</p>`)
            .join('') || '<p class="empty-msg">주문 없음</p>'}
        </div>
      </div>
      <div class="panel">
        <div class="panel__head"><h2>최근 주문</h2><button class="btn btn--sm btn--ghost" onclick="Admin.loadOrders('')">전체 보기</button></div>
        <table class="data-table"><thead><tr><th>주문번호</th><th>주문자</th><th>금액</th><th>상태</th><th>일시</th></tr></thead><tbody>${recent || '<tr><td colspan="5" class="empty-msg">주문 없음</td></tr>'}</tbody></table>
      </div>`;
  },

  renderProducts() {
    const list = this.getFilteredProducts();
    const total = (this.products || []).length;
    const q = (this.productFilter || '').trim();
    const cat = this.productCategoryFilter || '';
    const rows = list
      .map((p) => {
        const img = p.adminImages?.[0]?.url || '';
        return `<tr>
          <td>${img ? `<img class="thumb" src="${img}" alt="" onerror="this.style.display='none'" />` : '📦'}</td>
          <td><strong>${this.esc(p.name)}</strong><br><small>${this.esc(p.unit)} · ${this.CATEGORIES[p.category] || p.category}</small></td>
          <td>${this.fmt(p.price)}</td>
          <td>${p.stock ?? '-'}개</td>
          <td>${this.badge(p.stock > 0 ? 'paid' : 'cancel').replace('결제완료', '판매중').replace('취소', '품절')}</td>
          <td>
            <button class="btn btn--sm btn--ghost" onclick="Admin.openProductForm('${p.id}')">수정</button>
            <button class="btn btn--sm btn--danger" onclick="Admin.deleteProduct('${p.id}')">삭제</button>
          </td>
        </tr>`;
      })
      .join('');

    const emptyMsg =
      q || cat
        ? '검색 조건에 맞는 상품이 없습니다.'
        : '등록된 상품이 없습니다.';

    return `
      <div class="panel">
        <div class="panel__head">
          <h2>상품 관리 ${q || cat ? `(${list.length} / ${total}개)` : `(${total}개)`}</h2>
          <div class="toolbar">
            <input type="search" class="product-search-input" placeholder="상품명·카테고리·단위·산지 검색" value="${this.esc(this.productFilter)}" oninput="Admin.setProductSearch(this.value)" />
            <select onchange="Admin.setProductCategoryFilter(this.value)">
              <option value="" ${!cat ? 'selected' : ''}>전체 카테고리</option>
              ${Object.entries(this.CATEGORIES)
                .map(
                  ([k, v]) =>
                    `<option value="${k}" ${cat === k ? 'selected' : ''}>${v}</option>`
                )
                .join('')}
            </select>
            ${q || cat ? `<button type="button" class="btn btn--sm btn--ghost" onclick="Admin.clearProductSearch()">검색 초기화</button>` : ''}
            <button class="btn" onclick="Admin.openProductForm(null)">+ 상품 등록</button>
          </div>
        </div>
        <table class="data-table">
          <thead><tr><th></th><th>상품명</th><th>가격</th><th>재고</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="empty-msg">${emptyMsg}</td></tr>`}</tbody>
        </table>
      </div>`;
  },

  renderProductForm() {
    const p = this.editingProduct || {};
    const d = this.productDraft || { options: [], detailBlocks: [], mainImage: '' };
    const isEdit = !!(p.id && this.products.some((x) => x.id === p.id));
    const draft = !isEdit ? this.getProductDraftInfo() : null;
    return `
      <div class="panel">
        <div class="panel__head"><h2>${isEdit ? '상품 수정' : '상품 등록'}</h2>
          <button class="btn btn--ghost btn--sm" type="button" onclick="Admin.syncProductFormState();Admin.loadProducts()">← 목록</button>
        </div>
        <form id="product-form" onsubmit="event.preventDefault();return false;" onkeydown="Admin.onProductFormKeydown(event)">
          <div class="form-grid">
            <div class="form-row"><label>카테고리 *</label><select name="category">${Object.entries(this.CATEGORIES).map(([k, v]) => `<option value="${k}" ${p.category === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="form-row"><label>뱃지</label><select name="badge">${this.BADGES.map((b) => `<option value="${b}" ${(p.badge || '신선') === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
            <div class="form-row full"><label>상품명 *</label><input name="name" required value="${this.esc(p.name)}" /></div>
            <div class="form-row"><label>기본 단위</label><input name="unit" value="${this.esc(p.unit)}" placeholder="1kg, 500g, 2입" /></div>
            <div class="form-row"><label>기본 판매가</label><input name="price" type="number" value="${p.price ?? ''}" placeholder="10000" oninput="Admin.updateAllOptionPreviews()" /></div>
            <div class="form-row"><label>기본 정가</label><input name="originalPrice" type="number" value="${p.originalPrice ?? p.price ?? ''}" placeholder="15000" oninput="Admin.updateAllOptionPreviews()" /></div>
            <div class="form-row"><label>재고</label><input name="stock" type="number" value="${p.stock ?? 50}" /></div>
            <div class="form-row"><label>산지</label><input name="origin" value="${this.esc(p.origin)}" /></div>
            <div class="form-row"><label>이모지</label><input name="emoji" value="${this.esc(p.emoji || '🛒')}" /></div>

            <div class="form-row full">
              <label>메인 이미지</label>
              ${d.mainImage ? `<img class="img-preview img-preview--main" src="${d.mainImage}" alt="" />` : '<p class="admin-hint">대표 상품 이미지를 등록하세요.</p>'}
              <input type="file" accept="image/*" onchange="Admin.onMainImagePick(event)" />
            </div>

            <div class="form-row full">
              <label class="checkbox-inline">
                <input type="checkbox" name="useOptions" ${d.useOptions ? 'checked' : ''} onchange="Admin.toggleUseOptions(this.checked)" />
                옵션 사용 (용량·중량 등)
              </label>
            </div>

            ${
              d.useOptions
                ? `
            <div class="form-row full" id="product-option-fields">
              <label>옵션 설정</label>
              <p class="admin-hint">판매가는 <strong>기본 판매가 + 추가금</strong>, 정가는 <strong>옵션별 정가(합산 아님)</strong>입니다. 예) 기본 10,000원 +8,000원, 정가 30,000원 → 2kg 선택 시 18,000원 / 30,000원</p>
              <div class="form-row"><label>옵션 라벨</label>
                <select name="optionLabel">${this.OPTION_LABELS.map((l) => `<option value="${l}" ${d.optionLabel === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
              </div>
              <div class="option-list">${this.renderProductOptions()}</div>
              <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.addProductOption()">+ 옵션 추가</button>
            </div>`
                : ''
            }

            <div class="form-row full"><label>상품 설명</label><textarea name="description" rows="3">${this.esc(p.description)}</textarea></div>

            <div class="form-row full">
              <label>상품 상세설명</label>
              <p class="admin-hint">직접 작성 · 텍스트 서식과 이미지 여러 장을 한 번에 첨부할 수 있습니다.</p>
              ${this.renderDetailEditor()}
            </div>

            <div class="form-row full checkbox-row">
              <label class="checkbox-inline"><input type="checkbox" name="organic" ${p.organic ? 'checked' : ''} /> 유기농</label>
              <label class="checkbox-inline"><input type="checkbox" name="localDirect" ${p.localDirect !== false ? 'checked' : ''} /> 산지직송</label>
              <label class="checkbox-inline"><input type="checkbox" name="freeShipping" ${p.freeShipping ? 'checked' : ''} /> 무료배송</label>
            </div>

            <div class="form-row full">
              <label class="policy-field-label">배송 안내 ${this.renderPolicyTemplatePicker('shipping')}</label>
              <textarea name="shippingGuide" rows="5">${this.esc(d.shippingGuide)}</textarea>
            </div>
            <div class="form-row full">
              <label class="policy-field-label">교환·반품 안내 ${this.renderPolicyTemplatePicker('return')}</label>
              <textarea name="returnGuide" rows="5">${this.esc(d.returnGuide)}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn" type="button" onclick="Admin.saveProductClick()">${isEdit ? '수정 저장' : '상품 등록'}</button>
            ${
              !isEdit
                ? `
            <button class="btn btn--ghost" type="button" onclick="Admin.saveProductDraftLocal()">임시 저장</button>
            ${
              draft
                ? `<button class="btn btn--ghost" type="button" onclick="Admin.loadProductDraftLocal()">임시 저장 불러오기 (${this.formatDraftSavedAt(draft.savedAt)})</button>
            <button class="btn btn--ghost btn--sm" type="button" onclick="if(confirm('임시 저장본을 삭제할까요?'))Admin.clearProductDraftLocal()">임시 저장 삭제</button>`
                : ''
            }`
                : ''
            }
          </div>
        </form>
      </div>`;
  },

  renderOrders() {
    const rows = (this.orders || [])
      .map(
        (o) => `<tr>
        <td><a href="#" onclick="Admin.openOrder('${o.id}');return false"><strong>${o.id}</strong></a></td>
        <td>${this.esc(o.guest_name)}<br><small>${this.esc(o.guest_phone)}</small></td>
        <td>${this.fmt(o.total)}</td>
        <td>${this.PAYMENT[o.payment_method] || o.payment_method || '-'}<br><small>${this.paymentStatusLabel(o.payment_status)}</small></td>
        <td>${this.badge(o.status)}</td>
        <td>${this.fmtDate(o.created_at)}</td>
        <td><button class="btn btn--sm btn--ghost" onclick="Admin.openOrder('${o.id}')">상세</button></td>
      </tr>`
      )
      .join('');

    const filters = ['', 'awaiting_deposit', 'paid', 'preparing', 'shipping', 'done'];
    return `
      <div class="panel">
        <div class="panel__head">
          <h2>주문·배송 관리 (${(this.orders || []).length}건)</h2>
          <div class="toolbar">
            ${filters.map((f) => `<button class="btn btn--sm ${this.orderFilter === f ? '' : 'btn--ghost'}" onclick="Admin.loadOrders('${f}')">${f ? this.STATUS[f] : '전체'}</button>`).join('')}
          </div>
        </div>
        <table class="data-table">
          <thead><tr><th>주문번호</th><th>주문자</th><th>금액</th><th>결제</th><th>주문상태</th><th>주문일</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" class="empty-msg">주문 없음</td></tr>'}</tbody>
        </table>
      </div>`;
  },

  renderOrderDetail() {
    const order = (this.orders || []).find((x) => x.id === this.selectedOrderId);
    if (!order) {
      return `<div class="panel"><p class="empty-msg">주문 정보를 불러올 수 없습니다.</p></div>`;
    }
    const items = Array.isArray(order.items) ? order.items : [];
    const itemRows = items
      .map((i) => `<li>${this.esc(this.productName(i.productId))} × ${i.quantity || 1}</li>`)
      .join('');

    return `
      <div class="panel">
        <div class="panel__head">
          <h2>주문 상세 — ${order.id}</h2>
          <button class="btn btn--ghost btn--sm" onclick="Admin.loadOrders(Admin.orderFilter)">← 목록</button>
        </div>
        <div class="order-detail-grid">
          <div class="detail-box">
            <strong>주문자</strong><br>
            ${this.esc(order.guest_name)} / ${this.esc(order.guest_phone)}<br>
            ${this.esc(order.guest_email || '')}<br><br>
            <strong>배송지</strong><br>
            [${this.esc(order.zipcode)}] ${this.esc(order.address)} ${this.esc(order.address_detail || '')}<br>
            ${order.memo ? `<br><strong>메모</strong> ${this.esc(order.memo)}` : ''}
          </div>
          <div class="detail-box">
            <strong>결제</strong><br>
            ${this.fmt(order.subtotal)} + 배송 ${order.shipping ? this.fmt(order.shipping) : '무료'} = <strong>${this.fmt(order.total)}</strong><br>
            ${this.PAYMENT[order.payment_method] || order.payment_method} · ${this.paymentStatusLabel(order.payment_status)}<br><br>
            <strong>상품</strong><ul>${itemRows || '<li>없음</li>'}</ul>
          </div>
        </div>
        <form onsubmit="Admin.saveOrderDetail(event)" style="margin-top:20px">
          <input type="hidden" name="id" value="${order.id}" />
          <div class="form-grid">
            <div class="form-row"><label>주문 상태</label>
              <select name="status">${Object.entries(this.STATUS).map(([k, v]) => `<option value="${k}" ${order.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
            </div>
            <div class="form-row"><label>결제 상태</label>
              <select name="paymentStatus">
                ${Object.entries(this.PAYMENT_STATUS).map(([k, v]) => `<option value="${k}" ${order.payment_status === k ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </div>
            <div class="form-row"><label>택배사</label><input name="trackingCompany" value="${this.esc(order.tracking_company || '')}" placeholder="CJ대한통운, 우체국 등" /></div>
            <div class="form-row"><label>송장번호</label><input name="trackingNumber" value="${this.esc(order.tracking_number || '')}" /></div>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn" type="submit">저장</button>
            ${order.status === 'paid' ? `<button type="button" class="btn btn--warn" onclick="Admin.patchOrder('${order.id}',{status:'preparing'})">준비중 처리</button>` : ''}
            ${order.status === 'preparing' ? `<button type="button" class="btn btn--warn" onclick="Admin.patchOrder('${order.id}',{status:'shipping'})">배송 시작</button>` : ''}
          </div>
        </form>
      </div>`;
  },

  renderSales() {
    const s = this.stats || {};
    const chart = this.sales?.chart || [];
    const maxRev = Math.max(...chart.map((c) => c.revenue), 1);
    const bars = chart
      .map(
        (c) => `
      <div class="chart-bar">
        <div class="chart-bar__col" style="height:${Math.round((c.revenue / maxRev) * 140)}px"></div>
        <span class="chart-bar__label">${c.date.slice(5)}</span>
      </div>`
      )
      .join('');

    const byPay = Object.entries(this.sales?.byPayment || {})
      .map(([k, v]) => `<tr><td>${this.PAYMENT[k] || k}</td><td>${this.fmt(v)}</td></tr>`)
      .join('');

    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-card__label">30일 매출</div><div class="stat-card__value">${this.fmt(this.sales?.totalRevenue)}</div></div>
        <div class="stat-card stat-card--blue"><div class="stat-card__label">30일 주문</div><div class="stat-card__value">${this.sales?.orderCount ?? 0}건</div></div>
        <div class="stat-card"><div class="stat-card__label">누적 매출</div><div class="stat-card__value">${this.fmt(s.totalRevenue)}</div></div>
        <div class="stat-card stat-card--warn"><div class="stat-card__label">평균 객단가</div><div class="stat-card__value">${this.fmt(s.orders ? Math.round((s.totalRevenue || 0) / s.orders) : 0)}</div></div>
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel__head"><h2>일별 매출 (30일)</h2></div><div class="chart-bars">${bars || '<p class="empty-msg">없음</p>'}</div></div>
        <div class="panel"><div class="panel__head"><h2>결제수단별 매출</h2></div>
          <table class="data-table"><thead><tr><th>수단</th><th>매출</th></tr></thead><tbody>${byPay || '<tr><td colspan="2">없음</td></tr>'}</tbody></table>
        </div>
      </div>`;
  },

  renderMembers() {
    const rows = (this.members || [])
      .filter((u) => u.role === 'user')
      .map(
        (u) => `<tr>
        <td>${this.esc(u.name)}</td><td>${this.esc(u.email)}</td><td>${this.esc(u.phone || '-')}</td>
        <td>${this.fmtDate(u.created_at)}</td>
      </tr>`
      )
      .join('');
    return `<div class="panel"><div class="panel__head"><h2>회원 관리 (${(this.members || []).filter((u) => u.role === 'user').length}명)</h2></div>
      <table class="data-table"><thead><tr><th>이름</th><th>이메일</th><th>연락처</th><th>가입일</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="empty-msg">회원 없음</td></tr>'}</tbody></table></div>`;
  },

  renderReviews() {
    const rows = (this.reviews || [])
      .map(
        (r) => `<tr><td>${this.esc(this.productName(r.productId))}</td><td>${this.esc(r.author)}</td><td>${r.rating}★</td><td>${this.esc((r.content || '').slice(0, 50))}</td><td>${this.fmtDate(r.date)}</td>
        <td><button class="btn btn--sm btn--danger" onclick="Admin.deleteReview('${r.id}')">삭제</button></td></tr>`
      )
      .join('');
    return `<div class="panel"><div class="panel__head"><h2>리뷰 관리</h2></div>
      <table class="data-table"><thead><tr><th>상품</th><th>작성자</th><th>별점</th><th>내용</th><th>일시</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  renderInquiries() {
    const rows = (this.inquiries || [])
      .map(
        (q) => `<tr><td>${this.esc(q.title)}</td><td>${this.esc(q.name)}</td><td>${this.esc(q.category || '')}</td>
        <td>${q.status === 'pending' ? '<span class="badge badge--pending">대기</span>' : '<span class="badge badge--done">완료</span>'}</td>
        <td>${q.status === 'pending' ? `<button class="btn btn--sm" onclick="Admin.patchInquiry('${q.id}')">답변완료</button>` : '-'}</td></tr>`
      )
      .join('');
    return `<div class="panel"><div class="panel__head"><h2>1:1 문의</h2></div>
      <table class="data-table"><thead><tr><th>제목</th><th>이름</th><th>분류</th><th>상태</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  renderSettings() {
    const s = this.settings?.shop || {};
    const p = this.settings?.payment || {};
    const bank = p.bankAccount || {};
    const o = this.settings?.order || {};
    const c = this.settings?.customerCenter || {};
    return `
      <form id="form-shop" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('shop')">
        <h2>쇼핑몰 정보</h2>
        <div class="form-grid">
          <div class="form-row"><label>상호</label><input name="name" value="${this.esc(s.name)}" /></div>
          <div class="form-row"><label>회사명</label><input name="company" value="${this.esc(s.company)}" /></div>
          <div class="form-row"><label>대표</label><input name="ceo" value="${this.esc(s.ceo)}" /></div>
          <div class="form-row"><label>사업자번호</label><input name="businessNo" value="${this.esc(s.businessNo)}" /></div>
          <div class="form-row full"><label>주소</label><input name="address" value="${this.esc(s.address)}" /></div>
          <div class="form-row"><label>이메일</label><input name="email" value="${this.esc(s.email)}" /></div>
          <div class="form-row"><label>전화</label><input name="phone" value="${this.esc(s.phone)}" /></div>
        </div>
        <button class="btn" type="submit" style="margin-top:12px">저장</button>
      </form>
      <form id="form-payment" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('payment')">
        <h2>결제 설정</h2>
        <p class="admin-hint">토스페이먼츠 키는 Vercel 환경변수 TOSS_CLIENT_KEY, TOSS_SECRET_KEY</p>
        <div class="form-row"><label>PG</label><select name="provider"><option value="toss" ${p.provider === 'toss' ? 'selected' : ''}>toss</option></select></div>
        <div class="form-row"><label><input type="checkbox" name="testMode" ${p.testMode ? 'checked' : ''} /> 테스트 모드</label></div>
        <div class="form-row"><label>은행</label><input name="bankName" value="${this.esc(bank.bank)}" /></div>
        <div class="form-row"><label>계좌</label><input name="bankNumber" value="${this.esc(bank.number)}" /></div>
        <div class="form-row"><label>예금주</label><input name="bankHolder" value="${this.esc(bank.holder)}" /></div>
        <button class="btn" type="submit" style="margin-top:12px">저장</button>
      </form>
      <form id="form-order" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('order')">
        <h2>배송 설정</h2>
        <div class="form-row"><label>기본 배송비</label><input name="shippingFee" type="number" value="${o.shippingFee ?? 3000}" /></div>
        <div class="form-row"><label>무료배송 기준</label><input name="freeShippingThreshold" type="number" value="${o.freeShippingThreshold ?? 50000}" /></div>
        <button class="btn" type="submit" style="margin-top:12px">저장</button>
      </form>
      <form id="form-customerCenter" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('customerCenter')">
        <h2>고객센터</h2>
        <div class="form-row"><label>전화</label><input name="phone" value="${this.esc(c.phone)}" /></div>
        <div class="form-row"><label>운영시간</label><input name="hours" value="${this.esc(c.hours)}" /></div>
        <button class="btn" type="submit" style="margin-top:12px">저장</button>
      </form>`;
  },

  renderSettingsGuides() {
    if (!this.policyTemplatesDraft) this.initPolicyTemplatesDraft(this.getProductPolicies());
    return `
      <form id="form-productPolicies" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('productPolicies')">
        <h2>배송 안내 템플릿</h2>
        <p class="admin-hint">여러 문구를 저장해 두고, 상품 등록·수정 시 「안내 불러오기」에서 선택해 불러올 수 있습니다.</p>
        <div class="policy-template-list">${this.renderPolicyTemplateCards('shipping')}</div>
        <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.addPolicyTemplate('shipping')">+ 배송 안내 추가</button>

        <h2 style="margin-top:28px">교환·반품 안내 템플릿</h2>
        <p class="admin-hint">신선·냉장·냉동 등 상품 유형별로 다른 안내 문구를 등록할 수 있습니다.</p>
        <div class="policy-template-list">${this.renderPolicyTemplateCards('return')}</div>
        <button type="button" class="btn btn--sm btn--ghost" onclick="Admin.addPolicyTemplate('return')">+ 교환·반품 안내 추가</button>

        <button class="btn" type="submit" style="margin-top:20px">전체 저장</button>
      </form>`;
  },

  renderBody() {
    switch (this.view) {
      case 'dashboard':
        return this.renderDashboard();
      case 'products':
        return this.renderProducts();
      case 'product-form':
        return this.renderProductForm();
      case 'orders':
        return this.renderOrders();
      case 'order-detail':
        return this.renderOrderDetail();
      case 'sales':
        return this.renderSales();
      case 'members':
        return this.renderMembers();
      case 'reviews':
        return this.renderReviews();
      case 'inquiries':
        return this.renderInquiries();
      case 'settings':
        return this.renderSettings();
      case 'settings-guides':
        return this.renderSettingsGuides();
      default:
        return this.renderDashboard();
    }
  },

  render() {
    const root = document.getElementById('admin-app');
    if (!this.token) {
      root.innerHTML = this.renderLogin();
      return;
    }

    const titles = {
      dashboard: '대시보드',
      products: '상품 관리',
      'product-form': '상품 등록/수정',
      orders: '주문·배송 관리',
      'order-detail': '주문 상세',
      sales: '매출 관리',
      members: '회원 관리',
      reviews: '리뷰 관리',
      inquiries: '문의함',
      settings: '설정',
      'settings-guides': '배송·반품 안내',
    };

    root.innerHTML = `
      <div class="admin-layout">
        ${this.renderSidebar()}
        <main class="admin-main">
          <div class="admin-topbar">
            <div><h1>${titles[this.view] || '관리자'}</h1><div class="admin-topbar__meta">${new Date().toLocaleDateString('ko-KR')} · 수산아빠 관리자</div></div>
          </div>
          ${this.renderBody()}
        </main>
      </div>`;
  },
};

const _adminRender = Admin.render.bind(Admin);
Admin.render = function () {
  if (Admin.view === 'product-form') {
    Admin.syncDetailEditorToDraft();
    Admin.syncProductFormState();
  }
  if (Admin.view === 'settings-guides') Admin.syncPolicyTemplatesFromForm();
  _adminRender();
  if (Admin.view === 'product-form') {
    requestAnimationFrame(() => Admin.initDetailEditor());
  }
};

Admin.render();
if (Admin.token) Admin.loadDashboard();
