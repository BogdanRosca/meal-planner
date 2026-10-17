import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

const STAR_VALUES = [1, 2, 3, 4, 5];

interface StarRatingProps {
  rating: number | null;
  recipeName: string;
  onRate: (_rating: number | null) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  recipeName,
  onRate,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? rating ?? 0;

  // Re-selecting the current rating clears it
  const handleClick = (e: React.MouseEvent, value: number) => {
    e.stopPropagation();
    onRate(value === rating ? null : value);
  };

  return (
    <div
      className={styles['star-rating']}
      role="group"
      aria-label={`Rating for ${recipeName}`}
      onMouseLeave={() => setHovered(null)}
    >
      {STAR_VALUES.map(value => (
        <button
          key={value}
          type="button"
          className={[styles.star, value <= shown ? styles.filled : '']
            .filter(Boolean)
            .join(' ')}
          aria-label={`${value} star${value === 1 ? '' : 's'}`}
          aria-pressed={value === rating}
          onClick={e => handleClick(e, value)}
          onMouseEnter={() => setHovered(value)}
        >
          <Star
            size={16}
            fill={value <= shown ? 'currentColor' : 'none'}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
