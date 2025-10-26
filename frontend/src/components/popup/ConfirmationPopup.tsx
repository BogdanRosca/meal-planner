import React from 'react';
import './ConfirmationPopup.css';

interface ConfirmationPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Prevent clicks on the popup from closing it
  const handlePopupClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className="confirmation-popup-overlay"
      onClick={onCancel}
      role="presentation"
    >
      <div className="confirmation-popup" onClick={handlePopupClick}>
        <div className="confirmation-popup-header">
          <h3 className="confirmation-popup-title">{title}</h3>
        </div>
        <div className="confirmation-popup-content">
          <p>{message}</p>
        </div>
        <div className="confirmation-popup-actions">
          <button
            className="confirmation-popup-btn confirmation-popup-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="confirmation-popup-btn confirmation-popup-btn-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
