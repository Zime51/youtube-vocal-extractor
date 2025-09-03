#!/bin/bash

# Install FFmpeg on Render
echo "Installing FFmpeg..."

# Update package list
apt-get update

# Install FFmpeg
apt-get install -y ffmpeg

# Verify installation
ffmpeg -version

echo "FFmpeg installation completed!"
