import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (_category: string) => void;
}

const CATEGORIES = ['All Categories', 'Breakfast', 'Snack', 'Lunch', 'Dinner'];

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    setIsOpen(false);
  };

  return (
    <div className={styles['category-filter-container']}>
      <button
        className={styles['filter-button']}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles['filter-label']}>{selectedCategory}</span>
        <ChevronDown
          size={18}
          className={`${styles['chevron']} ${isOpen ? styles['open'] : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles['dropdown-menu']}>
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`${styles['dropdown-item']} ${
                selectedCategory === category ? styles['active'] : ''
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
