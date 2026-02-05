#!/bin/bash
# EC2 Deployment Verification Script
# This script checks if the new frontend build with manual chunks is deployed on EC2

echo "=== EC2 Deployment Verification ==="
echo ""

echo "1. Check current release symlink:"
ls -la /var/www/hms/current | grep frontend
echo ""

echo "2. Check if new vendor chunks exist in deployed build:"
ls -1 /var/www/hms/current/frontend/dist/assets/*vendor*.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Vendor chunks found!"
    echo ""
    echo "3. Count vendor chunks (should be 6):"
    CHUNK_COUNT=$(ls -1 /var/www/hms/current/frontend/dist/assets/*vendor*.js 2>/dev/null | wc -l)
    echo "Found $CHUNK_COUNT vendor chunks"
    
    if [ $CHUNK_COUNT -eq 6 ]; then
        echo "✅ All 6 vendor chunks deployed correctly!"
    else
        echo "❌ Expected 6 chunks but found $CHUNK_COUNT"
    fi
else
    echo "❌ No vendor chunks found - old build may still be deployed"
fi
echo ""

echo "4. Check release timestamp:"
RELEASE=$(readlink /var/www/hms/current)
echo "Current release: $RELEASE"
echo ""

echo "5. Check if react-vendor chunk exists:"
if ls /var/www/hms/current/frontend/dist/assets/react-vendor-*.js 1>/dev/null 2>&1; then
    echo "✅ react-vendor chunk exists (new build deployed)"
else
    echo "❌ react-vendor chunk NOT found (old build still active)"
fi
echo ""

echo "6. List all chunks with timestamps:"
ls -lh /var/www/hms/current/frontend/dist/assets/*.js | grep -E "(vendor|index)" | awk '{print $6, $7, $8, $9}'
echo ""

echo "7. Check nginx status:"
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "=== Verification Complete ==="
