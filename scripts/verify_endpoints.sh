#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost}
EMAIL=${2:-admin@hospital.com}
PASSWORD=${3:-Test@123}

echo "Checking health..."
curl -fsS "$BASE_URL/health" | cat

echo "Requesting token..."
TOKEN=$(curl -fsS -X POST "$BASE_URL/api/v1/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD" \
  | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

echo "Token received"

echo "Fetching current user..."
curl -fsS "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" | cat

echo "Done"
