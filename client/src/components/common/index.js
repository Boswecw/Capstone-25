// client/src/components/common/index.js - Add HeroBanner export
export { default as Button } from './Button';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as SafeImage } from './SafeImage';
export { default as Toast, ToastContainer, useToast } from './Toast';
export { default as Modal } from './Modal';
export { default as HeroBanner } from './HeroBanner'; // ← Add this line

// Export hooks
export { useModal } from '../../hooks/useModal';

// Export preset components from LoadingSpinner
export { 
  PageLoadingSpinner, 
  ButtonLoadingSpinner, 
  CardLoadingSpinner, 
  InlineLoadingSpinner
} from './LoadingSpinner';

// Export preset components from SafeImage
export { 
  PetImage, 
  ProductImage, 
  BrandImage 
} from './SafeImage';

// Create PetLoadingSpinner as a NEW component
export const PetLoadingSpinner = () => (
  <div className="text-center py-5">
    <div className="spinner-border text-primary mb-3" role="status">
      <span className="visually-hidden">Loading pets...</span>
    </div>
    <p className="text-muted">Loading adorable pets...</p>
  </div>
);