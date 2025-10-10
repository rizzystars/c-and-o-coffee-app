param([string]$RouterPath = "src\styles\App.tsx")

$ErrorActionPreference = "Stop"

if (-not (Test-Path $RouterPath)) {
  Write-Host "❌ Router file not found: $RouterPath" -ForegroundColor Red
  Write-Host "Tip: run:  powershell -File .\find-router-and-css.ps1" -ForegroundColor Yellow
  exit 1
}

# 1) Ensure styles/app-overrides.css exists with the home-hero rules
$stylesDir = "src\styles"
$appOverrides = Join-Path $stylesDir "app-overrides.css"
New-Item -ItemType Directory -Force -Path $stylesDir | Out-Null

@'
 /* Homepage-specific background — wins without touching other CSS */
 body.home-hero {
   background-image: url('/cappuccino-crew.png') !important;
   background-repeat: no-repeat;
   background-position: center;
   background-size: cover;
 }

 /* Let the art show through on the homepage */
 body.home-hero main,
 body.home-hero main * {
   background: transparent !important;
 }

 /* Keep header solid */
 header {
   background-color: #000 !important;
   background-image: none !important;
   backdrop-filter: none !important;
 }
