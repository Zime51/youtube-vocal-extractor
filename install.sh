#!/bin/bash

# YouTube Vocal Extractor Installation Script

echo "🎤 YouTube Vocal Extractor - Installation Script"
echo "=================================================="

# Check if Chrome is installed
if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo "❌ Chrome browser not found. Please install Google Chrome first."
    exit 1
fi

echo "✅ Chrome browser detected"

# Create extension directory if it doesn't exist
EXTENSION_DIR="$HOME/youtube-vocal-extractor"
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "📁 Creating extension directory..."
    mkdir -p "$EXTENSION_DIR"
fi

echo "📦 Extension files are ready in: $EXTENSION_DIR"
echo ""
echo "🔧 To install the extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the folder: $EXTENSION_DIR"
echo ""
echo "🎯 After installation:"
echo "- Go to any YouTube video"
echo "- Look for the floating '🎤 Extract Vocals' button"
echo "- Click the extension icon in the toolbar"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "✨ Installation script completed!"
