import { useState } from 'react';
import { Recipe } from '../types/recipe';

export const useRecipeModals = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] =
    useState<boolean>(false);
  const [isEditRecipeModalOpen, setIsEditRecipeModalOpen] =
    useState<boolean>(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    recipeId: number | null;
    recipeName: string;
  }>({
    isOpen: false,
    recipeId: null,
    recipeName: '',
  });

  const openDetailModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecipe(null);
  };

  const openAddRecipeModal = () => {
    setIsAddRecipeModalOpen(true);
  };

  const closeAddRecipeModal = () => {
    setIsAddRecipeModalOpen(false);
  };

  const openEditRecipeModal = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsEditRecipeModalOpen(true);
  };

  const closeEditRecipeModal = () => {
    setIsEditRecipeModalOpen(false);
    setRecipeToEdit(null);
  };

  const openDeleteConfirmation = (recipe: Recipe) => {
    setDeleteConfirmation({
      isOpen: true,
      recipeId: recipe.id,
      recipeName: recipe.name,
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      recipeId: null,
      recipeName: '',
    });
  };

  return {
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
  };
};
