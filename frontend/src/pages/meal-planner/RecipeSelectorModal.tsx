import React from 'react';
import { Recipe } from '../../types/recipe';
import styles from './RecipeSelectorModal.module.css';

interface RecipeSelectorModalProps {
  isOpen: boolean;
  recipes: Recipe[];
  categoryFilter: string;
  onSelect: (_recipe: Recipe) => void;
  onClose: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍿',
};

const RecipeSelectorModal: React.FC<RecipeSelectorModalProps> = ({
  isOpen,
  recipes,
  categoryFilter,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  const filtered = recipes.filter(
    r => r.category.toLowerCase() === categoryFilter.toLowerCase()
  );

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles['selector-backdrop']} onClick={handleBackdropClick}>
      <div className={styles['selector-modal']}>
        <div className={styles['selector-header']}>
          <h3 className={styles['selector-title']}>
            Select a {categoryFilter} recipe
          </h3>
          <button className={styles['selector-close']} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles['selector-list']}>
          {filtered.length === 0 ? (
            <p className={styles['selector-empty']}>
              No {categoryFilter} recipes available.
            </p>
          ) : (
            filtered.map(recipe => (
              <button
                key={recipe.id}
                className={styles['selector-item']}
                onClick={() => onSelect(recipe)}
              >
                <span className={styles['selector-item-emoji']}>
                  {CATEGORY_EMOJI[recipe.category.toLowerCase()] || '🍴'}
                </span>
                <div className={styles['selector-item-info']}>
                  <span className={styles['selector-item-name']}>
                    {recipe.name}
                  </span>
                  <span className={styles['selector-item-meta']}>
                    ⏱️ {recipe.prep_time} min · 👥 {recipe.portions}{' '}
                    {recipe.portions === 1 ? 'portion' : 'portions'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeSelectorModal;
