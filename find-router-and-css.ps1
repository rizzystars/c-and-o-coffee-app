param([string]$ProjectRoot=".")
$ErrorActionPreference="Stop"
Push-Location $ProjectRoot

$routerCandidates = Get-ChildItem -Recurse -File -Include *.tsx,*.jsx | Where-Object {
  (Get-Content $_.FullName -Raw) -match 'HashRouter|BrowserRouter|createBrowserRouter'
}
$routerFile = $routerCandidates | Select-Object -First 1

$cssCandidates = @()
$cssCandidates += Get-ChildItem -Recurse -File -Include index.css,main.css,global.css,app.css,styles.css
$linkedFromHtml = @()
$indexHtml = Get-ChildItem -Recurse -File -Include index.html | Select-Object -First 1
if($indexHtml){
  $html = Get-Content $indexHtml.FullName -Raw
  $links = [regex]::Matches($html,'href\s*=\s*["'']([^"'']+\.css)["'']')
  foreach($m in $links){ 
    $rp = Join-Path $indexHtml.DirectoryName $m.Groups[1].Value
    $resolved = Resolve-Path -LiteralPath $rp -ErrorAction SilentlyContinue
    if($resolved){ $linkedFromHtml += $resolved }
  }
}

Write-Host "`n🔎 Router file:" -ForegroundColor Cyan
if($routerFile){ Write-Host "  $($routerFile.FullName)" } else { Write-Host "  (not found)" }

Write-Host "`n🔎 CSS candidates:" -ForegroundColor Cyan
($cssCandidates + $linkedFromHtml | Select-Object -Unique) | ForEach-Object { Write-Host "  $_" }

Pop-Location
