#!/bin/sh
# Run before each commit: stamps a new version so open apps (admin and golfer phones) update themselves.
cd "$(dirname "$0")/.." || exit 1
V=$(date +%Y%m%d%H%M%S)
printf '%s\n' "$V" > version.txt
sed -i '' "s/window.APP_VERSION='[0-9]*'/window.APP_VERSION='$V'/" admin.html index.html
echo "version $V"
