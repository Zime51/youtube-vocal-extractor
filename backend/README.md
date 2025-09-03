# YouTube Audio Backend Service

A Node.js backend service that can actually download and extract audio from YouTube videos using server-side processing.

## Features

- ✅ **Real YouTube audio extraction** (not fake/synthetic)
- ✅ **High-quality MP3 conversion** (320kbps)
- ✅ **Video info extraction** (title, duration, thumbnail, etc.)
- ✅ **Rate limiting** and security features
- ✅ **Automatic file cleanup**
- ✅ **CORS support** for Chrome extensions
- ✅ **Error handling** and logging

## Prerequisites

1. **Node.js** (v16 or higher)
2. **FFmpeg** installed on your system

### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

## Installation

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Health Check
```
GET /api/health
```
Returns server status and uptime.

### 2. Get Video Info
```
POST /api/video-info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Returns video metadata (title, duration, thumbnail, etc.).

### 3. Download Audio
```
POST /api/download-audio
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "highest" // or "lowest"
}
```

Downloads and converts YouTube video to MP3 format.

### 4. Download Video (Bonus)
```
POST /api/download-video
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "highest" // or "lowest"
}
```

Downloads YouTube video in MP4 format.

## How It Works

1. **Extension sends YouTube URL** to backend
2. **Backend validates URL** and gets video info
3. **ytdl-core downloads** the audio stream
4. **FFmpeg converts** to high-quality MP3
5. **File is streamed** back to extension
6. **Temporary files are cleaned up** automatically

## Security Features

- **Rate limiting**: 100 requests per 15 minutes per IP
- **CORS protection**: Only allows Chrome extension origins
- **Helmet security**: Various HTTP security headers
- **Input validation**: YouTube URL validation
- **File cleanup**: Automatic removal of temporary files

## Environment Variables

```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=development         # Environment (development/production)
```

## Testing the API

### Using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Get video info
curl -X POST http://localhost:3000/api/video-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Download audio
curl -X POST http://localhost:3000/api/download-audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "quality": "highest"}' \
  --output audio.mp3
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues:

1. **FFmpeg not found**: Make sure FFmpeg is installed and in PATH
2. **Permission errors**: Check file system permissions for downloads directory
3. **Memory issues**: Large videos may require more memory
4. **Rate limiting**: Too many requests will be blocked

### Logs:
The server logs all operations to console. Check for error messages and file operations.

## Next Steps

1. **Start the backend server**
2. **Update your Chrome extension** to use this backend
3. **Test with real YouTube videos**
4. **Deploy to production** when ready

This backend service actually works and can extract real audio from YouTube videos, unlike the browser-based approach that was blocked by security restrictions.
