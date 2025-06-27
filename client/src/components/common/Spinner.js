// client/src/components/common/Spinner.js
import React from 'react';
import PropTypes from 'prop-types';
import './Spinner.css'

const Spinner = ({
  size = 'medium',
  variant = 'primary',
  centered = false,
  overlay = false,
  text = '',
  className = '',
  style = {}
}) => {
  const getSizeClass = () => {
    const sizeMap = {
      small: 'spinner-border-sm',
      medium: '',
      large: 'spinner-lg'
    };
    return sizeMap[size] || '';
  };

  const getVariantClass = () => {
    return `text-${variant}`;
  };

  const spinnerClasses = [
    'spinner-border',
    getSizeClass(),
    getVariantClass(),
    className
  ].filter(Boolean).join(' ');

  const SpinnerElement = () => (
    <div className={spinnerClasses} role="status" style={style}>
      <span className="visually-hidden">Loading...</span>
    </div>
  );

  const Content = () => (
    <>
      <SpinnerElement />
      {text && (
        <div className={`mt-2 ${getVariantClass()}`}>
          {text}
        </div>
      )}
    </>
  );

  if (overlay) {
    return (
      <div className="spinner-overlay">
        <div className="spinner-overlay-content">
          <Content />
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center h-100 p-4">
        <Content />
      </div>
    );
  }

  return <Content />;
};

// Page Loading Spinner
export const PageSpinner = ({ text = 'Loading...' }) => (
  <div className="d-flex flex-column justify-content-center align-items-center" 
       style={{ minHeight: '60vh' }}>
    <div className="spinner-border text-primary mb-3" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="text-muted">{text}</p>
  </div>
);

// Button Spinner (for inline use in buttons)
export const ButtonSpinner = ({ size = 'small' }) => (
  <span className={`spinner-border spinner-border-${size} me-2`} role="status" aria-hidden="true"></span>
);

// Card Loading Spinner
export const CardSpinner = ({ height = '200px', text = 'Loading...' }) => (
  <div 
    className="card d-flex justify-content-center align-items-center"
    style={{ height }}
  >
    <div className="text-center">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted mb-0">{text}</p>
    </div>
  </div>
);

// Custom Pet Loading Spinner
export const PetLoadingSpinner = () => (
  <div className="text-center p-4">
    <div className="spinner-border text-primary mb-3" role="status">
      <span className="visually-hidden">Loading pets...</span>
    </div>
    <p className="text-muted mb-0">
      <i className="fas fa-paw me-2"></i>
      Loading our furry friends...
    </p>
  </div>
);

// Dots Loading Animation
export const DotsSpinner = ({ color = 'primary' }) => (
  <div className="dots-spinner">
    <div className={`dot bg-${color}`}></div>
    <div className={`dot bg-${color}`}></div>
    <div className={`dot bg-${color}`}></div>
  </div>
);

Spinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark', 'light']),
  centered: PropTypes.bool,
  overlay: PropTypes.bool,
  text: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object
};

export default Spinner;

// Usage Examples:
/*
import Spinner, { 
  PageSpinner, 
  ButtonSpinner, 
  CardSpinner, 
  PetLoadingSpinner,
  DotsSpinner 
} from './components/common/Spinner';

// Basic spinner
<Spinner />

// Large primary spinner with text
<Spinner size="large" variant="primary" text="Loading pets..." />

// Centered spinner
<Spinner centered text="Please wait..." />

// Overlay spinner (covers entire parent)
<div className="position-relative">
  <SomeContent />
  {loading && <Spinner overlay text="Saving..." />}
</div>

// Page loading
{loading ? <PageSpinner text="Loading pets..." /> : <PetList pets={pets} />}

// Button with spinner
<Button disabled={loading}>
  {loading && <ButtonSpinner />}
  {loading ? 'Saving...' : 'Save Pet'}
</Button>

// Card loading state
{loading ? (
  <CardSpinner height="300px" text="Loading pet details..." />
) : (
  <PetCard pet={pet} />
)}

// Custom pet spinner
<PetLoadingSpinner />

// Dots animation
<DotsSpinner color="success" />
*/