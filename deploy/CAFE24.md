# 카페24에서 susanfather.com 배포하기

도메인을 **카페24**에서 구매·관리하시는 경우 안내입니다.

---

## 1. 먼저 확인: 어떤 상품을 샀나요?

| 상품 | 이 쇼핑몰 배포 |
|------|----------------|
| **일반 웹호스팅** (PHP, HTML) | ❌ 불가 — Node.js 미지원 |
| **Node.js 호스팅** | △ 가능하나 제약 많음 (아래 3-B) |
| **서버 호스팅 / VPS / 개발언어 VPS** | ✅ **권장** (아래 3-A) |

**도메인만** 샀고 웹호스팅이 PHP만 있는 경우 → 카페24에서 **서버호스팅** 또는 **Node.js VPS**를 추가로 신청해야 합니다.

확인: [카페24 마이페이지](https://hosting.cafe24.com) → **나의 서비스 관리**

---

## 2. 도메인 연결 (DNS)

### 도메인 + 서버를 **둘 다 카페24**에서 쓸 때

1. **나의 서비스 관리** → **호스팅 관리** → **기본 관리**
2. **도메인 연결 관리** → `susanfather.com` 연결
3. 연결할 **서버(호스팅) IP** 선택 후 저장  
   (반영 10분~24시간)

### 도메인만 카페24, 서버는 다른 곳일 때

1. **나의 서비스 관리** → **도메인** → `susanfather.com` → **DNS 관리**
2. 레코드 추가:

| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | `@` | 서버 공인 IP |
| A | `www` | 같은 IP |

---

## 3-A. 서버 호스팅 / VPS (권장)

SSH 접속 가능한 상품이면 `DEPLOY.md`와 동일합니다. 카페24만의 차이:

1. **FileZilla** 또는 카페24 FTP로 프로젝트 업로드  
   예: `/home/사용자ID/susanfather/`
2. SSH(PuTTY) 접속 후:

```bash
cd /home/사용자ID/susanfather
npm ci --omit=dev
npm run seed
```

3. `.env` 작성:

```env
NODE_ENV=production
PORT=3000
SITE_URL=https://susanfather.com
JWT_SECRET=64자이상_랜덤
DB_PATH=/home/사용자ID/susanfather/server/data/shop.db
KAKAO_REDIRECT_URI=https://susanfather.com/api/auth/kakao/callback
```

4. PM2 실행:

```bash
npm install -g pm2
mkdir -p server/data
pm2 start ecosystem.config.cjs --env production
pm2 save
```

5. **HTTPS**  
   - 카페24 관리자에서 **SSL(보안서버)** 신청/설치  
   - 또는 서버에 Nginx + Let's Encrypt (`deploy/nginx-susanfather.conf` 참고)

6. **방화벽**  
   - 카페24 **서버 방화벽**에서 **80, 443** 허용  
   - 앱은 `127.0.0.1:3000` 에만 두고 Nginx가 프록시하는 방식 권장

접속: **https://susanfather.com**

---

## 3-B. Node.js 호스팅 (Git 배포)

제약: Node 버전 제한, `web.js` 필수, SQLite/네이티브 모듈 오류 가능, PM2 불가.

1. 카페24 **Node.js 호스팅** 신청 (Tomcat이 아닌 **Node.js** 탭)
2. 관리자에서 **Git 저장소** 연결 후 프로젝트 push
3. 프로젝트 **루트에 `web.js`** 있음 (이미 포함됨)
4. 환경 변수는 카페24 관리 화면에 설정:

   - `NODE_ENV=production`
   - `SITE_URL=https://susanfather.com`
   - `JWT_SECRET=...`
   - `PORT` — 카페24가 지정한 값 사용 (관리자 안내 확인)

5. **better-sqlite3** 빌드 실패 시 → **서버 호스팅으로 변경** 권장

6. 도메인: Node.js 호스팅 관리 → **도메인 연결** → `susanfather.com`

---

## 4. 카카오 로그인 (카페24 + susanfather.com)

[카카오 개발자](https://developers.kakao.com) → Redirect URI:

```
https://susanfather.com/api/auth/kakao/callback
```

카페24 **플랫폼 도메인**에도 `https://susanfather.com` 등록.

---

## 5. 배포 후 체크

- https://susanfather.com
- https://susanfather.com/api/health
- https://susanfather.com/admin/

관리자 비밀번호 **반드시 변경**.

---

## 6. 자주 묻는 문제

| 증상 | 해결 |
|------|------|
| 도메인만 사고 사이트 안 열림 | **서버 호스팅** 추가 필요 |
| PHP 호스팅만 있음 | Node 서버 상품으로 변경 |
| :3000 붙여야만 접속됨 | Nginx 리버스 프록시 또는 카페24 SSL+프록시 설정 |
| npm install 실패 (sqlite) | VPS/서버호스팅 사용 |

---

## 7. 카페24 고객센터

- 호스팅 기술: 1544-0597  
- “Node.js 서버호스팅에 Express 배포” 문의 시 **SSH IP, FTP 경로** 확인
