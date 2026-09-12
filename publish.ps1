# Publish notes without quartz sync (exFAT-safe).
# Usage:  cd E:\quartz;  .\publish.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$gitExe = "git.exe"

function Invoke-SafeGit {
  & $gitExe -c safe.directory=E:/quartz @args
  if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed ($LASTEXITCODE)" }
}

Invoke-SafeGit add -- content publish.ps1
$status = & $gitExe -c safe.directory=E:/quartz status --short -- content publish.ps1 | Out-String
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "No content changes to publish."
  exit 0
}

Invoke-SafeGit -c user.name="CY-816330937" -c user.email="249255200+CY-816330937@users.noreply.github.com" commit -m "Update notes."
Invoke-SafeGit push origin v5
Write-Host "Pushed. Site: https://cy-816330937.github.io/notes/"
