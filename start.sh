#!/bin/bash

echo "========================================"
echo "  LogiTask - Start Script (Linux)"
echo "========================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "[1/4] Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend npm install failed!"
    exit 1
fi

echo ""
echo "[2/4] Running Prisma migrations..."
cd "$PROJECT_DIR/backend"
export DATABASE_URL="file:./dev.db"
npx prisma migrate dev

echo ""
echo "[3/4] Seeding database..."
cd "$PROJECT_DIR/backend"
npm run prisma:seed

echo ""
echo "[4/4] Starting Backend server..."
echo "Backend will run on http://localhost:4000"
echo "Open a new terminal for Frontend"
npm run start:dev &
BACKEND_PID=$!

echo ""
echo "========================================"
echo "Installing Frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install

echo ""
echo "========================================"
echo "Starting Frontend server..."
echo "Frontend will run on http://localhost:3000"
echo "========================================"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Servers should be starting..."
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait