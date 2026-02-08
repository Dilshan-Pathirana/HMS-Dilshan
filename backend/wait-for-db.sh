#!/usr/bin/env sh
set -e

echo "Starting database connection check..."

# Get database connection details from DATABASE_URL
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USERNAME:-hms_user}"
DB_PASS="${DB_PASSWORD:-hmspass123}"

echo "Database connection parameters:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"

MAX_TRIES=30
COUNT=0

while [ $COUNT -lt $MAX_TRIES ]; do
  COUNT=$((COUNT + 1))
  echo "Attempt $COUNT/$MAX_TRIES: Checking database connectivity..."

  # Test basic network connectivity first
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "  ✓ Network connection to $DB_HOST:$DB_PORT successful"

    # Now test DB connectivity with SQLAlchemy async engine
    if python - <<'PY'
import asyncio
import os
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("  ✗ DATABASE_URL is not set", file=sys.stderr)
        sys.exit(1)

    try:
        engine = create_async_engine(database_url, pool_pre_ping=True, echo=False)
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
        print("  ✓ Database connection successful!")
    except Exception as e:
        print(f"  ✗ Database connection failed: {e}", file=sys.stderr)
        sys.exit(1)


asyncio.run(main())
PY
    then
      echo "Database is ready! Starting application..."
      exec "$@"
      exit 0
    else
      echo "  ✗ MySQL authentication or query failed"
    fi
  else
    echo "  ✗ Cannot connect to $DB_HOST:$DB_PORT"
  fi

  if [ $COUNT -lt $MAX_TRIES ]; then
    echo "  Waiting 2 seconds before retry..."
    sleep 2
  fi
done

echo "ERROR: Failed to connect to database after $MAX_TRIES attempts"
echo "Please check:"
echo "  1. Database container is running"
echo "  2. DATABASE_URL environment variable is correct"
echo "  3. Network connectivity between containers"
exit 1
