# Couple Cards + Dares

A gamified couples app where partners propose dares/cards to each other, earn credits by completing them, and build intimacy through playful challenges.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Launch with SQLite (Recommended for simplicity)

```bash
# Start the app
docker compose -f docker-compose.sqlite.yml up -d

# Run database migrations
docker compose -f docker-compose.sqlite.yml --profile migrate up migrate

# Seed initial cards and users
docker compose -f docker-compose.sqlite.yml --profile seed up seed
```

### Launch with MySQL

```bash
# Start the app with MySQL
docker compose --profile mysql up -d

# Wait for MySQL to be healthy, then run migrations
docker compose --profile migrate up migrate

# Seed initial cards and users
docker compose --profile seed up seed
```

### Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Default Login

Both users have the default PIN: `1234`

## Services

| Service  | Port | Description |
|----------|------|-------------|
| frontend | 3000 | React web interface |
| backend  | 8000 | FastAPI REST API |
| mysql    | 3306 | MySQL database (optional) |

## Common Commands

```bash
# View logs
docker compose -f docker-compose.sqlite.yml logs -f

# Stop the app
docker compose -f docker-compose.sqlite.yml down

# Rebuild after code changes
docker compose -f docker-compose.sqlite.yml up -d --build

# Reset database (removes all data)
docker compose -f docker-compose.sqlite.yml down -v
```

## Configuration

Environment variables can be set in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| DB_TYPE | sqlite | Database type: `sqlite` or `mysql` |
| SQLITE_PATH | /data/couple_cards.db | SQLite database path |
| MYSQL_HOST | mysql | MySQL host |
| MYSQL_PORT | 3306 | MySQL port |
| MYSQL_USER | couple_cards | MySQL username |
| MYSQL_PASSWORD | couple_cards_secret | MySQL password |
| MYSQL_DATABASE | couple_cards | MySQL database name |

## Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

### Version Format

```
vMAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible API changes or breaking database schema changes
- **MINOR**: New features added in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

### Release History

#### v1.0.0 (2025-12-22)

First stable release with core MVP features:

- Card library with browse and add functionality
- Like/dislike voting per card
- Period management (week/month/two-month cycles)
- Weekly proposal system with credit economy
- Dare responses: yes / maybe later / not at all
- Completion confirmation workflow
- Credit balance and ledger tracking
- User authentication with PIN

### Creating a New Release

```bash
# Create an annotated tag
git tag -a vX.Y.Z -m "vX.Y.Z - Brief description"

# Push the tag
git push origin vX.Y.Z
```
