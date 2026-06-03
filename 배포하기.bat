@echo off
chcp 65001 >nul
title Susan Father deploy
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $OutputEncoding=[System.Text.Encoding]::UTF8; & '%~dp0scripts\deploy-all.ps1'"
pause
