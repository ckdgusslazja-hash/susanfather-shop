@echo off
chcp 65001 >nul
title Susan Father 배포 (GitHub + Vercel)
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-all.ps1"
pause
