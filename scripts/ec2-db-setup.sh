#!/usr/bin/env bash
set -euo pipefail

DB_PASS=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)

printf "POSTGRES_PASSWORD=%s\nHMS_DB_USER=hms\nHMS_DB_NAME=hms_db\n" "$DB_PASS" | sudo tee /var/www/hms/password_db.txt > /dev/null
sudo chmod 600 /var/www/hms/password_db.txt
sudo chown ubuntu:ubuntu /var/www/hms/password_db.txt

sudo -u postgres psql -v ON_ERROR_STOP=1 -d postgres -c "ALTER USER postgres WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hms') THEN CREATE ROLE hms LOGIN PASSWORD '${DB_PASS}'; END IF; END \$\$;"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'hms_db'" | grep -q 1; then
	sudo -u postgres createdb -O hms hms_db
fi

printf "DATABASE_URL=postgresql+asyncpg://hms:%s@127.0.0.1:5432/hms_db\nSECRET_KEY=%s\n" "$DB_PASS" "$SECRET_KEY" | sudo tee /var/www/hms/backend/.env > /dev/null
sudo chown ubuntu:www-data /var/www/hms/backend/.env
sudo chmod 640 /var/www/hms/backend/.env

echo "DB setup complete"
