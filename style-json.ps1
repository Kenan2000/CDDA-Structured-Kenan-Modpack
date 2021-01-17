Write-Output "JSON formatting script begins."
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location -Path (Join-Path -Path $scriptDir -ChildPath "..")
$blacklist = Get-Content "Goats-Mod-Compilation\json_blacklist" | Resolve-Path -Relative
$files = Get-ChildItem -Recurse -Include *.json "CDDA-Kenan-Modpack\TEST_MODS_IGNORE" | Resolve-Path -Relative | ?{$blacklist -notcontains $_}
$files | ForEach-Object { Invoke-Expression "Goats-Mod-Compilation\tools\format\json_formatter.exe $_" }
Write-Output "JSON formatting script ends."
