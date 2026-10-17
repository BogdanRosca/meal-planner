import React, { useMemo } from 'react';
import styles from './Categories.module.css';
import { useRecipes } from '../../hooks/useRecipes';
import { useSelectedCategory } from '../../hooks/useSelectedCategory';
import { getCategoryIcon } from '../../config/categoryIcons';

interface CategoriesProps {
  onCategoryClick?: (_category: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Breakfast: '#5b8266',
  Snack: '#294936',
  Lunch: '#3e6259',
  Dinner: '#212922',
};

const Categories: React.FC<CategoriesProps> = ({ onCategoryClick }) => {
  const selectedCategory = useSelectedCategory();

  const { recipes, loading } = useRecipes();

  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      onCategoryClick?.('All Categories');
    } else {
      onCategoryClick?.(categoryName);
    }
  };

  const categories = useMemo(() => {
    const categoryCounts: Record<string, number> = {};

    recipes.forEach(recipe => {
      const category = recipe.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([name, count]) => {
      const normalizedName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      return {
        id: name.toLowerCase(),
        name: normalizedName,
        icon: getCategoryIcon(name),
        count,
        color: CATEGORY_COLORS[normalizedName] || '#666',
      };
    });
  }, [recipes]);

  if (loading) {
    return (
      <div className={styles['categories-section']}>
        <div className={styles['categories-header']}>
          <h3>Categories</h3>
        </div>
        <div className={styles['categories-list']}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['categories-section']}>
      <div className={styles['categories-header']}>
        <h3>Categories</h3>
      </div>
      <div className={styles['categories-list']}>
        {categories.length > 0 ? (
          categories.map(category => {
            const isActive = selectedCategory === category.name;
            return (
              <button
                key={category.id}
                className={`${styles['category-item']} ${
                  isActive ? styles['active'] : ''
                }`}
                onClick={() => handleCategorySelect(category.name)}
                style={
                  { '--category-color': category.color } as React.CSSProperties
                }
              >
                <div className={styles['category-content']}>
                  <div className={styles['category-icon']} aria-hidden="true">
                    <category.icon />
                  </div>
                  <span className={styles['category-name']}>
                    {category.name}
                  </span>
                </div>
                <div className={styles['category-count']}>{category.count}</div>
              </button>
            );
          })
        ) : (
          <p>No recipes yet</p>
        )}
      </div>
    </div>
  );
};

export default Categories;
