# HumanProof - Start all services
# Run from Windows PowerShell: .\start.ps1

$PROJECT = "/home/matej/midnight-hackathon-recaptcha"

Write-Host ""
Write-Host "Starting HumanProof..." -ForegroundColor Cyan
Write-Host ""

# Terminal 1: Docker stack
Write-Host "[1/3] Starting Midnight Docker stack..." -ForegroundColor Yellow
Start-Process wt -ArgumentList "new-tab --title `"Docker Stack`" wsl -d Ubuntu -- bash -lc `"cd $PROJECT/bridge-server && docker compose -f standalone.yml up`""

# Wait for Docker to be healthy before starting bridge server
Write-Host "      Waiting 30s for Docker stack to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Terminal 2: Bridge server
Write-Host "[2/3] Starting Bridge server..." -ForegroundColor Yellow
Start-Process wt -ArgumentList "new-tab --title `"Bridge Server`" wsl -d Ubuntu -- bash -lc `"cd $PROJECT/bridge-server && source ~/.nvm/nvm.sh && npm start`""

# Terminal 3: Demo site
Write-Host "[3/4] Starting Demo site..." -ForegroundColor Yellow
Start-Process wt -ArgumentList "new-tab --title `"Demo Site`" wsl -d Ubuntu -- bash -lc `"cd $PROJECT/demo-site && python3 -m http.server 8080`""

# Terminal 4: Human Proof site (Next.js)
Write-Host "[4/4] Starting Human Proof site..." -ForegroundColor Yellow
Start-Process wt -ArgumentList "new-tab --title `"Human Proof Site`" wsl -d Ubuntu -- bash -lc `"cd $PROJECT/human-proof-site && source ~/.nvm/nvm.sh && npm run dev -- --port 3001`""

Write-Host ""
Write-Host "All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "  Docker stack:       watch the 'Docker Stack' tab" -ForegroundColor White
Write-Host "  Bridge server:      http://localhost:3000/health" -ForegroundColor White
Write-Host "  Demo site:          http://localhost:8080" -ForegroundColor White
Write-Host "  Human Proof site:   http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Bridge server will be ready ~60s after Docker is healthy." -ForegroundColor Gray
Write-Host ""
