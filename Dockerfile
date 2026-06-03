FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV SITE_URL=https://susanfather.com
ENV DB_PATH=/app/data/shop.db

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh", "-c", "node server/seed.js 2>/dev/null || true; node server/index.js"]
