# Susan Father → GitHub (셀러비온과 동일)
# Usage: .\scripts\push-github.ps1
# GitHub에서 빈 저장소 susanfather-shop 만든 뒤 실행하거나, 없으면 웹에서 New repository 생성

param(
  [string]$RepoUrl = "https://github.com/ckdgusslazja-hash/susanfather-shop.git"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$git = $null
foreach ($p in @("git", "${env:ProgramFiles}\Git\bin\git.exe")) {
  if (Get-Command $p -ErrorAction SilentlyContinue) {
    $git = (Get-Command $p).Source
    break
  }
}

if (-not $git) {
  Write-Host "Git 설치 필요: https://git-scm.com/download/win"
  exit 1
}

Write-Host "폴더: $root"

if (-not (Test-Path ".git")) {
  & $git init
}

& $git add .
$status = & $git status --porcelain
if ($status) {
  & $git commit -m "susanfather.com Vercel 배포"
} else {
  Write-Host "커밋할 변경 없음"
}

& $git branch -M main 2>$null

$remotes = & $git remote 2>$null
if ($remotes -match "origin") {
  & $git remote set-url origin $RepoUrl
} else {
  & $git remote add origin $RepoUrl
}

Write-Host "푸시: $RepoUrl"
& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "완료. Vercel: https://vercel.com/new → 저장소 Import"
  Write-Host "도메인: https://susanfather.com"
} else {
  Write-Host ""
  Write-Host "푸시 실패 시:"
  Write-Host "1. https://github.com/new → 이름 susanfather-shop → Create"
  Write-Host "2. 다시 이 스크립트 실행"
}
