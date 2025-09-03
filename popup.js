// Popup script for YouTube Vocal Extractor
class PopupController {
  constructor() {
    this.selectedQuality = 'medium';
    this.selectedFile = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadVideoInfo();
    this.setupFileUpload();
  }

  bindEvents() {
    // Download quality selection
    document.querySelectorAll('.download-option').forEach(option => {
      option.addEventListener('click', () => {
        this.selectQuality(option.dataset.quality);
      });
    });

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
      this.downloadAudio();
    });

    // Extract button
    document.getElementById('extractBtn').addEventListener('click', () => {
      this.extractVocals();
    });
  }

  selectQuality(quality) {
    // Remove previous selection
    document.querySelectorAll('.download-option').forEach(option => {
      option.classList.remove('selected');
    });

    // Select new quality
    document.querySelector(`[data-quality="${quality}"]`).classList.add('selected');
    this.selectedQuality = quality;
  }

  setupFileUpload() {
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('fileInput');

    // Click to browse
    fileUpload.addEventListener('click', () => {
      fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Drag and drop
    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.classList.add('dragover');
    });

    fileUpload.addEventListener('dragleave', () => {
      fileUpload.classList.remove('dragover');
    });

    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  handleFileSelect(file) {
    if (!file.type.startsWith('audio/')) {
      this.showStatus('Please select an audio file', 'error');
      return;
    }

    this.selectedFile = file;
    const fileUpload = document.getElementById('fileUpload');
    const extractBtn = document.getElementById('extractBtn');

    // Update UI
    fileUpload.innerHTML = `
      <div class="upload-icon">✅</div>
      <div class="upload-text">${file.name}</div>
      <div style="font-size: 10px; color: #666;">${(file.size / 1024 / 1024).toFixed(1)} MB</div>
    `;
    fileUpload.style.borderColor = '#28a745';

    // Enable extract button
    extractBtn.disabled = false;
    this.showStatus(`Audio file loaded: ${file.name}`, 'success');
  }

  async loadVideoInfo() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url && tab.url.includes('youtube.com/watch')) {
        // Send message to content script to get video info with error handling
        chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Failed to communicate with content script:', chrome.runtime.lastError.message);
            this.showNoVideo();
            return;
          }
          
          if (response && response.videoId) {
            this.updateVideoInfo(response);
          } else {
            this.showNoVideo();
          }
        });
      } else {
        this.showNoVideo();
      }
    } catch (error) {
      console.error('Error loading video info:', error);
      this.showNoVideo();
    }
  }

  updateVideoInfo(videoInfo) {
    document.getElementById('videoTitle').textContent = videoInfo.title || 'Unknown Title';
    document.getElementById('videoDuration').textContent = `Duration: ${videoInfo.duration || 'Unknown'}`;
    document.getElementById('videoUrl').textContent = `URL: ${videoInfo.url || 'Not available'}`;
  }

  showNoVideo() {
    document.getElementById('videoTitle').textContent = 'No YouTube video detected';
    document.getElementById('videoDuration').textContent = 'Duration: Unknown';
    document.getElementById('videoUrl').textContent = 'URL: Not available';
  }

  async downloadAudio() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('youtube.com/watch')) {
        this.showStatus('Please navigate to a YouTube video first', 'error');
        return;
      }

      this.showStatus(`Attempting ${this.selectedQuality} quality download...`, 'info');

      // Send message to content script to download audio with error handling
      chrome.tabs.sendMessage(tab.id, { 
        action: 'downloadAudio',
        quality: this.selectedQuality
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to communicate with content script:', chrome.runtime.lastError.message);
          this.showStatus('❌ INSTALLATION FAILED: Cannot communicate with YouTube page', 'error');
          return;
        }
        
        if (response && response.success) {
          this.showStatus(`✅ ${this.selectedQuality} quality audio download started!`, 'success');
        } else {
          this.showStatus('❌ INSTALLATION FAILED: Audio capture not supported', 'error');
        }
      });

    } catch (error) {
      console.error('Error downloading audio:', error);
      this.showStatus('❌ INSTALLATION FAILED: ' + error.message, 'error');
    }
  }

  async extractVocals() {
    if (!this.selectedFile) {
      this.showStatus('Please select an audio file first', 'error');
      return;
    }

    try {
      this.showStatus('Starting vocal separation...', 'info');
      this.showProgress(0, 'Starting vocal separation...');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audioFile', this.selectedFile);

      // Send to backend for vocal separation with progress streaming
      // For local development: 'http://localhost:3000/api/separate-vocals'
      // For production: 'https://your-app.railway.app/api/separate-vocals'
      const response = await fetch('http://localhost:3000/api/separate-vocals', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle Server-Sent Events for progress updates
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                this.showProgress(data.progress, data.message);
              } else if (data.type === 'complete') {
                result = data.result;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      if (result && result.success) {
        this.showStatus('Vocal separation completed! Downloading files...', 'success');
        
        // Download both files
        await this.downloadSeparatedFile(result.files.vocals);
        await this.downloadSeparatedFile(result.files.instrumentals);
        
        this.showStatus('✅ Both vocal and instrumental tracks downloaded!', 'success');
        this.hideProgress();
      } else {
        this.showStatus('Failed to separate vocals. Please try again.', 'error');
        this.hideProgress();
      }

    } catch (error) {
      console.error('Error extracting vocals:', error);
      this.hideProgress();
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        this.showStatus('❌ Cannot connect to backend service. Make sure the server is running.', 'error');
      } else {
        this.showStatus('❌ Error: ' + error.message, 'error');
      }
    }
  }

  async downloadSeparatedFile(filename) {
    try {
      // For local development: 'http://localhost:3000/api/download-separated/'
      // For production: 'https://your-app.railway.app/api/download-separated/'
      const response = await fetch(`http://localhost:3000/api/download-separated/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async getVideoInfo() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, (response) => {
        resolve(response || {});
      });
    });
  }

  showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
  }

  showProgress(percent, message) {
    let progressContainer = document.getElementById('progress-container');
    if (!progressContainer) {
      // Create progress container if it doesn't exist
      progressContainer = document.createElement('div');
      progressContainer.id = 'progress-container';
      progressContainer.innerHTML = `
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-text" id="progress-text"></div>
      `;
      document.body.appendChild(progressContainer);
    }

    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}% - ${message}`;
    
    progressContainer.style.display = 'block';
  }

  hideProgress() {
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

