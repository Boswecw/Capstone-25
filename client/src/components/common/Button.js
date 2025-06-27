// client/src/components/common/Button.js
import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  // Build CSS classes
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size === 'small' ? 'btn-sm' : size === 'large' ? 'btn-lg' : '';
  const widthClasses = fullWidth ? 'w-100' : '';
  const disabledClasses = (disabled || loading) ? 'disabled' : '';
  
  const finalClassName = [
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {typeof children === 'string' ? 'Loading...' : children}
        </>
      );
    }

    if (icon) {
      return iconPosition === 'left' ? (
        <>
          <i className={`${icon} ${children ? 'me-2' : ''}`}></i>
          {children}
        </>
      ) : (
        <>
          {children}
          <i className={`${icon} ${children ? 'ms-2' : ''}`}></i>
        </>
      );
    }

    return children;
  };

  return (
    <button
      type={type}
      className={finalClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger', 'warning', 
    'info', 'light', 'dark', 'outline-primary', 'outline-secondary',
    'outline-success', 'outline-danger', 'outline-warning', 'outline-info'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  icon: PropTypes.string,
  iconPosition: PropTypes.oneOf(['left', 'right'])
};

export default Button;

// Usage Examples:
/*
import Button from './components/common/Button';

// Basic button
<Button onClick={handleClick}>Click Me</Button>

// Loading state
<Button loading={isLoading} onClick={handleSubmit}>
  Submit Form
</Button>

// With icon
<Button icon="fas fa-heart" variant="danger">
  Add to Favorites
</Button>

// Different variants
<Button variant="success">Success</Button>
<Button variant="outline-primary">Outline</Button>

// Different sizes
<Button size="small">Small</Button>
<Button size="large">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
*/