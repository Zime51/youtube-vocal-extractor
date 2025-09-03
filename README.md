# YouTube Vocal Extractor Chrome Extension

A powerful Chrome extension that allows you to export YouTube videos, extract audio, and isolate vocals using advanced audio processing techniques.

## Features

- 🎤 **Vocal Extraction**: Advanced spectral analysis to isolate vocals from music
- 🎵 **Audio Processing**: Multi-band equalization and dynamic processing
- 📹 **YouTube Integration**: Seamless integration with YouTube video pages
- 🎨 **Modern UI**: Beautiful gradient interface with real-time status updates
- ⚡ **Real-time Processing**: Web Audio API for efficient audio processing

## Installation

### Prerequisites

- Google Chrome browser
- YouTube video access
- Basic understanding of Chrome extensions

### Installation Steps

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd youtube-vocal-extractor
   ```

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the extension folder
   - The extension should now appear in your extensions list

3. **Verify Installation**
   - Navigate to any YouTube video page
   - You should see a floating "🎤 Extract Vocals" button on the right side
   - Click the extension icon in the toolbar to open the popup

## Usage

### Basic Usage

1. **Navigate to a YouTube Video**
   - Go to any YouTube video you want to extract vocals from
   - The extension will automatically detect the video

2. **Extract Vocals**
   - Click the floating "🎤 Extract Vocals" button on the page
   - Or use the extension popup and click "Extract Vocals"
   - The extension will start processing the video

3. **Monitor Progress**
   - Watch the status updates in the popup
   - Progress bar shows processing status
   - Check your downloads folder for the final vocal file

### Advanced Features

- **Real-time Processing**: Audio is processed using Web Audio API
- **Spectral Analysis**: Advanced frequency analysis for vocal detection
- **Multi-band Processing**: Optimized equalization for vocal enhancement
- **Dynamic Range Compression**: Professional audio processing

## Technical Details

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content Script │    │  Background Script │    │   Audio Processor │
│                 │    │                 │    │                 │
│ • YouTube UI    │◄──►│ • Video Download │◄──►│ • Spectral Analysis│
│ • Video Detection│    │ • Audio Extraction│    │ • Vocal Isolation │
│ • User Interface│    │ • File Management│    │ • Post-processing │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Audio Processing Pipeline

1. **Pre-processing**
   - High-pass filter (80Hz) to remove low-frequency noise
   - Low-pass filter (8kHz) to focus on vocal range
   - Dynamic range compression

2. **Vocal Detection**
   - Spectral analysis using FFT
   - Frequency range identification (85Hz - 3.2kHz)
   - Vocal mask creation

3. **Vocal Isolation**
   - Frequency mask application
   - Multi-channel processing
   - Harmonic enhancement

4. **Post-processing**
   - Multi-band equalization
   - Subtle reverb addition
   - Limiting to prevent clipping

### File Structure

```
youtube-vocal-extractor/
├── manifest.json          # Extension configuration
├── content.js            # YouTube page integration
├── background.js         # Background processing
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── audio-processor.js    # Advanced audio processing
└── README.md             # This file
```

## Limitations

### Current Limitations

- **Browser-based Processing**: Limited by Web Audio API capabilities
- **Video Download**: Requires external service integration (yt-dlp)
- **Processing Time**: Real-time processing may be slower for long videos
- **Quality**: Browser-based processing may not match professional tools

### Future Improvements

- **Backend Integration**: Server-side processing for better quality
- **Machine Learning**: Integration with Spleeter or similar ML models
- **Batch Processing**: Process multiple videos simultaneously
- **Format Support**: Support for more audio formats
- **Cloud Processing**: Offload processing to cloud services

## Troubleshooting

### Common Issues

1. **Extension Not Loading**
   - Ensure Developer mode is enabled
   - Check for any console errors
   - Try reloading the extension

2. **No Video Detected**
   - Make sure you're on a YouTube video page
   - Refresh the page and try again
   - Check if the video is publicly accessible

3. **Processing Fails**
   - Check browser console for errors
   - Ensure Web Audio API is supported
   - Try with a shorter video first

4. **Audio Quality Issues**
   - This is a demo implementation
   - For professional results, consider using dedicated tools

### Debug Mode

Enable debug logging by opening the browser console and looking for:
- `YouTubeVocalExtractor` messages
- `BackgroundProcessor` messages
- `AudioProcessor` messages

## Legal Considerations

### Important Notes

- **Copyright**: Respect copyright laws and only extract vocals from content you own or have permission to use
- **Terms of Service**: Ensure compliance with YouTube's Terms of Service
- **Fair Use**: Consider fair use guidelines for your specific use case
- **Commercial Use**: Additional licensing may be required for commercial applications

### Disclaimer

This extension is provided for educational and personal use only. Users are responsible for ensuring they have the necessary rights to process any audio content.

## Contributing

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd youtube-vocal-extractor
   ```

2. **Make Changes**
   - Edit the relevant files
   - Test in Chrome with Developer mode
   - Ensure all functionality works

3. **Submit Changes**
   - Create a pull request
   - Include detailed description of changes
   - Test thoroughly before submitting

### Areas for Contribution

- **Audio Processing**: Improve vocal extraction algorithms
- **UI/UX**: Enhance user interface and experience
- **Performance**: Optimize processing speed and efficiency
- **Compatibility**: Add support for more browsers
- **Documentation**: Improve code documentation and user guides

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, questions, or feature requests:
- Create an issue on the GitHub repository
- Check the troubleshooting section above
- Review the technical documentation

---

**Note**: This is a demonstration extension. For professional audio processing, consider using dedicated tools like Spleeter, Audacity, or professional audio software.
