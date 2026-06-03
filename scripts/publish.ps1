# 수정 후 자동 반영: Git commit + GitHub push (Vercel GitHub 연동으로 자동 배포)
# Usage: .\scripts\publish.ps1 -Message "수정 내용 요약"

param(
  [Parameter(Mandatory = $false)]
  [string]$Message = "update"
)

$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path

if (-not $env:GIT_AUTHOR_NAME) {
  $env:GIT_AUTHOR_NAME = "ckdgusslazja-hash"
  $env:GIT_AUTHOR_EMAIL = "ckdgusslazja-hash@users.noreply.github.com"
  $env:GIT_COMMITTER_NAME = $env:GIT_AUTHOR_NAME
  $env:GIT_COMMITTER_EMAIL = $env:GIT_AUTHOR_EMAIL
}

Write-Host "=== publish: $Message ==="

& git add -A
$status = & git status --porcelain
if (-not $status) {
  Write-Host "변경 파일 없음 — push/배포 생략"
  exit 0
}

& git commit -m $Message
& git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub push 실패"
  exit 1
}

Write-Host ""
Write-Host "GitHub push 완료 → Vercel 자동 배포 시작 (1~3분)"
Write-Host "사이트: https://susanfather.com"
