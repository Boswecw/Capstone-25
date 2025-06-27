// 2. server/scripts/testImageUpload.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🖼️  Testing Image Upload Functionality...\n');

async function testImageUpload() {
  try {
    // Dynamic import of CloudStorageService
    const { default: CloudStorageService } = await import('../services/CloudStorageService.js');
    
    console.log('📋 Initializing Cloud Storage Service...');
    const cloudStorage = new CloudStorageService();
    
    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x25,
      0xDB, 0x56, 0xCA, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    console.log('📤 Testing single image upload...');
    
    // Test single image upload
    const uploadResult = await cloudStorage.uploadImage(
      testImageBuffer,
      'test-image.png',
      'test',
      'test-pet-123'
    );

    console.log('✅ Single image upload successful!');
    console.log(`   📄 File name: ${uploadResult.fileName}`);
    console.log(`   🌐 Public URL: ${uploadResult.publicUrl}`);
    console.log(`   📏 File size: ${uploadResult.size} bytes`);

    // Test thumbnail creation
    console.log('\n🖼️  Testing thumbnail creation...');
    
    const thumbnailResult = await cloudStorage.uploadThumbnail(
      testImageBuffer,
      'test-image.png',
      'test-thumbnails'
    );

    console.log('✅ Thumbnail creation successful!');
    console.log(`   📄 Thumbnail name: ${thumbnailResult.fileName}`);
    console.log(`   🌐 Thumbnail URL: ${thumbnailResult.publicUrl}`);

    // Test image listing
    console.log('\n📁 Testing image listing...');
    
    const imageList = await cloudStorage.listImages('test', 10);
    console.log(`✅ Found ${imageList.length} test images`);

    // Test image metadata
    console.log('\n📊 Testing metadata retrieval...');
    
    const metadata = await cloudStorage.getImageMetadata(uploadResult.fileName);
    console.log('✅ Metadata retrieved successfully!');
    console.log(`   📄 Content type: ${metadata.contentType}`);
    console.log(`   📅 Created: ${metadata.timeCreated}`);

    // Test signed URL generation
    console.log('\n🔗 Testing signed URL generation...');
    
    const signedUrl = await cloudStorage.generateSignedUrl(uploadResult.fileName, 5);
    console.log('✅ Signed URL generated successfully!');
    console.log(`   🔗 Expires in 5 minutes`);

    // Clean up test files
    console.log('\n🧹 Cleaning up test files...');
    
    await cloudStorage.deleteImage(uploadResult.fileName);
    await cloudStorage.deleteImage(thumbnailResult.fileName);
    
    console.log('✅ Test files cleaned up successfully!');

    console.log('\n🎉 All image upload tests passed!');
    console.log('✅ Your image upload functionality is working correctly.');

    return true;

  } catch (error) {
    console.error('\n💥 Image upload test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('CloudStorageService')) {
      console.log('\n💡 Make sure to create the CloudStorageService.js file first:');
      console.log('   server/services/CloudStorageService.js');
    }
    
    return false;
  }
}

// Run the test
testImageUpload()
  .then(success => {
    if (success) {
      console.log('\n🚀 Image upload system is ready!');
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