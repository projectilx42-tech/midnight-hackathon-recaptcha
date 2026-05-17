#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Resolve project root ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Source nvm if available ──────────────────────────────────────────────────
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

# ─── Dependency checks ───────────────────────────────────────────────────────
echo -e "${BOLD}Checking dependencies...${NC}\n"

check_command() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" &> /dev/null; then
    echo -e "  ${RED}✗ $cmd not found${NC}"
    echo -e "    ${hint}"
    return 1
  fi
  echo -e "  ${GREEN}✓${NC} $cmd"
  return 0
}

MISSING=0

check_command docker \
  "Install: https://docs.docker.com/engine/install/ubuntu/" || MISSING=1

if ! docker compose version &> /dev/null 2>&1; then
  echo -e "  ${RED}✗ docker compose plugin not found${NC}"
  echo -e "    Install: sudo apt-get install -y docker-compose-plugin"
  MISSING=1
else
  echo -e "  ${GREEN}✓${NC} docker compose"
fi

# Verify docker actually works (permissions)
if ! docker ps &> /dev/null 2>&1; then
  echo -e "  ${RED}✗ Cannot connect to Docker daemon${NC}"
  echo -e "    Fix: sudo usermod -aG docker \$USER && newgrp docker"
  echo -e "    Then log out and back in, or run: newgrp docker"
  MISSING=1
fi

check_command node \
  "Install: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && nvm install 22" || MISSING=1

if command -v node &> /dev/null; then
  NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
  if [ "$NODE_MAJOR" -lt 22 ]; then
    echo -e "  ${RED}✗ Node.js 22+ required (found $(node -v))${NC}"
    echo -e "    Fix: nvm install 22 && nvm use 22"
    MISSING=1
  fi
fi

check_command python3 \
  "Install: sudo apt-get install -y python3" || MISSING=1

check_command curl \
  "Install: sudo apt-get install -y curl" || MISSING=1

if [ "$MISSING" -eq 1 ]; then
  echo -e "\n${RED}${BOLD}Missing dependencies. Install them and try again.${NC}"
  exit 1
fi

echo -e "\n${GREEN}${BOLD}All dependencies OK.${NC}\n"

# ─── Process management ───────────────────────────────────────────────────────
PIDS=()

cleanup() {
  echo -e "\n\n${YELLOW}${BOLD}Shutting down...${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo -e "${CYAN}Stopping Docker stack...${NC}"
  docker compose -f "$SCRIPT_DIR/bridge-server/standalone.yml" down 2>/dev/null || true
  echo -e "${GREEN}${BOLD}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ─── Helper: prefixed output ─────────────────────────────────────────────────
run_prefixed() {
  local label="$1"
  local color="$2"
  shift 2
  stdbuf -oL "$@" 2>&1 | while IFS= read -r line; do
    printf "${color}[%s]${NC} %s\n" "$label" "$line"
  done &
  PIDS+=($!)
}

# ─── Helper: wait for URL ────────────────────────────────────────────────────
wait_for_url() {
  local url="$1"
  local name="$2"
  local timeout="${3:-120}"
  local elapsed=0

  printf "  Waiting for ${BOLD}%s${NC}" "$name"
  while ! curl -sf "$url" > /dev/null 2>&1; do
    if [ $elapsed -ge $timeout ]; then
      printf "\n"
      echo -e "  ${RED}✗ $name did not become ready within ${timeout}s${NC}"
      cleanup
      exit 1
    fi
    printf "."
    sleep 3
    elapsed=$((elapsed + 3))
  done
  printf " ${GREEN}ready!${NC}\n"
}

# ─── Step 1: Docker stack ─────────────────────────────────────────────────────
echo -e "${BOLD}Starting HumanProof...${NC}\n"
echo -e "${BLUE}[1/4]${NC} Starting Docker stack (Midnight node + indexer + proof server)..."

run_prefixed "DOCKER" "$BLUE" docker compose -f "$SCRIPT_DIR/bridge-server/standalone.yml" up

# Wait for node and indexer to be healthy
wait_for_url "http://localhost:9944/health" "Midnight node" 120
wait_for_url "http://localhost:8088/api/v3/graphql" "Indexer" 120

echo ""

# ─── Step 2: Bridge server ────────────────────────────────────────────────────
echo -e "${MAGENTA}[2/4]${NC} Starting Bridge server..."

(cd "$SCRIPT_DIR/bridge-server" && stdbuf -oL npx tsx src/server.ts 2>&1 | while IFS= read -r line; do
  printf "${MAGENTA}[BRIDGE]${NC} %s\n" "$line"
done) &
PIDS+=($!)

wait_for_url "http://localhost:3000/health" "Bridge server" 180

echo ""

# ─── Step 3: Demo site ────────────────────────────────────────────────────────
echo -e "${CYAN}[3/4]${NC} Starting Demo site (port 8080)..."

run_prefixed "DEMO" "$CYAN" python3 -m http.server 8080 --directory "$SCRIPT_DIR/demo-site"

echo ""

# ─── Step 4: Next.js site ─────────────────────────────────────────────────────
echo -e "${GREEN}[4/4]${NC} Starting Human Proof site (port 3001)..."

(cd "$SCRIPT_DIR/human-proof-site" && stdbuf -oL npx next dev --port 3001 2>&1 | while IFS= read -r line; do
  printf "${GREEN}[NEXTJS]${NC} %s\n" "$line"
done) &
PIDS+=($!)

sleep 3

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  All services running!${NC}"
echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Demo site:          ${BOLD}http://localhost:8080${NC}"
echo -e "  Landing page:       ${BOLD}http://localhost:3001${NC}"
echo -e "  Bridge server:      ${BOLD}http://localhost:3000/health${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# ─── Wait ─────────────────────────────────────────────────────────────────────
wait
