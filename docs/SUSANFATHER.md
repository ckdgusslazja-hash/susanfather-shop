# susanfather.com — 셀러비온과 똑같이 (GitHub + Vercel)

## 한 번에 배포 (셀러비온 했던 것과 동일)

### ① `배포하기.bat` 더블클릭

또는 PowerShell:

```powershell
cd "C:\Users\User\Desktop\이커머스 쇼핑몰"
npm run setup:env    # .env 생성 (최초 1회)
# .env 에 Neon DATABASE_URL 붙여넣기
npm run deploy:all   # GitHub 푸시 + Vercel 배포
```

---

## 처음 1회만: DB 주소

1. https://neon.tech → 가입 → **Connection string** 복사  
2. `.env` 파일의 `DATABASE_URL=` 뒤에 붙여넣기  
3. 저장

(JWT 등은 스크립트가 자동 생성)

---

## GitHub (셀러비온과 같음)

저장소: **https://github.com/ckdgusslazja-hash/susanfather-shop**

없으면 GitHub → **New repository** → 이름 `susanfather-shop` → Create  
그 다음 `npm run github:push`

---

## Vercel (셀러비온과 같음)

- CLI: `npm run deploy` (자동)
- 또는 https://vercel.com/new → GitHub **susanfather-shop** Import

환경 변수 (Vercel 대시보드 또는 deploy 스크립트가 자동 설정):

| 이름 | 값 |
|------|-----|
| DATABASE_URL | Neon 연결 문자열 |
| JWT_SECRET | 32자+ |
| NEXT_PUBLIC_SITE_URL | https://susanfather.com |

첫 배포 후:

```powershell
npx prisma db push
npm run db:seed
```

---

## 카페24 DNS

| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

Vercel → Domains → `susanfather.com` 추가

**셀러비온(sellervion.shop)과 IP 같아도 충돌 없음** (도메인으로 구분)

---

## 확인

- https://susanfather.com
- /admin/ — admin@greenharvest.kr / admin1234
