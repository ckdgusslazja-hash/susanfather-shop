# Susan Father — Vercel 자동 배포 (셀러비온과 동일 방식)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path

if (-not (Test-Path ".env")) {
  Write-Host ".env 파일이 없습니다. .env.example 을 복사해 DATABASE_URL 을 넣어 주세요."
  exit 1
}

function Get-EnvValue($key) {
  $line = Get-Content ".env" | Where-Object { $_ -match "^\s*$key\s*=" } | Select-Object -First 1
  if (-not $line) { return $null }
  $v = $line -replace "^\s*$key\s*=\s*", ""
  return $v.Trim().Trim('"').Trim("'")
}

$dbUrl = Get-EnvValue "DATABASE_URL"
if (-not $dbUrl) {
  Write-Host "DATABASE_URL 이 .env 에 필요합니다. (Neon.tech 무료 Postgres 권장)"
  exit 1
}

$jwt = Get-EnvValue "JWT_SECRET"
if (-not $jwt -or $jwt.Length -lt 32) {
  $bytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $jwt = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
  Add-Content ".env" "`nJWT_SECRET=$jwt"
  Write-Host "JWT_SECRET 자동 생성 후 .env 에 저장했습니다."
}

$prodUrl = "https://susanfather.com"

function Set-VercelEnv($name, $value) {
  $value | npx vercel@latest env add $name production --force 2>&1 | Out-Null
  Write-Host "  env: $name"
}

Write-Host "Vercel 프로젝트 연결 (susanfather-shop)..."
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npx vercel@latest link --yes --project susanfather-shop 2>&1 | Out-Null
$ErrorActionPreference = $prevEAP

Write-Host "환경 변수 설정..."
Set-VercelEnv "DATABASE_URL" $dbUrl
Set-VercelEnv "JWT_SECRET" $jwt
Set-VercelEnv "NEXT_PUBLIC_SITE_URL" $prodUrl
Set-VercelEnv "SITE_URL" $prodUrl
Set-VercelEnv "SITE_NAME" "Susan Father"

$kakao = Get-EnvValue "KAKAO_REST_API_KEY"
if ($kakao) {
  Set-VercelEnv "KAKAO_REST_API_KEY" $kakao
  Set-VercelEnv "KAKAO_REDIRECT_URI" "$prodUrl/api/auth/kakao/callback"
}

Write-Host "DB 스키마 + 시드 (로컬에서 1회)..."
npx prisma db push
npm run db:seed

Write-Host "Vercel 배포 중 (2~5분)..."
npx vercel@latest deploy --prod --yes

Write-Host ""
Write-Host "완료. 아래 DNS 를 카페24에 설정하세요 (docs/SUSANFATHER.md 참고):"
Write-Host "  A @ -> 76.76.21.21"
Write-Host "  CNAME www -> cname.vercel-dns.com"
