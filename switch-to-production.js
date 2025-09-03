#!/usr/bin/env node

// Script to switch extension URLs from local to production
// Usage: node switch-to-production.js https://your-app.railway.app

const fs = require('fs');
const path = require('path');

const productionUrl = process.argv[2];

if (!productionUrl) {
  console.log('Usage: node switch-to-production.js https://your-app.railway.app');
  process.exit(1);
}

console.log(`Switching to production URL: ${productionUrl}`);

// Files to update
const files = [
  'content.js',
  'popup.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace localhost URLs with production URL
    content = content.replace(/http:\/\/localhost:3000/g, productionUrl);
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${file}`);
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log('\n🎉 Extension updated for production!');
console.log('📦 You can now package and share the extension with your friends.');
