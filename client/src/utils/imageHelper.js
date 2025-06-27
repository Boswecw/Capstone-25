// client/src/utils/imageHelper.js - Complete and Fixed Version
import { IMAGE_PATHS } from "../constants/imagePaths";

export const getImagePath = (imagePath, type = "pet") => {
  if (!imagePath) {
    return IMAGE_PATHS.placeholders[type] || IMAGE_PATHS.placeholders.pet;
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  return `/assets/${imagePath}`;
};

export const validateImageUrl = async (url) => {
  if (!url) return false;

  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;

      setTimeout(() => resolve(false), 5000);
    });
  } catch (error) {
    return false;
  }
};

// FIXED: Safe placeholder image generation that handles Unicode characters
export const getPlaceholderImage = (
  width = 400,
  height = 300,
  text = "Pet Photo",
) => {
  // Clean and sanitize the text to prevent encoding errors
  const cleanText = text
    .replace(/[^\u0020-\u007E]/g, "") // Remove non-printable ASCII characters
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters except spaces
    .trim() || "Pet Photo"; // Fallback if text becomes empty

  // Use URL encoding instead of btoa to avoid character encoding issues
  const encodedText = encodeURIComponent(cleanText);
  
  return `https://via.placeholder.com/${width}x${height}/f8f9fa/6c757d?text=${encodedText}`;
};

// Alternative method using a more robust placeholder service
export const getPlaceholderImageRobust = (
  width = 400,
  height = 300,
  text = "Pet Photo",
) => {
  // Use picsum.photos for more reliable placeholder images
  return `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`;
};

// Safe text-based placeholder that avoids encoding issues entirely
export const getTextPlaceholder = (
  width = 400,
  height = 300,
  text = "Pet Photo",
) => {
  // Create a simple colored placeholder without text to avoid encoding issues
  return `https://via.placeholder.com/${width}x${height}/e9ecef/495057`;
};

export const getPetImage = (petImagePath) => {
  return getImagePath(petImagePath, "pet");
};

export const getProductImage = (productImagePath) => {
  return getImagePath(productImagePath, "product");
};

export const getBrandImage = (brandImagePath) => {
  return getImagePath(brandImagePath, "brand");
};

export const getAboutImage = (aboutImagePath) => {
  return getImagePath(aboutImagePath, "about");
};

// Additional helper functions for better image handling
export const getImageWithFallback = (primarySrc, fallbackSrc, type = "pet") => {
  if (primarySrc) {
    return getImagePath(primarySrc, type);
  }
  return fallbackSrc || IMAGE_PATHS.placeholders[type];
};

export const createDataUrl = (width, height, backgroundColor = "#f8f9fa", textColor = "#6c757d") => {
  // Create a simple SVG placeholder to avoid encoding issues
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${textColor}" font-family="Arial, sans-serif" font-size="14">
        Pet Photo
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Google Cloud Storage specific helpers
export const getGCSImageUrl = (bucketName, fileName) => {
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
};

export const extractGCSFileName = (gcsUrl) => {
  if (!gcsUrl || !gcsUrl.includes('storage.googleapis.com')) return null;
  const parts = gcsUrl.split('/');
  return parts.slice(2).join('/'); // Remove https://storage.googleapis.com
};

export const getOptimizedImageUrl = (imageUrl, width, height) => {
  // If it's a GCS URL, we could add optimization parameters
  if (imageUrl && imageUrl.includes('storage.googleapis.com')) {
    return imageUrl; // GCS doesn't support URL-based transformations by default
  }
  return imageUrl;
};

// Responsive image utilities
export const getResponsiveImageSizes = (baseWidth) => {
  return {
    small: Math.round(baseWidth * 0.5),
    medium: baseWidth,
    large: Math.round(baseWidth * 1.5),
    xlarge: Math.round(baseWidth * 2)
  };
};

// Image preview utilities
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const createImagePreviews = async (files) => {
  const previews = [];
  for (const file of files) {
    try {
      const preview = await createImagePreview(file);
      previews.push({ file, preview });
    } catch (error) {
      console.error('Error creating preview for file:', file.name, error);
      previews.push({ file, preview: null, error: error.message });
    }
  }
  return previews;
};

// Image loading hook-like utility
export const useImageLoader = () => {
  return {
    loadImage: (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    },
    preloadImages: async (srcArray) => {
      const results = await Promise.allSettled(
        srcArray.map(src => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ src, loaded: true });
            img.onerror = () => reject({ src, loaded: false });
            img.src = src;
          });
        })
      );
      return results;
    }
  };
};

// Get multiple pet images for gallery
export const getPetImages = (pet) => {
  const images = [];
  
  // Add cloud images if available
  if (pet.cloudImages && pet.cloudImages.length > 0) {
    images.push(...pet.cloudImages.map(img => ({
      url: img.publicUrl,
      thumbnail: img.thumbnailUrl || img.publicUrl,
      isMain: img.isMain,
      alt: `${pet.name} - ${img.description || 'Photo'}`
    })));
  }
  
  // Add legacy image if available and no cloud images
  if (images.length === 0 && pet.image && pet.image !== '/images/default-pet.jpg') {
    images.push({
      url: getImagePath(pet.image),
      thumbnail: getImagePath(pet.image),
      isMain: true,
      alt: `${pet.name} - Photo`
    });
  }
  
  // Add placeholder if no images
  if (images.length === 0) {
    images.push({
      url: getPlaceholderImage(400, 300, pet.name),
      thumbnail: getPlaceholderImage(150, 150, pet.name),
      isMain: true,
      alt: `${pet.name} - Placeholder`
    });
  }
  
  return images;
};

// Default export - assign to variable first to satisfy linter
const imageHelperUtils = {
  getImagePath,
  validateImageUrl,
  getPlaceholderImage,
  getPlaceholderImageRobust,
  getTextPlaceholder,
  getPetImage,
  getProductImage,
  getBrandImage,
  getAboutImage,
  getImageWithFallback,
  createDataUrl,
  getGCSImageUrl,
  extractGCSFileName,
  getOptimizedImageUrl,
  getResponsiveImageSizes,
  createImagePreview,
  createImagePreviews,
  useImageLoader,
  getPetImages
};

export default imageHelperUtils;