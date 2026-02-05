#!/bin/bash
# Fix nginx to serve from correct deployment directory

echo "=== Fixing Nginx Configuration ==="
echo ""

echo "Current nginx root:"
sudo grep "root" /etc/nginx/sites-enabled/* | grep -v "#"
echo ""

echo "Updating nginx to serve from deployment directory..."
sudo sed -i 's|root /var/www/hms/frontend/build;|root /var/www/hms/current/frontend/dist;|g' /etc/nginx/sites-enabled/*

echo ""
echo "New nginx root:"
sudo grep "root" /etc/nginx/sites-enabled/* | grep -v "#"
echo ""

echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration valid! Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
    echo ""
    echo "Verifying new files are accessible:"
    ls -la /var/www/hms/current/frontend/dist/assets/*vendor*.js | wc -l
    echo "vendor chunks found (should be 6)"
else
    echo "❌ Configuration test failed! Not reloading nginx."
    exit 1
fi
