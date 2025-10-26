import React from 'react';
import { Recipe } from '../../types/recipe';

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

  return (
    <div className="recipe-card">
      <div className="recipe-card-main" onClick={() => onRecipeClick(_recipe)}>
        <div className="recipe-card-image">
          {_recipe.foto_url ? (
            <img
              src={_recipe.foto_url}
              alt={_recipe.name}
              className="recipe-image"
            />
          ) : (
            <div className="recipe-placeholder">
              {getCategoryEmoji(_recipe.category)}
            </div>
          )}
        </div>
        <div className="recipe-card-content">
          <div className="recipe-title-container">
            <h3 className="recipe-card-title">{_recipe.name}</h3>
            <div
              className="recipe-delete-button"
              onClick={_e => onDeleteClick(_e, _recipe)}
            >
              <img
                src="assets/delete.png"
                alt="Delete"
                className="delete-icon"
              />
            </div>
          </div>
          <div
            className={`recipe-category-badge category-${_recipe.category.toLowerCase()}`}
          >
            {_recipe.category}
          </div>
          <div className="recipe-card-footer">
            <span className="recipe-time">⏱️ {_recipe.prep_time} min</span>
            <span className="recipe-portions">
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
