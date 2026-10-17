import { API_ENDPOINTS } from '../config/api';
import { apiFetch } from './apiClient';
import {
  ImportPlatform,
  Recipe,
  RecipeDraftResponse,
  RecipeImportErrorCode,
  RecipesResponse,
} from '../types/recipe';

const IMPORT_ENDPOINTS: Record<ImportPlatform, string> = {
  youtube: API_ENDPOINTS.RECIPE_IMPORT_YOUTUBE,
  instagram: API_ENDPOINTS.RECIPE_IMPORT_INSTAGRAM,
  facebook: API_ENDPOINTS.RECIPE_IMPORT_FACEBOOK,
};

const IMPORT_ERROR_CODES: RecipeImportErrorCode[] = [
  'invalid_url',
  'video_not_found',
  'not_a_recipe',
  'not_configured',
  'upstream_error',
  'timeout',
  'internal_error',
  'network_error',
];

export class RecipeImportError extends Error {
  status: number;
  code: RecipeImportErrorCode;

  constructor(status: number, code: RecipeImportErrorCode, message: string) {
    super(message);
    this.name = 'RecipeImportError';
    this.status = status;
    this.code = code;
  }
}

const isImportErrorCode = (value: unknown): value is RecipeImportErrorCode =>
  typeof value === 'string' && IMPORT_ERROR_CODES.some(code => code === value);

const toImportError = async (
  response: Response
): Promise<RecipeImportError> => {
  let detail: unknown = null;
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      detail = body.detail;
    }
  } catch {
    // Non-JSON error body: fall through to the status-based error below
  }

  if (
    typeof detail === 'object' &&
    detail !== null &&
    'code' in detail &&
    'message' in detail &&
    isImportErrorCode(detail.code) &&
    typeof detail.message === 'string'
  ) {
    return new RecipeImportError(response.status, detail.code, detail.message);
  }
  if (response.status === 422) {
    return new RecipeImportError(
      422,
      'invalid_url',
      'Enter a valid video URL.'
    );
  }
  return new RecipeImportError(
    response.status,
    'upstream_error',
    'Import failed, try again or add manually.'
  );
};

export const recipeService = {
  /**
   * Add a new recipe
   */
  async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    try {
      const response = await apiFetch(API_ENDPOINTS.RECIPES, {
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
   * Build a recipe draft from a YouTube video or Instagram reel. Nothing is saved.
   */
  async importFromLink(
    platform: ImportPlatform,
    url: string,
    signal?: AbortSignal
  ): Promise<RecipeDraftResponse> {
    let response: Response;
    try {
      response = await apiFetch(IMPORT_ENDPOINTS[platform], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      throw new RecipeImportError(
        0,
        'network_error',
        'Import failed, try again or add manually.'
      );
    }

    if (!response.ok) {
      throw await toImportError(response);
    }

    const data: RecipeDraftResponse = await response.json();
    return data;
  },

  /**
   * Fetch all recipes from the API
   */
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await apiFetch(API_ENDPOINTS.RECIPES);

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
      const response = await apiFetch(`${API_ENDPOINTS.RECIPES}/${id}`);

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
   * Update an existing recipe
   */
  async updateRecipe(
    id: number,
    recipe: Partial<Omit<Recipe, 'id'>>
  ): Promise<Recipe> {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.RECIPES}/${id}`, {
        method: 'PATCH',
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
      console.error(`Error updating recipe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a recipe by ID
   */
  async deleteRecipe(id: number): Promise<void> {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.RECIPES}/${id}`, {
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
