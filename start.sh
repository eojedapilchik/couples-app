#!/bin/bash

# Couple Cards - Docker Startup Script

set -e

echo "========================================"
echo "  Couple Cards + Dares - Docker Setup"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start services
echo ""
echo "Building and starting services..."
docker compose up -d --build

# Wait for backend to be ready
echo ""
echo "Waiting for backend to be ready..."
sleep 5

# Check if database needs seeding
if ! docker compose exec backend test -f /data/couple_cards.db 2>/dev/null; then
    echo ""
    echo "Seeding database with users and cards..."
    docker compose run --rm seed
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "========================================"
echo "  App is ready!"
echo "========================================"
echo ""
echo "Access the app:"
echo "  - Local:     http://localhost:3000"
echo "  - LAN:       http://${LOCAL_IP}:3000"
echo ""
echo "API Documentation:"
echo "  - Local:     http://localhost:8000/docs"
echo "  - LAN:       http://${LOCAL_IP}:8000/docs"
echo ""
echo "Default login PIN: 1234"
echo ""
echo "Commands:"
echo "  Stop:        docker compose down"
echo "  Logs:        docker compose logs -f"
echo "  Re-seed:     docker compose run --rm seed"
echo ""
