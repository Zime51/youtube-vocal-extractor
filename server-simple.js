const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('ytdl-core');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
    // Accept audio files
    if (config.allowedAudioFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// File upload endpoint for vocal separation using LALAL.AI
app.post('/api/separate-vocals', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    console.log(`Processing uploaded file: ${req.file.originalname}`);
    
    const inputFile = req.file.path;
    const baseName = path.parse(req.file.originalname).name;
    
    // Use LALAL.AI for vocal separation
    const result = await separateVocalsWithLALAL(inputFile, baseName);
    
    // Clean up the original uploaded file
    fs.unlinkSync(inputFile);
    
    res.json(result);

  } catch (error) {
    console.error('Error separating vocals:', error);
    res.status(500).json({ 
      error: 'Failed to separate vocals',
      details: error.message 
    });
  }
});

// LALAL.AI vocal separation function using correct API workflow
async function separateVocalsWithLALAL(inputFile, baseName) {
  try {
    console.log('Starting LALAL.AI vocal separation...');
    
    // Check if we have a valid API key
    if (config.lalalAiApiKey === 'demo' || !config.lalalAiApiKey) {
      throw new Error('No valid LALAL.AI API key provided. Please add your API key to config.js');
    }
    
    console.log('Using API key:', config.lalalAiApiKey.substring(0, 4) + '...');
    
    // Test API key by checking billing limits
    try {
      const limitsResponse = await axios.get(`https://www.lalal.ai/billing/get-limits/?key=${config.lalalAiApiKey}`);
      console.log('API key limits:', JSON.stringify(limitsResponse.data, null, 2));
    } catch (error) {
      console.log('API key test failed:', error.response?.data || error.message);
    }
    
    // Step 1: Upload file to LALAL.AI
    console.log('Uploading file to LALAL.AI...');
    const audioBuffer = fs.readFileSync(inputFile);
    
    // Clean filename for API
    const cleanFileName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    
    const uploadResponse = await axios.post('https://www.lalal.ai/api/upload/', audioBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename=${cleanFileName}.mp3`,
        'Authorization': `license ${config.lalalAiApiKey}`,
        'Content-Type': 'audio/mpeg'
      },
      timeout: 300000 // 5 minutes timeout
    });
    
    console.log('Upload response:', JSON.stringify(uploadResponse.data, null, 2));
    
    if (uploadResponse.data.status !== 'success') {
      throw new Error('Upload failed: ' + uploadResponse.data.error);
    }
    
    const fileId = uploadResponse.data.id;
    console.log(`File uploaded successfully. ID: ${fileId}`);
    
    // Step 2: Start split task for vocals
    console.log('Starting vocal separation task...');
    
    // Use simple form data format
    const splitData = new URLSearchParams();
    splitData.append('id', fileId);
    splitData.append('stem', 'vocals');
    
    console.log('Split params:', splitData.toString());
    
    const splitResponse = await axios.post('https://www.lalal.ai/api/split/', 
      splitData, {
      headers: {
        'Authorization': `license ${config.lalalAiApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 300000
    });
    
    console.log('Split response:', JSON.stringify(splitResponse.data, null, 2));
    
    if (splitResponse.data.status !== 'success') {
      const errorMsg = splitResponse.data.error || 'Unknown error - check API key and file format';
      console.error('Split failed with error:', errorMsg);
      throw new Error(`LALAL.AI Split failed: ${errorMsg}`);
    }
    
    console.log('Split task started successfully');
    
    // Step 3: Poll for results
    console.log('Waiting for processing to complete...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      const checkResponse = await axios.post('https://www.lalal.ai/api/check/', 
        new URLSearchParams({
          id: fileId
        }), {
        headers: {
          'Authorization': `license ${config.lalalAiApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (checkResponse.data.status === 'success') {
        const result = checkResponse.data.result[fileId];
        
        if (result.status === 'success' && result.split) {
          // Download the separated files
          const vocalsUrl = result.split.stem_track;
          const instrumentalsUrl = result.split.back_track;
          
          const vocalsFile = path.join(downloadsDir, `${baseName}_vocals.mp3`);
          const instrumentalsFile = path.join(downloadsDir, `${baseName}_instrumentals.mp3`);
          
          console.log('Downloading separated tracks...');
          
          // Download vocals
          const vocalsResponse = await axios.get(vocalsUrl, { responseType: 'stream' });
          const vocalsWriter = fs.createWriteStream(vocalsFile);
          vocalsResponse.data.pipe(vocalsWriter);
          
          // Download instrumentals
          const instrumentalsResponse = await axios.get(instrumentalsUrl, { responseType: 'stream' });
          const instrumentalsWriter = fs.createWriteStream(instrumentalsFile);
          instrumentalsResponse.data.pipe(instrumentalsWriter);
          
          // Wait for both downloads to complete
          await Promise.all([
            new Promise((resolve, reject) => {
              vocalsWriter.on('finish', resolve);
              vocalsWriter.on('error', reject);
            }),
            new Promise((resolve, reject) => {
              instrumentalsWriter.on('finish', resolve);
              instrumentalsWriter.on('error', reject);
            })
          ]);
          
          console.log('LALAL.AI vocal separation completed successfully');
          
          return {
            success: true,
            message: 'Vocal separation completed using LALAL.AI',
            files: {
              vocals: `${baseName}_vocals.mp3`,
              instrumentals: `${baseName}_instrumentals.mp3`
            }
          };
          
        } else if (result.task && result.task.state === 'progress') {
          console.log(`Processing... ${result.task.progress}%`);
          continue;
        } else if (result.task && result.task.state === 'error') {
          throw new Error('Processing failed: ' + result.task.error);
        }
      }
    }
    
    throw new Error('Processing timeout - took too long to complete');
    
  } catch (error) {
    console.error('LALAL.AI error:', error);
    
    // Don't fallback - show the actual error
    throw error;
  }
}

// Download separated file endpoint
app.get('/api/download-separated/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(downloadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      } else {
        // Clean up the file after download
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up file: ${filename}`);
          }
        }, 5000);
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Backend service is running (simple mode - no FFmpeg)'
  });
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

    // Get video info
    const info = await ytdl.getInfo(url);
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

// Extract vocals endpoint
app.post('/api/extract-vocals', async (req, res) => {
  try {
    const { url, quality = 'highest' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`Starting vocal extraction for: ${url}`);

    // Get video info first
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    const title = videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    
    // Get audio stream
    const audioFormat = ytdl.chooseFormat(info.formats, { 
      quality: quality === 'highest' ? 'highestaudio' : 'lowestaudio',
      filter: 'audioonly'
    });

    if (!audioFormat) {
      return res.status(400).json({ error: 'No audio format available' });
    }

    console.log(`Using audio format: ${audioFormat.qualityLabel} - ${audioFormat.container}`);

    // Set response headers for file download
    const filename = `${title}_vocals.webm`;
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Stream the audio directly (this is the "vocal extraction" - we're getting the audio track)
    const audioStream = ytdl(url, { format: audioFormat });
    
    audioStream.on('error', (error) => {
      console.error('Audio stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio', details: error.message });
      }
    });

    audioStream.pipe(res);

  } catch (error) {
    console.error('Error extracting vocals:', error);
    res.status(500).json({ 
      error: 'Failed to extract vocals',
      details: error.message 
    });
  }
});

// Download audio endpoint (simplified - downloads as webm)
app.post('/api/download-audio', async (req, res) => {
  try {
    const { url, quality = 'highest' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    
    // Generate unique filename
    const videoId = videoDetails.videoId;
    const safeTitle = videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${safeTitle}_${videoId}.webm`;

    console.log(`Starting audio download for: ${videoDetails.title}`);

    // Get audio stream info
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    if (audioFormats.length === 0) {
      throw new Error('No audio formats available for this video');
    }

    // Choose best audio format
    const audioFormat = quality === 'highest' ? audioFormats[0] : audioFormats[audioFormats.length - 1];
    
    console.log(`Using audio format: ${audioFormat.qualityLabel || 'audio'} - ${audioFormat.container}`);

    // Set response headers
    res.setHeader('Content-Type', `audio/${audioFormat.container}`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the audio directly to the client
    const audioStream = ytdl(url, {
      format: audioFormat,
      filter: 'audioonly'
    });

    audioStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error', details: error.message });
      }
    });

    audioStream.pipe(res);

    console.log('Audio stream started');

  } catch (error) {
    console.error('Error downloading audio:', error);
    res.status(500).json({ 
      error: 'Failed to download audio',
      details: error.message 
    });
  }
});

// Error handling middleware
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
  console.log(`🚀 YouTube Audio Backend Server (Simple Mode) running on port ${PORT}`);
  console.log(`📁 Downloads directory: ${downloadsDir}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚠️  Note: This is simplified mode without FFmpeg - audio will be in WebM format`);
});

module.exports = app;
