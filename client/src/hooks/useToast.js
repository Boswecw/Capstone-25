// client/src/hooks/useToast.js
import { useState, useCallback } from 'react';

let globalToastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, title, variant = 'success', duration = 4000) => {
    const id = ++globalToastId;
    const newToast = {
      id,
      message,
      title,
      variant,
      show: true,
      createdAt: Date.now()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title = 'Success') => {
    return addToast(message, title, 'success');
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    return addToast(message, title, 'danger');
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return addToast(message, title, 'warning');
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    return addToast(message, title, 'info');
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};