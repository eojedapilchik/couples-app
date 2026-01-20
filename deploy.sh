#!/bin/sh
set -eu pipefail

APP_DIR="${DEPLOY_APP_DIR:-~/apps/couples-app/}"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.yml}"

cd "$APP_DIR"
git pull
docker compose -f "$COMPOSE_FILE" --profile mysql up -d --build
docker compose -f "$COMPOSE_FILE" --profile migrate up --build migrate
