@echo off
echo 🚀 Setting up YouTube Audio Extractor with Backend Service
echo ==========================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

REM Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FFmpeg is not installed. Please install FFmpeg first:
    echo.
    echo    Using Chocolatey: choco install ffmpeg
    echo    Or download from: https://ffmpeg.org/download.html
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js and FFmpeg are installed

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install

if %errorlevel% equ 0 (
    echo ✅ Backend dependencies installed successfully
) else (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Start the backend server:
echo    cd backend ^&^& npm start
echo.
echo 2. Load the Chrome extension:
echo    - Open Chrome and go to chrome://extensions/
echo    - Enable 'Developer mode'
echo    - Click 'Load unpacked' and select this folder
echo.
echo 3. Test the extension:
echo    - Go to any YouTube video
echo    - Click the extension icon
echo    - Click 'Download Audio'
echo.
echo 🔧 Backend server will run on: http://localhost:3000
echo 📁 Audio files will be downloaded to your Downloads folder
echo.
echo Happy downloading! 🎵
pause
