# --- Center cappuccino-crew on homepage; stop duplication --------------------
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Write-Host "`n— Fixing homepage background (cappuccino-crew) —`n" -ForegroundColor Cyan

$root = Get-Location
$img  = Join-Path $root "public\cappuccino-crew.png"
if (-not (Test-Path $img)) { throw "Image not found: $img (run from project root)" }

# Find candidates that mention home-hero or the image or the fixed layer id
$candidates = Get-ChildItem -Recurse -File -Include *.css,*.scss,*.ts,*.tsx,*.js,*.jsx |
  Where-Object { Select-String -Path $_.FullName -Quiet -Pattern 'home-hero|cappuccino-crew\.png|home-fixed-bg' }

if (-not $candidates) { throw "No candidate files found that mention 'home-hero' or 'cappuccino-crew.png'." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$bak   = Join-Path $root ".bak_fix-homepage-bg_$stamp"
New-Item -ItemType Directory -Path $bak | Out-Null
$candidates | Copy-Item -Destination $bak

$desiredCss = @"
body.home-hero {
  background-image: url('/cappuccino-crew.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-attachment: fixed; /* keep it stable and centered */
  background-size: contain;     /* show ONE full image, no cropping */
  background-color: #000;       /* fill surrounding with black */
}
"@

$blockRegex = 'body\.home-hero\s*\{[^}]*\}'
function Set-CRLF([string]$p,[string]$t){ $crlf = $t -replace "(`r)?`n","`r`n"; Set-Content -Path $p -Value $crlf -Encoding UTF8 }

$patched  = @()
$injected = @()

foreach ($f in $candidates) {
  $txt = Get-Content $f.FullName -Raw

  if ($f.Extension -match 'css|scss') {
    if ($txt -match $blockRegex) {
      $new = [regex]::Replace($txt, $blockRegex, $desiredCss, 'Singleline')
      if ($new -ne $txt) { Set-CRLF $f.FullName $new; $patched += $f.FullName }
    } elseif ($txt -match 'home-hero|cappuccino-crew\.png') {
      $new = $txt.TrimEnd() + "`r`n`r`n" + $desiredCss
      Set-CRLF $f.FullName $new
      $injected += $f.FullName
    }
  } else {
    if ($txt -match '#home-fixed-bg|getElementById\((["'']?)home-fixed-bg\1\)') {
      $new = $txt `
        -replace "backgroundRepeat\s*=\s*['""][^'""]*['""]", "backgroundRepeat = 'no-repeat'" `
        -replace "backgroundPosition\s*=\s*['""][^'""]*['""]", "backgroundPosition = 'center center'" `
        -replace "backgroundSize\s*=\s*['""][^'""]*['""]", "backgroundSize = 'contain'" `
        -replace "backgroundAttachment\s*=\s*['""][^'""]*['""]", "backgroundAttachment = 'fixed'"
      if ($new -ne $txt) { Set-CRLF $f.FullName $new; $patched += $f.FullName }
    }
  }
}

# Ensure global black fallback (prevents any flash/edges)
$globalCssPaths = @("index.css","app-overrides.css","src\index.css","styles\*.css") `
  | ForEach-Object { Join-Path $root $_ } `
  | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } `
  | Where-Object { $_ }

$bodyRule = @"
/* Global fallback to keep app on black */
html, body, #root { height: 100%; }
body { margin: 0; background: #000; }
"@

foreach ($g in $globalCssPaths) {
  $t = Get-Content $g.FullName -Raw
  if ($t -notmatch 'body\s*\{[^\}]*background\s*:') {
    Set-CRLF $g.FullName ($t.TrimEnd() + "`r`n`r`n" + $bodyRule)
    $injected += $g.FullName
  }
}

Write-Host "`nBackup saved to: $bak" -ForegroundColor DarkGray
if ($patched)  { Write-Host "`nPatched:"  -ForegroundColor Green;  $patched  | ForEach-Object { "  + $_" } }
if ($injected) { Write-Host "`nInjected:" -ForegroundColor Green;  $injected | ForEach-Object { "  + $_" } }
if (-not $patched -and -not $injected) { Write-Host "No changes needed." -ForegroundColor Green }
Write-Host "`nDone. Hard-refresh (Ctrl+F5) or restart dev server." -ForegroundColor Cyan
