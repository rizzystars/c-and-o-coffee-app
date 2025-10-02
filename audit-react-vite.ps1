param(
  [string]$Root = ".",
  [string]$OutDir = ".\audit-report"
)

function New-Folder($p){ if(-not (Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null } }
function Write-Head($t){ Write-Host "`n==== $t ====" -ForegroundColor Cyan }

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $Root).Path
$OutDir = Join-Path $Root $OutDir
New-Folder $OutDir

Write-Host "== C&O Coffee Project Audit ==" -ForegroundColor Green
Write-Host "Root: $Root"
Write-Host "Out:  $OutDir"

# ======= collect files =======
$srcDir = Join-Path $Root "src"
$pubDir = Join-Path $Root "public"
$funcDir = Join-Path $Root "netlify\functions"

$codeFiles     = Get-ChildItem $srcDir  -Recurse -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue
$publicFiles   = Get-ChildItem $pubDir  -Recurse -Include *.html,*.json,*.txt,*.png,*.jpg,*.svg -ErrorAction SilentlyContinue
$functionFiles = Get-ChildItem $funcDir -Recurse -Include *.ts,*.js -ErrorAction SilentlyContinue

# ======= netlify + package metadata =======
$netlifyToml = Join-Path $Root "netlify.toml"
$packageJson = Join-Path $Root "package.json"
$viteConfigTs = Join-Path $Root "vite.config.ts"
$viteConfigJs = Join-Path $Root "vite.config.js"

$meta = [ordered]@{
  Time               = (Get-Date).ToString("s")
  Root               = $Root
  HasNetlifyToml     = (Test-Path $netlifyToml)
  HasPackageJson     = (Test-Path $packageJson)
  HasViteConfigTs    = (Test-Path $viteConfigTs)
  HasViteConfigJs    = (Test-Path $viteConfigJs)
  SrcFiles           = $codeFiles.Count
  PublicFiles        = $publicFiles.Count
  FunctionFiles      = $functionFiles.Count
  FunctionsDirExists = (Test-Path $funcDir)
}
$meta | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 (Join-Path $OutDir "meta.json")

# ======= parse routes from React Router =======
$routePatterns = @(
  '<Route\s+[^>]*path\s*=\s*["''](?<path>[^"'']+)["'']'
  'path\s*:\s*["''](?<path>[^"'']+)["'']'
)
$lazyImportPattern = 'React\.lazy\(\s*\(\s*=>\s*import\(["''](?<lazy>[^"'']+)["'']\)\s*\)\s*\)'

$routes = @()
foreach($f in $codeFiles){
  $text = Get-Content $f.FullName -Raw
  foreach($rx in $routePatterns){
    [regex]::Matches($text, $rx) | ForEach-Object{
      $path = $_.Groups['path'].Value
      if($path){
        $routes += [pscustomobject]@{
          File = $f.FullName.Substring($Root.Length+1)
          Path = $path
          Type = "route"
        }
      }
    }
  }
  # collect lazy routes
  [regex]::Matches($text, $lazyImportPattern) | ForEach-Object{
    $imp = $_.Groups['lazy'].Value
    if($imp){
      $routes += [pscustomobject]@{
        File = $f.FullName.Substring($Root.Length+1)
        Path = $imp
        Type = "lazy-import"
      }
    }
  }
}
$routes | Sort-Object File, Path | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "routes.csv")

# ======= pages by convention (src/pages/*) and components named *Page.tsx =======
$pages = @()
$pages += Get-ChildItem $srcDir -Recurse -Include *.tsx,*.jsx -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match '\\src\\pages\\' } |
  ForEach-Object {
    [pscustomobject]@{ Kind="convention"; File=$_.FullName.Substring($Root.Length+1); Name=$_.BaseName }
  }
$pages += Get-ChildItem $srcDir -Recurse -Include *Page.tsx,*Page.jsx -ErrorAction SilentlyContinue |
  ForEach-Object {
    [pscustomobject]@{ Kind="name-suffix"; File=$_.FullName.Substring($Root.Length+1); Name=$_.BaseName }
  }
$pages | Sort-Object Kind, Name | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "pages.csv")

# ======= scan for function calls to /.netlify/functions/* =======
$fnCallRx = '/\.netlify\/functions\/(?<fn>[a-zA-Z0-9\-_]+)'
$fnCalls = @()
foreach($f in $codeFiles){
  $content = Get-Content $f.FullName -Raw
  [regex]::Matches($content, $fnCallRx) | ForEach-Object{
    $fn = $_.Groups['fn'].Value
    $start = [Math]::Max(0, $_.Index - 60)
    $length = [Math]::Min(160, $content.Length - $start)
    $snippet = ($content.Substring($start, $length) -replace '\s+', ' ').Trim()
    $fnCalls += [pscustomobject]@{
      File     = $f.FullName.Substring($Root.Length+1)
      Function = $fn
      Snippet  = $snippet
    }
  }
}
$fnCalls | Sort-Object Function, File | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "frontend-function-calls.csv")

# ======= list Netlify Functions, infer handlers =======
$functions = @()
foreach($f in $functionFiles){
  $code = Get-Content $f.FullName -Raw
  $name = [IO.Path]::GetFileNameWithoutExtension($f.FullName)
  $hasDefault      = ($code -match 'export\s+default')
  $hasNamedHandler = ($code -match 'export\s+(const|async)?\s*handler')

  $fetchTargets = [regex]::Matches($code,'/\.netlify\/functions\/([a-zA-Z0-9\-_]+)') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

  $functions += [pscustomobject]@{
    File         = $f.FullName.Substring($Root.Length+1)
    NameGuess    = $name
    Exports      = if($hasDefault){'default'} elseif($hasNamedHandler){'handler'} else {'unknown'}
    HasSupabase  = ($code -match '@supabase/supabase-js')
    HasSquareSDK = ($code -match 'Web Payments SDK|square|@square')
    UsesEnv      = ($code -match 'process\.env')
    FetchRoutes  = ($fetchTargets -join ',')
  }
}
$functions | Sort-Object NameGuess | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "functions.csv")

# ======= env vars referenced in code =======
$envRefs = @()
foreach($f in $codeFiles + $functionFiles){
  $txt = Get-Content $f.FullName -Raw
  [regex]::Matches($txt, 'process\.env\.([A-Z0-9_]+)') | ForEach-Object{
    $envRefs += [pscustomobject]@{
      File = $f.FullName.Substring($Root.Length+1)
      Var  = $_.Groups[1].Value
    }
  }
}
$envRefs | Sort-Object Var, File | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "env-refs.csv")

# ======= Supabase / Square usage hotspots =======
$hotspots = @()
foreach($f in $codeFiles + $functionFiles){
  $c = Get-Content $f.FullName -Raw
  $hasSb = $c -match '@supabase/supabase-js'
  $hasSq = $c -match 'Web Payments SDK|@square|Square\W'
  if($hasSb -or $hasSq){
    $hotspots += [pscustomobject]@{
      File    = $f.FullName.Substring($Root.Length+1)
      Supabase= $hasSb
      Square  = $hasSq
    }
  }
}
$hotspots | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "hotspots.csv")

# ======= public HTML entry points =======
$publicReport = $publicFiles | Select-Object FullName, Length, LastWriteTime |
  ForEach-Object {
    [pscustomobject]@{
      File     = $_.FullName.Substring($Root.Length+1)
      KB       = [math]::Round($_.Length/1kb,2)
      Modified = $_.LastWriteTime
    }
  }
$publicReport | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutDir "public-files.csv")

# ======= package.json quick read =======
if(Test-Path $packageJson){
  try {
    $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
    $pkg | ConvertTo-Json -Depth 6 | Out-File -Encoding utf8 (Join-Path $OutDir "package.json.pretty.json")
  } catch { }
}

# ======= netlify.toml copy =======
if(Test-Path $netlifyToml){
  Copy-Item $netlifyToml (Join-Path $OutDir "netlify.toml") -Force
}

# ======= summary.md =======
$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine("# C&O Coffee — React/Vite Audit")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("Generated: $(Get-Date -Format s)")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("## Meta")
$null = $sb.AppendLine('```')
$null = $sb.AppendLine(($meta | ConvertTo-Json -Depth 4))
$null = $sb.AppendLine('```')
$null = $sb.AppendLine("")
$null = $sb.AppendLine("## Key Outputs")
$null = $sb.AppendLine("- routes.csv — all detected React Router routes and lazy imports")
$null = $sb.AppendLine("- pages.csv — files under src/pages and *Page components")
$null = $sb.AppendLine("- functions.csv — Netlify Functions (export type, deps, env usage)")
$null = $sb.AppendLine("- frontend-function-calls.csv — client calls to /.netlify/functions/*")
$null = $sb.AppendLine("- env-refs.csv — environment variables referenced in code")
$null = $sb.AppendLine("- hotspots.csv — files using Supabase and/or Square")
$null = $sb.AppendLine("- public-files.csv — public assets")
$null = $sb.AppendLine("- package.json.pretty.json — scripts/deps snapshot (if present)")
$null = $sb.AppendLine("- netlify.toml — copied for quick inspection (if present)")
$summaryText = $sb.ToString()
$summaryText | Out-File -Encoding utf8 (Join-Path $OutDir "summary.md")

# ======= console preview =======
Write-Head "Routes (top 20)"
if (Test-Path (Join-Path $OutDir "routes.csv")) {
  Import-Csv (Join-Path $OutDir "routes.csv") | Select-Object -First 20 | Format-Table -AutoSize
}

Write-Head "Pages (top 20)"
if (Test-Path (Join-Path $OutDir "pages.csv")) {
  Import-Csv (Join-Path $OutDir "pages.csv") | Select-Object -First 20 | Format-Table -AutoSize
}

Write-Head "Functions"
if (Test-Path (Join-Path $OutDir "functions.csv")) {
  Import-Csv (Join-Path $OutDir "functions.csv") | Format-Table -AutoSize
}

Write-Head "Frontend calls to Netlify Functions"
if (Test-Path (Join-Path $OutDir "frontend-function-calls.csv")) {
  Import-Csv (Join-Path $OutDir "frontend-function-calls.csv") | Format-Table -AutoSize
}

Write-Head "Env vars referenced (top 30)"
if (Test-Path (Join-Path $OutDir "env-refs.csv")) {
  Import-Csv (Join-Path $OutDir "env-refs.csv") | Select-Object -First 30 | Format-Table -AutoSize
}

Write-Host "`nDone. Open $OutDir\summary.md" -ForegroundColor Green

