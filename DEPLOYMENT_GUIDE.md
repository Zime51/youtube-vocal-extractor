# 🚀 Deployment Guide - YouTube Vocal Extractor

## Deploy to Railway (Free Tier)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Prepare Your Repository
1. Push your code to GitHub (if not already done)
2. Make sure your `backend/` folder is in the repository

### Step 3: Deploy to Railway
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `backend` folder as the root directory

### Step 4: Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
LALAL_AI_API_KEY=aa4c8130aa5c4b0d
PORT=3000
NODE_ENV=production
```

### Step 5: Update Extension
After deployment, Railway will give you a URL like: `https://your-app-name.railway.app`

Update your extension files:
- `content.js` - Change `http://localhost:3000` to your Railway URL
- `popup.js` - Change `http://localhost:3000` to your Railway URL

### Step 6: Test
1. Your friends can now use the extension
2. The backend will run on Railway's servers
3. No need for local server setup

## Alternative: Deploy to Render (Free Tier)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: `Node`

### Step 3: Environment Variables
Add in Render dashboard:
```
LALAL_AI_API_KEY=aa4c8130aa5c4b0d
NODE_ENV=production
```

## Alternative: Deploy to Heroku (Free Tier Discontinued)
Heroku no longer offers free hosting, but Railway and Render are better alternatives.

## Important Notes

### Free Tier Limits:
- **Railway**: 500 hours/month free, $5 credit monthly
- **Render**: 750 hours/month free, sleeps after 15 min inactivity

### For Production Use:
- Consider upgrading to paid plans for better reliability
- Set up monitoring and logging
- Use a proper database for file storage if needed

### Security:
- Your API key will be visible in environment variables
- Consider using a separate API key for production
- Monitor usage to avoid exceeding API limits

## Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in `package.json`
2. **Environment variables**: Make sure they're set in the hosting platform
3. **CORS errors**: The current CORS config should work for production
4. **File uploads**: Free tiers have file size limits

### Testing:
1. Deploy the backend first
2. Test the backend URL directly: `https://your-app.railway.app/api/health`
3. Update extension with new URL
4. Test full functionality

## Next Steps After Deployment:
1. Share the extension with friends
2. Monitor usage and performance
3. Consider upgrading if you hit limits
4. Set up proper logging and monitoring
