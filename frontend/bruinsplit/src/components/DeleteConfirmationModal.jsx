import React from 'react';
import { createPortal } from 'react-dom';
import './card.css'; // Assuming shared styles, might need its own CSS file later

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading, error }) => {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal-overlay delete-modal-overlay">
      <div
        className="delete-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="delete-modal-title">Delete Ride?</h3>
        <p className="delete-modal-text">
          Are you sure you want to permanently delete this ride group?
          This action cannot be undone.
        </p>

        {error && <p className="error delete-modal-error">{error}</p>}

        <div className="delete-modal-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </button>

          <button
            className="btn-primary delete-btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default DeleteConfirmationModal;
