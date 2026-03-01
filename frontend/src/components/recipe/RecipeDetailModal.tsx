import React from 'react';
import styles from './RecipeDetailModal.module.css';
import { Recipe } from '../../types/recipe';

interface RecipeDetailModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
};

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

  const categoryClass = styles[`category-${recipe.category.toLowerCase()}`];

  return (
    <div
      className={styles['recipe-modal-backdrop']}
      onClick={handleBackdropClick}
    >
      <div className={styles['recipe-modal-content']}>
        {/* Close Button */}
        <button className={styles['recipe-modal-close']} onClick={onClose}>
          ×
        </button>

        {/* Hero Image */}
        <div className={styles['recipe-modal-image']}>
          {recipe.foto_url ? (
            <img
              src={recipe.foto_url}
              alt={recipe.name}
              className={styles['recipe-modal-hero-img']}
            />
          ) : (
            <div className={styles['recipe-modal-placeholder']}>
              {getCategoryEmoji(recipe.category)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles['recipe-modal-body']}>
          {/* Title and Badge */}
          <div className={styles['recipe-header']}>
            <h2 className={styles['recipe-modal-title']}>{recipe.name}</h2>
            <div
              className={[styles['recipe-category-badge'], categoryClass ?? '']
                .filter(Boolean)
                .join(' ')}
            >
              {recipe.category}
            </div>
          </div>

          {/* Meta Information */}
          <div className={styles['recipe-modal-meta']}>
            <span className={styles['recipe-meta-item']}>
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
            <span className={styles['recipe-meta-item']}>
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
          <div className={styles['recipe-section']}>
            <h3 className={styles['recipe-section-title']}>Ingredients</h3>
            <ul className={styles['recipe-ingredients-list']}>
              {recipe.main_ingredients.map((ingredient, index) => (
                <li key={index} className={styles['recipe-ingredient-item']}>
                  <span className={styles['ingredient-bullet']}>●</span>
                  <span className={styles['ingredient-quantity']}>
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                  <span className={styles['ingredient-name']}>
                    {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Ingredients Section */}
          {recipe.common_ingredients &&
            recipe.common_ingredients.length > 0 && (
              <div className={styles['recipe-section']}>
                <h3 className={styles['recipe-section-title']}>
                  Spices and Others
                </h3>
                <ul className={styles['recipe-common-ingredients-list']}>
                  {recipe.common_ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className={styles['recipe-common-ingredient-item']}
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Instructions Section */}
          <div className={styles['recipe-section']}>
            <h3 className={styles['recipe-section-title']}>Instructions</h3>
            <div className={styles['recipe-instructions']}>
              {recipe.instructions}
            </div>
          </div>

          {/* Video Section */}
          {recipe.video_url && (
            <div className={styles['recipe-section']}>
              <h3 className={styles['recipe-section-title']}>Video</h3>
              <div className={styles['recipe-video-container']}>
                {getYouTubeEmbedUrl(recipe.video_url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(recipe.video_url)!}
                    title={`${recipe.name} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles['recipe-video-iframe']}
                  />
                ) : (
                  <video controls className={styles['recipe-video-player']}>
                    <source src={recipe.video_url} />
                  </video>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
