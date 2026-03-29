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
echo "[2/4] Running Prisma setup..."
cd "$PROJECT_DIR/backend"

# Remove old migrations folder completely if exists (for clean SQLite setup)
if [ -d "migrations" ]; then
    echo "Removing old migrations folder..."
    rm -rf migrations
fi

# Recreate migration_lock.toml with sqlite (Prisma needs this)
echo 'provider = "sqlite"' > migration_lock.toml

# Create .env file with default SQLite if not exists
if [ ! -f .env ]; then
    echo "Creating .env file with SQLite configuration..."
    cat > .env << 'EOF'
DATABASE_URL=file:./dev.db
AUTH_MODE=development
NODE_ENV=development
EOF
fi

# Delete existing dev.db for clean setup
if [ -f "dev.db" ]; then
    rm -f dev.db
fi

# Use prisma db push instead of migrate dev (faster for local dev)
export DATABASE_URL="file:./dev.db"
echo "Using DATABASE_URL: $DATABASE_URL"

npx prisma db push --force-reset

echo ""
echo "[3/4] Seeding database..."
cd "$PROJECT_DIR/backend"
export DATABASE_URL="file:./dev.db"
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