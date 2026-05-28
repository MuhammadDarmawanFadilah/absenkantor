#!/bin/bash
cd /var/www/ikafk.my.id
pnpm install --no-frozen-lockfile > /tmp/ikafk-install.log 2>&1
echo "EXIT_CODE:$?" >> /tmp/ikafk-install.log
