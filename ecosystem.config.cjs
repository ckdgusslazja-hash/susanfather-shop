module.exports = {
  apps: [
    {
      name: 'susanfather-shop',
      script: 'server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        SITE_URL: 'https://susanfather.com',
        DB_PATH: './server/data/shop.db',
      },
    },
  ],
};
