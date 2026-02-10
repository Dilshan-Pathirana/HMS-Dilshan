@echo off
setlocal
REM Local dev up: backend + mysql + frontend (docker)
REM Uses docker-compose.yml and .env.local

IF NOT EXIST .env.local (
  echo Missing .env.local
  echo Create .env.local (or copy .env.local.example to .env.local)
  exit /b 1
)

REM Provide DB_PORT for compose interpolation (if needed)
if "%DB_PORT%"=="" set DB_PORT=3306

docker compose --env-file .env.local -f docker-compose.yml up -d --build
