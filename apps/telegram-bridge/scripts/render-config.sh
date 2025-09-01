#!/bin/sh
set -euo pipefail

TEMPLATE="/opt/telegram-bridge/templates/config.template.yaml"
OUT="/data/config.yaml"

# Inputs (can be empty if ALLOW_EMPTY=1)
: "${HOMESERVER_ADDRESS:=}"
: "${MATRIX_DOMAIN:=}"
: "${APPSERVICE_ADDRESS:=}"
: "${HS_TOKEN:=}"
: "${AS_TOKEN:=}"
: "${BOT_USERNAME:=telegrambot}"

# Behavior flags
: "${RENDER_CONFIG:=}"
: "${ALLOW_EMPTY:=0}"
: "${BACKUP_CONFIG:=1}"

err() { echo "[render-config] $*" 1>&2; }

replace() {
  key="$1"; val="$2"
  if [ -z "$val" ] && [ "$ALLOW_EMPTY" != "1" ]; then
    err "Missing $key. Set env or ALLOW_EMPTY=1."
    exit 1
  fi
  # Escape chars for sed replacement
  esc=$(printf '%s' "$val" | sed -e 's/[\\/&]/\\&/g')
  sed -i "s|__${key}__|${esc}|g" "$OUT"
}

if [ ! -f "$TEMPLATE" ]; then
  err "Template not found at $TEMPLATE"
  exit 1
fi

if [ ! -f "$OUT" ] || [ "${RENDER_CONFIG}" = "1" ]; then
  if [ -f "$OUT" ] && [ "$BACKUP_CONFIG" = "1" ]; then
    cp "$OUT" "/data/config.yaml.bak.$(date +%s)"
    err "Backed up existing config.yaml"
  fi
  cp "$TEMPLATE" "$OUT"
  replace HOMESERVER_ADDRESS "$HOMESERVER_ADDRESS"
  replace MATRIX_DOMAIN "$MATRIX_DOMAIN"
  replace APPSERVICE_ADDRESS "$APPSERVICE_ADDRESS"
  replace HS_TOKEN "$HS_TOKEN"
  replace AS_TOKEN "$AS_TOKEN"
  replace BOT_USERNAME "$BOT_USERNAME"
  err "Rendered $OUT from env"
else
  err "Using existing $OUT (set RENDER_CONFIG=1 to regenerate)"
fi

