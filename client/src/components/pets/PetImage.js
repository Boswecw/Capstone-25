// client/src/components/PetImage.js
import React, { useState } from "react";
import { getImagePath, getPlaceholderImage, getTextPlaceholder } from "../../utils/imageHelper";
import "./PetImage.css";

const PetImage = ({
  src,
  alt,
  className = "",
  fallbackText = "Pet Photo",
  width = 300,
  height = 200,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // Get the processed image path
  const imageSrc = getImagePath(src);

  // Create safe placeholder - avoid btoa errors by using simple placeholder
  const getPlaceholderSrc = () => {
    try {
      // Try the enhanced placeholder first
      return getPlaceholderImage(width, height, fallbackText);
    } catch (error) {
      console.warn("Error creating placeholder image, using simple fallback:", error);
      // Fallback to a simple placeholder without text
      return getTextPlaceholder(width, height);
    }
  };

  // Use placeholder if no image or error
  const finalSrc = imageError || !imageSrc ? getPlaceholderSrc() : imageSrc;

  return (
    <div className={`pet-image-container ${className}`} {...props}>
      {isLoading && !imageError && (
        <div className="image-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      <img
        src={finalSrc}
        alt={alt || fallbackText}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`pet-image ${isLoading ? "loading" : ""} ${imageError ? "error" : ""}`}
      />

      {imageError && src && (
        <div className="image-error-overlay">
          <span>🐾</span>
          <p>Image not available</p>
          <small>Photo coming soon</small>
        </div>
      )}
    </div>
  );
};

export default PetImage;