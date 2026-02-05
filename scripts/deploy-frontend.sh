#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
FRONTEND_DIR="$ROOT_DIR/frontend"

: "${REMOTE_HOST:?Set REMOTE_HOST to your EC2 public IP or DNS}"
: "${SSH_KEY:?Set SSH_KEY to your SSH private key path}"

REMOTE_USER=${REMOTE_USER:-ubuntu}
REMOTE_PATH=${REMOTE_PATH:-/var/www/hms/frontend/build}
BUILD_CMD=${BUILD_CMD:-"npm ci && npm run build"}

cd "$FRONTEND_DIR"

echo "Building frontend..."
eval "$BUILD_CMD"

echo "Deploying dist/ to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
rsync -az --delete -e "ssh -i ${SSH_KEY}" "${FRONTEND_DIR}/dist/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "Done."
