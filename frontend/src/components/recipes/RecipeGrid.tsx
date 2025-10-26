import React from 'react';
import { Recipe } from '../../types/recipe';
import RecipeCard from './RecipeCard';

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
      <div className="no-recipes-message">
        {searchQuery
          ? 'No recipes found matching your search.'
          : 'No recipes available yet.'}
      </div>
    );
  }

  return (
    <div className="recipes-grid">
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
