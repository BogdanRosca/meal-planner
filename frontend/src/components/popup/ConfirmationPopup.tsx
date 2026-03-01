import React from 'react';
import styles from './ConfirmationPopup.module.css';

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
      className={styles['confirmation-popup-overlay']}
      onClick={onCancel}
      role="presentation"
    >
      <div className={styles['confirmation-popup']} onClick={handlePopupClick}>
        <div className={styles['confirmation-popup-header']}>
          <h3 className={styles['confirmation-popup-title']}>{title}</h3>
        </div>
        <div className={styles['confirmation-popup-content']}>
          <p>{message}</p>
        </div>
        <div className={styles['confirmation-popup-actions']}>
          <button
            className={`${styles['confirmation-popup-btn']} ${styles['confirmation-popup-btn-cancel']}`}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`${styles['confirmation-popup-btn']} ${styles['confirmation-popup-btn-confirm']}`}
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
