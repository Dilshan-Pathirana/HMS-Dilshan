#!/usr/bin/env bash
set -euo pipefail

DB_PASS=$(awk -F= '/POSTGRES_PASSWORD/{print $2}' /var/www/hms/password_db.txt)

sudo -u postgres psql -v ON_ERROR_STOP=1 -d postgres -c "ALTER USER hms WITH PASSWORD '${DB_PASS}';"

# Ensure DB exists
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'hms_db'" | grep -q 1; then
  sudo -u postgres createdb -O hms hms_db
fi

echo "DB user password synced"
