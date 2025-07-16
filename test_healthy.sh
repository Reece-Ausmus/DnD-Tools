#!/bin/bash
set -e

YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running frontend tests...${NC}"
cd frontend
npm test

cd ..

echo -e "${YELLOW}Running backend tests...${NC}"
cd backend
source venv/bin/activate
pytest tests/
deactivate