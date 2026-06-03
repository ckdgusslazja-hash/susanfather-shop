@echo off

chcp 65001 >nul

title 그린하베스트 쇼핑몰

cd /d "%~dp0"



where node >nul 2>&1

if errorlevel 1 (

  echo Node.js가 필요합니다. https://nodejs.org 에서 설치 후 다시 실행하세요.

  pause

  exit /b 1

)



if not exist node_modules (

  echo 패키지 설치 중...

  call npm install

)



if not exist server\shop.db (

  echo 데이터 시드 중...

  call npm run seed

)



echo 서버 시작: http://localhost:3000

start "" "http://localhost:3000"

node server\index.js

pause

