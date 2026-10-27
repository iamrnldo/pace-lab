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

wait_for_api() {
  local body=""
  for attempt in $(seq 1 30); do
    if body="$(curl -fsS --max-time 3 "$API_HEALTH_URL" 2>/dev/null)"; then
      printf '%s\n' "$body"
      return 0
    fi
    printf '\r[PaceLab] Menunggu API siap... %s/30' "$attempt"
    sleep 1
  done

  printf '\n[PaceLab] API tidak siap setelah 30 detik. PM2 log terakhir:\n' >&2
  pm2 logs "$API_PROCESS" --lines 50 --nostream || true
  return 1
}

wait_for_web() {
  local status=""
  for attempt in $(seq 1 30); do
    status="$(curl -sS --max-time 3 -o /dev/null -w '%{http_code}' "$WEB_LOGIN_URL" 2>/dev/null || true)"
    if [[ "$status" == "200" || "$status" == "301" || "$status" == "302" ]]; then
      printf 'HTTP %s\n' "$status"
      return 0
    fi
    printf '\r[PaceLab] Menunggu frontend siap... %s/30' "$attempt"
    sleep 1
  done

  printf '\n[PaceLab] Frontend tidak siap setelah 30 detik (HTTP %s).\n' "${status:-000}" >&2
  pm2 logs "$WEB_PROCESS" --lines 50 --nostream || true
  return 1
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

log "Memeriksa API health (maksimal 30 detik)"
wait_for_api

log "Install dependency, test, build, dan restart frontend"
cd "$PACELAB_DIR/frontend"
npm ci
npm test
npm run build
pm2 restart "$WEB_PROCESS"

log "Memeriksa halaman login (maksimal 30 detik)"
wait_for_web

log "Update PaceLab selesai"
