// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  RECIPES: `${API_BASE_URL}/recipes`,
  MEAL_PLANS: `${API_BASE_URL}/meal-plans`,
  SHOPPING_LIST: `${API_BASE_URL}/shopping-list`,
  RECIPE_IMPORT_YOUTUBE: `${API_BASE_URL}/recipes/import/youtube`,
  RECIPE_IMPORT_INSTAGRAM: `${API_BASE_URL}/recipes/import/instagram`,
  RECIPE_IMPORT_FACEBOOK: `${API_BASE_URL}/recipes/import/facebook`,
};
