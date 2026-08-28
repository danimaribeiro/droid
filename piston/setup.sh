#!/bin/sh
set -e

PISTON_URL="${PISTON_URL:-http://localhost:2000}"

echo "Waiting for Piston API..."
until curl -sf "$PISTON_URL/api/v2/runtimes" > /dev/null 2>&1; do
  sleep 1
done
echo "Piston API is up."

installed=$(curl -sf "$PISTON_URL/api/v2/runtimes")

install_if_missing() {
  lang="$1"
  ver="$2"

  if echo "$installed" | grep -q "\"$lang\""; then
    echo "[ok] $lang already installed"
    return
  fi

  echo "[installing] $lang $ver ..."
  curl -sf -X POST "$PISTON_URL/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\":\"$lang\",\"version\":\"$ver\"}" || {
    echo "[error] Failed to install $lang $ver"
    exit 1
  }
  echo ""
  echo "[done] $lang $ver"
}

install_if_missing bash   5.2.0
install_if_missing gcc    10.2.0
install_if_missing python 3.12.0
install_if_missing rust   1.68.2
install_if_missing zig    0.10.1

echo ""
echo "Installed runtimes:"
curl -sf "$PISTON_URL/api/v2/runtimes"
echo ""
echo "Piston setup complete."
