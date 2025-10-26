import React from 'react';

interface StatusMessageProps {
  loading: boolean;
  error: string | null;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ loading, error }) => {
  if (loading) {
    return <div className="loading-message">Loading recipes...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return null;
};

export default StatusMessage;
