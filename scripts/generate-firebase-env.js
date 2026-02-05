/**
 * Generate FIREBASE_SERVICE_ACCOUNT_KEY for production deployment
 * This script converts firebase-service-account.json to a single-line string
 * 
 * Usage: node scripts/generate-firebase-env.js
 */

const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

try {
  // Check if file exists
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: firebase-service-account.json not found!');
    console.log('\n📝 To get this file:');
    console.log('   1. Go to Firebase Console: https://console.firebase.google.com');
    console.log('   2. Select project: combinedactivities-7da43');
    console.log('   3. Go to Project Settings > Service Accounts');
    console.log('   4. Click "Generate New Private Key"');
    console.log('   5. Save as firebase-service-account.json in project root\n');
    process.exit(1);
  }

  // Read and parse the JSON file
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  // Convert to single-line string (important for environment variables)
  const singleLineJson = JSON.stringify(serviceAccount);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Firebase Service Account Key Generated Successfully!');
  console.log('='.repeat(80));
  console.log('\n📋 Copy the value below and add it to your Render environment variables:\n');
  console.log('Variable Name: FIREBASE_SERVICE_ACCOUNT_KEY');
  console.log('Variable Value:\n');
  console.log(singleLineJson);
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Instructions for Render:');
  console.log('   1. Go to Render Dashboard');
  console.log('   2. Select your service: game-count-system');
  console.log('   3. Go to Environment tab');
  console.log('   4. Add new environment variable:');
  console.log('      Key: FIREBASE_SERVICE_ACCOUNT_KEY');
  console.log('      Value: (paste the JSON string above)');
  console.log('   5. Click "Save Changes"');
  console.log('   6. Render will automatically redeploy\n');
  console.log('='.repeat(80));
  console.log('\n⚠️  SECURITY WARNING:');
  console.log('   - Keep this value SECRET');
  console.log('   - Never commit to Git');
  console.log('   - Only use in secure environment variables\n');

} catch (error) {
  console.error('❌ Error reading service account file:', error.message);
  process.exit(1);
}
