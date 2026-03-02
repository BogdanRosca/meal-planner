import { useState, useEffect, useCallback } from 'react';
import { MealPlanEntry, Recipe } from '../types/recipe';
import { mealPlanService } from '../services/mealPlanService';
import { recipeService } from '../services/recipeService';

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const useMealPlanner = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartStr = formatDate(weekStart);

  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mealPlanService.getMealPlan(weekStartStr);
      setEntries(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading meal plan:', err);
      setError('Failed to load meal plan. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [weekStartStr]);

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await recipeService.getAllRecipes();
        setRecipes(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading recipes:', err);
      }
    };
    loadRecipes();
  }, []);

  const navigateWeek = (direction: -1 | 1) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  };

  const addEntry = async (
    dayOfWeek: number,
    mealSlot: string,
    recipeId: number
  ): Promise<boolean> => {
    try {
      await mealPlanService.addMealPlanEntry({
        week_start: weekStartStr,
        day_of_week: dayOfWeek,
        meal_slot: mealSlot,
        recipe_id: recipeId,
      });
      await fetchMealPlan();
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error adding meal plan entry:', err);
      return false;
    }
  };

  const removeEntry = async (entryId: number): Promise<boolean> => {
    try {
      await mealPlanService.deleteMealPlanEntry(entryId);
      await fetchMealPlan();
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error removing meal plan entry:', err);
      return false;
    }
  };

  const getEntry = (
    dayOfWeek: number,
    mealSlot: string
  ): MealPlanEntry | undefined => {
    return entries.find(
      e => e.day_of_week === dayOfWeek && e.meal_slot === mealSlot
    );
  };

  return {
    weekStart,
    weekStartStr,
    entries,
    recipes,
    loading,
    error,
    navigateWeek,
    addEntry,
    removeEntry,
    getEntry,
  };
};
