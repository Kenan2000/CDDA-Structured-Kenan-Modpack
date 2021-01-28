Write-Output "JSON formatting script begins."
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location -Path (Join-Path -Path $scriptDir -ChildPath "..")
$blacklist = Get-Content "CDDA-Kenan-Modpack\json_blacklist" | Resolve-Path -Relative
$files = Get-ChildItem -Recurse -Include *.json "CDDA-Kenan-Modpack\Kenan-Modpack" | Resolve-Path -Relative | ?{$blacklist -notcontains $_}
$files | ForEach-Object { Invoke-Expression "CDDA-Kenan-Modpack\tools\format\json_formatter.exe $_" }
Write-Output "JSON formatting script ends."
