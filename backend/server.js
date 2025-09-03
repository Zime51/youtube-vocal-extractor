const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Load configuration
let config;
try {
  config = require('./config.js');
} catch (error) {
  console.log('No config.js found, using default configuration');
  config = {
    lalalAiApiKey: 'demo',
    port: 3000,
    maxFileSize: 100 * 1024 * 1024,
    allowedAudioFormats: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a']
  };
}

// Bot detection evasion utilities
function getRandomDelay() {
  return Math.random() * 2000 + 1000; // 1-3 seconds
}

function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getBotEvasionHeaders() {
  const userAgent = getRandomUserAgent();
  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Referer': 'https://www.youtube.com/',
    'Origin': 'https://www.youtube.com',
    'X-Forwarded-For': '127.0.0.1',
    'X-Real-IP': '127.0.0.1'
  };
}

// Hybrid YouTube downloader with multiple fallback methods
async function downloadWithHybridApproach(url, quality) {
  const methods = [
    {
      name: 'ytdl-core with advanced evasion',
      fn: () => downloadWithYtdlCore(url, quality)
    },
    {
      name: 'Third-party API fallback',
      fn: () => downloadWithThirdPartyAPI(url, quality)
    }
  ];
  
  for (const method of methods) {
    try {
      console.log(`Trying ${method.name} for: ${url}`);
      const result = await method.fn();
      console.log(`Success with ${method.name}`);
      return result;
    } catch (error) {
      console.error(`${method.name} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All download methods failed');
}

// ytdl-core with advanced evasion
async function downloadWithYtdlCore(url, quality) {
  try {
    // Add random delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Get video info with advanced evasion
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: getBotEvasionHeaders(),
        timeout: 30000
      }
    });
    
    const videoDetails = info.videoDetails;
    console.log(`Got video info: ${videoDetails.title}`);
    
    // Create audio stream with evasion
    const audioStream = ytdl(url, {
      quality: quality === 'highest' ? 'highestaudio' : 'lowestaudio',
      filter: 'audioonly',
      requestOptions: {
        headers: getBotEvasionHeaders(),
        timeout: 30000
      }
    });
    
    // Generate filename
    const cleanTitle = videoDetails.title
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 60);
    const filename = `${cleanTitle}.mp3`;
    const filePath = path.join(downloadsDir, filename);
    
    // Convert to MP3 using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(audioStream)
        .audioBitrate(320)
        .audioChannels(2)
        .audioFrequency(44100)
        .format('mp3')
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Audio conversion completed');
          resolve();
        })
        .save(filePath);
    });
    
    return {
      filePath: filePath,
      title: videoDetails.title,
      filename: filename
    };
    
  } catch (error) {
    throw new Error(`ytdl-core failed: ${error.message}`);
  }
}

// Third-party API fallback
async function downloadWithThirdPartyAPI(url, quality) {
  try {
    console.log(`Trying third-party API for: ${url}`);
    
    // Use a different API service
    const apiUrl = 'https://api.vevioz.com/api/button/mp3/320';
    
    const response = await axios.post(apiUrl, {
      url: url,
      format: 'mp3',
      quality: quality === 'highest' ? '320' : '128'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.youtube.com/'
      },
      timeout: 30000
    });
    
    if (response.data && response.data.url) {
      console.log('Got download URL from API:', response.data.url);
      
      // Download the file
      const fileResponse = await axios.get(response.data.url, {
        responseType: 'stream',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://www.youtube.com/'
        },
        timeout: 60000
      });
      
      // Generate filename
      const videoId = url.match(/[?&]v=([^&]+)/)?.[1] || 'youtube_audio';
      const filename = `youtube_${videoId}.mp3`;
      const filePath = path.join(downloadsDir, filename);
      
      // Save the file
      const writer = fs.createWriteStream(filePath);
      fileResponse.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('File downloaded successfully via API:', filename);
          resolve({
            filePath: filePath,
            title: `YouTube Audio ${videoId}`,
            filename: filename
          });
        });
        
        writer.on('error', (error) => {
          console.error('Error writing file:', error);
          reject(error);
        });
      });
      
    } else {
      throw new Error('No download URL received from API');
    }
    
  } catch (error) {
    throw new Error(`Third-party API failed: ${error.message}`);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, downloadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.allowedAudioFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  }
});

// Cleanup old files (older than 1 hour)
setInterval(() => {
  const files = fs.readdirSync(downloadsDir);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(downloadsDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > 60 * 60 * 1000) { // 1 hour
      fs.unlinkSync(filePath);
      console.log(`Cleaned up old file: ${file}`);
    }
  });
}, 30 * 60 * 1000); // Run every 30 minutes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });
});

// Debug endpoint to check what's available
app.get('/api/debug', async (req, res) => {
  try {
    const { spawn } = require('child_process');
    
    // Check if ffmpeg is available
    let ffmpegAvailable = false;
    try {
      const ffmpegCheck = spawn('ffmpeg', ['-version']);
      ffmpegCheck.on('close', (code) => {
        ffmpegAvailable = code === 0;
      });
    } catch (e) {
      ffmpegAvailable = false;
    }
    
    // Test ytdl-core
    let ytdlTest = 'Not tested';
    try {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const info = await ytdl.getInfo(testUrl);
      ytdlTest = 'Working - got video info';
    } catch (error) {
      ytdlTest = `Failed: ${error.message}`;
    }
    
    res.json({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      ffmpegAvailable: ffmpegAvailable,
      ytdlTest: ytdlTest,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get video info endpoint
app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info with bot detection avoidance
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: getBotEvasionHeaders()
      }
    });
    const videoDetails = info.videoDetails;

    res.json({
      success: true,
      videoInfo: {
        title: videoDetails.title,
        author: videoDetails.author.name,
        duration: videoDetails.lengthSeconds,
        thumbnail: videoDetails.thumbnails[0]?.url,
        description: videoDetails.description,
        viewCount: videoDetails.viewCount,
        uploadDate: videoDetails.uploadDate
      }
    });

  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({ 
      error: 'Failed to get video info',
      details: error.message 
    });
  }
});

// Download audio endpoint
app.post('/api/download-audio', async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { url, quality = 'highest' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Basic YouTube URL validation
    if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`Starting audio download for: ${url}`);

    // Use hybrid approach with multiple fallback methods
    const downloadResult = await downloadWithHybridApproach(url, quality);
    
    tempFilePath = downloadResult.filePath;
    const filename = downloadResult.filename;

    console.log(`Download completed: ${filename}`);

    // Check if file was created successfully
    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Audio file was not created');
    }

    const stats = fs.statSync(tempFilePath);
    console.log(`Audio file created: ${filename} (${stats.size} bytes)`);

    // Send file to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    console.log('Sending file with filename:', filename);
    console.log('Content-Disposition header set to:', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log(`Cleaned up file: ${filename}`);
        }
      }, 1000);
    });

  } catch (error) {
    console.error('Error downloading audio:', error);
    
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    res.status(500).json({ 
      error: 'Failed to download audio',
      details: error.message 
    });
  }
});

// Download video endpoint (bonus feature)
app.post('/api/download-video', async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { url, quality = 'highest' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    
    const videoId = videoDetails.videoId;
    const safeTitle = videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${safeTitle}_${videoId}.mp4`;
    tempFilePath = path.join(downloadsDir, filename);

    console.log(`Starting video download for: ${videoDetails.title}`);

    const videoStream = ytdl(url, {
      quality: quality === 'highest' ? 'highest' : 'lowest',
      requestOptions: {
        headers: getBotEvasionHeaders()
      }
    });

    await new Promise((resolve, reject) => {
      ffmpeg(videoStream)
        .format('mp4')
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Video conversion completed');
          resolve();
        })
        .save(tempFilePath);
    });

    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Video file was not created');
    }

    const stats = fs.statSync(tempFilePath);
    console.log(`Video file created: ${filename} (${stats.size} bytes)`);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log(`Cleaned up file: ${filename}`);
        }
      }, 1000);
    });

  } catch (error) {
    console.error('Error downloading video:', error);
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message 
    });
  }
});

// Error handling middleware
// LALAL.AI Vocal Separation Function
async function separateVocalsWithLALAL(inputFile, baseName, progressCallback = null) {
  try {
    console.log('Starting LALAL.AI vocal separation...');
    console.log('Using API key:', config.lalalAiApiKey.substring(0, 4) + '...');
    
    // Step 1: Upload file to LALAL.AI
    console.log('Uploading file to LALAL.AI...');
    if (progressCallback) progressCallback(5, 'Uploading file to LALAL.AI...');
    const audioBuffer = fs.readFileSync(inputFile);
    const cleanFileName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    const uploadResponse = await axios.post('https://www.lalal.ai/api/upload/', audioBuffer, {
      headers: {
        'Authorization': `license ${config.lalalAiApiKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${cleanFileName}.mp3"`
      },
      timeout: 300000
    });
    
    console.log('Upload response:', JSON.stringify(uploadResponse.data, null, 2));
    
    if (uploadResponse.data.status !== 'success') {
      throw new Error('Upload failed: ' + uploadResponse.data.error);
    }
    
    const fileId = uploadResponse.data.id;
    console.log(`File uploaded successfully. ID: ${fileId}`);
    if (progressCallback) progressCallback(10, 'File uploaded successfully. Starting separation...');
    
    // Step 2: Start split task for vocals
    console.log('Starting vocal separation task...');
    if (progressCallback) progressCallback(15, 'Starting vocal separation task...');
    const splitParams = JSON.stringify([{
      id: fileId,
      stem: 'vocals'
    }]);
    
    console.log('Split params:', splitParams);
    
    const splitResponse = await axios.post('https://www.lalal.ai/api/split/', 
      `params=${encodeURIComponent(splitParams)}`, {
      headers: {
        'Authorization': `license ${config.lalalAiApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 300000
    });
    
    console.log('Split response:', JSON.stringify(splitResponse.data, null, 2));
    
    if (splitResponse.data.status !== 'success') {
      throw new Error('Split task failed: ' + (splitResponse.data.error || 'Unknown error'));
    }
    
    console.log('Split task started successfully');
    if (progressCallback) progressCallback(20, 'Split task started. Processing...');
    
    // Step 3: Poll for results
    console.log('Waiting for processing to complete...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      const checkResponse = await axios.post('https://www.lalal.ai/api/check/', 
        `id=${fileId}`, {
        headers: {
          'Authorization': `license ${config.lalalAiApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log(`Check attempt ${attempts}:`, checkResponse.data.status);
      
      if (checkResponse.data.status === 'success') {
        const fileResult = checkResponse.data.result[fileId];
        
        if (fileResult.status === 'success' && fileResult.split) {
          console.log('Processing completed successfully!');
          if (progressCallback) progressCallback(85, 'Processing completed! Downloading files...');
          
          // Download vocals
          console.log('Downloading vocals from:', fileResult.split.stem_track);
          if (progressCallback) progressCallback(90, 'Downloading vocals...');
          const vocalsResponse = await axios.get(fileResult.split.stem_track, { responseType: 'stream' });
          const vocalsFile = path.join(downloadsDir, `${baseName}_vocals.mp3`);
          console.log('Saving vocals to:', vocalsFile);
          const vocalsWriter = fs.createWriteStream(vocalsFile);
          vocalsResponse.data.pipe(vocalsWriter);
          
          // Download instrumentals
          console.log('Downloading instrumentals from:', fileResult.split.back_track);
          if (progressCallback) progressCallback(95, 'Downloading instrumentals...');
          const instrumentalsResponse = await axios.get(fileResult.split.back_track, { responseType: 'stream' });
          const instrumentalsFile = path.join(downloadsDir, `${baseName}_instrumentals.mp3`);
          console.log('Saving instrumentals to:', instrumentalsFile);
          const instrumentalsWriter = fs.createWriteStream(instrumentalsFile);
          instrumentalsResponse.data.pipe(instrumentalsWriter);
          
          // Wait for downloads to complete
          await new Promise((resolve, reject) => {
            let completed = 0;
            const onComplete = () => {
              completed++;
              console.log(`Download completed: ${completed}/2`);
              if (completed === 2) {
                console.log('All downloads completed successfully!');
                if (progressCallback) progressCallback(100, 'All files downloaded successfully!');
                resolve();
              }
            };
            
            const onError = (error) => {
              console.error('Download error:', error);
              reject(error);
            };
            
            vocalsWriter.on('finish', onComplete);
            vocalsWriter.on('error', onError);
            instrumentalsWriter.on('finish', onComplete);
            instrumentalsWriter.on('error', onError);
          });
          
          return {
            success: true,
            message: 'Vocal separation completed successfully',
            files: {
              vocals: `${baseName}_vocals.mp3`,
              instrumentals: `${baseName}_instrumentals.mp3`
            }
          };
          
        } else if (fileResult.status === 'error') {
          throw new Error('Processing failed: ' + fileResult.error);
        }
        
        // Check if still processing
        if (fileResult.task && fileResult.task.state === 'progress') {
          console.log(`Progress: ${fileResult.task.progress}%`);
          if (progressCallback) {
            const progressPercent = Math.min(20 + (fileResult.task.progress * 0.6), 80);
            progressCallback(progressPercent, `Processing: ${fileResult.task.progress}%`);
          }
        }
      } else if (checkResponse.data.status === 'error') {
        throw new Error('Check failed: ' + checkResponse.data.error);
      }
    }
    
    throw new Error('Processing timeout - took too long to complete');
    
  } catch (error) {
    console.error('LALAL.AI error:', error);
    
    // Don't fallback - show the actual error
    throw error;
  }
}


// Vocal separation endpoint with progress streaming
app.post('/api/separate-vocals', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    const inputFile = req.file.path;
    const baseName = path.parse(req.file.originalname).name;
    
    console.log(`Processing uploaded file: ${req.file.originalname}`);
    
    // Set up Server-Sent Events for progress streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial progress
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Starting vocal separation...', progress: 0 })}\n\n`);
    
    const result = await separateVocalsWithLALAL(inputFile, baseName, (progress, message) => {
      // Send progress updates to frontend
      res.write(`data: ${JSON.stringify({ type: 'progress', message, progress })}\n\n`);
    });
    
    // Clean up the original uploaded file
    if (fs.existsSync(inputFile)) {
      fs.unlinkSync(inputFile);
    }
    
    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Error separating vocals:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Send error to frontend
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Download separated file endpoint
app.get('/api/download-separated/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(downloadsDir, filename);
    
    console.log(`Download request for: ${filename}`);
    console.log(`File path: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filename}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up file: ${filename}`);
        }
      }, 5000); // Increased delay to 5 seconds
    });
    
  } catch (error) {
    console.error('Error downloading separated file:', error);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 YouTube Audio Backend Server running on port ${PORT}`);
  console.log(`📁 Downloads directory: ${downloadsDir}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
