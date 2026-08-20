#!/usr/bin/env bash
# PaceLab VPS updater
# Usage on VPS: update_pacelab

set -Eeuo pipefail

PACELAB_DIR="${PACELAB_DIR:-/root/pacelab}"
API_PROCESS="${API_PROCESS:-pacelab-api}"
WEB_PROCESS="${WEB_PROCESS:-pacelab-web}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:5000/api/v1/health}"
WEB_LOGIN_URL="${WEB_LOGIN_URL:-http://127.0.0.1:3000/login}"

log() {
  printf '\n\033[1;36m[PaceLab]\033[0m %s\n' "$1"
}

fail() {
  printf '\n\033[1;31m[PaceLab] Deploy gagal pada baris %s.\033[0m\n' "$1" >&2
}

trap 'fail "$LINENO"' ERR

if [[ ! -d "$PACELAB_DIR/.git" ]]; then
  echo "Repository tidak ditemukan: $PACELAB_DIR" >&2
  exit 1
fi

command -v git >/dev/null || { echo "git tidak ditemukan" >&2; exit 1; }
command -v npm >/dev/null || { echo "npm tidak ditemukan" >&2; exit 1; }
command -v pm2 >/dev/null || { echo "pm2 tidak ditemukan" >&2; exit 1; }
command -v curl >/dev/null || { echo "curl tidak ditemukan" >&2; exit 1; }

log "Mengambil update repository"
cd "$PACELAB_DIR"
git pull --ff-only

log "Install dependency dan restart API"
cd "$PACELAB_DIR/backend"
npm ci
pm2 restart "$API_PROCESS"

log "Memeriksa API health"
api_health="$(curl -fsS "$API_HEALTH_URL")"
printf '%s\n' "$api_health"

log "Install dependency, test, build, dan restart frontend"
cd "$PACELAB_DIR/frontend"
npm ci
npm test
npm run build
pm2 restart "$WEB_PROCESS"

log "Memeriksa halaman login"
web_status="$(curl -sS -o /dev/null -w '%{http_code}' "$WEB_LOGIN_URL")"
printf 'HTTP %s\n' "$web_status"
if [[ "$web_status" != "200" && "$web_status" != "301" && "$web_status" != "302" ]]; then
  echo "Login health check gagal (HTTP $web_status)" >&2
  exit 1
fi

log "Update PaceLab selesai"
