@echo off
echo ========================================================
echo  Musix - Windows Installer Setup Builder
echo ========================================================
echo.

cd /d "%~dp0\.."

echo [1/3] Building frontend assets with Vite...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b %errorlevel%
)

echo.
echo [2/3] Compiling Tauri release binary and NSIS Installer...
call npm run tauri build -- --bundles nsis
if %errorlevel% neq 0 (
    echo [ERROR] Tauri build failed!
    exit /b %errorlevel%
)

echo.
echo [3/3] Setting up installer directory and shortcuts...
if not exist "installer" mkdir "installer"
if not exist "installer\musix-portable" mkdir "installer\musix-portable"
xcopy /y /q "src-tauri\target\release\bundle\nsis\*.exe" "installer\" >nul 2>&1
xcopy /y /q "src-tauri\target\release\musix.exe" "installer\musix-portable\" >nul 2>&1
xcopy /y /q "src-tauri\target\release\WebView2Loader.dll" "installer\musix-portable\" >nul 2>&1
powershell -Command "if (Test-Path 'installer\musix-portable.zip') { Remove-Item 'installer\musix-portable.zip' -Force }; Compress-Archive -Path 'installer\musix-portable\*' -DestinationPath 'installer\musix-portable.zip'"
if exist "src-tauri\target\release\musix.exe" (
    powershell -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1" -TargetExe "%CD%\src-tauri\target\release\musix.exe"
)

echo.
echo ========================================================
echo  SUCCESS!
echo  Installer is available in: %CD%\installer\
echo  Windows Shortcut Key (Ctrl+Alt+M) is registered!
echo ========================================================
pause
