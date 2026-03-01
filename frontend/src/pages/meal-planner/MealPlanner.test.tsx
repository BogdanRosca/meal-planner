import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MealPlanner from './MealPlanner';
import { mealPlanService } from '../../services/mealPlanService';
import { recipeService } from '../../services/recipeService';
import { Recipe, MealPlanEntry } from '../../types/recipe';

jest.mock('../../services/mealPlanService');
jest.mock('../../services/recipeService');

const mockRecipes: Recipe[] = [
  {
    id: 1,
    name: 'Pancakes',
    category: 'breakfast',
    main_ingredients: [{ name: 'flour', quantity: 200, unit: 'g' }],
    common_ingredients: [],
    instructions: 'Mix and cook',
    prep_time: 15,
    portions: 4,
  },
  {
    id: 2,
    name: 'Caesar Salad',
    category: 'lunch',
    main_ingredients: [{ name: 'lettuce', quantity: 1, unit: 'head' }],
    common_ingredients: [],
    instructions: 'Toss',
    prep_time: 10,
    portions: 2,
  },
];

const mockEntry: MealPlanEntry = {
  id: 1,
  week_start: '2026-03-02',
  day_of_week: 0,
  meal_slot: 'breakfast',
  recipe_id: 1,
  recipe_name: 'Pancakes',
  recipe_category: 'breakfast',
  recipe_foto_url: null,
};

describe('MealPlanner', () => {
  const mockGetMealPlan = mealPlanService.getMealPlan as jest.MockedFunction<
    typeof mealPlanService.getMealPlan
  >;
  const mockGetAllRecipes = recipeService.getAllRecipes as jest.MockedFunction<
    typeof recipeService.getAllRecipes
  >;
  const mockAddEntry = mealPlanService.addMealPlanEntry as jest.MockedFunction<
    typeof mealPlanService.addMealPlanEntry
  >;
  const mockDeleteEntry =
    mealPlanService.deleteMealPlanEntry as jest.MockedFunction<
      typeof mealPlanService.deleteMealPlanEntry
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllRecipes.mockResolvedValue(mockRecipes);
  });

  it('should display loading state initially', () => {
    mockGetMealPlan.mockReturnValue(new Promise(() => {}));

    render(<MealPlanner />);

    expect(screen.getByText('Loading meal plan...')).toBeInTheDocument();
  });

  it('should display calendar after loading', async () => {
    mockGetMealPlan.mockResolvedValue([]);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Meal Plan')).toBeInTheDocument();
    });

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetMealPlan.mockRejectedValue(new Error('Network error'));

    render(<MealPlanner />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load meal plan. Please try again later.')
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should display existing meal plan entries', async () => {
    mockGetMealPlan.mockResolvedValue([mockEntry]);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
    });
  });

  it('should navigate to previous week', async () => {
    mockGetMealPlan.mockResolvedValue([]);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Meal Plan')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Previous week'));

    await waitFor(() => {
      expect(mockGetMealPlan).toHaveBeenCalledTimes(2);
    });
  });

  it('should navigate to next week', async () => {
    mockGetMealPlan.mockResolvedValue([]);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Meal Plan')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Next week'));

    await waitFor(() => {
      expect(mockGetMealPlan).toHaveBeenCalledTimes(2);
    });
  });

  it('should open recipe selector when empty cell is clicked', async () => {
    mockGetMealPlan.mockResolvedValue([]);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Meal Plan')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0].closest('[role="button"]')!);

    await waitFor(() => {
      expect(screen.getByText(/Select a breakfast recipe/)).toBeInTheDocument();
    });
  });

  it('should add entry when recipe is selected', async () => {
    mockGetMealPlan.mockResolvedValue([]);
    mockAddEntry.mockResolvedValue(mockEntry);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Meal Plan')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0].closest('[role="button"]')!);

    await waitFor(() => {
      expect(screen.getByText(/Select a breakfast recipe/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pancakes'));

    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalled();
    });
  });

  it('should remove entry when remove button is clicked', async () => {
    mockGetMealPlan
      .mockResolvedValueOnce([mockEntry])
      .mockResolvedValueOnce([]);
    mockDeleteEntry.mockResolvedValue();

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
    });

    const removeBtn = screen.getByLabelText('Remove Pancakes');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockDeleteEntry).toHaveBeenCalledWith(1);
    });
  });

  it('should close recipe selector when close button is clicked', async () => {
    mockGetMealPlan.mockResolvedValue([]);

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Meal Plan')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0].closest('[role="button"]')!);

    await waitFor(() => {
      expect(screen.getByText(/Select a breakfast recipe/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('×'));

    await waitFor(() => {
      expect(
        screen.queryByText(/Select a breakfast recipe/)
      ).not.toBeInTheDocument();
    });
  });
});
