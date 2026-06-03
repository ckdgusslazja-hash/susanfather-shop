# Susan Father — 최대 자동 배포 (Vercel 로그인된 상태)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path

function Set-VercelEnv($name, $value) {
  $value | npx vercel@latest env add $name production --force 2>&1 | Out-Null
  Write-Host "  env: $name"
}

$prodUrl = "https://susanfather.com"

# JWT
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwt = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()

Write-Host "=== Vercel 프로젝트 연결 ==="
npx vercel@latest link --yes --project susanfather-shop 2>&1 | Out-Null

Write-Host "=== DB (Vercel Storage) — 브라우저 약관 1번 ==="
$termsPrisma = "https://vercel.com/ckdgusslazja-hashs-projects/~/integrations/accept-terms/prisma?source=cli"
$termsNeon = "https://vercel.com/ckdgusslazja-hashs-projects/~/integrations/accept-terms/neon?source=cli"
Start-Process $termsPrisma
Start-Process $termsNeon
Write-Host "브라우저에서 Prisma 또는 Neon 약관 '동의' 후 Enter..."
Read-Host

$ErrorActionPreference = "Continue"
npx vercel@latest integration add prisma-postgres 2>&1
$ErrorActionPreference = "Stop"

Write-Host "=== 환경 변수 ==="
Set-VercelEnv "JWT_SECRET" $jwt
Set-VercelEnv "NEXT_PUBLIC_SITE_URL" $prodUrl
Set-VercelEnv "SITE_URL" $prodUrl
Set-VercelEnv "SITE_NAME" "Susan Father"

Write-Host "=== 배포 ==="
npx vercel@latest deploy --prod --yes

Write-Host "=== 도메인 연결 ==="
npx vercel@latest domains add susanfather.com 2>&1
npx vercel@latest domains add www.susanfather.com 2>&1

Write-Host "=== DB 시드 (로컬에서 Vercel env pull 후) ==="
npx vercel@latest env pull .env.local --yes 2>&1
if (Test-Path ".env.local") {
  Copy-Item ".env.local" ".env" -Force
  npm run db:setup
}

Write-Host ""
Write-Host "완료: https://susanfather.com (DNS 반영 후 1~24시간)"
Write-Host "관리자: admin@greenharvest.kr / admin1234"
