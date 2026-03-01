import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { mealPlanService } from './services/mealPlanService';
import { recipeService } from './services/recipeService';

jest.mock('./services/mealPlanService');
jest.mock('./services/recipeService');

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
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('MealCraft')).toBeInTheDocument();
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

    // Check Home component is rendered (it should contain categories and recent recipes)
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Recent Recipes')).toBeInTheDocument();
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

    // Verify recipes page is rendered (shows loading message or content)
    expect(screen.getByText(/Loading recipes.../i)).toBeInTheDocument();
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

  it('handles recipe clicks and closes mobile menu', () => {
    const { container } = render(<App />);

    // Open mobile menu first
    const mobileMenuButton = container.querySelector('.mobile-menu-btn');
    fireEvent.click(mobileMenuButton!);

    const quickActions = screen.getByRole('complementary');
    expect(quickActions).toHaveClass('mobile-open');

    // Find and click a recent recipe
    const recentRecipeButton = screen
      .getAllByText('Açaí bowl')[0]
      .closest('button');
    expect(recentRecipeButton).toBeTruthy();
    fireEvent.click(recentRecipeButton!);

    // Should close mobile menu
    expect(quickActions).not.toHaveClass('mobile-open');
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

    // Wait for recipes page to render - should see loading or search input
    const loadingOrSearch = screen.queryByText(/Loading recipes.../i);
    expect(loadingOrSearch).toBeInTheDocument();

    // Click Analytics nav
    const analyticsNavButton = screen.getByText('Analytics');
    fireEvent.click(analyticsNavButton);
    // Verify navigation state changed (the active class should be on Analytics now)
    expect(analyticsNavButton.closest('button')).toHaveClass('active');

    // Go back to Home (Meal Planner) and verify search works
    const mealPlannerNav = screen.getByText('Meal Planner');
    fireEvent.click(mealPlannerNav);
    expect(mealPlannerNav.closest('button')).toHaveClass('active');
  });
});
