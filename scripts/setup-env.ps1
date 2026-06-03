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
Write-Host "1. https://neon.tech 가입 → New Project → Connection string 복사"
Write-Host "2. .env 를 열어 DATABASE_URL= 뒤에 붙여넣기"
Write-Host "3. 저장 후: npm run deploy-all"
Write-Host ""
notepad .env
