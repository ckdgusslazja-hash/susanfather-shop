# Susan Father → GitHub (셀러비온과 동일)
# Usage: .\scripts\push-github.ps1
# GitHub에서 빈 저장소 susanfather-shop 만든 뒤 실행하거나, 없으면 웹에서 New repository 생성

param(
  [string]$RepoUrl = "https://github.com/ckdgusslazja-hash/susanfather-shop.git"
)

$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

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
  if (-not $env:GIT_AUTHOR_NAME) {
    $env:GIT_AUTHOR_NAME = "ckdgusslazja-hash"
    $env:GIT_AUTHOR_EMAIL = "ckdgusslazja-hash@users.noreply.github.com"
    $env:GIT_COMMITTER_NAME = $env:GIT_AUTHOR_NAME
    $env:GIT_COMMITTER_EMAIL = $env:GIT_AUTHOR_EMAIL
  }
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

Write-Host "원격 확인: $RepoUrl"
& $git ls-remote origin 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "GitHub 저장소가 아직 없습니다."
  Start-Process "https://github.com/new?name=susanfather-shop&description=susanfather.com"
  Write-Host "브라우저에서 Create repository 후 다시 배포하기를 실행하세요."
  exit 1
}

Write-Host "푸시: $RepoUrl"
& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "GitHub 푸시 완료."
  Write-Host "도메인: https://susanfather.com"
  exit 0
}

Write-Host ""
Write-Host "푸시 실패 — GitHub 로그인/저장소 이름을 확인하세요."
exit 1
