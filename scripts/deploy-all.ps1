# 셀러비온처럼 한 번에: GitHub 푸시 + Vercel 배포
# Usage: .\scripts\deploy-all.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path

if (-not (Test-Path ".env")) {
  Write-Host ".env 없음 → setup-env 실행"
  & "$PSScriptRoot\setup-env.ps1"
  if (-not (Test-Path ".env")) { exit 1 }
  $db = Get-Content ".env" | Where-Object { $_ -match "^DATABASE_URL=postgresql" }
  if (-not $db) {
    Write-Host "DATABASE_URL 을 .env 에 넣은 뒤 다시 deploy-all 실행"
    exit 1
  }
}

Write-Host "=== 1/3 npm install ==="
npm install

Write-Host "=== 2/3 GitHub push ==="
& "$PSScriptRoot\push-github.ps1"
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub 푸시는 건너뛰고 Vercel CLI 배포만 진행합니다."
}

Write-Host "=== 3/3 Vercel deploy ==="
& "$PSScriptRoot\vercel-deploy-auto.ps1"
