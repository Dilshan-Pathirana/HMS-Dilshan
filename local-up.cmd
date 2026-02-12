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

echo Running schema compatibility migration...
docker compose --env-file .env.local -f docker-compose.yml exec -T db sh -lc "mysql -u\"$MYSQL_USER\" -p\"$MYSQL_PASSWORD\" \"$MYSQL_DATABASE\"" < aws_migration.sql
if errorlevel 1 (
  echo Failed to run aws_migration.sql on local DB
  exit /b 1
)

echo Local schema migration complete.
