#!/bin/bash

# Couple Cards - Docker Stop Script

echo "Stopping Couple Cards..."
docker compose down

echo ""
echo "Services stopped. Data is preserved in Docker volume."
echo "Run './start.sh' to start again."
