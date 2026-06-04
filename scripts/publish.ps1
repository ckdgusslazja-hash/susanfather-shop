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
Write-Host "Vercel 프로덕션 배포 중 (2~5분)..."
$env:Path = "${env:ProgramFiles}\Git\bin;${env:ProgramFiles}\nodejs;" + $env:Path
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npx vercel@latest deploy --prod --yes 2>&1 | ForEach-Object { Write-Host "  $_" }
$deployOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEAP
if (-not $deployOk) {
  Write-Host "Vercel 배포 실패 — npm run deploy 로 재시도하세요."
  exit 1
}

Write-Host ""
Write-Host "배포 완료: https://susanfather.com"
