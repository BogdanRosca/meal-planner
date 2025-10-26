import { renderHook, act } from '@testing-library/react';
import { useRecipeModals } from './useRecipeModals';
import { Recipe } from '../types/recipe';

describe('useRecipeModals hook', () => {
  const mockRecipe: Recipe = {
    id: 1,
    name: 'Test Recipe',
    category: 'dinner',
    instructions: 'Test instructions',
    prep_time: 30,
    portions: 4,
    main_ingredients: [{ name: 'Ingredient 1', quantity: 100, unit: 'g' }],
    common_ingredients: ['Salt', 'Pepper'],
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRecipeModals());

    expect(result.current.selectedRecipe).toBeNull();
    expect(result.current.isDetailModalOpen).toBe(false);
    expect(result.current.isAddRecipeModalOpen).toBe(false);
    expect(result.current.deleteConfirmation).toEqual({
      isOpen: false,
      recipeId: null,
      recipeName: '',
    });
  });

  describe('Detail Modal', () => {
    it('should open detail modal and set selected recipe', () => {
      const { result } = renderHook(() => useRecipeModals());

      act(() => {
        result.current.openDetailModal(mockRecipe);
      });

      expect(result.current.selectedRecipe).toEqual(mockRecipe);
      expect(result.current.isDetailModalOpen).toBe(true);
    });

    it('should close detail modal and clear selected recipe', () => {
      const { result } = renderHook(() => useRecipeModals());

      // First open the modal
      act(() => {
        result.current.openDetailModal(mockRecipe);
      });

      expect(result.current.isDetailModalOpen).toBe(true);
      expect(result.current.selectedRecipe).toEqual(mockRecipe);

      // Then close it
      act(() => {
        result.current.closeDetailModal();
      });

      expect(result.current.isDetailModalOpen).toBe(false);
      expect(result.current.selectedRecipe).toBeNull();
    });
  });

  describe('Add Recipe Modal', () => {
    it('should open add recipe modal', () => {
      const { result } = renderHook(() => useRecipeModals());

      act(() => {
        result.current.openAddRecipeModal();
      });

      expect(result.current.isAddRecipeModalOpen).toBe(true);
    });

    it('should close add recipe modal', () => {
      const { result } = renderHook(() => useRecipeModals());

      // First open the modal
      act(() => {
        result.current.openAddRecipeModal();
      });

      expect(result.current.isAddRecipeModalOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeAddRecipeModal();
      });

      expect(result.current.isAddRecipeModalOpen).toBe(false);
    });
  });

  describe('Delete Confirmation', () => {
    it('should open delete confirmation with recipe details', () => {
      const { result } = renderHook(() => useRecipeModals());

      act(() => {
        result.current.openDeleteConfirmation(mockRecipe);
      });

      expect(result.current.deleteConfirmation).toEqual({
        isOpen: true,
        recipeId: mockRecipe.id,
        recipeName: mockRecipe.name,
      });
    });

    it('should close delete confirmation and reset state', () => {
      const { result } = renderHook(() => useRecipeModals());

      // First open the confirmation
      act(() => {
        result.current.openDeleteConfirmation(mockRecipe);
      });

      expect(result.current.deleteConfirmation.isOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeDeleteConfirmation();
      });

      expect(result.current.deleteConfirmation).toEqual({
        isOpen: false,
        recipeId: null,
        recipeName: '',
      });
    });
  });

  describe('Multiple operations', () => {
    it('should handle opening and closing detail modal multiple times', () => {
      const { result } = renderHook(() => useRecipeModals());

      const recipe2: Recipe = {
        ...mockRecipe,
        id: 2,
        name: 'Another Recipe',
      };

      // Open with first recipe
      act(() => {
        result.current.openDetailModal(mockRecipe);
      });
      expect(result.current.selectedRecipe).toEqual(mockRecipe);

      // Close
      act(() => {
        result.current.closeDetailModal();
      });
      expect(result.current.selectedRecipe).toBeNull();

      // Open with second recipe
      act(() => {
        result.current.openDetailModal(recipe2);
      });
      expect(result.current.selectedRecipe).toEqual(recipe2);
    });

    it('should handle opening multiple modals independently', () => {
      const { result } = renderHook(() => useRecipeModals());

      // Open detail modal
      act(() => {
        result.current.openDetailModal(mockRecipe);
      });

      // Open add recipe modal
      act(() => {
        result.current.openAddRecipeModal();
      });

      // Both should be open
      expect(result.current.isDetailModalOpen).toBe(true);
      expect(result.current.isAddRecipeModalOpen).toBe(true);
      expect(result.current.selectedRecipe).toEqual(mockRecipe);
    });

    it('should maintain delete confirmation state while other modals change', () => {
      const { result } = renderHook(() => useRecipeModals());

      // Open delete confirmation
      act(() => {
        result.current.openDeleteConfirmation(mockRecipe);
      });

      // Open and close detail modal
      act(() => {
        result.current.openDetailModal(mockRecipe);
      });
      act(() => {
        result.current.closeDetailModal();
      });

      // Delete confirmation should still be open
      expect(result.current.deleteConfirmation.isOpen).toBe(true);
      expect(result.current.deleteConfirmation.recipeId).toBe(mockRecipe.id);
    });

    it('should handle switching between different recipes in delete confirmation', () => {
      const { result } = renderHook(() => useRecipeModals());

      const recipe2: Recipe = {
        ...mockRecipe,
        id: 2,
        name: 'Another Recipe',
      };

      // Open delete confirmation for first recipe
      act(() => {
        result.current.openDeleteConfirmation(mockRecipe);
      });
      expect(result.current.deleteConfirmation.recipeId).toBe(mockRecipe.id);
      expect(result.current.deleteConfirmation.recipeName).toBe(
        mockRecipe.name
      );

      // Open delete confirmation for second recipe
      act(() => {
        result.current.openDeleteConfirmation(recipe2);
      });
      expect(result.current.deleteConfirmation.recipeId).toBe(recipe2.id);
      expect(result.current.deleteConfirmation.recipeName).toBe(recipe2.name);
    });
  });

  describe('Edge cases', () => {
    it('should handle recipe with minimal data', () => {
      const { result } = renderHook(() => useRecipeModals());

      const minimalRecipe: Recipe = {
        id: 99,
        name: 'Minimal',
        category: 'snack',
        instructions: 'Simple',
        prep_time: 5,
        portions: 1,
        main_ingredients: [],
        common_ingredients: [],
      };

      act(() => {
        result.current.openDetailModal(minimalRecipe);
      });

      expect(result.current.selectedRecipe).toEqual(minimalRecipe);

      act(() => {
        result.current.openDeleteConfirmation(minimalRecipe);
      });

      expect(result.current.deleteConfirmation.recipeName).toBe('Minimal');
    });

    it('should handle recipe with id 0', () => {
      const { result } = renderHook(() => useRecipeModals());

      const recipeWithZeroId: Recipe = {
        ...mockRecipe,
        id: 0,
      };

      act(() => {
        result.current.openDeleteConfirmation(recipeWithZeroId);
      });

      expect(result.current.deleteConfirmation.recipeId).toBe(0);
    });

    it('should handle recipe with very long name', () => {
      const { result } = renderHook(() => useRecipeModals());

      const longNameRecipe: Recipe = {
        ...mockRecipe,
        name: 'A'.repeat(200),
      };

      act(() => {
        result.current.openDeleteConfirmation(longNameRecipe);
      });

      expect(result.current.deleteConfirmation.recipeName).toBe(
        'A'.repeat(200)
      );
    });
  });

  describe('State persistence', () => {
    it('should maintain state across multiple operations', () => {
      const { result } = renderHook(() => useRecipeModals());

      // Perform a sequence of operations
      act(() => {
        result.current.openAddRecipeModal();
      });
      expect(result.current.isAddRecipeModalOpen).toBe(true);

      act(() => {
        result.current.openDetailModal(mockRecipe);
      });
      expect(result.current.isDetailModalOpen).toBe(true);
      expect(result.current.selectedRecipe).toEqual(mockRecipe);

      act(() => {
        result.current.openDeleteConfirmation(mockRecipe);
      });
      expect(result.current.deleteConfirmation.isOpen).toBe(true);

      // Close add recipe modal - others should remain
      act(() => {
        result.current.closeAddRecipeModal();
      });
      expect(result.current.isAddRecipeModalOpen).toBe(false);
      expect(result.current.isDetailModalOpen).toBe(true);
      expect(result.current.deleteConfirmation.isOpen).toBe(true);

      // Close detail modal - delete confirmation should remain
      act(() => {
        result.current.closeDetailModal();
      });
      expect(result.current.isDetailModalOpen).toBe(false);
      expect(result.current.selectedRecipe).toBeNull();
      expect(result.current.deleteConfirmation.isOpen).toBe(true);

      // Close delete confirmation
      act(() => {
        result.current.closeDeleteConfirmation();
      });
      expect(result.current.deleteConfirmation.isOpen).toBe(false);
    });
  });
});
