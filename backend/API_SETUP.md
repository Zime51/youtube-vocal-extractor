# LALAL.AI API Setup Guide

## How to Get Your LALAL.AI API Key

### Step 1: Sign Up for LALAL.AI
1. Go to [https://www.lalal.ai/](https://www.lalal.ai/)
2. Click "Sign Up" or "Get Started"
3. Create an account with your email

### Step 2: Choose a Plan
LALAL.AI offers different plans:
- **Free Plan**: Limited usage (good for testing)
- **Plus Plan**: More processing time
- **Pro Plan**: Highest limits

### Step 3: Get Your API Key
1. After signing up, go to your account dashboard
2. Look for "API" or "Developer" section
3. Generate your API key (it will look like: `14abcde0`)

### Step 4: Configure Your Backend
1. Copy the example config file:
   ```bash
   cd backend
   cp config.example.js config.js
   ```

2. Edit `config.js` and add your API key:
   ```javascript
   module.exports = {
     lalalAiApiKey: 'your_actual_api_key_here', // Replace with your key
     port: 3000,
     maxFileSize: 100 * 1024 * 1024, // 100MB
     allowedAudioFormats: [
       'audio/mpeg',
       'audio/mp3', 
       'audio/wav',
       'audio/webm',
       'audio/ogg',
       'audio/m4a'
     ]
   };
   ```

3. Restart the server:
   ```bash
   ./start-server.sh restart
   ```

## API Usage Limits

According to the [LALAL.AI API documentation](https://www.lalal.ai/api/help/):

- **Free accounts**: Limited processing time
- **Paid accounts**: Higher limits based on your plan
- **File size limit**: 2GB with valid license, 1GB without
- **Processing time**: Varies by file length and complexity

## How It Works

The backend now uses the correct LALAL.AI API workflow:

1. **Upload**: Sends your MP3 file to LALAL.AI servers
2. **Process**: LALAL.AI uses their Phoenix AI model to separate vocals
3. **Download**: Downloads the separated vocal and instrumental tracks
4. **Deliver**: Your extension gets the real separated files

## Testing Without API Key

If you don't have an API key yet, the system will fall back to creating copies of the original file. This lets you test the workflow, but you won't get real vocal separation.

## Troubleshooting

- **"No valid API key"**: Make sure you've created `config.js` with your API key
- **"Upload failed"**: Check your internet connection and API key validity
- **"Processing timeout"**: Large files may take longer to process
- **"License not found"**: Your API key might be invalid or expired

## Support

- LALAL.AI Support: [https://www.lalal.ai/support](https://www.lalal.ai/support)
- API Documentation: [https://www.lalal.ai/api/help/](https://www.lalal.ai/api/help/)
