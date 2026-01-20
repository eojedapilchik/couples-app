SHELL := /bin/sh

COMPOSE ?= docker compose
SQLITE_FILE ?= docker-compose.sqlite.yml
MYSQL_FILE ?= docker-compose.yml
PYTHON ?= python3
UV_CACHE_DIR := $(or $(UV_CACHE_DIR),/tmp/uv-cache)
UV_PYTHON ?= 3.12

.PHONY: help init init-mysql up up-mysql down down-mysql logs logs-mysql rebuild rebuild-mysql migrate migrate-mysql migrate-mysql-build seed seed-mysql reset-db reset-db-mysql test-backend deploy

help:
	@echo "Targets:"
	@echo "  init         Start sqlite stack, run migrations, seed data"
	@echo "  init-mysql   Start mysql stack, run migrations, seed data"
	@echo "  up           Start sqlite stack"
	@echo "  up-mysql     Start mysql stack"
	@echo "  down         Stop sqlite stack"
	@echo "  down-mysql   Stop mysql stack"
	@echo "  logs         Tail sqlite logs"
	@echo "  logs-mysql   Tail mysql logs"
	@echo "  rebuild      Rebuild sqlite stack"
	@echo "  rebuild-mysql Rebuild mysql stack"
	@echo "  migrate      Run sqlite migrations"
	@echo "  migrate-mysql Run mysql migrations"
	@echo "  migrate-mysql-build Run mysql migrations with rebuild"
	@echo "  seed         Seed sqlite data"
	@echo "  seed-mysql   Seed mysql data"
	@echo "  reset-db     Drop sqlite volumes"
	@echo "  reset-db-mysql Drop mysql volumes"
	@echo "  test-backend  Run backend tests (pytest)"
	@echo "  deploy        Pull latest, build, and migrate (mysql profile)"

init: up migrate seed

init-mysql: up-mysql migrate-mysql seed-mysql

up:
	$(COMPOSE) -f $(SQLITE_FILE) up -d

up-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile mysql up -d

down:
	$(COMPOSE) -f $(SQLITE_FILE) down

down-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile mysql down

logs:
	$(COMPOSE) -f $(SQLITE_FILE) logs -f

logs-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile mysql logs -f

rebuild:
	$(COMPOSE) -f $(SQLITE_FILE) up -d --build

rebuild-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile mysql up -d --build

migrate:
	$(COMPOSE) -f $(SQLITE_FILE) --profile migrate up migrate

migrate-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile migrate up migrate

migrate-mysql-build:
	$(COMPOSE) -f $(MYSQL_FILE) --profile migrate up --build migrate

seed:
	$(COMPOSE) -f $(SQLITE_FILE) --profile seed up seed

seed-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile seed up seed

reset-db:
	$(COMPOSE) -f $(SQLITE_FILE) down -v

reset-db-mysql:
	$(COMPOSE) -f $(MYSQL_FILE) --profile mysql down -v

test-backend:
	UV_CACHE_DIR=$(UV_CACHE_DIR) uv pip install --python $(UV_PYTHON) -r backend/requirements.txt
	UV_CACHE_DIR=$(UV_CACHE_DIR) uv run --python $(UV_PYTHON) -m pytest backend/tests

deploy:
	ssh ${DEPLOY_HOST:-bastion} "sh ${DEPLOY_APP_DIR:-~/apps/couples-app}/deploy.sh"
