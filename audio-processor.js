// Advanced Audio Processor for Vocal Extraction
class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.sampleRate = 44100;
    this.init();
  }

  init() {
    // Initialize Web Audio API context
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API not supported:', error);
    }
  }

  async processAudio(audioBuffer) {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    console.log('Processing audio for vocal extraction...');
    
    // Step 1: Apply pre-processing filters
    const preprocessed = await this.preprocessAudio(audioBuffer);
    
    // Step 2: Apply spectral analysis for vocal detection
    const vocalMask = await this.detectVocals(preprocessed);
    
    // Step 3: Apply vocal isolation
    const isolatedVocals = await this.isolateVocals(preprocessed, vocalMask);
    
    // Step 4: Apply post-processing
    const finalVocals = await this.postprocessVocals(isolatedVocals);
    
    return finalVocals;
  }

  async preprocessAudio(audioBuffer) {
    console.log('Preprocessing audio...');
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create filters for preprocessing
    const highPassFilter = this.audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 80; // Remove low frequency noise
    
    const lowPassFilter = this.audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 8000; // Focus on vocal frequency range
    
    // Create compressor for dynamic range
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // Connect the audio processing chain
    source.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    lowPassFilter.connect(compressor);
    
    // Create output buffer
    const outputBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Process the audio
    compressor.connect(this.audioContext.destination);
    source.start();
    
    // Wait for processing to complete
    await new Promise(resolve => {
      setTimeout(resolve, audioBuffer.duration * 1000);
    });
    
    return outputBuffer;
  }

  async detectVocals(audioBuffer) {
    console.log('Detecting vocal frequencies...');
    
    // Perform spectral analysis to identify vocal frequencies
    const vocalFrequencies = this.analyzeVocalFrequencies(audioBuffer);
    
    // Create frequency mask for vocals
    const vocalMask = this.createVocalMask(vocalFrequencies, audioBuffer);
    
    return vocalMask;
  }

  analyzeVocalFrequencies(audioBuffer) {
    const vocalFreqRanges = [
      { min: 85, max: 180 },   // Male vocals
      { min: 165, max: 255 },  // Female vocals
      { min: 250, max: 400 },  // Child vocals
      { min: 400, max: 800 },  // Harmonics
      { min: 800, max: 1600 }, // Upper harmonics
      { min: 1600, max: 3200 } // Sibilance
    ];
    
    // Analyze frequency content
    const fftSize = 2048;
    const frequencyData = new Float32Array(fftSize / 2);
    
    // Get frequency data from audio buffer
    const channelData = audioBuffer.getChannelData(0);
    const fft = new FFT(fftSize);
    fft.forward(channelData);
    
    // Identify vocal frequency ranges
    const vocalFrequencies = [];
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * this.audioContext.sampleRate / fftSize;
      const magnitude = fft.spectrum[i];
      
      // Check if frequency falls in vocal ranges
      for (const range of vocalFreqRanges) {
        if (frequency >= range.min && frequency <= range.max) {
          vocalFrequencies.push({
            frequency,
            magnitude,
            range
          });
        }
      }
    }
    
    return vocalFrequencies;
  }

  createVocalMask(vocalFrequencies, audioBuffer) {
    // Create a frequency mask based on vocal analysis
    const mask = new Float32Array(audioBuffer.length);
    
    // Apply vocal frequency weighting
    vocalFrequencies.forEach(vocal => {
      const binIndex = Math.floor(vocal.frequency * audioBuffer.length / this.audioContext.sampleRate);
      if (binIndex < mask.length) {
        mask[binIndex] = vocal.magnitude * 0.8; // Vocal emphasis
      }
    });
    
    return mask;
  }

  async isolateVocals(audioBuffer, vocalMask) {
    console.log('Isolating vocals...');
    
    // Create output buffer for isolated vocals
    const outputBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Apply vocal mask to each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      for (let i = 0; i < inputData.length; i++) {
        // Apply vocal mask
        const maskValue = vocalMask[i] || 0;
        outputData[i] = inputData[i] * maskValue;
      }
    }
    
    return outputBuffer;
  }

  async postprocessVocals(audioBuffer) {
    console.log('Post-processing vocals...');
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Apply final processing chain
    const equalizer = this.createVocalEqualizer();
    const reverb = this.createSubtleReverb();
    const limiter = this.createLimiter();
    
    // Connect processing chain
    source.connect(equalizer);
    equalizer.connect(reverb);
    reverb.connect(limiter);
    
    // Create output buffer
    const outputBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Process
    limiter.connect(this.audioContext.destination);
    source.start();
    
    await new Promise(resolve => {
      setTimeout(resolve, audioBuffer.duration * 1000);
    });
    
    return outputBuffer;
  }

  createVocalEqualizer() {
    // Create a multi-band equalizer optimized for vocals
    const bands = [
      { frequency: 100, type: 'lowshelf', gain: -6 },   // Reduce low end
      { frequency: 250, type: 'peaking', gain: 3 },     // Enhance warmth
      { frequency: 1000, type: 'peaking', gain: 2 },   // Enhance presence
      { frequency: 3000, type: 'peaking', gain: 4 },    // Enhance clarity
      { frequency: 8000, type: 'highshelf', gain: -2 } // Reduce harshness
    ];
    
    const filters = bands.map(band => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      return filter;
    });
    
    // Connect filters in series
    filters.reduce((prev, curr) => {
      prev.connect(curr);
      return curr;
    });
    
    return filters[0];
  }

  createSubtleReverb() {
    // Create a subtle reverb for natural vocal sound
    const convolver = this.audioContext.createConvolver();
    
    // Generate impulse response for reverb
    const impulseLength = this.audioContext.sampleRate * 0.1; // 100ms
    const impulse = this.audioContext.createBuffer(1, impulseLength, this.audioContext.sampleRate);
    const impulseData = impulse.getChannelData(0);
    
    for (let i = 0; i < impulseLength; i++) {
      impulseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.01));
    }
    
    convolver.buffer = impulse;
    return convolver;
  }

  createLimiter() {
    // Create a limiter to prevent clipping
    const limiter = this.audioContext.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    return limiter;
  }

  // Utility function to convert audio buffer to WAV
  audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
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
}

// Simple FFT implementation for spectral analysis
class FFT {
  constructor(size) {
    this.size = size;
    this.spectrum = new Float32Array(size / 2);
  }

  forward(buffer) {
    // Simplified FFT implementation
    // In a real implementation, you would use a proper FFT library
    for (let i = 0; i < this.spectrum.length; i++) {
      let real = 0;
      let imag = 0;
      
      for (let j = 0; j < buffer.length; j++) {
        const angle = -2 * Math.PI * i * j / buffer.length;
        real += buffer[j] * Math.cos(angle);
        imag += buffer[j] * Math.sin(angle);
      }
      
      this.spectrum[i] = Math.sqrt(real * real + imag * imag);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioProcessor;
}
