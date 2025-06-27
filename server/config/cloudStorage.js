import dotenv from 'dotenv';

dotenv.config();

// Cloud storage configuration object
export const CLOUD_STORAGE_CONFIG = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'furbabies-project',
  bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'furbabies-storage',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
  
  // Fallback configuration for development
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Optional: Service account for authentication
  credentials: process.env.GOOGLE_CLOUD_CREDENTIALS ? 
    JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) : null
};

// Export as default as well
export default CLOUD_STORAGE_CONFIG;

// Helper function to check if cloud storage is properly configured
export const isCloudStorageConfigured = () => {
  return !!(
    CLOUD_STORAGE_CONFIG.projectId && 
    CLOUD_STORAGE_CONFIG.bucketName &&
    (CLOUD_STORAGE_CONFIG.keyFilename || CLOUD_STORAGE_CONFIG.credentials)
  );
};

console.log('📦 Cloud Storage Config Loaded:', {
  projectId: CLOUD_STORAGE_CONFIG.projectId,
  bucketName: CLOUD_STORAGE_CONFIG.bucketName,
  hasCredentials: !!(CLOUD_STORAGE_CONFIG.keyFilename || CLOUD_STORAGE_CONFIG.credentials),
  isDevelopment: CLOUD_STORAGE_CONFIG.isDevelopment
});