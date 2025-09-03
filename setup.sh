#!/bin/bash

echo "🚀 Setting up YouTube Audio Extractor with Backend Service"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg first:"
    echo ""
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu/Debian: sudo apt install ffmpeg"
    echo "   Windows: choco install ffmpeg"
    echo ""
    exit 1
fi

echo "✅ Node.js and FFmpeg are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "2. Load the Chrome extension:"
echo "   - Open Chrome and go to chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked' and select this folder"
echo ""
echo "3. Test the extension:"
echo "   - Go to any YouTube video"
echo "   - Click the extension icon"
echo "   - Click 'Download Audio'"
echo ""
echo "🔧 Backend server will run on: http://localhost:3000"
echo "📁 Audio files will be downloaded to your Downloads folder"
echo ""
echo "Happy downloading! 🎵"
