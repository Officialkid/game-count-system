/**
 * Generate Render.com Environment Variable for Firebase Service Account
 * 
 * This script converts your firebase-service-account.json into a properly
 * formatted string that can be used as an environment variable on Render.com
 * 
 * Usage:
 *   node scripts/generate-render-env.js
 * 
 * Output:
 *   - Displays the formatted JSON string
 *   - Can be copied directly to Render.com environment variables
 */

const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_FILE = path.join(__dirname, '..', 'firebase-service-account.json');

console.log('🔧 Firebase Service Account → Render.com Environment Variable');
console.log('============================================================\n');

// Check if file exists
if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
  console.error('❌ Error: firebase-service-account.json not found!');
  console.error('   Expected location:', SERVICE_ACCOUNT_FILE);
  console.error('\n📖 How to get the file:');
  console.error('   1. Go to Firebase Console');
  console.error('   2. Project Settings → Service Accounts');
  console.error('   3. Generate New Private Key');
  console.error('   4. Save as firebase-service-account.json in project root\n');
  process.exit(1);
}

try {
  // Read the service account file
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));
  
  // Validate required fields
  const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Error: Invalid service account file!');
    console.error('   Missing fields:', missingFields.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Service account file validated');
  console.log(`   Project: ${serviceAccount.project_id}`);
  console.log(`   Email: ${serviceAccount.client_email}\n`);
  
  // Convert to single-line JSON
  const singleLineJson = JSON.stringify(serviceAccount);
  
  console.log('📋 Copy this value to Render.com:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(singleLineJson);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🚀 How to use on Render.com:');
  console.log('   1. Go to your Render.com dashboard');
  console.log('   2. Select your web service');
  console.log('   3. Environment → Add Environment Variable');
  console.log('   4. Key: FIREBASE_SERVICE_ACCOUNT_KEY');
  console.log('   5. Value: (paste the text above)');
  console.log('   6. Save Changes\n');
  
  // Statistics
  const jsonLength = singleLineJson.length;
  const hasPrivateKey = serviceAccount.private_key.includes('BEGIN PRIVATE KEY');
  
  console.log('📊 Statistics:');
  console.log(`   Length: ${jsonLength} characters`);
  console.log(`   Private Key: ${hasPrivateKey ? '✅ Valid PEM format' : '⚠️  Invalid format'}`);
  console.log(`   Newlines: ${(serviceAccount.private_key.match(/\\n/g) || []).length}\n`);
  
  // Optional: Save to file for easy copying
  const outputFile = path.join(__dirname, '..', 'firebase-env-variable.txt');
  fs.writeFileSync(outputFile, singleLineJson, 'utf8');
  console.log(`💾 Also saved to: ${outputFile}`);
  console.log('   You can copy from this file if the console output is truncated.\n');
  
  console.log('✅ Done! Your environment variable is ready for Render.com');
  
} catch (error) {
  console.error('❌ Error processing service account:', error.message);
  process.exit(1);
}
