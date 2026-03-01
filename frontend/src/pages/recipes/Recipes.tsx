import React, { useState } from 'react';
import styles from './Recipes.module.css';
import { Recipe } from '../../types/recipe';
import RecipeDetailModal from '../../components/recipe/RecipeDetailModal';
import AddRecipeModal from '../../components/recipe/AddRecipeModal';
import ConfirmationPopup from '../../components/popup/ConfirmationPopup';
import SearchBar from '../../components/recipes/SearchBar';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import StatusMessage from '../../components/recipes/StatusMessage';
import { useRecipes } from '../../hooks/useRecipes';
import { useRecipeModals } from '../../hooks/useRecipeModals';

const Recipes: React.FC = () => {
  const { recipes, loading, error, addRecipe, deleteRecipe } = useRecipes();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    selectedRecipe,
    isDetailModalOpen,
    isAddRecipeModalOpen,
    deleteConfirmation,
    openDetailModal,
    closeDetailModal,
    openAddRecipeModal,
    closeAddRecipeModal,
    openDeleteConfirmation,
    closeDeleteConfirmation,
  } = useRecipeModals();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleRecipeClick = (recipe: Recipe) => {
    openDetailModal(recipe);
  };

  const handleDeleteClick = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    openDeleteConfirmation(recipe);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.recipeId) {
      const success = await deleteRecipe(deleteConfirmation.recipeId);
      if (success) {
        closeDeleteConfirmation();
      }
    }
  };

  const handleAddRecipe = async (newRecipe: Omit<Recipe, 'id'>) => {
    const success = await addRecipe(newRecipe);
    if (success) {
      closeAddRecipeModal();
    }
  };

  return (
    <div className={styles['recipes-content']}>
      <StatusMessage loading={loading} error={error} />

      {!loading && !error && (
        <>
          <div className={styles['recipes-action-bar']}>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
            />
            <button
              className={styles['add-recipe-button']}
              onClick={openAddRecipeModal}
            >
              + Add recipe
            </button>
          </div>

          <RecipeGrid
            recipes={recipes}
            searchQuery={searchQuery}
            onRecipeClick={handleRecipeClick}
            onDeleteClick={handleDeleteClick}
          />

          {selectedRecipe && (
            <RecipeDetailModal
              recipe={selectedRecipe}
              isOpen={isDetailModalOpen}
              onClose={closeDetailModal}
            />
          )}

          <AddRecipeModal
            isOpen={isAddRecipeModalOpen}
            onClose={closeAddRecipeModal}
            onAddRecipe={handleAddRecipe}
          />

          <ConfirmationPopup
            isOpen={deleteConfirmation.isOpen}
            title="Delete Recipe"
            message="Are you sure you want to delete recipe?"
            onConfirm={handleConfirmDelete}
            onCancel={closeDeleteConfirmation}
          />
        </>
      )}
    </div>
  );
};

export default Recipes;
