import React from 'react';
import styles from './Categories.module.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface CategoriesProps {
  onCategoryClick?: (_category: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onCategoryClick }) => {
  const categories: Category[] = [
    {
      id: 'breakfast',
      name: 'Breakfast',
      icon: '☕️',
      count: 6,
      color: '#5b8266', // Viridian
    },
    {
      id: 'snack',
      name: 'Snack',
      icon: '🍎',
      count: 2,
      color: '#294936', // Brunswick green
    },
    {
      id: 'lunch',
      name: 'Lunch',
      icon: '☀️',
      count: 1,
      color: '#3e6259', // Feldgrau
    },
    {
      id: 'dinner',
      name: 'Dinner',
      icon: '🌙',
      count: 1,
      color: '#212922', // Black olive
    },
  ];

  return (
    <div className={styles['categories-section']}>
      <div className={styles['categories-header']}>
        <h3>Categories</h3>
      </div>
      <div className={styles['categories-list']}>
        {categories.map(category => (
          <button
            key={category.id}
            className={styles['category-item']}
            onClick={() => onCategoryClick?.(category.name)}
            style={
              { '--category-color': category.color } as React.CSSProperties
            }
          >
            <div className={styles['category-content']}>
              <div className={styles['category-icon']}>{category.icon}</div>
              <span className={styles['category-name']}>{category.name}</span>
            </div>
            <div className={styles['category-count']}>{category.count}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Categories;
