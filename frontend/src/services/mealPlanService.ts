import { API_ENDPOINTS } from '../config/api';
import { MealPlanEntry } from '../types/recipe';

export const mealPlanService = {
  async getMealPlan(weekStart: string): Promise<MealPlanEntry[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.MEAL_PLANS}?week_start=${weekStart}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.entries;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching meal plan:', error);
      throw error;
    }
  },

  async addMealPlanEntry(entry: {
    week_start: string;
    day_of_week: number;
    meal_slot: string;
    recipe_id: number;
  }): Promise<MealPlanEntry> {
    try {
      const response = await fetch(API_ENDPOINTS.MEAL_PLANS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.entry;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding meal plan entry:', error);
      throw error;
    }
  },

  async deleteMealPlanEntry(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_ENDPOINTS.MEAL_PLANS}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error deleting meal plan entry ${id}:`, error);
      throw error;
    }
  },
};
