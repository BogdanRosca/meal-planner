import { useState, useEffect, useCallback } from 'react';
import { MealPlanEntry } from '../types/recipe';
import { mealPlanService } from '../services/mealPlanService';
import { recipeService } from '../services/recipeService';
import {
  aggregateIngredients,
  ShoppingListItem,
} from '../services/shoppingListService';

export type ShoppingListRange = 'first-half' | 'second-half' | 'entire';

const DAY_RANGES: Record<ShoppingListRange, number[]> = {
  'first-half': [0, 1, 2, 3],
  'second-half': [4, 5, 6],
  entire: [0, 1, 2, 3, 4, 5, 6],
};

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

export const useShoppingList = (range: ShoppingListRange) => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartStr = formatDate(weekStart);

  const generateList = useCallback(async () => {
    const allowedDays = DAY_RANGES[range];
    setLoading(true);
    setError(null);
    try {
      const entries: MealPlanEntry[] = await mealPlanService.getMealPlan(
        weekStartStr
      );
      const filtered = entries.filter(e => allowedDays.includes(e.day_of_week));
      const recipeIds = Array.from(new Set(filtered.map(e => e.recipe_id)));

      const recipes = await Promise.all(
        recipeIds.map(id => recipeService.getRecipeById(id))
      );

      const aggregated = aggregateIngredients(recipes);
      setItems(aggregated);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error generating shopping list:', err);
      setError('Failed to generate shopping list. Please try again later.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [weekStartStr, range]);

  useEffect(() => {
    generateList();
  }, [generateList]);

  const navigateWeek = (direction: -1 | 1) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ShoppingListItem>) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return {
    weekStart,
    items,
    loading,
    error,
    navigateWeek,
    regenerate: generateList,
    removeItem,
    updateItem,
  };
};
