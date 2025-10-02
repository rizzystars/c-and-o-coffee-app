param(
  [switch]$Install,
  [switch]$Clean
)
Write-Host "== C&O Coffee: build-and-zip =="
if ($Clean) {
  if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
  if (Test-Path dist) { Remove-Item -Recurse -Force dist }
}
if ($Install -or -not (Test-Path node_modules)) {
  Write-Host "Installing dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}
Write-Host "Building..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
$zipPath = Join-Path -Path (Get-Location) -ChildPath "dist.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Write-Host "Zipping dist -> $zipPath"
Compress-Archive -Path ".\dist\*" -DestinationPath $zipPath
Write-Host "Done. Drag-and-drop dist.zip into Netlify if desired."