import { recipeService } from './recipeService';
import { Recipe, RecipesResponse } from '../types/recipe';

// Mock fetch globally
global.fetch = jest.fn();

describe('recipeService', () => {
  const mockRecipe: Recipe = {
    id: 1,
    name: 'Test Recipe',
    category: 'lunch',
    main_ingredients: [
      { name: 'ingredient1', quantity: 100, unit: 'g' },
      { name: 'ingredient2', quantity: 2, unit: 'pcs' },
    ],
    common_ingredients: ['salt', 'pepper'],
    instructions: 'Test instructions',
    prep_time: 30,
    portions: 4,
  };

  const mockRecipesResponse: RecipesResponse = {
    status: 'success',
    count: 2,
    recipes: [
      mockRecipe,
      {
        id: 2,
        name: 'Another Recipe',
        category: 'dinner',
        main_ingredients: [{ name: 'pasta', quantity: 200, unit: 'g' }],
        common_ingredients: ['oil'],
        instructions: 'Cook pasta',
        prep_time: 20,
        portions: 2,
      },
    ],
  };

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error mock
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getAllRecipes', () => {
    it('should fetch all recipes successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecipesResponse,
      });

      const result = await recipeService.getAllRecipes();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recipes'
      );
      expect(result).toEqual(mockRecipesResponse.recipes);
      expect(result.length).toBe(2);
    });

    it('should return correct recipe structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecipesResponse,
      });

      const result = await recipeService.getAllRecipes();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('main_ingredients');
      expect(result[0]).toHaveProperty('common_ingredients');
      expect(result[0]).toHaveProperty('instructions');
      expect(result[0]).toHaveProperty('prep_time');
      expect(result[0]).toHaveProperty('portions');
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(recipeService.getAllRecipes()).rejects.toThrow(
        'HTTP error! status: 500'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching recipes:',
        expect.any(Error)
      );
    });

    it('should handle 404 error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(recipeService.getAllRecipes()).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(recipeService.getAllRecipes()).rejects.toThrow(
        'Network failure'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching recipes:',
        networkError
      );
    });

    it('should handle empty recipes array', async () => {
      const emptyResponse: RecipesResponse = {
        status: 'success',
        count: 0,
        recipes: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => emptyResponse,
      });

      const result = await recipeService.getAllRecipes();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(recipeService.getAllRecipes()).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should log error to console on failure', async () => {
      const error = new Error('Test error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(error);

      await expect(recipeService.getAllRecipes()).rejects.toThrow('Test error');

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching recipes:',
        error
      );
    });
  });

  describe('getRecipeById', () => {
    it('should fetch a single recipe successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecipe,
      });

      const result = await recipeService.getRecipeById(1);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recipes/1'
      );
      expect(result).toEqual(mockRecipe);
    });

    it('should fetch recipe with different id', async () => {
      const recipeId = 42;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockRecipe, id: recipeId }),
      });

      const result = await recipeService.getRecipeById(recipeId);

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8000/recipes/${recipeId}`
      );
      expect(result.id).toBe(recipeId);
    });

    it('should return complete recipe structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecipe,
      });

      const result = await recipeService.getRecipeById(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Recipe');
      expect(result).toHaveProperty('category', 'lunch');
      expect(result.main_ingredients).toHaveLength(2);
      expect(result.common_ingredients).toHaveLength(2);
      expect(result).toHaveProperty('instructions');
      expect(result).toHaveProperty('prep_time');
      expect(result).toHaveProperty('portions');
    });

    it('should throw error when recipe is not found (404)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(recipeService.getRecipeById(999)).rejects.toThrow(
        'HTTP error! status: 404'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching recipe 999:',
        expect.any(Error)
      );
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(recipeService.getRecipeById(1)).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(recipeService.getRecipeById(1)).rejects.toThrow(
        'Network failure'
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching recipe 1:',
        networkError
      );
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(recipeService.getRecipeById(1)).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should log error with correct recipe id to console on failure', async () => {
      const recipeId = 123;
      const error = new Error('Test error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(error);

      await expect(recipeService.getRecipeById(recipeId)).rejects.toThrow(
        'Test error'
      );

      expect(console.error).toHaveBeenCalledWith(
        `Error fetching recipe ${recipeId}:`,
        error
      );
    });

    it('should handle zero as a valid recipe id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockRecipe, id: 0 }),
      });

      const result = await recipeService.getRecipeById(0);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recipes/0'
      );
      expect(result.id).toBe(0);
    });

    it('should handle large recipe ids', async () => {
      const largeId = 999999;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockRecipe, id: largeId }),
      });

      const result = await recipeService.getRecipeById(largeId);

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8000/recipes/${largeId}`
      );
      expect(result.id).toBe(largeId);
    });
  });

  describe('API URL Configuration', () => {
    it('should use correct API endpoint for getAllRecipes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecipesResponse,
      });

      await recipeService.getAllRecipes();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recipes'
      );
    });

    it('should use correct API endpoint for getRecipeById', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecipe,
      });

      await recipeService.getRecipeById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recipes/1'
      );
    });
  });

  describe('Error Logging', () => {
    it('should always log errors to console when they occur', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const error = new Error('Something went wrong');

      (global.fetch as jest.Mock).mockRejectedValueOnce(error);

      await expect(recipeService.getAllRecipes()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should log different messages for getAllRecipes and getRecipeById', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const error = new Error('Test error');

      (global.fetch as jest.Mock).mockRejectedValueOnce(error);
      await expect(recipeService.getAllRecipes()).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching recipes:',
        error
      );

      consoleErrorSpy.mockClear();

      (global.fetch as jest.Mock).mockRejectedValueOnce(error);
      await expect(recipeService.getRecipeById(1)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching recipe 1:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await recipeService.deleteRecipe(1);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recipes/1',
        {
          method: 'DELETE',
        }
      );
    });

    it('should handle errors when deleting a recipe', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(recipeService.deleteRecipe(999)).rejects.toThrow(
        'HTTP error! status: 404'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting recipe 999:',
        expect.any(Error)
      );
    });

    it('should handle network errors when deleting a recipe', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(recipeService.deleteRecipe(1)).rejects.toThrow(
        'Network error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting recipe 1:',
        networkError
      );
    });
  });
});
