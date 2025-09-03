// Configuration file for YouTube Vocal Extractor Backend
// Copy this file to config.js and add your API keys

module.exports = {
  // LALAL.AI API Configuration
  // Get your API key from: https://www.lalal.ai/api/
  lalalAiApiKey: 'your_api_key_here',
  
  // Server Configuration
  port: 3000,
  
  // File upload limits
  maxFileSize: 100 * 1024 * 1024, // 100MB
  
  // Allowed audio formats
  allowedAudioFormats: [
    'audio/mpeg',
    'audio/mp3', 
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a'
  ]
};
