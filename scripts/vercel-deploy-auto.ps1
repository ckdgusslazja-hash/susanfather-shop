# Susan Father — Vercel 자동 배포 (셀러비온과 동일 방식)
$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path

if (-not (Test-Path ".env")) {
  Write-Host ".env 파일이 없습니다. .env.example 을 복사해 DATABASE_URL 을 넣어 주세요."
  exit 1
}

function Strip-Bom($text) {
  if (-not $text) { return $text }
  return $text.Trim().Trim([char]0xFEFF).Trim('"').Trim("'")
}

function Get-EnvValue($key) {
  $line = Get-Content ".env" | Where-Object { $_ -match "^\s*$key\s*=" } | Select-Object -First 1
  if (-not $line) { return $null }
  $v = $line -replace "^\s*$key\s*=\s*", ""
  return Strip-Bom $v
}

function Get-ProdDbUrl() {
  if (Test-Path ".env.prod") {
    $line = Get-Content ".env.prod" | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
    if ($line) {
      return Strip-Bom ($line -replace '^\s*DATABASE_URL\s*=\s*', '')
    }
  }
  return Get-EnvValue "DATABASE_URL"
}

$dbUrl = Get-ProdDbUrl
if (-not $dbUrl) {
  Write-Host "DATABASE_URL 없음 — Vercel 배포만 진행 (상품 JSON 폴백)"
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
  $value = Strip-Bom $value
  $tmp = Join-Path $env:TEMP "vercel-env-$name.txt"
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($tmp, $value, $utf8NoBom)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  Get-Content -Path $tmp -Raw -Encoding UTF8 | npx vercel@latest env add $name production --force 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  Write-Host "  env: $name"
}

Write-Host "Vercel 프로젝트 연결 (susanfather-shop)..."
Write-Host "  >> 30초~1분 정도 걸릴 수 있습니다. 창을 닫지 마세요."
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npx vercel@latest link --yes --project susanfather-shop 2>&1 | ForEach-Object { Write-Host "  $_" }
$ErrorActionPreference = $prevEAP
Write-Host "  >> 연결 완료"

Write-Host "환경 변수 업로드 중..."
if ($dbUrl) { Set-VercelEnv "DATABASE_URL" $dbUrl }
Set-VercelEnv "JWT_SECRET" $jwt
Set-VercelEnv "NEXT_PUBLIC_SITE_URL" $prodUrl
Set-VercelEnv "SITE_URL" $prodUrl
Set-VercelEnv "SITE_NAME" "Susan Father"
Write-Host "  >> 환경 변수 완료"

$kakao = Get-EnvValue "KAKAO_REST_API_KEY"
if ($kakao) {
  Set-VercelEnv "KAKAO_REST_API_KEY" $kakao
  Set-VercelEnv "KAKAO_REDIRECT_URI" "$prodUrl/api/auth/kakao/callback"
}

if ($dbUrl) {
  Write-Host "DB 스키마 + 시드 (로컬, 실패해도 배포는 계속)..."
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  npx prisma db push 2>&1
  if ($LASTEXITCODE -eq 0) { npm run db:seed 2>&1 }
  else { Write-Host "  로컬 DB 연결 실패 — Vercel Storage 연결 후 npm run db:setup 실행" }
  $ErrorActionPreference = $prevEAP
}

Write-Host "Vercel 배포 중 (2~5분)..."
Write-Host "  >> 빌드 로그가 아래에 표시됩니다."
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npx vercel@latest deploy --prod --yes
$deployOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEAP
if (-not $deployOk) { exit 1 }

Write-Host ""
Write-Host "완료: https://susanfather.com"
Write-Host "DNS (이미 설정했다면 생략): A @ -> 76.76.21.21"
