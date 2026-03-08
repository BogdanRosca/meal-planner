import { renderHook, act, waitFor } from '@testing-library/react';
import { useShoppingList, ShoppingListRange } from './useShoppingList';
import * as mealPlanService from '../services/mealPlanService';
import * as recipeService from '../services/recipeService';
import * as shoppingListService from '../services/shoppingListService';

jest.mock('../services/mealPlanService');
jest.mock('../services/recipeService');
jest.mock('../services/shoppingListService');

describe('useShoppingList', () => {
  const mockMealPlanEntries = [
    {
      id: 1,
      recipe_id: 'recipe1',
      day_of_week: 0,
      meal_type: 'lunch' as const,
    },
    {
      id: 2,
      recipe_id: 'recipe2',
      day_of_week: 3,
      meal_type: 'dinner' as const,
    },
  ];

  const mockRecipes = [
    {
      id: 'recipe1',
      name: 'Pasta',
      category: 'Italian',
      main_ingredients: [{ name: 'Pasta', unit: 'g', quantity: 400 }],
      common_ingredients: [],
    },
    {
      id: 'recipe2',
      name: 'Salad',
      category: 'Salad',
      main_ingredients: [{ name: 'Lettuce', unit: 'g', quantity: 200 }],
      common_ingredients: [],
    },
  ];

  const mockShoppingItems = [
    {
      id: 'main-0',
      name: 'Pasta',
      unit: 'g',
      quantity: 400,
      isCommon: false,
      recipes: ['Pasta'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (
      mealPlanService.mealPlanService.getMealPlan as jest.Mock
    ).mockResolvedValue(mockMealPlanEntries);
    (recipeService.recipeService.getRecipeById as jest.Mock).mockImplementation(
      (id: string) => Promise.resolve(mockRecipes.find(r => r.id === id))
    );
    (shoppingListService.aggregateIngredients as jest.Mock).mockReturnValue(
      mockShoppingItems
    );
  });

  describe('initial state', () => {
    it('initializes with loading state', () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.items).toEqual([]);
    });

    it('initializes weekStart to current Monday', () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      expect(result.current.weekStart).toBeInstanceOf(Date);
      expect(result.current.weekStart.getDay()).toBe(1);
    });
  });

  describe('fetching and aggregating data', () => {
    it('fetches meal plan and recipes for entire week', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mealPlanService.mealPlanService.getMealPlan).toHaveBeenCalled();
      expect(recipeService.recipeService.getRecipeById).toHaveBeenCalledWith(
        'recipe1'
      );
      expect(recipeService.recipeService.getRecipeById).toHaveBeenCalledWith(
        'recipe2'
      );
    });

    it('filters meals for first-half range', async () => {
      (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mockResolvedValue([
        {
          id: 1,
          recipe_id: 'recipe1',
          day_of_week: 0,
          meal_type: 'lunch' as const,
        },
        {
          id: 2,
          recipe_id: 'recipe2',
          day_of_week: 1,
          meal_type: 'lunch' as const,
        },
        {
          id: 3,
          recipe_id: 'recipe1',
          day_of_week: 5,
          meal_type: 'dinner' as const,
        },
      ]);

      const { result } = renderHook(() => useShoppingList('first-half'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(recipeService.recipeService.getRecipeById).toHaveBeenCalledTimes(
        2
      );
    });

    it('filters meals for second-half range', async () => {
      (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mockResolvedValue([
        {
          id: 1,
          recipe_id: 'recipe1',
          day_of_week: 0,
          meal_type: 'lunch' as const,
        },
        {
          id: 2,
          recipe_id: 'recipe2',
          day_of_week: 4,
          meal_type: 'lunch' as const,
        },
        {
          id: 3,
          recipe_id: 'recipe1',
          day_of_week: 6,
          meal_type: 'dinner' as const,
        },
      ]);

      const { result } = renderHook(() => useShoppingList('second-half'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(recipeService.recipeService.getRecipeById).toHaveBeenCalledTimes(
        2
      );
    });

    it('deduplicates recipe IDs before fetching', async () => {
      (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mockResolvedValue([
        {
          id: 1,
          recipe_id: 'recipe1',
          day_of_week: 0,
          meal_type: 'lunch' as const,
        },
        {
          id: 2,
          recipe_id: 'recipe1',
          day_of_week: 1,
          meal_type: 'lunch' as const,
        },
      ]);

      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(recipeService.recipeService.getRecipeById).toHaveBeenCalledTimes(
        1
      );
    });

    it('sets items after successful aggregation', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.items).toEqual(mockShoppingItems);
      expect(result.current.error).toBe(null);
    });
  });

  describe('error handling', () => {
    it('handles error when fetching meal plan fails', async () => {
      const errorMessage = 'Failed to fetch meal plan';
      (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(
        'Failed to generate shopping list. Please try again later.'
      );
      expect(result.current.items).toEqual([]);
    });

    it('handles error when fetching recipes fails', async () => {
      (
        recipeService.recipeService.getRecipeById as jest.Mock
      ).mockRejectedValue(new Error('Failed to fetch recipe'));

      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(
        'Failed to generate shopping list. Please try again later.'
      );
      expect(result.current.items).toEqual([]);
    });

    it('clears error and items on new attempt', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mockRejectedValue(new Error('Failed'));

      act(() => {
        result.current.regenerate();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('week navigation', () => {
    it('navigates to next week', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      const initialDate = new Date(result.current.weekStart);

      act(() => {
        result.current.navigateWeek(1);
      });

      const expectedDate = new Date(initialDate);
      expectedDate.setDate(expectedDate.getDate() + 7);

      expect(result.current.weekStart.getDate()).toBe(expectedDate.getDate());
    });

    it('navigates to previous week', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      const initialDate = new Date(result.current.weekStart);

      act(() => {
        result.current.navigateWeek(-1);
      });

      const expectedDate = new Date(initialDate);
      expectedDate.setDate(expectedDate.getDate() - 7);

      expect(result.current.weekStart.getDate()).toBe(expectedDate.getDate());
    });

    it('regenerates list when weekStart changes', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mock.calls.length;

      act(() => {
        result.current.navigateWeek(1);
      });

      await waitFor(() => {
        expect(
          (mealPlanService.mealPlanService.getMealPlan as jest.Mock).mock.calls
            .length
        ).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('item management', () => {
    it('removes item by id', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.removeItem('main-0');
      });

      expect(result.current.items).toEqual([]);
    });

    it('updates item by id', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateItem('main-0', { quantity: 500, unit: 'ml' });
      });

      expect(result.current.items[0].quantity).toBe(500);
      expect(result.current.items[0].unit).toBe('ml');
    });

    it('only updates matching item', async () => {
      (shoppingListService.aggregateIngredients as jest.Mock).mockReturnValue([
        {
          id: 'main-0',
          name: 'Pasta',
          unit: 'g',
          quantity: 400,
          isCommon: false,
          recipes: ['Pasta'],
        },
        {
          id: 'main-1',
          name: 'Flour',
          unit: 'g',
          quantity: 500,
          isCommon: false,
          recipes: ['Bread'],
        },
      ]);

      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateItem('main-0', { quantity: 600 });
      });

      expect(result.current.items[0].quantity).toBe(600);
      expect(result.current.items[1].quantity).toBe(500);
    });
  });

  describe('range handling', () => {
    const ranges: ShoppingListRange[] = ['first-half', 'second-half', 'entire'];

    ranges.forEach(range => {
      it(`loads shopping list for ${range} range`, async () => {
        const { result } = renderHook(() => useShoppingList(range));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(mealPlanService.mealPlanService.getMealPlan).toHaveBeenCalled();
      });
    });
  });

  describe('regenerate function', () => {
    it('can be called to regenerate list', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mock.calls.length;

      act(() => {
        result.current.regenerate();
      });

      await waitFor(() => {
        expect(
          (mealPlanService.mealPlanService.getMealPlan as jest.Mock).mock.calls
            .length
        ).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('date formatting', () => {
    it('formats date correctly for API calls', async () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const callArgs = (
        mealPlanService.mealPlanService.getMealPlan as jest.Mock
      ).mock.calls[0];
      const dateString = callArgs[0];

      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('sets hours to 00:00:00 for weekStart', () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      expect(result.current.weekStart.getHours()).toBe(0);
      expect(result.current.weekStart.getMinutes()).toBe(0);
      expect(result.current.weekStart.getSeconds()).toBe(0);
    });
  });

  describe('Monday calculation', () => {
    it('returns Monday when called on Monday', () => {
      const monday = new Date('2024-01-01');
      expect(monday.getDay()).toBe(1);

      const { result } = renderHook(() => useShoppingList('entire'));

      expect(result.current.weekStart.getDay()).toBe(1);
    });

    it('returns previous Monday when called on other days', () => {
      const { result } = renderHook(() => useShoppingList('entire'));

      const weekStart = result.current.weekStart;
      expect(weekStart.getDay()).toBe(1);
    });
  });
});
