# .env 자동 준비 (Neon DB URL만 붙여넣으면 됨)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (Test-Path ".env") {
  Write-Host ".env 이미 있습니다."
  exit 0
}

Copy-Item ".env.example" ".env"

$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwt = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
(Get-Content ".env") -replace "JWT_SECRET=.*", "JWT_SECRET=$jwt" | Set-Content ".env"

Write-Host ""
Write-Host "=== .env 파일 생성됨 ==="
Write-Host ""
Write-Host "DATABASE_URL 은 아래 중 하나만 하면 됩니다 (Neon 필수 아님):"
Write-Host "  A) vercel.com → 프로젝트 → Storage → Postgres 생성 후 연결 문자열 복사"
Write-Host "  B) 또는 neon.tech 에서 무료 DB (선택)"
Write-Host ""
Write-Host "1. .env 에 DATABASE_URL= 붙여넣기"
Write-Host "2. 저장 후: npm run deploy-all"
Write-Host ""
notepad .env
