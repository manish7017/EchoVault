#!/usr/bin/env bash

# EchoVault — Single Command Unified Launcher
# Launches Ollama, FastAPI Backend, and Next.js Frontend

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# ANSI Colors
GOLD='\033[38;2;214;166;92m'
GREEN='\033[38;2;126;139;104m'
IVORY='\033[38;2;232;224;210m'
GRAY='\033[38;2;158;152;142m'
RESET='\033[0m'

echo -e "${GOLD}"
echo "  ███████╗ ██████╗██╗  ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗"
echo "  ██╔════╝██╔════╝██║  ██║██╔═══██╗██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝"
echo "  █████╗  ██║     ███████║██║   ██║██║   ██║███████║██║   ██║██║     ██║   "
echo "  ██╔══╝  ██║     ██╔══██║██║   ██║╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   "
echo "  ███████╗╚██████╗██║  ██║╚██████╔╝ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   "
echo "  ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   "
echo -e "${RESET}"
echo -e "${IVORY}  \"Some memories never leave. They just wait to be remembered.\"${RESET}"
echo -e "${GRAY}  Hacktoberfest Open-Source AI Challenge — Week 4: Ghost in the Machine${RESET}\n"

# Cleanup on exit
cleanup() {
    echo -e "\n${GOLD}[EchoVault] Shutting down services cleanly...${RESET}"
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    # Also release ports if still bound
    fuser -k 8000/tcp 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
    echo -e "${GREEN}[EchoVault] All services stopped.${RESET}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Check or start Ollama
echo -e "${GRAY}[1/4] Checking Ollama local AI server...${RESET}"
if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Ollama is online on port 11434.${RESET}"
else
    echo -e "${GOLD}  Starting Ollama background daemon...${RESET}"
    ollama serve >/dev/null 2>&1 &
    sleep 2
    if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Ollama started successfully.${RESET}"
    else
        echo -e "${GRAY}  Note: Could not start Ollama automatically. Ensure 'ollama serve' is running for AI features.${RESET}"
    fi
fi

# 2. Check Backend Environment
echo -e "${GRAY}[2/4] Initializing Python backend...${RESET}"
if [ ! -d "backend/venv" ]; then
    echo -e "${GOLD}  Creating Python virtual environment in backend/venv...${RESET}"
    python3 -m venv backend/venv
    backend/venv/bin/pip install --upgrade pip
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# Release port 8000 if in use
fuser -k 8000/tcp 2>/dev/null || true

# Start FastAPI backend
cd "$DIR/backend"
PYTHONPATH=. ./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$DIR"

# Wait for backend health
echo -ne "${GRAY}  Waiting for backend API on port 8000...${RESET}"
for i in {1..20}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✓ Ready!${RESET}"
        break
    fi
    sleep 0.5
done

# 3. Check Frontend Environment
echo -e "${GRAY}[3/4] Preparing Next.js frontend...${RESET}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${GOLD}  Installing frontend npm dependencies...${RESET}"
    npm --prefix frontend install
fi

# Check if production build exists; if not, build it
if [ ! -d "frontend/.next" ]; then
    echo -e "${GOLD}  Building production Next.js assets...${RESET}"
    npm --prefix frontend run build
fi

# Release port 3000 if in use
fuser -k 3000/tcp 2>/dev/null || true

# Start Next.js frontend
echo -e "${GRAY}[4/4] Starting frontend server on port 3000...${RESET}"
cd "$DIR/frontend"
npm run start -- -p 3000 > "$DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$DIR"

# Wait for frontend
for i in {1..20}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

# Display Active Access Banner
echo -e "\n${GOLD}========================================================================${RESET}"
echo -e "${GREEN}  ✓ EchoVault is fully operational!${RESET}"
echo -e "${GOLD}========================================================================${RESET}"
echo -e "  ${IVORY}Frontend Web UI :${RESET}  ${GOLD}http://localhost:3000${RESET}"
echo -e "  ${IVORY}Backend API     :${RESET}  ${GOLD}http://localhost:8000${RESET}"
echo -e "  ${IVORY}Interactive Docs:${RESET}  ${GOLD}http://localhost:8000/docs${RESET}"
echo -e "  ${IVORY}Local AI Engine :${RESET}  ${GOLD}http://127.0.0.1:11434${RESET}"
echo -e "${GOLD}========================================================================${RESET}"
echo -e "  ${GRAY}Press [Ctrl+C] at any time to gracefully shut down all services.${RESET}\n"

# Wait on processes
wait "$BACKEND_PID" "$FRONTEND_PID"
