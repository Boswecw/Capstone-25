// client/src/components/common/Modal.js
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const Modal = ({
  show = false,
  onClose,
  title = '',
  children,
  size = 'medium',
  centered = false,
  backdrop = true,
  keyboard = true,
  closeButton = true,
  footer = null,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = ''
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (keyboard && e.keyCode === 27 && show) {
        onClose?.();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, keyboard, onClose]);

  const handleBackdropClick = (e) => {
    if (backdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const getSizeClass = () => {
    const sizeMap = {
      small: 'modal-sm',
      medium: '',
      large: 'modal-lg',
      'extra-large': 'modal-xl'
    };
    return sizeMap[size] || '';
  };

  if (!show) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog"
      onClick={handleBackdropClick}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className={`modal-dialog ${getSizeClass()} ${centered ? 'modal-dialog-centered' : ''} ${className}`}
        role="document"
      >
        <div className="modal-content">
          {/* Header */}
          {(title || closeButton) && (
            <div className={`modal-header ${headerClassName}`}>
              {title && <h5 className="modal-title">{title}</h5>}
              {closeButton && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={`modal-body ${bodyClassName}`}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`modal-footer ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({
  show,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false
}) => {
  const handleConfirm = async () => {
    await onConfirm?.();
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button 
        variant={confirmVariant} 
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      footer={footer}
      size="small"
      centered
    >
      <p>{message}</p>
    </Modal>
  );
};

// Image Modal Component
export const ImageModal = ({
  show,
  onClose,
  src,
  alt = 'Image',
  title = ''
}) => {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      size="large"
      centered
      className="image-modal"
    >
      <div className="text-center">
        <img 
          src={src} 
          alt={alt} 
          className="img-fluid" 
          style={{ maxHeight: '70vh' }}
        />
      </div>
    </Modal>
  );
};

// Hook for managing modals
export const useModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};

Modal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'extra-large']),
  centered: PropTypes.bool,
  backdrop: PropTypes.bool,
  keyboard: PropTypes.bool,
  closeButton: PropTypes.bool,
  footer: PropTypes.node,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string
};

export default Modal;

// Usage Examples:
/*
import Modal, { ConfirmModal, ImageModal, useModal } from './components/common/Modal';

// Basic Modal
const MyComponent = () => {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <Button onClick={openModal}>Open Modal</Button>
      
      <Modal show={isOpen} onClose={closeModal} title="Pet Details">
        <p>This is the modal content!</p>
      </Modal>
    </>
  );
};

// Confirmation Modal
const DeletePetComponent = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePet(petId);
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setShowConfirm(true)}>
        Delete Pet
      </Button>
      
      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Pet"
        message="Are you sure you want to delete this pet? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
};

// Image Modal
const PetImageComponent = ({ pet }) => {
  const [showImage, setShowImage] = useState(false);

  return (
    <>
      <img 
        src={pet.image} 
        alt={pet.name}
        onClick={() => setShowImage(true)}
        style={{ cursor: 'pointer' }}
      />
      
      <ImageModal
        show={showImage}
        onClose={() => setShowImage(false)}
        src={pet.image}
        alt={pet.name}
        title={pet.name}
      />
    </>
  );
};
*/