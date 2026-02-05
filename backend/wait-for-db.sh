#!/bin/sh
set -e

python - <<'PY'
import asyncio
import os
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def main() -> None:
  database_url = os.environ.get("DATABASE_URL")
  if not database_url:
    print("DATABASE_URL is not set", file=sys.stderr)
    sys.exit(1)

  engine = create_async_engine(database_url, pool_pre_ping=True)
  for _ in range(30):
    try:
      async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
      await engine.dispose()
      return
    except Exception:
      print("Waiting for database...")
      await asyncio.sleep(2)

  await engine.dispose()
  sys.exit(1)

asyncio.run(main())
PY

exec "$@"
