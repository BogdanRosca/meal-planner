import React from 'react';
import './RecipeDetailModal.css';
import { Recipe } from '../../types/recipe';

interface RecipeDetailModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

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

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="recipe-modal-backdrop" onClick={handleBackdropClick}>
      <div className="recipe-modal-content">
        {/* Close Button */}
        <button className="recipe-modal-close" onClick={onClose}>
          ×
        </button>

        {/* Hero Image */}
        <div className="recipe-modal-image">
          <div className="recipe-modal-placeholder">
            {getCategoryEmoji(recipe.category)}
          </div>
        </div>

        {/* Content */}
        <div className="recipe-modal-body">
          {/* Title and Badge */}
          <div className="recipe-header">
            <h2 className="recipe-modal-title">{recipe.name}</h2>
            <div
              className={`recipe-category-badge category-${recipe.category.toLowerCase()}`}
            >
              {recipe.category}
            </div>
          </div>

          {/* Meta Information */}
          <div className="recipe-modal-meta">
            <span className="recipe-meta-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {recipe.prep_time}
            </span>
            <span className="recipe-meta-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {recipe.portions} {recipe.portions === 1 ? 'portion' : 'portions'}
            </span>
          </div>

          {/* Ingredients Section */}
          <div className="recipe-section">
            <h3 className="recipe-section-title">Ingredients</h3>
            <ul className="recipe-ingredients-list">
              {recipe.main_ingredients.map((ingredient, index) => (
                <li key={index} className="recipe-ingredient-item">
                  <span className="ingredient-bullet">●</span>
                  <span className="ingredient-quantity">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                  <span className="ingredient-name">{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Ingredients Section */}
          {recipe.common_ingredients &&
            recipe.common_ingredients.length > 0 && (
              <div className="recipe-section">
                <h3 className="recipe-section-title">Spices and Others</h3>
                <ul className="recipe-common-ingredients-list">
                  {recipe.common_ingredients.map((ingredient, index) => (
                    <li key={index} className="recipe-common-ingredient-item">
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Instructions Section */}
          <div className="recipe-section">
            <h3 className="recipe-section-title">Instructions</h3>
            <div className="recipe-instructions">{recipe.instructions}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
