const Admin = {
  token: localStorage.getItem('gh_admin_token') || '',
  tab: 'dashboard',
  settings: null,
  msg: '',

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
      this.tab = 'dashboard';
      this.render();
      await this.loadAll();
    } catch (err) {
      this.msg = err.message;
      this.render();
    }
  },

  logout() {
    this.setToken('');
    this.render();
  },

  async loadAll() {
    if (!this.token) return;
    try {
      const [stats, settings] = await Promise.all([
        this.request('/api/admin/stats'),
        this.request('/api/admin/settings'),
      ]);
      this.stats = stats;
      this.settings = settings;
      this.render();
    } catch (e) {
      this.msg = e.message;
      this.render();
    }
  },

  async saveSetting(key) {
    const form = document.getElementById('form-' + key);
    if (!form) return;
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => {
      if (k.includes('.')) {
        const [a, b] = k.split('.');
        body[a] = body[a] || {};
        body[a][b] = v;
      } else if (k === 'testMode' || k === 'enabled') {
        body[k] = v === 'on' || v === 'true';
      } else if (k === 'shippingFee' || k === 'freeShippingThreshold') {
        body[k] = Number(v);
      } else {
        body[k] = v;
      }
    });
    const nested = {};
    fd.forEach((v, k) => {
      if (!k.includes('.')) return;
      const [a, b] = k.split('.');
      nested[a] = nested[a] || {};
      nested[a][b] = v;
    });
    Object.assign(body, nested.shop ? { shop: nested.shop } : {});
    if (key === 'shop' && nested.shop) body.shop = nested.shop;
    if (key === 'customerCenter' && nested.customerCenter) body.customerCenter = nested.customerCenter;
    if (key === 'payment') {
      body.provider = fd.get('provider');
      body.testMode = fd.get('testMode') === 'on';
      body.notice = fd.get('notice');
    }
    if (key === 'order') {
      body.shippingFee = Number(fd.get('shippingFee'));
      body.freeShippingThreshold = Number(fd.get('freeShippingThreshold'));
      body.autoConfirm = fd.get('autoConfirm') === 'on';
    }
    try {
      const flat = this.settings[key] || {};
      if (key === 'shop') {
        await this.request('/api/admin/settings/shop', {
          method: 'PUT',
          body: JSON.stringify({
            name: fd.get('name') || flat.name,
            company: fd.get('company') || flat.company,
            ceo: fd.get('ceo') || flat.ceo,
            businessNo: fd.get('businessNo') || flat.businessNo,
            address: fd.get('address') || flat.address,
            email: fd.get('email') || flat.email,
            phone: fd.get('phone') || flat.phone,
            mailOrderNo: fd.get('mailOrderNo') || flat.mailOrderNo,
          }),
        });
      } else if (key === 'payment') {
        await this.request('/api/admin/settings/payment', {
          method: 'PUT',
          body: JSON.stringify({
            provider: fd.get('provider'),
            testMode: fd.get('testMode') === 'on',
            notice: fd.get('notice'),
            merchantId: fd.get('merchantId') || '',
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
      }
      alert('저장되었습니다');
      await this.loadAll();
    } catch (e) {
      alert(e.message);
    }
  },

  async loadOrders() {
    this.orders = await this.request('/api/admin/orders');
    this.tab = 'orders';
    this.render();
  },

  async loadReviews() {
    this.reviews = await this.request('/api/admin/reviews');
    this.tab = 'reviews';
    this.render();
  },

  async loadInquiries() {
    this.inquiries = await this.request('/api/admin/inquiries');
    this.tab = 'inquiries';
    this.render();
  },

  async patchOrder(id, status) {
    await this.request('/api/admin/orders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
    await this.loadOrders();
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

  renderLogin() {
    return `
      <div class="login-box">
        <h1>🌿 관리자 로그인</h1>
        <p class="msg">${this.msg}</p>
        <form onsubmit="Admin.login(event)">
          <div class="form-row"><label>이메일</label><input name="email" type="email" required value="admin@greenharvest.kr" /></div>
          <div class="form-row"><label>비밀번호</label><input name="password" type="password" required /></div>
          <button class="btn" type="submit">로그인</button>
        </form>
        <p style="margin-top:16px;font-size:0.85rem;color:#666">기본: admin@greenharvest.kr / admin1234</p>
        <p><a href="/">← 쇼핑몰</a></p>
      </div>`;
  },

  renderDashboard() {
    const s = this.stats || {};
    return `
      <div class="stats">
        <div class="stat-card"><span>회원</span><strong>${s.users ?? '-'}</strong></div>
        <div class="stat-card"><span>주문</span><strong>${s.orders ?? '-'}</strong></div>
        <div class="stat-card"><span>리뷰</span><strong>${s.reviews ?? '-'}</strong></div>
        <div class="stat-card"><span>미답변 문의</span><strong>${s.inquiries ?? '-'}</strong></div>
      </div>`;
  },

  renderSettingsShop() {
    const s = this.settings?.shop || {};
    return `
      <form id="form-shop" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('shop')">
        <h2>쇼핑몰 정보</h2>
        <div class="form-row"><label>상호</label><input name="name" value="${s.name || ''}" /></div>
        <div class="form-row"><label>회사명</label><input name="company" value="${s.company || ''}" /></div>
        <div class="form-row"><label>대표</label><input name="ceo" value="${s.ceo || ''}" /></div>
        <div class="form-row"><label>사업자번호</label><input name="businessNo" value="${s.businessNo || ''}" /></div>
        <div class="form-row"><label>주소</label><input name="address" value="${s.address || ''}" /></div>
        <div class="form-row"><label>이메일</label><input name="email" value="${s.email || ''}" /></div>
        <div class="form-row"><label>전화</label><input name="phone" value="${s.phone || ''}" /></div>
        <div class="form-row"><label>통신판매업</label><input name="mailOrderNo" value="${s.mailOrderNo || ''}" /></div>
        <button class="btn" type="submit">저장</button>
      </form>`;
  },

  renderSettingsPayment() {
    const p = this.settings?.payment || {};
    return `
      <form id="form-payment" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('payment')">
        <h2>결제 설정</h2>
        <div class="form-row"><label>PG 제공사</label>
          <select name="provider">
            <option value="demo" ${p.provider === 'demo' ? 'selected' : ''}>demo</option>
            <option value="toss" ${p.provider === 'toss' ? 'selected' : ''}>toss</option>
            <option value="inicis" ${p.provider === 'inicis' ? 'selected' : ''}>inicis</option>
          </select>
        </div>
        <div class="form-row"><label><input type="checkbox" name="testMode" ${p.testMode ? 'checked' : ''} /> 테스트 모드 (실결제 없음)</label></div>
        <div class="form-row"><label>가맹점 ID</label><input name="merchantId" value="${p.merchantId || ''}" placeholder="PG 연동 시 입력" /></div>
        <div class="form-row"><label>안내 문구</label><textarea name="notice" rows="2">${p.notice || ''}</textarea></div>
        <button class="btn" type="submit">저장</button>
      </form>`;
  },

  renderSettingsOrder() {
    const o = this.settings?.order || {};
    return `
      <form id="form-order" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('order')">
        <h2>주문·배송 설정</h2>
        <div class="form-row"><label>기본 배송비 (원)</label><input name="shippingFee" type="number" value="${o.shippingFee ?? 3000}" /></div>
        <div class="form-row"><label>무료배송 기준 (원)</label><input name="freeShippingThreshold" type="number" value="${o.freeShippingThreshold ?? 50000}" /></div>
        <div class="form-row"><label><input type="checkbox" name="autoConfirm" ${o.autoConfirm ? 'checked' : ''} /> 주문 자동 확인</label></div>
        <button class="btn" type="submit">저장</button>
      </form>`;
  },

  renderSettingsCS() {
    const c = this.settings?.customerCenter || {};
    return `
      <form id="form-customerCenter" class="panel" onsubmit="event.preventDefault();Admin.saveSetting('customerCenter')">
        <h2>고객센터 설정</h2>
        <div class="form-row"><label>전화</label><input name="phone" value="${c.phone || ''}" /></div>
        <div class="form-row"><label>운영시간</label><input name="hours" value="${c.hours || ''}" /></div>
        <div class="form-row"><label>이메일</label><input name="email" value="${c.email || ''}" /></div>
        <button class="btn" type="submit">저장</button>
      </form>`;
  },

  renderOrders() {
    const rows = (this.orders || [])
      .map(
        (o) => `<tr>
        <td>${o.id}</td><td>${o.guest_name}</td><td>${o.total?.toLocaleString()}원</td>
        <td>${o.status}</td>
        <td><select onchange="Admin.patchOrder('${o.id}', this.value)">
          <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>결제완료</option>
          <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>준비중</option>
          <option value="shipping" ${o.status === 'shipping' ? 'selected' : ''}>배송중</option>
          <option value="done" ${o.status === 'done' ? 'selected' : ''}>완료</option>
        </select></td>
      </tr>`
      )
      .join('');
    return `<div class="panel"><h2>주문 관리</h2><table><thead><tr><th>번호</th><th>이름</th><th>금액</th><th>상태</th><th>변경</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  renderReviews() {
    const rows = (this.reviews || [])
      .map(
        (r) => `<tr><td>${r.productId}</td><td>${r.author}</td><td>${r.rating}★</td><td>${(r.content || '').slice(0, 40)}…</td>
        <td><button class="btn btn--ghost" onclick="Admin.deleteReview('${r.id}')">삭제</button></td></tr>`
      )
      .join('');
    return `<div class="panel"><h2>리뷰 관리</h2><table><thead><tr><th>상품</th><th>작성자</th><th>별점</th><th>내용</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  renderInquiries() {
    const rows = (this.inquiries || [])
      .map(
        (q) => `<tr><td>${q.title}</td><td>${q.name}</td><td>${q.status}</td>
        <td>${q.status === 'pending' ? `<button class="btn btn--ghost" onclick="Admin.patchInquiry('${q.id}')">처리완료</button>` : '-'}</td></tr>`
      )
      .join('');
    return `<div class="panel"><h2>문의함</h2><table><thead><tr><th>제목</th><th>이름</th><th>상태</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  render() {
    const root = document.getElementById('admin-app');
    if (!this.token) {
      root.innerHTML = this.renderLogin();
      return;
    }
    let body = '';
    if (this.tab === 'dashboard') body = this.renderDashboard();
    if (this.tab === 'settings') {
      body =
        this.renderSettingsShop() +
        this.renderSettingsPayment() +
        this.renderSettingsOrder() +
        this.renderSettingsCS();
    }
    if (this.tab === 'orders') body = this.renderOrders();
    if (this.tab === 'reviews') body = this.renderReviews();
    if (this.tab === 'inquiries') body = this.renderInquiries();

    root.innerHTML = `
      <div class="admin-wrap">
        <header class="admin-header">
          <h1>🌿 그린하베스트 관리자</h1>
          <button class="btn btn--ghost" onclick="Admin.logout()">로그아웃</button>
        </header>
        <nav class="admin-tabs">
          <button class="${this.tab === 'dashboard' ? 'active' : ''}" onclick="Admin.tab='dashboard';Admin.render()">대시보드</button>
          <button class="${this.tab === 'settings' ? 'active' : ''}" onclick="Admin.tab='settings';Admin.render()">설정</button>
          <button class="${this.tab === 'orders' ? 'active' : ''}" onclick="Admin.loadOrders()">주문</button>
          <button class="${this.tab === 'reviews' ? 'active' : ''}" onclick="Admin.loadReviews()">리뷰</button>
          <button class="${this.tab === 'inquiries' ? 'active' : ''}" onclick="Admin.loadInquiries()">문의</button>
          <a href="/" style="margin-left:auto;line-height:40px">쇼핑몰 →</a>
        </nav>
        ${body}
      </div>`;
  },
};

Admin.render();
if (Admin.token) Admin.loadAll();
