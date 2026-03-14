import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './Recipes.module.css';
import { Recipe } from '../../types/recipe';
import RecipeDetailModal from '../../components/recipe/RecipeDetailModal';
import AddRecipeModal from '../../components/recipe/AddRecipeModal';
import EditRecipeModal from '../../components/recipe/EditRecipeModal';
import ConfirmationPopup from '../../components/popup/ConfirmationPopup';
import SearchBar from '../../components/recipes/SearchBar';
import CategoryFilter from '../../components/recipes/CategoryFilter';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import StatusMessage from '../../components/recipes/StatusMessage';
import { useRecipes } from '../../hooks/useRecipes';
import { useRecipeModals } from '../../hooks/useRecipeModals';

const Recipes: React.FC = () => {
  const { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe } =
    useRecipes();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Categories');

  const {
    selectedRecipe,
    isDetailModalOpen,
    isAddRecipeModalOpen,
    isEditRecipeModalOpen,
    recipeToEdit,
    deleteConfirmation,
    openDetailModal,
    closeDetailModal,
    openAddRecipeModal,
    closeAddRecipeModal,
    openEditRecipeModal,
    closeEditRecipeModal,
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

  const handleEditRecipe = (recipe: Recipe) => {
    closeDetailModal();
    openEditRecipeModal(recipe);
  };

  const handleUpdateRecipe = async (updatedRecipe: Omit<Recipe, 'id'>) => {
    if (recipeToEdit) {
      const success = await updateRecipe(recipeToEdit.id, updatedRecipe);
      if (success) {
        closeEditRecipeModal();
      }
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
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <button
              className={styles['add-recipe-button']}
              onClick={openAddRecipeModal}
            >
              <Plus size={18} />
              Add recipe
            </button>
          </div>

          <RecipeGrid
            recipes={recipes}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onRecipeClick={handleRecipeClick}
            onDeleteClick={handleDeleteClick}
          />

          {selectedRecipe && (
            <RecipeDetailModal
              recipe={selectedRecipe}
              isOpen={isDetailModalOpen}
              onClose={closeDetailModal}
              onEdit={() => handleEditRecipe(selectedRecipe)}
            />
          )}

          <AddRecipeModal
            isOpen={isAddRecipeModalOpen}
            onClose={closeAddRecipeModal}
            onAddRecipe={handleAddRecipe}
          />

          {recipeToEdit && (
            <EditRecipeModal
              recipe={recipeToEdit}
              isOpen={isEditRecipeModalOpen}
              onClose={closeEditRecipeModal}
              onEditRecipe={handleUpdateRecipe}
            />
          )}

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
