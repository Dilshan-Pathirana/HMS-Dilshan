docker-compose exec backend poetry run alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend poetry run alembic upgrade heads
