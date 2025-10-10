param(
  [string]$AppPath = "App.tsx",
  [string]$OverridesPath = "styles/app-overrides.css"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $AppPath)) {
  throw "Could not find $AppPath (expected at project root)."
}

# 1) Ensure overrides import exists
$code = Get-Content $AppPath -Raw
if ($code -notmatch 'import\s+["'']\.\/styles\/app-overrides\.css["''];') {
  $code = $code -replace '(?ms)(^\s*(import[^\n]*;\s*)+)', "`$1`r`nimport `"./styles/app-overrides.css`";`r`n"
}

# 2) Ensure useLocation is imported
if ($code -match 'import\s*\{\s*([^}]*)\}\s*from\s*["'']react-router-dom["''];') {
  $inner = $Matches[1]
  if ($inner -notmatch '\buseLocation\b') {
    $code = $code -replace 'import\s*\{\s*([^}]*)\}\s*from\s*["'']react-router-dom["''];', {
      param($m)
      $names = $m.Groups[1].Value.Trim()
      $names = ('useLocation, ' + $names).Trim(', ')
      "import { $names } from `"react-router-dom`";"
    }
  }
} elseif ($code -match 'from\s*["'']react-router-dom["'']') {
  $code = $code -replace '(?ms)^(\s*import\s+[^;]+from\s+["'']react-router-dom["''];\s*)', "`$1`r`nimport { useLocation } from `"react-router-dom`";`r`n"
} else {
  $code = "import { useLocation } from `"react-router-dom`";`r`n$code"
}

# 3) Define BodyClassController if missing
if ($code -notmatch '(function|const)\s+BodyClassController') {
$controller = @"
function BodyClassController() {
  const location = useLocation();
  React.useEffect(() => {
    const onHome =
      location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
    document.body.classList.toggle("home-hero", onHome);
  }, [location]);
  return null;
}
"@
  if ($code -match 'export\s+default') {
    $code = $code -replace '(?ms)(export\s+default)', "$controller`r`n`r`n`$1"
  } else {
    $code = "$controller`r`n`r`n$code"
  }
}

# 4) Render BodyClassController inside HashRouter
if ($code -notmatch '<BodyClassController\s*/>') {
  $code = $code -replace '(?ms)(<HashRouter[^>]*>)', '`$1`r`n      <BodyClassController />'
}

# Save changes
Set-Content -Path $AppPath -Value $code -Encoding UTF8

# 5) Strengthen override CSS
if (Test-Path $OverridesPath) {
  $css = Get-Content $OverridesPath -Raw
  $css = $css -replace "(body\.home-hero\s*\{[^}]*background-image:\s*url\([^)]+\))\s*;", '$1 !important;'
  Set-Content -Path $OverridesPath -Value $css -Encoding UTF8
}

Write-Host "✅ Patched $AppPath and $OverridesPath"
Write-Host "✅ PNG exists: " (Test-Path "public\cappuccino-crew.png")
