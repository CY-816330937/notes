# Publish notes without quartz sync (exFAT-safe).
# Uploads everything under content/ except private, templates, inbox.
# Usage:  cd E:\quartz;  .\publish.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$gitExe = "git.exe"
$excludeDirs = @("private", "templates", "inbox", ".obsidian", ".trash")

function Invoke-SafeGit {
  & $gitExe -c safe.directory=E:/quartz @args
  if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed ($LASTEXITCODE)" }
}

function Test-ExcludedPath([string]$fullPath) {
  $contentRoot = (Resolve-Path "content").Path
  if (-not $fullPath.StartsWith($contentRoot, [StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  $rel = $fullPath.Substring($contentRoot.Length).TrimStart("\", "/")
  foreach ($part in $rel.Split([IO.Path]::DirectorySeparatorChar)) {
    if ($excludeDirs -contains $part) { return $true }
  }
  return $false
}

Get-ChildItem -LiteralPath "content" -Directory -Recurse -Force | ForEach-Object {
  if (Test-ExcludedPath $_.FullName) { return }
  $files = @(Get-ChildItem -LiteralPath $_.FullName -File -Force -ErrorAction SilentlyContinue)
  if ($files.Count -eq 0) {
    $gitkeep = Join-Path $_.FullName ".gitkeep"
    if (-not (Test-Path -LiteralPath $gitkeep)) {
      New-Item -ItemType File -Path $gitkeep -Force | Out-Null
    }
  }
}

Invoke-SafeGit add -A -- content publish.ps1 quartz.config.yaml .gitignore
Invoke-SafeGit rm -r --cached --ignore-unmatch -- content/private content/templates content/inbox | Out-Null

$status = & $gitExe -c safe.directory=E:/quartz status --short -- content publish.ps1 quartz.config.yaml .gitignore | Out-String
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "No content changes to publish."
  exit 0
}

Write-Host $status
Invoke-SafeGit -c user.name="CY-816330937" -c user.email="249255200+CY-816330937@users.noreply.github.com" commit -m "Update notes."
Invoke-SafeGit push origin v5
Write-Host "Pushed. Site: https://cy-816330937.github.io/notes/"
