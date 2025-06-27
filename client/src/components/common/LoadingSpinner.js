// client/src/components/common/LoadingSpinner.js
import React from "react";
import { Spinner } from "react-bootstrap";

const LoadingSpinner = ({
  size = "border",
  variant = "primary",
  text = "Loading...",
  centered = true,
  className = "",
  showText = true,
  spinnerSize = undefined, // 'sm' for small spinner
}) => {
  const spinnerElement = (
    <Spinner
      animation={size}
      variant={variant}
      role="status"
      size={spinnerSize}
    >
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  );

  const content = (
    <div className={`d-flex align-items-center ${className}`}>
      {spinnerElement}
      {showText && text && <span className="ms-2 text-muted">{text}</span>}
    </div>
  );

  return centered ? (
    <div className="d-flex justify-content-center align-items-center py-4">
      {content}
    </div>
  ) : (
    content
  );
};

// Preset loading spinners for common use cases
export const PageLoadingSpinner = () => (
  <LoadingSpinner text="Loading page..." centered={true} className="py-5" />
);

export const ButtonLoadingSpinner = () => (
  <LoadingSpinner
    size="border"
    spinnerSize="sm"
    text=""
    centered={false}
    showText={false}
  />
);

export const CardLoadingSpinner = () => (
  <LoadingSpinner text="Loading content..." centered={true} className="py-3" />
);

export const InlineLoadingSpinner = () => (
  <LoadingSpinner
    size="border"
    spinnerSize="sm"
    text="Loading..."
    centered={false}
  />
);

export default LoadingSpinner;
