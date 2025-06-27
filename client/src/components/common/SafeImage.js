// client/src/components/common/SafeImage.js
import React, { useState, useEffect } from "react";
import { IMAGE_PATHS } from "../../constants/imagePaths";

const SafeImage = ({
  src,
  alt = "",
  className = "",
  fallbackType = "pet",
  onError,
  onLoad,
  showLoading = false,
  loadingComponent = null,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset states when src changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleError = () => {
    setIsLoading(false);
    if (!hasError) {
      setHasError(true);
      const fallbackSrc =
        IMAGE_PATHS.placeholders[fallbackType] || IMAGE_PATHS.placeholders.pet;
      setImgSrc(fallbackSrc);

      if (onError) {
        onError();
      }
    }
  };

  const LoadingSpinner = () => (
    <div
      className="d-flex justify-content-center align-items-center bg-light"
      style={{ minHeight: "200px" }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading image...</span>
      </div>
    </div>
  );

  return (
    <div className="position-relative">
      {showLoading && isLoading && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
          {loadingComponent || <LoadingSpinner />}
        </div>
      )}

      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        style={{
          transition: "opacity 0.3s ease",
          ...props.style,
        }}
        {...props}
      />

      {hasError && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light text-muted">
          <i className="fas fa-image fa-2x mb-2"></i>
          <small>Image not available</small>
        </div>
      )}
    </div>
  );
};

// Preset components for common use cases
export const PetImage = ({ src, alt, className = "", ...props }) => (
  <SafeImage
    src={src}
    alt={alt}
    className={className}
    fallbackType="pet"
    {...props}
  />
);

export const ProductImage = ({ src, alt, className = "", ...props }) => (
  <SafeImage
    src={src}
    alt={alt}
    className={className}
    fallbackType="product"
    {...props}
  />
);

export const BrandImage = ({ src, alt, className = "", ...props }) => (
  <SafeImage
    src={src}
    alt={alt}
    className={className}
    fallbackType="brand"
    {...props}
  />
);

export default SafeImage;
