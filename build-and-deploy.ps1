Write-Host "== C&O Coffee: build-and-deploy =="
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Node.js/npm not found. Install Node 18+ first from https://nodejs.org"
}
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Netlify CLI globally..."
  npm install -g netlify-cli
}
if (-not (Test-Path node_modules)) {
  Write-Host "Installing dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}
Write-Host "Building..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
if (-not (Test-Path ".\dist")) { throw "dist folder not found after build" }
Write-Host ""
Write-Host "Deploy Draft (y/N)? " -NoNewline
$draft = Read-Host
if ($draft -match '^(y|yes)$') {
  if (-not (Test-Path ".\netlify.toml")) { Write-Host "Warning: netlify.toml missing" }
  if (-not (Test-Path ".\netlify")) { Write-Host "Warning: netlify functions folder missing" }
  netlify deploy --dir dist
}
Write-Host "Deploy to Production (y/N)? " -NoNewline
$prod = Read-Host
if ($prod -match '^(y|yes)$') {
  netlify deploy --dir dist --prod
}
Write-Host "All done."