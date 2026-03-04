import React from 'react';
import { BookOpen } from 'lucide-react';
import { Recipe } from '../../types/recipe';
import RecipeCard from './RecipeCard';
import styles from './RecipeGrid.module.css';

interface RecipeGridProps {
  recipes: Recipe[];
  searchQuery: string;
  onRecipeClick: (_recipe: Recipe) => void;
  onDeleteClick: (_e: React.MouseEvent, _recipe: Recipe) => void;
}

const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  searchQuery,
  onRecipeClick,
  onDeleteClick,
}) => {
  // Filter recipes based on search query
  const filteredRecipes = searchQuery
    ? recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recipes;

  if (filteredRecipes.length === 0) {
    return (
      <div className={styles['no-recipes-message']}>
        <BookOpen size={48} className={styles['no-recipes-icon']} />
        <p>
          {searchQuery
            ? 'No recipes found matching your search.'
            : 'No recipes available yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles['recipes-grid']}>
      {filteredRecipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          _recipe={recipe}
          onRecipeClick={onRecipeClick}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
};

export default RecipeGrid;
