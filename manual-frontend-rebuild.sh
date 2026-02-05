#!/bin/bash
# Manual deployment fix - rebuild frontend with correct env vars

echo "=== MANUAL FRONTEND REBUILD WITH FIX ==="
echo ""

# Clean build
cd /var/www/hms/current/frontend
rm -rf node_modules dist .vite
echo "✓ Cleaned build artifacts"

# Install dependencies
npm ci --prefer-offline
echo "✓ Installed dependencies"

# Build with correct env var
export VITE_API_BASE_URL=""
npm run build
echo "✓ Built frontend with VITE_API_BASE_URL=\"\""

# Reload nginx
sudo systemctl reload nginx
echo "✓ Reloaded nginx"

echo ""
echo "Frontend rebuilt successfully!"
echo "Check index.html for new bundle reference"
