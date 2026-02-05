module.exports = {
  apps: [{
    name: 'hms-backend',
    script: '.venv/bin/uvicorn',
    args: 'app.main:app --host 0.0.0.0 --port 8000',
    cwd: '/var/www/hms/current/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      SECRET_KEY: process.env.SECRET_KEY,
      ALGORITHM: 'HS256',
      ACCESS_TOKEN_EXPIRE_MINUTES: '30'
    },
    error_file: '/var/www/hms/logs/backend-error.log',
    out_file: '/var/www/hms/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
