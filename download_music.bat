@echo off
title YouTube Music Downloader
color 0A

:: ============================================
::   PREREQUISITES TO USE THIS SCRIPT:
::
::   1. Python (3.8+)
::      https://www.python.org/downloads/
::      ✔ Check "Add Python to PATH" on install
::
::   2. yt-dlp  (auto-installed if missing)
::      pip install yt-dlp
::
::   3. ffmpeg  (MUST be manually installed)
::      https://ffmpeg.org/download.html
::      → Download → Extract → Add /bin to PATH
::      Guide: https://www.gyan.dev/ffmpeg/builds/
::
::   4. links.txt on your Desktop
::      One YouTube URL per line, example:
::        https://www.youtube.com/watch?v=abc123
::        https://youtu.be/xyz456
::
::   HOW TO RUN:
::      Double-click this .bat file
::      or run it from Command Prompt
::
:: ============================================

echo.
echo  =============================================
echo        YouTube Music Batch Downloader
echo  =============================================
echo.

:: ── Resolve current user Desktop (works on ANY Windows account) ──
:: %USERPROFILE% always points to C:\Users\YourName
set "DESKTOP=%USERPROFILE%\Desktop"
set "LINKS_FILE=%DESKTOP%\links.txt"
set "OUTPUT_DIR=%DESKTOP%\Music"

:: ── Verify Desktop path resolved correctly ──
if not exist "%DESKTOP%" (
    echo  [ERROR] Could not locate your Desktop folder.
    echo          Expected: %DESKTOP%
    echo  Try running the script as your normal user account.
    echo.
    pause
    exit /b 1
)

:: ── Check links.txt exists ──
if not exist "%LINKS_FILE%" (
    echo  [ERROR] links.txt not found on your Desktop.
    echo.
    echo  Please create a file called links.txt on your Desktop
    echo  and paste one YouTube URL per line, for example:
    echo.
    echo    https://www.youtube.com/watch?v=abc123
    echo    https://youtu.be/xyz456
    echo.
    pause
    exit /b 1
)

:: ── Check links.txt is not empty ──
for /f "usebackq" %%A in ("%LINKS_FILE%") do set "HAS_LINKS=1"
if not defined HAS_LINKS (
    echo  [ERROR] links.txt is empty. Add at least one YouTube URL.
    echo.
    pause
    exit /b 1
)

:: ── Check Python is available ──
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found.
    echo.
    echo  Download Python from: https://www.python.org/downloads/
    echo  During install, check "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

:: ── Check / install yt-dlp ──
where yt-dlp >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] yt-dlp not found. Installing via pip...
    echo.
    pip install yt-dlp
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] Failed to install yt-dlp.
        echo  Try running: pip install yt-dlp  manually.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] yt-dlp installed successfully.
    echo.
)

:: ── Check ffmpeg ──
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] ffmpeg not found - required for MP3 conversion.
    echo.
    echo  How to install ffmpeg:
    echo    1. Go to https://www.gyan.dev/ffmpeg/builds/
    echo    2. Download  ffmpeg-release-essentials.zip
    echo    3. Extract to C:\ffmpeg
    echo    4. Add C:\ffmpeg\bin to your System PATH
    echo       (Search "Environment Variables" in Start Menu)
    echo    5. Re-run this script.
    echo.
    pause
    exit /b 1
)

:: ── Create Music folder if needed ──
if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
    echo  [*] Created output folder: %OUTPUT_DIR%
)

:: ── Summary ──
echo  [*] Links file : %LINKS_FILE%
echo  [*] Output dir : %OUTPUT_DIR%
echo  [*] Format     : MP3 (best quality)
echo  [*] Metadata   : Embedded (title, artist, thumbnail)
echo.
echo  =============================================
echo   Starting downloads... (may take a while)
echo  =============================================
echo.

:: ── Run yt-dlp ──
yt-dlp ^
    --extract-audio ^
    --audio-format mp3 ^
    --audio-quality 0 ^
    --embed-thumbnail ^
    --add-metadata ^
    --output "%OUTPUT_DIR%\%%(title)s.%%(ext)s" ^
    --no-playlist ^
    --ignore-errors ^
    --console-title ^
    --progress ^
    --batch-file "%LINKS_FILE%"

:: ── Done ──
echo.
echo  =============================================
echo   [DONE] All downloads finished!
echo   Music saved to: %OUTPUT_DIR%
echo  =============================================
echo.
pause