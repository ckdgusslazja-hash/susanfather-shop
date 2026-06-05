# 셀러비온처럼 한 번에: GitHub 푸시 + Vercel 배포
# Usage: .\scripts\deploy-all.ps1

$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path

if (-not (Test-Path ".env")) {
  Write-Host ".env 없음 → setup-env 실행"
  & "$PSScriptRoot\setup-env.ps1"
  if (-not (Test-Path ".env")) { exit 1 }
  $db = Get-Content ".env" | Where-Object { $_ -match "^DATABASE_URL=postgres" }
  if (-not $db) {
    Write-Host "DATABASE_URL 없음 — 상품 목록만 배포됩니다. 회원/주문은 Vercel Storage 연결 후 가능."
  }
}

Write-Host "=== 1/3 npm install ==="
npm install

Write-Host "=== 2/3 GitHub push (선택) ==="
& "$PSScriptRoot\push-github.ps1"
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "[안내] GitHub 저장소가 없어 푸시를 건너뜁니다. (사이트 배포에는 필수 아님)"
  Write-Host "  1) https://github.com/new 에서 이름 susanfather-shop 으로 빈 저장소 생성"
  Write-Host "  2) 다시 배포하기 실행"
  Write-Host ""
}

Write-Host "=== 3/3 Vercel deploy ==="
& "$PSScriptRoot\vercel-deploy-auto.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "========================================"
Write-Host " 배포 완료: https://susanfather.com"
Write-Host "========================================"
