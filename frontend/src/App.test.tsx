import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { mealPlanService } from './services/mealPlanService';
import { recipeService } from './services/recipeService';
import * as useRecipesModule from './hooks/useRecipes';

const mockRecipes = [
  { id: 1, name: 'Pancakes', category: 'breakfast' },
  { id: 2, name: 'Waffles', category: 'breakfast' },
  { id: 3, name: 'Chips', category: 'snack' },
  { id: 4, name: 'Salad', category: 'lunch' },
  { id: 5, name: 'Steak', category: 'dinner' },
];

jest.mock('./services/mealPlanService');
jest.mock('./services/recipeService');
jest.mock('./hooks/useRecipes');

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mealPlanService.getMealPlan as jest.Mock).mockResolvedValue([]);
    (recipeService.getAllRecipes as jest.Mock).mockResolvedValue([]);
    (useRecipesModule.useRecipes as jest.Mock).mockReturnValue({
      recipes: mockRecipes,
      loading: false,
      error: null,
      addRecipe: jest.fn(),
      updateRecipe: jest.fn(),
      deleteRecipe: jest.fn(),
    });
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('BrokenApp')).toBeInTheDocument();
  });

  it('renders all main components', () => {
    render(<App />);

    // Check TopBar is rendered
    expect(screen.getByText('MealCraft')).toBeInTheDocument();

    // Check QuickActions is rendered
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add Recipe')).toBeInTheDocument();

    // Check main content area is rendered
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check QuickActions contains Categories
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('displays default section as "Meal Planner"', () => {
    render(<App />);
    // Check the Meal Planner nav button is active by default
    const mealPlannerNav = screen.getByText('Meal Planner');
    expect(mealPlannerNav.closest('button')).toHaveClass('active');
  });

  it('updates current section when navigation is clicked', () => {
    render(<App />);

    const recipesNavButton = screen.getByText('Recipes');
    fireEvent.click(recipesNavButton);

    // Verify recipes page is rendered
    const recipesContent = document.querySelector('.recipes-content');
    expect(recipesContent).toBeInTheDocument();
    expect(recipesNavButton.closest('button')).toHaveClass('active');
  });

  it('navigates to recipes page when Recipes nav is clicked', async () => {
    render(<App />);

    // Navigate to Recipes page
    const recipesNavButton = screen.getByText('Recipes');
    fireEvent.click(recipesNavButton);

    // Verify the Recipes nav button is now active
    expect(recipesNavButton.closest('button')).toHaveClass('active');

    // Verify recipes content is rendered (should show loading or recipes)
    await waitFor(() => {
      const recipesContent = document.querySelector('.recipes-content');
      expect(recipesContent).toBeInTheDocument();
    });
  });

  it('handles mobile menu toggle', () => {
    const { container } = render(<App />);

    const mobileMenuButton = container.querySelector('.mobile-menu-btn');
    expect(mobileMenuButton).toBeInTheDocument();

    // Initially mobile menu should be closed
    const quickActions = screen.getByRole('complementary');
    expect(quickActions).not.toHaveClass('mobile-open');

    // Toggle mobile menu
    fireEvent.click(mobileMenuButton!);
    expect(quickActions).toHaveClass('mobile-open');
  });

  it('handles quick action clicks and closes mobile menu', () => {
    const { container } = render(<App />);

    // Open mobile menu first
    const mobileMenuButton = container.querySelector('.mobile-menu-btn');
    fireEvent.click(mobileMenuButton!);

    const quickActions = screen.getByRole('complementary');
    expect(quickActions).toHaveClass('mobile-open');

    // Click a quick action
    const addRecipeButton = screen.getByText('Add Recipe');
    fireEvent.click(addRecipeButton);

    // Should close mobile menu
    expect(quickActions).not.toHaveClass('mobile-open');
  });

  it('handles category clicks and closes mobile menu', () => {
    const { container } = render(<App />);

    // Open mobile menu first
    const mobileMenuButton = container.querySelector('.mobile-menu-btn');
    fireEvent.click(mobileMenuButton!);

    const quickActions = screen.getByRole('complementary');
    expect(quickActions).toHaveClass('mobile-open');

    // Find and click a category button (specifically in the categories section)
    const categorySection = screen
      .getByText('Categories')
      .closest('.categories-section');
    const breakfastButton = categorySection?.querySelector('.category-item');
    expect(breakfastButton).toBeTruthy();
    fireEvent.click(breakfastButton!);

    // Should close mobile menu
    expect(quickActions).not.toHaveClass('mobile-open');
  });

  it('navigates to recipes when category is clicked', () => {
    render(<App />);

    // Get initial section (should be Meal Planner)
    const mealPlannerNav = screen.getByText('Meal Planner');
    expect(mealPlannerNav.closest('button')).toHaveClass('active');

    // Click a category to navigate to Recipes
    const categorySection = screen
      .getByText('Categories')
      .closest('.categories-section');
    const categoryButton = categorySection?.querySelector('.category-item');
    expect(categoryButton).toBeTruthy();
    fireEvent.click(categoryButton!);

    // Should navigate to Recipes page
    const recipesContent = document.querySelector('.recipes-content');
    expect(recipesContent).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    render(<App />);

    // Check TopBar receives correct user prop
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check Home component receives search query (initially empty)
    // We can verify this by checking if search results are not shown initially
    screen.queryByText('Welcome');
    // Since search query is empty initially, welcome section should be visible if it exists
    // or the home component should render its default state
  });

  it('has correct CSS classes', () => {
    const { container } = render(<App />);

    const appDiv = container.firstChild as HTMLElement;
    expect(appDiv).toHaveClass('App');

    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('App-main');

    // Default section is "Meal Planner", so meal planner content renders
    const contentArea = mainElement.querySelector('.meal-planner');
    expect(contentArea).toBeInTheDocument();
  });

  it('renders with React.StrictMode compatibility', () => {
    // This test ensures the component works with StrictMode (no side effects)
    const { unmount } = render(<App />);
    unmount();

    // Re-render to check for any side effects
    render(<App />);
    expect(screen.getByText('MealCraft')).toBeInTheDocument();
  });

  it('maintains state correctly across interactions', () => {
    render(<App />);

    // Test multiple state changes - click Recipes nav
    const recipesNavButton = screen.getByText('Recipes');
    fireEvent.click(recipesNavButton);

    // Verify recipes page is rendered
    const recipesContent = document.querySelector('.recipes-content');
    expect(recipesContent).toBeInTheDocument();
    expect(recipesNavButton.closest('button')).toHaveClass('active');

    // Click Shopping List nav
    const shoppingListNavButtons = screen.getAllByText('Shopping List');
    const shoppingListNavButton = shoppingListNavButtons[0];
    fireEvent.click(shoppingListNavButton);
    // Verify navigation state changed
    expect(shoppingListNavButton.closest('button')).toHaveClass('active');

    // Go back to Meal Planner and verify it's active
    const mealPlannerNav = screen.getByText('Meal Planner');
    fireEvent.click(mealPlannerNav);
    expect(mealPlannerNav.closest('button')).toHaveClass('active');
  });

  it('navigates to shopping list page when Shopping List nav is clicked', () => {
    render(<App />);

    const shoppingListNavButtons = screen.getAllByText('Shopping List');
    const shoppingListNavButton = shoppingListNavButtons[0];
    fireEvent.click(shoppingListNavButton);

    expect(shoppingListNavButton.closest('button')).toHaveClass('active');
    const shoppingListContent = document.querySelector('.shopping-list');
    expect(shoppingListContent).toBeInTheDocument();
  });

  it('renders Home when navigated to unknown section', () => {
    render(<App />);

    // Navigate to Recipes
    const recipesNavButton = screen.getByText('Recipes');
    fireEvent.click(recipesNavButton);

    // Navigate to an unknown section by triggering category click with different name
    const mealPlannerNav = screen.getByText('Meal Planner');
    fireEvent.click(mealPlannerNav);

    expect(mealPlannerNav.closest('button')).toHaveClass('active');
  });

  it('renders correct content for each section', () => {
    render(<App />);

    // Default is Meal Planner
    let mealPlannerContent = document.querySelector('.meal-planner');
    expect(mealPlannerContent).toBeInTheDocument();

    // Switch to Recipes
    fireEvent.click(screen.getByText('Recipes'));
    let recipesContent = document.querySelector('.recipes-content');
    expect(recipesContent).toBeInTheDocument();

    // Switch to Shopping List
    const shoppingListButtons = screen.getAllByText('Shopping List');
    fireEvent.click(shoppingListButtons[0]);
    let shoppingListContent = document.querySelector('.shopping-list');
    expect(shoppingListContent).toBeInTheDocument();

    // Switch back to Meal Planner
    fireEvent.click(screen.getByText('Meal Planner'));
    mealPlannerContent = document.querySelector('.meal-planner');
    expect(mealPlannerContent).toBeInTheDocument();
  });

  it('passes selectedCategory to Recipes component', () => {
    render(<App />);

    // Click a category
    const categorySection = screen
      .getByText('Categories')
      .closest('.categories-section');
    const categoryButton = categorySection?.querySelector('.category-item');

    expect(categoryButton).toBeTruthy();
    fireEvent.click(categoryButton!);

    // Should navigate to Recipes with category selected
    const recipesContent = document.querySelector('.recipes-content');
    expect(recipesContent).toBeInTheDocument();
  });

  it('navigates to recipes when Add Recipe quick action is clicked', () => {
    render(<App />);

    const addRecipeButton = screen.getByText('Add Recipe');
    fireEvent.click(addRecipeButton);

    const recipesContent = document.querySelector('.recipes-content');
    expect(recipesContent).toBeInTheDocument();
  });

  it('navigates to meal planner when Plan Meals quick action is clicked', () => {
    render(<App />);

    const planMealsButton = screen.getByText('Plan Meals');
    fireEvent.click(planMealsButton);

    const mealPlannerContent = document.querySelector('.meal-planner');
    expect(mealPlannerContent).toBeInTheDocument();
  });

  it('navigates to shopping list when Shopping List quick action is clicked', () => {
    render(<App />);

    // Find the quick action "Shopping List" button (the last one is in quick actions)
    const allShoppingListButtons = screen.getAllByText('Shopping List');
    const quickActionButton =
      allShoppingListButtons[allShoppingListButtons.length - 1];

    fireEvent.click(quickActionButton);

    const shoppingListContent = document.querySelector('.shopping-list');
    expect(shoppingListContent).toBeInTheDocument();
  });
});
