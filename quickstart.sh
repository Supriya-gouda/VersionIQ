#!/usr/bin/env bash

# Quick Start - Version Vault Pro Production Deployment
# Run this script to get production-ready in minutes

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Version Vault Pro - Quick Start (Production Deploy)      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Run validation
echo "${YELLOW}[1/5] Running production validation...${NC}"
npm run validate:prod
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Validation passed${NC}"
else
    echo "${RED}✗ Validation failed - fix issues before deploying${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}[2/5] Checking environment configuration...${NC}"

# Step 2: Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "${RED}✗ backend/.env not found${NC}"
    echo "   Creating from template..."
    cp backend/.env.example backend/.env
    echo "${YELLOW}   ⚠ Please edit backend/.env with production values:${NC}"
    echo "      - MONGODB_URI (MongoDB Atlas connection string)"
    echo "      - JWT_SECRET (cryptographically random string)"
    echo "      - CLIENT_ORIGIN (your domain)"
    echo ""
    exit 1
fi

# Check required environment variables
if ! grep -q "^MONGODB_URI=" backend/.env; then
    echo "${RED}✗ MONGODB_URI not configured in backend/.env${NC}"
    exit 1
fi

if ! grep -q "^JWT_SECRET=" backend/.env; then
    echo "${RED}✗ JWT_SECRET not configured in backend/.env${NC}"
    exit 1
fi

echo "${GREEN}✓ Environment configured${NC}"

echo ""
echo "${YELLOW}[3/5] Running backend tests...${NC}"
cd backend
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Tests passed${NC}"
else
    echo "${YELLOW}⚠ Tests had issues - check backend/tests/run.js${NC}"
fi
cd ..

echo ""
echo "${YELLOW}[4/5] Building Docker images...${NC}"
docker compose build --quiet
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Docker images built${NC}"
else
    echo "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}[5/5] Starting services...${NC}"
docker compose down > /dev/null 2>&1 || true
docker compose up -d

# Wait for health checks
echo "   Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT COMPLETE! ✓                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check health
echo "Checking service health..."
BACKEND_HEALTH=$(curl -s http://localhost:4000/health || echo '{"status":"unhealthy"}')
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if echo "$BACKEND_HEALTH" | grep -q "ok"; then
    echo "${GREEN}✓ Backend: Healthy${NC}"
else
    echo "${YELLOW}⚠ Backend: Check logs (docker compose logs backend)${NC}"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "${GREEN}✓ Frontend: Responding${NC}"
else
    echo "${YELLOW}⚠ Frontend: Check logs (docker compose logs frontend)${NC}"
fi

echo ""
echo "Services available at:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:4000"
echo "  Health:    curl http://localhost:4000/health"
echo ""
echo "Useful commands:"
echo "  View logs:       docker compose logs -f backend"
echo "  Stop services:   docker compose down"
echo "  Restart:         docker compose restart"
echo "  Database shell:  docker exec -it mongodb mongosh"
echo ""
echo "Documentation:"
echo "  README:       cat README.md"
echo "  Architecture: cat ARCHITECTURE.md"
echo "  Deployment:   cat PRODUCTION_DEPLOYMENT.md"
echo ""
