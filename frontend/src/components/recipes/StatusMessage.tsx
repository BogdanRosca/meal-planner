import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  loading: boolean;
  error: string | null;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ loading, error }) => {
  if (loading) {
    return (
      <div className={styles['loading-message']}>
        <Loader2 size={28} className={styles['loading-spinner']} />
        Loading recipes...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['error-message']}>
        <AlertCircle size={24} />
        {error}
      </div>
    );
  }

  return null;
};

export default StatusMessage;
