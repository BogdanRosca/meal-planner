import { renderHook, waitFor } from '@testing-library/react';
import { useRecipes } from './useRecipes';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../types/recipe';

// Mock the recipe service
jest.mock('../services/recipeService');

const mockRecipeService = recipeService as jest.Mocked<typeof recipeService>;

describe('useRecipes hook', () => {
  const mockRecipes: Recipe[] = [
    {
      id: 1,
      name: 'Pancakes',
      category: 'breakfast',
      instructions: 'Mix and cook',
      prep_time: 15,
      portions: 4,
      main_ingredients: [
        { name: 'Flour', quantity: 200, unit: 'g' },
        { name: 'Milk', quantity: 300, unit: 'ml' },
      ],
      common_ingredients: ['Salt', 'Sugar'],
    },
    {
      id: 2,
      name: 'Caesar Salad',
      category: 'lunch',
      instructions: 'Chop and mix',
      prep_time: 10,
      portions: 2,
      main_ingredients: [
        { name: 'Lettuce', quantity: 200, unit: 'g' },
        { name: 'Chicken', quantity: 150, unit: 'g' },
      ],
      common_ingredients: ['Pepper', 'Dressing'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial state and data fetching', () => {
    it('should initialize with loading state and fetch recipes', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.recipes).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual(mockRecipes);
      expect(result.current.error).toBeNull();
      expect(mockRecipeService.getAllRecipes).toHaveBeenCalledTimes(1);
    });

    it('should handle empty recipe list', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error and set error message', async () => {
      const errorMessage = 'Network error';
      mockRecipeService.getAllRecipes.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual([]);
      expect(result.current.error).toBe(
        'Failed to load recipes. Please try again later.'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error loading recipes:',
        expect.any(Error)
      );
    });
  });

  describe('addRecipe', () => {
    it('should add a new recipe successfully', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'Pasta Carbonara',
        category: 'dinner',
        instructions: 'Cook pasta and add sauce',
        prep_time: 25,
        portions: 3,
        main_ingredients: [
          { name: 'Pasta', quantity: 300, unit: 'g' },
          { name: 'Bacon', quantity: 100, unit: 'g' },
        ],
        common_ingredients: ['Salt', 'Pepper'],
      };

      const addedRecipe: Recipe = { ...newRecipe, id: 3 };
      mockRecipeService.addRecipe.mockResolvedValue(addedRecipe);

      const { result } = renderHook(() => useRecipes());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add recipe
      let addResult: boolean = false;
      await waitFor(async () => {
        addResult = await result.current.addRecipe(newRecipe);
      });

      expect(addResult).toBe(true);
      expect(result.current.recipes).toHaveLength(3);
      expect(result.current.recipes[2]).toEqual(addedRecipe);
      expect(mockRecipeService.addRecipe).toHaveBeenCalledWith(newRecipe);
      expect(mockRecipeService.addRecipe).toHaveBeenCalledTimes(1);
    });

    it('should return false and log error when adding recipe fails', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.addRecipe.mockRejectedValue(new Error('Failed to add'));

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'Failed Recipe',
        category: 'dinner',
        instructions: 'Test',
        prep_time: 10,
        portions: 1,
        main_ingredients: [],
        common_ingredients: [],
      };

      let addResult: boolean = true;
      await waitFor(async () => {
        addResult = await result.current.addRecipe(newRecipe);
      });

      expect(addResult).toBe(false);
      expect(result.current.recipes).toHaveLength(2); // No new recipe added
      expect(console.error).toHaveBeenCalledWith(
        'Error adding recipe:',
        expect.any(Error)
      );
    });

    it('should add recipe to empty list', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue([]);
      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'First Recipe',
        category: 'breakfast',
        instructions: 'Simple',
        prep_time: 5,
        portions: 1,
        main_ingredients: [],
        common_ingredients: [],
      };
      const addedRecipe: Recipe = { ...newRecipe, id: 1 };
      mockRecipeService.addRecipe.mockResolvedValue(addedRecipe);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let addResult: boolean = false;
      await waitFor(async () => {
        addResult = await result.current.addRecipe(newRecipe);
      });

      expect(addResult).toBe(true);
      expect(result.current.recipes).toHaveLength(1);
      expect(result.current.recipes[0]).toEqual(addedRecipe);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe successfully', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.deleteRecipe.mockResolvedValue();

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toHaveLength(2);

      // Delete recipe with id 1
      let deleteResult: boolean = false;
      await waitFor(async () => {
        deleteResult = await result.current.deleteRecipe(1);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.recipes).toHaveLength(1);
      expect(result.current.recipes[0].id).toBe(2);
      expect(mockRecipeService.deleteRecipe).toHaveBeenCalledWith(1);
      expect(mockRecipeService.deleteRecipe).toHaveBeenCalledTimes(1);
    });

    it('should return false and log error when deleting recipe fails', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.deleteRecipe.mockRejectedValue(
        new Error('Failed to delete')
      );

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: boolean = true;
      await waitFor(async () => {
        deleteResult = await result.current.deleteRecipe(1);
      });

      expect(deleteResult).toBe(false);
      expect(result.current.recipes).toHaveLength(2); // Recipe not deleted
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting recipe:',
        expect.any(Error)
      );
    });

    it('should handle deleting non-existent recipe', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.deleteRecipe.mockResolvedValue();

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Delete non-existent recipe
      let deleteResult: boolean = false;
      await waitFor(async () => {
        deleteResult = await result.current.deleteRecipe(999);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.recipes).toHaveLength(2); // No change
    });

    it('should delete last remaining recipe', async () => {
      const singleRecipe = [mockRecipes[0]];
      mockRecipeService.getAllRecipes.mockResolvedValue(singleRecipe);
      mockRecipeService.deleteRecipe.mockResolvedValue();

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toHaveLength(1);

      let deleteResult: boolean = false;
      await waitFor(async () => {
        deleteResult = await result.current.deleteRecipe(1);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.recipes).toHaveLength(0);
    });
  });

  describe('Multiple operations', () => {
    it('should handle adding multiple recipes sequentially', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue([]);

      const recipe1: Omit<Recipe, 'id'> = {
        name: 'Recipe 1',
        category: 'breakfast',
        instructions: 'Test 1',
        prep_time: 10,
        portions: 2,
        main_ingredients: [],
        common_ingredients: [],
      };

      const recipe2: Omit<Recipe, 'id'> = {
        name: 'Recipe 2',
        category: 'lunch',
        instructions: 'Test 2',
        prep_time: 15,
        portions: 3,
        main_ingredients: [],
        common_ingredients: [],
      };

      mockRecipeService.addRecipe
        .mockResolvedValueOnce({ ...recipe1, id: 1 })
        .mockResolvedValueOnce({ ...recipe2, id: 2 });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add first recipe
      await waitFor(async () => {
        await result.current.addRecipe(recipe1);
      });
      expect(result.current.recipes).toHaveLength(1);

      // Add second recipe
      await waitFor(async () => {
        await result.current.addRecipe(recipe2);
      });
      expect(result.current.recipes).toHaveLength(2);
    });

    it('should handle deleting multiple recipes sequentially', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.deleteRecipe.mockResolvedValue();

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toHaveLength(2);

      // Delete first recipe
      await waitFor(async () => {
        await result.current.deleteRecipe(1);
      });
      expect(result.current.recipes).toHaveLength(1);

      // Delete second recipe
      await waitFor(async () => {
        await result.current.deleteRecipe(2);
      });
      expect(result.current.recipes).toHaveLength(0);
    });

    it('should handle add and delete operations together', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);

      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'New Recipe',
        category: 'snack',
        instructions: 'Simple',
        prep_time: 5,
        portions: 1,
        main_ingredients: [],
        common_ingredients: [],
      };

      mockRecipeService.addRecipe.mockResolvedValue({ ...newRecipe, id: 3 });
      mockRecipeService.deleteRecipe.mockResolvedValue();

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toHaveLength(2);

      // Add a recipe
      await waitFor(async () => {
        await result.current.addRecipe(newRecipe);
      });
      expect(result.current.recipes).toHaveLength(3);

      // Delete an existing recipe
      await waitFor(async () => {
        await result.current.deleteRecipe(1);
      });
      expect(result.current.recipes).toHaveLength(2);

      // Verify the correct recipes remain
      expect(result.current.recipes.find(r => r.id === 1)).toBeUndefined();
      expect(result.current.recipes.find(r => r.id === 2)).toBeDefined();
      expect(result.current.recipes.find(r => r.id === 3)).toBeDefined();
    });
  });

  describe('Error recovery', () => {
    it('should not affect recipes list when add fails', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.addRecipe.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalCount = result.current.recipes.length;

      const newRecipe: Omit<Recipe, 'id'> = {
        name: 'Failed Recipe',
        category: 'dinner',
        instructions: 'Test',
        prep_time: 10,
        portions: 1,
        main_ingredients: [],
        common_ingredients: [],
      };

      await waitFor(async () => {
        await result.current.addRecipe(newRecipe);
      });

      expect(result.current.recipes).toHaveLength(originalCount);
    });

    it('should not affect recipes list when delete fails', async () => {
      mockRecipeService.getAllRecipes.mockResolvedValue(mockRecipes);
      mockRecipeService.deleteRecipe.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalCount = result.current.recipes.length;
      const originalRecipes = [...result.current.recipes];

      await waitFor(async () => {
        await result.current.deleteRecipe(1);
      });

      expect(result.current.recipes).toHaveLength(originalCount);
      expect(result.current.recipes).toEqual(originalRecipes);
    });
  });
});
