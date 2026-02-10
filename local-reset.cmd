@echo off
setlocal
REM Local dev reset (DESTROYS local DB volume)

IF NOT EXIST .env.local (
  echo Missing .env.local
  echo Create .env.local (or copy .env.local.example to .env.local)
  exit /b 1
)

if "%DB_PORT%"=="" set DB_PORT=3306

docker compose --env-file .env.local -f docker-compose.yml down -v
