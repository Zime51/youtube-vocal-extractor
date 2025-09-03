#!/usr/bin/env python3
"""
Simple YouTube Downloader Server using yt-dlp
This is what most people are actually using in 2024
"""

import os
import json
import subprocess
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

# Configuration
DOWNLOAD_DIR = '/tmp/downloads'
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def download_youtube_audio(url, quality='best'):
    """Download YouTube audio using yt-dlp"""
    try:
        # yt-dlp options
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s'),
            'extractaudio': True,
            'audioformat': 'mp3',
            'audioquality': '320K' if quality == 'highest' else '128K',
            'noplaylist': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            
            # Download the audio
            ydl.download([url])
            
            # Find the downloaded file
            for file in os.listdir(DOWNLOAD_DIR):
                if file.endswith('.mp3'):
                    return os.path.join(DOWNLOAD_DIR, file), title
                    
        return None, None
        
    except Exception as e:
        print(f"Download error: {e}")
        return None, str(e)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'yt-dlp-server'})

@app.route('/api/download-audio', methods=['POST'])
def download_audio():
    try:
        data = request.get_json()
        url = data.get('url')
        quality = data.get('quality', 'medium')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
            
        print(f"Downloading: {url}")
        
        # Download the audio
        file_path, title = download_youtube_audio(url, quality)
        
        if not file_path:
            return jsonify({'error': f'Download failed: {title}'}), 500
            
        # Send the file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{title}.mp3",
            mimetype='audio/mpeg'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/video-info', methods=['POST'])
def video_info():
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
            
        ydl_opts = {'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
        return jsonify({
            'title': info.get('title'),
            'duration': info.get('duration'),
            'uploader': info.get('uploader'),
            'view_count': info.get('view_count')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)
