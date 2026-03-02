// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  RECIPES: `${API_BASE_URL}/recipes`,
  MEAL_PLANS: `${API_BASE_URL}/meal-plans`,
};
