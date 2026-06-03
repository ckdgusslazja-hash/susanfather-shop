const API = {
  base: '',
  token: localStorage.getItem('gh_token') || '',
  user: JSON.parse(localStorage.getItem('gh_user') || 'null'),
  shopSettings: null,
  orderSettings: null,

  setAuth(token, user) {
    this.token = token || '';
    this.user = user;
    if (token) {
      localStorage.setItem('gh_token', token);
      localStorage.setItem('gh_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gh_token');
      localStorage.removeItem('gh_user');
    }
  },

  logout() {
    this.setAuth('', null);
  },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    const res = await fetch(this.base + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '요청에 실패했습니다.');
    return data;
  },

  async loadShopSettings() {
    try {
      const data = await this.request('/api/settings/shop');
      this.shopSettings = data.shop;
      this.orderSettings = data.order;
      this.customerCenter = data.customerCenter;
      if (data.order) {
        window.SHIPPING_FEE = data.order.shippingFee;
        window.FREE_SHIPPING_THRESHOLD = data.order.freeShippingThreshold;
      }
    } catch {
      /* offline */
    }
  },

  async loadProducts() {
    try {
      const list = await this.request('/api/products');
      if (list?.length) {
        window.PRODUCTS_FROM_API = list;
        return list;
      }
    } catch {
      /* */
    }
    return null;
  },

  signup(body) {
    return this.request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) });
  },
  login(body) {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  findEmail(body) {
    return this.request('/api/auth/find-email', { method: 'POST', body: JSON.stringify(body) });
  },
  resetPassword(body) {
    return this.request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) });
  },
  changePassword(body) {
    return this.request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) });
  },
  getReviews(productId) {
    return this.request('/api/reviews?productId=' + encodeURIComponent(productId));
  },
  canWriteReview(productId) {
    return this.request('/api/reviews/can-write?productId=' + encodeURIComponent(productId));
  },
  postReview(body) {
    return this.request('/api/reviews', { method: 'POST', body: JSON.stringify(body) });
  },
  createOrder(body) {
    return this.request('/api/orders', { method: 'POST', body: JSON.stringify(body) });
  },
  myOrders() {
    return this.request('/api/orders/my');
  },
  postInquiry(body) {
    return this.request('/api/inquiries', { method: 'POST', body: JSON.stringify(body) });
  },
  getAddresses() {
    return this.request('/api/addresses');
  },
  createAddress(body) {
    return this.request('/api/addresses', { method: 'POST', body: JSON.stringify(body) });
  },
  updateAddress(id, body) {
    return this.request('/api/addresses/' + encodeURIComponent(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteAddress(id) {
    return this.request('/api/addresses/' + encodeURIComponent(id), { method: 'DELETE' });
  },
  setDefaultAddress(id) {
    return this.request('/api/addresses/' + encodeURIComponent(id) + '/default', { method: 'PATCH' });
  },
};
