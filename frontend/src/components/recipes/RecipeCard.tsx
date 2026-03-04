import React from 'react';
import { Trash2, Clock, Users } from 'lucide-react';
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
            <button
              type="button"
              className={styles['recipe-delete-button']}
              onClick={e => onDeleteClick(e, _recipe)}
              aria-label={`Delete ${_recipe.name}`}
            >
              <Trash2 size={16} />
            </button>
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
              <Clock size={14} />
              {_recipe.prep_time} min
            </span>
            <span className={styles['recipe-portions']}>
              <Users size={14} />
              {_recipe.portions}{' '}
              {_recipe.portions === 1 ? 'portion' : 'portions'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
