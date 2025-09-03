// Content script for YouTube Vocal Extractor
class YouTubeVocalExtractor {
  constructor() {
    this.isProcessing = false;
    this.currentVideoId = null;
    this.init();
  }

  init() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Content script received message:', request.action);
      
      try {
        if (request.action === 'extractVocals') {
          this.extractVocalsFromCurrentVideo();
          sendResponse({ success: true });
        } else if (request.action === 'getVideoInfo') {
          const videoInfo = this.getVideoInfo();
          sendResponse(videoInfo);
        } else if (request.action === 'downloadAudio') {
          this.downloadAudioFromVideo(request.quality);
          sendResponse({ success: true });
        } else if (request.action === 'extractionComplete') {
          this.handleExtractionComplete(request);
        } else {
          sendResponse({ success: false, error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Error handling message in content script:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // Keep message channel open
    });

    // Test connection to background script with retry logic
    this.testBackgroundConnection();

    console.log('YouTube Vocal Extractor: Content script loaded');
  }

  testBackgroundConnection() {
    const maxRetries = 3;
    let retryCount = 0;

    const attemptConnection = () => {
      chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`Background script connection attempt ${retryCount + 1} failed:`, chrome.runtime.lastError.message);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Retry after a delay
            setTimeout(attemptConnection, 1000 * retryCount);
          } else {
            console.warn('Background script connection failed after all retries. Extension will work in limited mode.');
          }
        } else {
          console.log('Background script connection successful');
        }
      });
    };

    // Start connection test after a short delay
    setTimeout(attemptConnection, 500);
  }

  getVideoInfo() {
    const videoId = this.getCurrentVideoId();
    const title = this.getVideoTitle();
    const duration = this.getVideoDuration();
    
    return {
      videoId,
      title,
      duration,
      url: window.location.href
    };
  }

  getCurrentVideoId() {
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  getVideoTitle() {
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer');
    return titleElement ? titleElement.textContent.trim() : 'Unknown Title';
  }

  getVideoDuration() {
    const durationElement = document.querySelector('.ytp-time-duration');
    return durationElement ? durationElement.textContent : 'Unknown';
  }

  async downloadAudioFromVideo(quality = 'medium') {
    try {
      console.log('Starting audio download from YouTube video...');
      console.log('Quality selected:', quality);
      
      // Get current YouTube URL
      const currentUrl = window.location.href;
      if (!currentUrl.includes('youtube.com/watch')) {
        this.showInstallFailed('Not on a YouTube video page');
        return;
      }

      console.log('YouTube URL found, sending to backend service...');
      
      // Send to backend service for real audio extraction
      await this.downloadAudioFromBackend(currentUrl, quality);

    } catch (error) {
      console.error('Error downloading audio:', error);
      this.showInstallFailed(`Download failed: ${error.message}`);
    }
  }

  async downloadAudioFromBackend(youtubeUrl, quality) {
    try {
      console.log('Sending request to backend service...');
      
      // Show loading notification
      this.showUserNotification('Downloading audio from YouTube...', 'info');
      
      // Backend service URL (update this to your actual backend URL)
      // For local development: 'http://localhost:3000/api/download-audio'
      // For production: 'https://your-app.railway.app/api/download-audio'
      const backendUrl = 'http://localhost:3000/api/download-audio';
      
      // Send request to backend
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          quality: quality === 'high' ? 'highest' : 'lowest'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Get the audio file
      const audioBlob = await response.blob();
      console.log('Audio file received from backend:', audioBlob.size, 'bytes');

      // Create filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('Content-Disposition header:', contentDisposition);
      let filename = 'youtube_audio.mp3';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        console.log('Filename match:', filenameMatch);
        if (filenameMatch) {
          filename = filenameMatch[1];
          console.log('Using filename from header:', filename);
        }
      } else {
        console.log('No Content-Disposition header found, using default filename');
      }

      // Download the file
      this.downloadBlob(audioBlob, filename);
      
      // Show success notification
      this.showUserNotification('✅ Audio download completed successfully!', 'success');

    } catch (error) {
      console.error('Backend download failed:', error);
      
      if (error.message.includes('fetch')) {
        this.showInstallFailed('Cannot connect to backend service. Make sure the server is running on localhost:3000');
      } else {
        this.showInstallFailed(`Backend error: ${error.message}`);
      }
    }
  }

  downloadBlob(blob, filename) {
    try {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('File downloaded:', filename);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  // Removed synthetic audio generation methods - extension only attempts real capture

  async captureRealAudio(videoElement, quality) {
    console.log('Attempting to capture real audio from video...');
    
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported in this browser');
      }

      // Check if video element has a valid source
      if (!videoElement.src && !videoElement.currentSrc) {
        throw new Error('Video element has no valid source');
      }

      // Get the video stream with error handling
      let stream;
      try {
        stream = videoElement.captureStream();
        console.log('Video stream captured:', stream);
      } catch (streamError) {
        console.warn('Failed to capture video stream:', streamError.message);
        throw new Error('Cannot capture video stream - YouTube security restrictions prevent audio extraction');
      }

      // Try different MIME types for better compatibility
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];

      let mediaRecorder;
      let mimeType = null;

      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log('Using MIME type:', type);
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      // Create MediaRecorder with error handling
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (recorderError) {
        console.warn('Failed to create MediaRecorder:', recorderError.message);
        throw new Error('Cannot create MediaRecorder - browser security restrictions');
      }

      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        try {
          // Create blob from chunks
          const audioBlob = new Blob(audioChunks, { type: mimeType });
          console.log('Audio blob created:', audioBlob.size, 'bytes');

          if (audioBlob.size === 0) {
            throw new Error('No audio data captured - YouTube blocks audio extraction');
          }

          // Convert to WAV format
          const wavData = await this.convertWebmToWav(audioBlob);
          
          // Create filename
          const videoInfo = this.getVideoInfo();
          const filename = `${videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_${quality}_quality.wav`;
          
          console.log('Sending real audio file for download:', filename);
          console.log('Real WAV data size:', wavData.byteLength);
          
          // Send to background script for download with error handling
          chrome.runtime.sendMessage({
            action: 'downloadAudioFile',
            filename: filename,
            audioData: wavData,
            quality: quality
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Failed to send real audio to background script:', chrome.runtime.lastError);
              throw new Error('Failed to communicate with extension background script');
            } else {
              console.log('Real audio file sent to background script successfully');
              this.showUserNotification('Audio download completed successfully!', 'success');
            }
          });

        } catch (error) {
          console.error('Error processing real audio:', error);
          throw new Error(`Audio processing failed: ${error.message}`);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        throw new Error(`MediaRecorder failed: ${event.error.message}`);
      };

      // Start recording with shorter duration to avoid timeouts
      console.log('Starting audio recording...');
      mediaRecorder.start(1000); // Collect data every second
      
      // Record for 5 seconds (reduced from 10 to avoid timeouts)
      setTimeout(() => {
        console.log('Stopping audio recording...');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);

    } catch (error) {
      console.error('Error capturing real audio:', error);
      throw error;
    }
  }

  async convertWebmToWav(webmBlob) {
    console.log('Converting WebM to WAV...');
    
    try {
      // Convert blob to array buffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio decoded:', audioBuffer.duration, 'seconds');
      
      // Convert to WAV format
      return this.audioBufferToWav(audioBuffer);
      
    } catch (error) {
      console.error('Error converting WebM to WAV:', error);
      throw error;
    }
  }

  audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const fileSize = 36 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }

  showStatus(message, type = 'info') {
    console.log(`YouTube Vocal Extractor: ${message}`);
  }

  handleExtractionComplete(request) {
    if (request.success) {
      this.showStatus(`✅ Vocal extraction completed! File: ${request.filename}`, 'success');
      this.isProcessing = false;
    } else {
      this.showStatus(`❌ Extraction failed: ${request.error}`, 'error');
      this.isProcessing = false;
    }
  }

  createDirectDownload(wavData, filename) {
    console.log('Creating direct download link...');
    
    try {
      // Create a blob from the WAV data
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Add to page and click
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Direct download completed:', filename);
      
    } catch (error) {
      console.error('Error creating direct download:', error);
      // Show user-friendly message
      this.showUserNotification(`Download failed: ${error.message}. Please try again.`, 'error');
    }
  }

  showInstallFailed(reason) {
    console.error('Extension installation failed:', reason);
    
    // Create a prominent failure notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      border: 2px solid #cc0000;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 20px; margin-bottom: 10px;">❌ INSTALLATION FAILED</div>
      <div style="font-size: 14px; margin-bottom: 15px;">${reason}</div>
      <div style="font-size: 12px; opacity: 0.8;">
        YouTube blocks audio extraction for security reasons.<br>
        This extension cannot work on YouTube videos.
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  showUserNotification(message, type = 'info') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  async extractVocalsFromCurrentVideo() {
    if (this.isProcessing) {
      this.showUserNotification('Already processing a video...', 'error');
      return;
    }

    const videoId = this.getCurrentVideoId();
    if (!videoId) {
      this.showUserNotification('No video found on this page', 'error');
      return;
    }

    this.isProcessing = true;
    this.showUserNotification('Starting vocal extraction...', 'info');

    try {
      // Get current YouTube URL
      const youtubeUrl = window.location.href;
      
      // Use backend service for vocal extraction
      await this.extractVocalsFromBackend(youtubeUrl, 'highest');

    } catch (error) {
      console.error('Error extracting vocals:', error);
      this.showUserNotification('Error: ' + error.message, 'error');
      this.isProcessing = false;
    }
  }

  async extractVocalsFromBackend(youtubeUrl, quality) {
    // YouTube blocks direct audio extraction, show installation failed message
    this.showUserNotification('❌ INSTALLATION FAILED: Cannot extract vocals directly from YouTube. Please download the audio first, then upload it for vocal separation.', 'error');
    this.isProcessing = false;
    throw new Error('INSTALLATION FAILED: Cannot extract vocals directly from YouTube');
  }
}

// Initialize the extractor when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new YouTubeVocalExtractor();
  });
} else {
  new YouTubeVocalExtractor();
}
