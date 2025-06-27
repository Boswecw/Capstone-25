// 1. server/scripts/testCloudStorage.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🧪 Testing Google Cloud Storage Configuration...\n');

async function testCloudStorageConnection() {
  try {
    console.log('📋 Checking Environment Variables:');
    const requiredVars = ['GOOGLE_CLOUD_PROJECT_ID', 'GOOGLE_CLOUD_BUCKET_NAME'];

    let missingVars = [];
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: ${value}`);
      } else {
        console.log(`   ❌ ${varName}: NOT SET`);
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.log('\n🚨 Missing required environment variables!');
      console.log('Please add these to your .env file:');
      missingVars.forEach(varName => {
        console.log(`${varName}=your-value-here`);
      });
      process.exit(1);
    }

    console.log('\n🔑 Checking Service Account Key:');
    const keyFilePath = path.join(__dirname, '../config/google-cloud-storage-key.json');
    try {
      const fs = await import('fs');
      if (fs.existsSync(keyFilePath)) {
        console.log(`   ✅ Service account key found: ${keyFilePath}`);
      } else {
        console.log(`   ⚠️  Service account key not found: ${keyFilePath}`);
        console.log('   📝 You can still test with Application Default Credentials');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check key file: ${error.message}`);
    }

    console.log('\n☁️  Initializing Google Cloud Storage...');
    const storageConfig = { projectId: process.env.GOOGLE_CLOUD_PROJECT_ID };
    try {
      const fs = await import('fs');
      if (fs.existsSync(keyFilePath)) {
        storageConfig.keyFilename = keyFilePath;
      }
    } catch (error) {}

    const storage = new Storage(storageConfig);
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);

    console.log(`   🪣 Testing bucket access: ${bucketName}`);
    const [exists] = await bucket.exists();
    if (exists) {
      console.log(`   ✅ Bucket '${bucketName}' exists and is accessible`);
    } else {
      console.log(`   ❌ Bucket '${bucketName}' does not exist or is not accessible`);
      console.log('   💡 Create the bucket in Google Cloud Console first');
      return false;
    }

    console.log('\n📊 Getting Bucket Metadata:');
    try {
      const [metadata] = await bucket.getMetadata();
      console.log(`   ✅ Bucket location: ${metadata.location}`);
      console.log(`   ✅ Storage class: ${metadata.storageClass}`);
      console.log(`   ✅ Created: ${metadata.timeCreated}`);
    } catch (error) {
      console.log(`   ⚠️  Could not get metadata: ${error.message}`);
    }

    console.log('\n📁 Testing File Listing:');
    try {
      const [files] = await bucket.getFiles({ maxResults: 5 });
      console.log(`   ✅ Successfully listed files: ${files.length} files found`);
      if (files.length > 0) {
        console.log('   📄 Sample files:');
        files.slice(0, 3).forEach(file => console.log(`      - ${file.name}`));
      } else {
        console.log('   📄 Bucket is empty (this is normal for new buckets)');
      }
    } catch (error) {
      console.log(`   ❌ Could not list files: ${error.message}`);
      return false;
    }

    console.log('\n✍️  Testing Write Permissions:');
    try {
      const testFileName = `test/connection-test-${Date.now()}.txt`;
      const testContent = `Cloud Storage test file created at ${new Date().toISOString()}`;

      const file = bucket.file(testFileName);
      await file.save(testContent, { metadata: { contentType: 'text/plain' } });
      console.log(`   ✅ Successfully created test file: ${testFileName}`);
      await file.delete();
      console.log(`   ✅ Successfully deleted test file`);
    } catch (error) {
      console.log(`   ❌ Write test failed: ${error.message}`);
      console.log('   💡 Check your service account permissions');
      return false;
    }

    console.log('\n🎉 All Google Cloud Storage tests passed!');
    console.log('✅ Your cloud storage integration is ready to use.');
    return true;

  } catch (error) {
    console.error('\n💥 Cloud Storage test failed:');
    console.error(`   Error: ${error.message}`);
    if (error.code === 'ENOENT') {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check your GOOGLE_CLOUD_PROJECT_ID in .env');
      console.log('   2. Ensure the bucket exists in Google Cloud Console');
      console.log('   3. Verify your service account key is correct');
    }
    return false;
  }
}

testCloudStorageConnection()
  .then(success => {
    if (success) {
      console.log('\n🚀 Ready to start using cloud storage!');
      process.exit(0);
    } else {
      console.log('\n🔧 Please fix the issues above and try again.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
