import React from 'react';
import { Recipe } from '../../types/recipe';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  _recipe: Recipe;
  onRecipeClick: (_recipe: Recipe) => void;
  onDeleteClick: (_e: React.MouseEvent, _recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  _recipe,
  onRecipeClick,
  onDeleteClick,
}) => {
  // Category emoji mapping
  const getCategoryEmoji = (category: string): string => {
    const emojiMap: { [key: string]: string } = {
      breakfast: '🍳',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍿',
    };
    return emojiMap[category.toLowerCase()] || '🍴';
  };

  const categoryClass = styles[`category-${_recipe.category.toLowerCase()}`];

  return (
    <div className={styles['recipe-card']}>
      <div
        className={styles['recipe-card-main']}
        onClick={() => onRecipeClick(_recipe)}
      >
        <div className={styles['recipe-card-image']}>
          {_recipe.foto_url ? (
            <img
              src={_recipe.foto_url}
              alt={_recipe.name}
              className={styles['recipe-image']}
            />
          ) : (
            <div className={styles['recipe-placeholder']}>
              {getCategoryEmoji(_recipe.category)}
            </div>
          )}
        </div>
        <div className={styles['recipe-card-content']}>
          <div className={styles['recipe-title-container']}>
            <h3 className={styles['recipe-card-title']}>{_recipe.name}</h3>
            <div
              className={styles['recipe-delete-button']}
              onClick={_e => onDeleteClick(_e, _recipe)}
            >
              <img
                src="assets/delete.png"
                alt="Delete"
                className={styles['delete-icon']}
              />
            </div>
          </div>
          <div
            className={[styles['recipe-category-badge'], categoryClass ?? '']
              .filter(Boolean)
              .join(' ')}
          >
            {_recipe.category}
          </div>
          <div className={styles['recipe-card-footer']}>
            <span className={styles['recipe-time']}>
              ⏱️ {_recipe.prep_time} min
            </span>
            <span className={styles['recipe-portions']}>
              👥 {_recipe.portions}{' '}
              {_recipe.portions === 1 ? 'portion' : 'portions'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
