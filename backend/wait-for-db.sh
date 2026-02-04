#!/bin/sh
# Wait for Postgres to be ready using psql
until PGPASSWORD=secret psql -h db -U hms -d hms_db -c "\q" 2>/dev/null; do
  echo "Waiting for postgres..."
  sleep 2
done
exec "$@"
