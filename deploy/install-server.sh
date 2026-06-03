#!/bin/bash
# Ubuntu 서버 최초 1회 (root 또는 sudo)
set -e
apt update
apt install -y nginx certbot python3-certbot-nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
echo "Node $(node -v) / PM2 설치 완료"
echo "다음: 프로젝트를 /var/www/susanfather 에 올리고 deploy/DEPLOY.md 3~5단계 진행"
