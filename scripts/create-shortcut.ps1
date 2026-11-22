param(
    [string]$TargetExe = ""
)

Write-Host "Musix - Configuring Windows Shortcut & Hotkey..." -ForegroundColor Cyan

if (-not $TargetExe) {
    $possiblePaths = @(
        "$PSScriptRoot\..\src-tauri\target\release\musix.exe",
        "$env:LOCALAPPDATA\Programs\musix\musix.exe",
        "$env:ProgramFiles\musix\musix.exe",
        "$PSScriptRoot\..\installer\musix.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $TargetExe = (Resolve-Path $path).Path
            break
        }
    }
}

if (-not $TargetExe -or -not (Test-Path $TargetExe)) {
    Write-Warning "Could not find musix.exe automatically. Please build the application first (npm run build:installer)."
    exit 1
}

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$StartMenuPath = [Environment]::GetFolderPath('Programs')

$DesktopShortcutPath = Join-Path $DesktopPath "Musix.lnk"
$Shortcut = $WshShell.CreateShortcut($DesktopShortcutPath)
$Shortcut.TargetPath = $TargetExe
$Shortcut.WorkingDirectory = Split-Path $TargetExe
$Shortcut.Description = "Musix - Lightweight Desktop Music Player"
$Shortcut.Hotkey = "CTRL+ALT+M"
$Shortcut.Save()

Write-Host "Desktop shortcut created: $DesktopShortcutPath" -ForegroundColor Green
Write-Host "Assigned Windows Shortcut Key: CTRL+ALT+M" -ForegroundColor Yellow

$StartMenuShortcutPath = Join-Path $StartMenuPath "Musix.lnk"
$StartShortcut = $WshShell.CreateShortcut($StartMenuShortcutPath)
$StartShortcut.TargetPath = $TargetExe
$StartShortcut.WorkingDirectory = Split-Path $TargetExe
$StartShortcut.Description = "Musix - Lightweight Desktop Music Player"
$StartShortcut.Hotkey = "CTRL+ALT+M"
$StartShortcut.Save()

Write-Host "Start Menu shortcut created: $StartMenuShortcutPath" -ForegroundColor Green

Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Musix" -Value "`"$TargetExe`" --autostart" -Force
Write-Host "Windows Startup registered: $TargetExe --autostart" -ForegroundColor Green

Write-Host "Setup complete: CTRL+ALT+M assigned." -ForegroundColor Magenta
