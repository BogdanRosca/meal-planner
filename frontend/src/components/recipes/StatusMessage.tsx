import React from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  loading: boolean;
  error: string | null;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ loading, error }) => {
  if (loading) {
    return <div className={styles['loading-message']}>Loading recipes...</div>;
  }

  if (error) {
    return <div className={styles['error-message']}>{error}</div>;
  }

  return null;
};

export default StatusMessage;
