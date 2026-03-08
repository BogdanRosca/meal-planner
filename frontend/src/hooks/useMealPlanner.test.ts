import { renderHook, act, waitFor } from '@testing-library/react';
import { useMealPlanner } from './useMealPlanner';
import * as mealPlanService from '../services/mealPlanService';
import * as recipeService from '../services/recipeService';

jest.mock('../services/mealPlanService');
jest.mock('../services/recipeService');

// Helper function to test getMonday (extracted from hook)
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('getMonday', () => {
  it('should return Monday when date is Monday', () => {
    const monday = new Date('2024-03-04'); // This is a Monday
    const result = getMonday(monday);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('should return Monday when date is Tuesday', () => {
    const tuesday = new Date('2024-03-05'); // This is a Tuesday
    const result = getMonday(tuesday);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('should return Monday when date is Sunday', () => {
    const sunday = new Date('2024-03-03'); // This is a Sunday
    const result = getMonday(sunday);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('should return Monday when date is Saturday', () => {
    const saturday = new Date('2024-03-02'); // This is a Saturday
    const result = getMonday(saturday);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('should reset hours to 00:00:00', () => {
    const date = new Date('2024-03-05 14:30:45');
    const result = getMonday(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe('useMealPlanner', () => {
  const mockMealPlanEntries = [
    {
      id: 1,
      week_start: '2024-01-01',
      day_of_week: 0,
      meal_slot: 'lunch',
      recipe_id: 1,
      recipe_name: 'Pasta',
      recipe_category: 'Italian',
      recipe_foto_url: null,
    },
    {
      id: 2,
      week_start: '2024-01-01',
      day_of_week: 1,
      meal_slot: 'dinner',
      recipe_id: 2,
      recipe_name: 'Salad',
      recipe_category: 'Salad',
      recipe_foto_url: null,
    },
  ];

  const mockRecipes = [
    {
      id: 1,
      name: 'Pasta',
      category: 'Italian',
      main_ingredients: [{ name: 'Pasta', quantity: 200, unit: 'g' }],
      common_ingredients: [],
      instructions: 'Cook pasta',
      prep_time: 20,
      portions: 2,
      foto_url: null,
    },
    {
      id: 2,
      name: 'Salad',
      category: 'Salad',
      main_ingredients: [{ name: 'Lettuce', quantity: 200, unit: 'g' }],
      common_ingredients: [],
      instructions: 'Mix salad',
      prep_time: 10,
      portions: 1,
      foto_url: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mockResolvedValue(mockMealPlanEntries);
    (recipeService.recipeService.getAllRecipes as jest.Mock).mockResolvedValue(
      mockRecipes
    );
  });

  it('should initialize with current week', () => {
    const { result } = renderHook(() => useMealPlanner());

    expect(result.current.weekStart).toBeInstanceOf(Date);
    expect(result.current.weekStartStr).toBeTruthy();
    expect(result.current.entries).toEqual([]);
    expect(result.current.recipes).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should load meal plan and recipes on mount', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toEqual(mockMealPlanEntries);
    expect(result.current.recipes).toEqual(mockRecipes);
  });

  it('should navigate to next week', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialWeekStart = result.current.weekStart;

    act(() => {
      result.current.navigateWeek(1);
    });

    await waitFor(() => {
      const nextWeekStart = result.current.weekStart;
      const daysDifference =
        (nextWeekStart.getTime() - initialWeekStart.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(daysDifference).toBe(7);
    });
  });

  it('should navigate to previous week', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialWeekStart = result.current.weekStart;

    act(() => {
      result.current.navigateWeek(-1);
    });

    await waitFor(() => {
      const prevWeekStart = result.current.weekStart;
      const daysDifference =
        (initialWeekStart.getTime() - prevWeekStart.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(daysDifference).toBe(7);
    });
  });

  it('should add meal plan entry', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const addResult = await act(async () => {
      return result.current.addEntry(2, 'breakfast', 1);
    });

    expect(addResult).toBe(true);
    expect(mealPlanService.mealPlanService.addMealPlanEntry).toHaveBeenCalled();
  });

  it('should handle error when adding entry fails', async () => {
    (
      mealPlanService.mealPlanService.addMealPlanEntry as jest.Mock
    ).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const addResult = await act(async () => {
      return result.current.addEntry(2, 'breakfast', 1);
    });

    expect(addResult).toBe(false);
  });

  it('should remove meal plan entry', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const removeResult = await act(async () => {
      return result.current.removeEntry(1);
    });

    expect(removeResult).toBe(true);
    expect(
      mealPlanService.mealPlanService.deleteMealPlanEntry
    ).toHaveBeenCalledWith(1);
  });

  it('should handle error when removing entry fails', async () => {
    (
      mealPlanService.mealPlanService.deleteMealPlanEntry as jest.Mock
    ).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const removeResult = await act(async () => {
      return result.current.removeEntry(1);
    });

    expect(removeResult).toBe(false);
  });

  it('should get entry by day of week and meal slot', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.entries.length).toBeGreaterThan(0);
    });

    const entry = result.current.getEntry(0, 'lunch');
    expect(entry).toBeDefined();
    expect(entry?.recipe_id).toBe(1);
  });

  it('should return undefined for non-existent entry', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.entries.length).toBeGreaterThan(0);
    });

    const entry = result.current.getEntry(5, 'breakfast');
    expect(entry).toBeUndefined();
  });

  it('should handle error when loading meal plan fails', async () => {
    (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      'Failed to load meal plan. Please try again later.'
    );
  });

  it('should handle error when loading recipes fails', async () => {
    (
      recipeService.recipeService.getAllRecipes as jest.Mock
    ).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toEqual([]);
  });

  it('should reload meal plan after adding entry', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mock.calls.length;

    await act(async () => {
      await result.current.addEntry(2, 'breakfast', 1);
    });

    const finalCallCount = (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mock.calls.length;
    expect(finalCallCount).toBeGreaterThan(initialCallCount);
  });

  it('should reload meal plan after removing entry', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mock.calls.length;

    await act(async () => {
      await result.current.removeEntry(1);
    });

    const finalCallCount = (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mock.calls.length;
    expect(finalCallCount).toBeGreaterThan(initialCallCount);
  });

  it('should handle error silently when loading recipes fails on initial load', async () => {
    (
      recipeService.recipeService.getAllRecipes as jest.Mock
    ).mockRejectedValueOnce(new Error('Network error'));
    (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mockResolvedValueOnce(mockMealPlanEntries);

    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toEqual([]);
    expect(result.current.entries).toEqual(mockMealPlanEntries);
  });

  it('should have error null initially', () => {
    const { result } = renderHook(() => useMealPlanner());
    expect(result.current.error).toBeNull();
  });
});
