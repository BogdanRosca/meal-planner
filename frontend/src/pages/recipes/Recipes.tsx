import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Link } from 'lucide-react';
import styles from './Recipes.module.css';
import { ImportPlatform, Recipe } from '../../types/recipe';
import RecipeDetailModal from '../../components/recipe/RecipeDetailModal';
import AddRecipeModal from '../../components/recipe/AddRecipeModal';
import EditRecipeModal from '../../components/recipe/EditRecipeModal';
import ImportRecipeModal from '../../components/recipe/ImportRecipeModal';
import ConfirmationPopup from '../../components/popup/ConfirmationPopup';
import SearchBar from '../../components/recipes/SearchBar';
import RecipeGrid from '../../components/recipes/RecipeGrid';
import StatusMessage from '../../components/recipes/StatusMessage';
import { useRecipes } from '../../hooks/useRecipes';
import { useRecipeModals } from '../../hooks/useRecipeModals';
import { useSelectedCategory } from '../../hooks/useSelectedCategory';
import { useRecipeImport } from '../../hooks/useRecipeImport';
import { getImportPlatform } from '../../config/importPlatforms';

const hasOpenImportFlag = (state: unknown): boolean =>
  typeof state === 'object' &&
  state !== null &&
  'openImport' in state &&
  state.openImport === true;

const Recipes: React.FC = () => {
  const selectedCategory = useSelectedCategory();
  const location = useLocation();
  const navigate = useNavigate();

  const { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe } =
    useRecipes();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    selectedRecipe,
    isDetailModalOpen,
    isAddRecipeModalOpen,
    isEditRecipeModalOpen,
    recipeToEdit,
    isImportModalOpen,
    deleteConfirmation,
    openDetailModal,
    closeDetailModal,
    openAddRecipeModal,
    closeAddRecipeModal,
    openImportModal,
    closeImportModal,
    openEditRecipeModal,
    closeEditRecipeModal,
    openDeleteConfirmation,
    closeDeleteConfirmation,
  } = useRecipeModals();

  const {
    importRecipe,
    draft: importedDraft,
    phase: importPhase,
    error: importError,
    cancel: cancelImport,
    reset: resetImport,
  } = useRecipeImport();
  // Bumped per draft so the review form mounts fresh with the new initial values
  const [draftFormKey, setDraftFormKey] = useState<number>(0);

  // The "Import from link" quick action navigates here with { openImport: true }
  useEffect(() => {
    if (hasOpenImportFlag(location.state)) {
      resetImport();
      openImportModal();
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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

  const handleRateRecipe = (recipe: Recipe, rating: number | null) => {
    updateRecipe(recipe.id, { rating });
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

  const handleOpenImport = () => {
    resetImport();
    openImportModal();
  };

  const handleImport = async (platform: ImportPlatform, url: string) => {
    const draft = await importRecipe(platform, url);
    if (draft) {
      setDraftFormKey(key => key + 1);
      closeImportModal();
    }
  };

  const handleCloseImport = () => {
    cancelImport();
    closeImportModal();
  };

  const handleImportAddManually = () => {
    handleCloseImport();
    resetImport();
    openAddRecipeModal();
  };

  const handleSaveImportedRecipe = async (newRecipe: Omit<Recipe, 'id'>) => {
    const success = await addRecipe(newRecipe);
    if (success) {
      resetImport();
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
            <div className={styles['action-buttons']}>
              <button
                type="button"
                className={styles['import-recipe-button']}
                onClick={handleOpenImport}
              >
                <Link size={18} />
                Import from link
              </button>
              <button
                className={styles['add-recipe-button']}
                onClick={openAddRecipeModal}
              >
                <Plus size={18} />
                Add recipe
              </button>
            </div>
          </div>

          <RecipeGrid
            recipes={recipes}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onRecipeClick={handleRecipeClick}
            onDeleteClick={handleDeleteClick}
            onRateRecipe={handleRateRecipe}
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

      {isImportModalOpen && (
        <ImportRecipeModal
          phase={importPhase}
          error={importError}
          onImport={handleImport}
          onCancel={cancelImport}
          onClose={handleCloseImport}
          onBack={resetImport}
          onAddManually={handleImportAddManually}
        />
      )}

      {importedDraft && (
        <AddRecipeModal
          key={draftFormKey}
          isOpen
          onClose={resetImport}
          onAddRecipe={handleSaveImportedRecipe}
          initialValues={importedDraft}
          fieldFlags={importedDraft.field_flags}
          duplicateOf={importedDraft.duplicate_of}
          importSourceLabel={
            getImportPlatform(importedDraft.source.platform).label
          }
        />
      )}
    </div>
  );
};

export default Recipes;
