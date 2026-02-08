@echo off
setlocal
REM Local dev down

IF NOT EXIST .env.local (
  echo Missing .env.local
  exit /b 1
)

if "%DB_PORT%"=="" set DB_PORT=3306

docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml down
