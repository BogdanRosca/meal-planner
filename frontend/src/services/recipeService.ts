import { API_ENDPOINTS } from '../config/api';
import { Recipe, RecipesResponse } from '../types/recipe';

export const recipeService = {
  /**
   * Add a new recipe
   */
  async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    try {
      const response = await fetch(API_ENDPOINTS.RECIPES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Recipe = await response.json();
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding recipe:', error);
      throw error;
    }
  },

  /**
   * Fetch all recipes from the API
   */
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch(API_ENDPOINTS.RECIPES);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RecipesResponse = await response.json();
      return data.recipes;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching recipes:', error);
      throw error;
    }
  },

  /**
   * Fetch a single recipe by ID
   */
  async getRecipeById(id: number): Promise<Recipe> {
    try {
      const response = await fetch(`${API_ENDPOINTS.RECIPES}/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Recipe = await response.json();
      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching recipe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a recipe by ID
   */
  async deleteRecipe(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINTS.RECIPES}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error deleting recipe ${id}:`, error);
      throw error;
    }
  },
};
