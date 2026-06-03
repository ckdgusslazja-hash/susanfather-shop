# susanfather.com 배포 가이드

쇼핑몰을 **https://susanfather.com** 에 올리는 절차입니다.

---

## 1. 도메인 DNS (도메인 업체 관리 페이지)

서버 공인 IP를 `YOUR_SERVER_IP` 라고 할 때:

| 타입 | 이름 | 값 | TTL |
|------|------|-----|-----|
| A | `@` | YOUR_SERVER_IP | 300 |
| A | `www` | YOUR_SERVER_IP | 300 |

또는 `www` → CNAME → `susanfather.com`

전파 후 확인:

```bash
ping susanfather.com
```

---

## 2. 서버 준비 (Ubuntu 22.04 예시)

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

프로젝트 업로드 (Git 또는 ZIP):

```bash
cd /var/www
sudo mkdir -p susanfather && sudo chown $USER:$USER susanfather
cd susanfather
# git clone ... 또는 scp 로 파일 복사
npm ci --omit=dev
npm run seed
```

---

## 3. 환경 변수 `.env`

프로젝트 루트에 `.env` 생성:

```env
NODE_ENV=production
PORT=3000
SITE_URL=https://susanfather.com
SITE_NAME=Susan Father

JWT_SECRET=여기에_랜덤_64자_이상_문자열

KAKAO_REST_API_KEY=카카오_REST_API_키
KAKAO_REDIRECT_URI=https://susanfather.com/api/auth/kakao/callback

DB_PATH=/var/www/susanfather/server/data/shop.db
```

JWT_SECRET 생성 예:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**카카오 개발자 콘솔** Redirect URI에 반드시 추가:

- `https://susanfather.com/api/auth/kakao/callback`

---

## 4. PM2로 앱 실행

```bash
cd /var/www/susanfather
mkdir -p server/data
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

---

## 5. Nginx + HTTPS

```bash
sudo cp deploy/nginx-susanfather.conf /etc/nginx/sites-available/susanfather.com
sudo ln -sf /etc/nginx/sites-available/susanfather.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d susanfather.com -d www.susanfather.com
```

---

## 6. Docker로 실행 (선택)

```bash
cp .env.example .env
# .env 편집 후
docker compose up -d --build
```

Nginx는 동일하게 `127.0.0.1:3000` 으로 프록시합니다.

---

## 7. 배포 후 확인

- https://susanfather.com — 쇼핑몰
- https://susanfather.com/api/health — `{"ok":true,...}`
- https://susanfather.com/admin/ — 관리자

관리자 비밀번호는 **반드시 변경**하세요.

---

## 8. 업데이트

```bash
cd /var/www/susanfather
git pull   # 또는 새 파일 업로드
npm ci --omit=dev
pm2 restart susanfather-shop
```

---

## 문제 해결

| 증상 | 확인 |
|------|------|
| 502 Bad Gateway | `pm2 status`, 포트 3000 리슨 여부 |
| 카카오 로그인 실패 | Redirect URI가 https 도메인과 정확히 일치하는지 |
| DB 초기화 | `server/data/shop.db` 백업 후 `npm run seed` |
