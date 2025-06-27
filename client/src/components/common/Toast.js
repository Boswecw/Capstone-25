// client/src/components/common/Toast.js - Fixed version
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

const Toast = ({
  show = false,
  onClose,
  title = '',
  message = '',
  variant = 'info',
  duration = 5000,
  position = 'top-right',
  dismissible = true,
  icon = null,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsAnimating(true);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getToastClasses = () => {
    const baseClasses = 'toast';
    const variantClasses = `toast-${variant}`;
    const positionClasses = `toast-${position}`;
    const animationClasses = isAnimating ? 'toast-show' : 'toast-hide';
    
    return [baseClasses, variantClasses, positionClasses, animationClasses, className]
      .filter(Boolean).join(' ');
  };

  const getIcon = () => {
    if (icon) return icon;
    
    const iconMap = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    return iconMap[variant] || iconMap.info;
  };

  if (!isVisible) return null;

  return (
    <div className={getToastClasses()} role="alert" aria-live="assertive" aria-atomic="true">
      <div className="toast-header">
        <i className={`${getIcon()} me-2`}></i>
        <strong className="me-auto">{title || variant.charAt(0).toUpperCase() + variant.slice(1)}</strong>
        {dismissible && (
          <button 
            type="button" 
            className="btn-close" 
            onClick={handleClose}
            aria-label="Close"
          ></button>
        )}
      </div>
      {message && (
        <div className="toast-body">
          {message}
        </div>
      )}
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ children, position = 'top-right' }) => {
  return (
    <div className={`toast-container position-fixed p-3 toast-container-${position}`}>
      {children}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toastData) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toastData, show: true };
    setToasts(prev => [...prev, newToast]);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, title = 'Success') => {
    return addToast({ message, title, variant: 'success' });
  };

  const showError = (message, title = 'Error') => {
    return addToast({ message, title, variant: 'error' });
  };

  const showWarning = (message, title = 'Warning') => {
    return addToast({ message, title, variant: 'warning' });
  };

  const showInfo = (message, title = 'Info') => {
    return addToast({ message, title, variant: 'info' });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

Toast.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  dismissible: PropTypes.bool,
  icon: PropTypes.string,
  className: PropTypes.string
};

export default Toast;