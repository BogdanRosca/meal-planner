import React from 'react';
import styles from './WeekNavigator.module.css';

interface WeekNavigatorProps {
  weekStart: Date;
  onNavigate: (_direction: -1 | 1) => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekStart,
  onNavigate,
}) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatRange = () => {
    const opts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = weekStart.toLocaleDateString('en-US', opts);
    const endStr = weekEnd.toLocaleDateString('en-US', {
      ...opts,
      year: 'numeric',
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className={styles['week-navigator']}>
      <button
        className={styles['nav-button']}
        onClick={() => onNavigate(-1)}
        aria-label="Previous week"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className={styles['week-label']}>{formatRange()}</span>
      <button
        className={styles['nav-button']}
        onClick={() => onNavigate(1)}
        aria-label="Next week"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default WeekNavigator;
