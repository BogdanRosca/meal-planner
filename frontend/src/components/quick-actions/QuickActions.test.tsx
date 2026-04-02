import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickActions from './QuickActions';
import * as useRecipesModule from '../../hooks/useRecipes';

const mockRecipes = [
  { id: 1, name: 'Pancakes', category: 'breakfast' },
  { id: 2, name: 'Waffles', category: 'breakfast' },
  { id: 3, name: 'Chips', category: 'snack' },
  { id: 4, name: 'Salad', category: 'lunch' },
  { id: 5, name: 'Steak', category: 'dinner' },
];

jest.mock('../../hooks/useRecipes');

const renderQuickActions = (
  props: React.ComponentProps<typeof QuickActions> = {},
  locationState: { category?: string } | null = null
) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/meal-planner', state: locationState }]}
    >
      <QuickActions {...props} />
    </MemoryRouter>
  );

describe('QuickActions Component', () => {
  const mockOnActionClick = jest.fn();
  const mockOnCategoryClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRecipesModule.useRecipes as jest.Mock).mockReturnValue({
      recipes: mockRecipes,
      loading: false,
      error: null,
      addRecipe: jest.fn(),
      updateRecipe: jest.fn(),
      deleteRecipe: jest.fn(),
    });
  });

  it('renders the QuickActions component with title', () => {
    renderQuickActions();

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('renders all quick action items', () => {
    renderQuickActions();

    expect(screen.getByText('Add Recipe')).toBeInTheDocument();
    expect(screen.getByText('Plan Meals')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();

    expect(screen.getByText('Create a new recipe')).toBeInTheDocument();
    expect(screen.getByText('Plan your weekly meals')).toBeInTheDocument();
    expect(screen.getByText('Create shopping list')).toBeInTheDocument();
  });

  it('renders action icons', () => {
    renderQuickActions();

    const actionButtons = screen.getAllByRole('button');
    // Filter out category buttons by checking for quick action specific content
    const quickActionButtons = actionButtons.filter(
      (button: HTMLElement) =>
        button.textContent?.includes('Create') ||
        button.textContent?.includes('Plan your weekly')
    );

    expect(quickActionButtons).toHaveLength(3);
  });

  it('calls onActionClick when a quick action is clicked', () => {
    renderQuickActions({ onActionClick: mockOnActionClick });

    const addRecipeButton = screen.getByText('Add Recipe').closest('button');
    fireEvent.click(addRecipeButton!);

    expect(mockOnActionClick).toHaveBeenCalledWith('Add Recipe');
    expect(mockOnActionClick).toHaveBeenCalledTimes(1);
  });

  it('calls onActionClick for all quick action buttons', () => {
    renderQuickActions({ onActionClick: mockOnActionClick });

    const addRecipeButton = screen.getByText('Add Recipe').closest('button');
    const planMealsButton = screen.getByText('Plan Meals').closest('button');
    const shoppingListButton = screen
      .getByText('Shopping List')
      .closest('button');

    fireEvent.click(addRecipeButton!);
    fireEvent.click(planMealsButton!);
    fireEvent.click(shoppingListButton!);

    expect(mockOnActionClick).toHaveBeenNthCalledWith(1, 'Add Recipe');
    expect(mockOnActionClick).toHaveBeenNthCalledWith(2, 'Plan Meals');
    expect(mockOnActionClick).toHaveBeenNthCalledWith(3, 'Shopping List');
    expect(mockOnActionClick).toHaveBeenCalledTimes(3);
  });

  it('applies mobile-open class when isMobileOpen is true', () => {
    const { container } = renderQuickActions({ isMobileOpen: true });

    const quickActionsAside = container.querySelector('.quick-actions');
    expect(quickActionsAside).toHaveClass('mobile-open');
  });

  it('does not apply mobile-open class when isMobileOpen is false', () => {
    const { container } = renderQuickActions({ isMobileOpen: false });

    const quickActionsAside = container.querySelector('.quick-actions');
    expect(quickActionsAside).not.toHaveClass('mobile-open');
  });

  it('renders Categories component within QuickActions', () => {
    renderQuickActions();

    // Check that Categories component is rendered
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();
  });

  it('calls onCategoryClick when a category is clicked', () => {
    renderQuickActions({ onCategoryClick: mockOnCategoryClick });

    // Find the category button specifically (the one with category-item class)
    const categorySection = screen
      .getByText('Categories')
      .closest('.categories-section');
    const breakfastButton = categorySection?.querySelector('.category-item');
    expect(breakfastButton).toBeTruthy();
    fireEvent.click(breakfastButton!);

    expect(mockOnCategoryClick).toHaveBeenCalledWith('Breakfast');
    expect(mockOnCategoryClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    renderQuickActions();

    const quickActionsSection = screen.getByRole('complementary');
    expect(quickActionsSection).toBeInTheDocument();

    const actionButtons = screen.getAllByRole('button');
    actionButtons.forEach((button: HTMLElement) => {
      expect(button).toBeInTheDocument();
    });
  });

  it('renders arrow indicators for each action', () => {
    const { container } = renderQuickActions();

    const arrows = container.querySelectorAll('.action-arrow');
    // Should have 3 arrows for quick actions (categories have their own component)
    const quickActionArrows = Array.from(arrows).filter(
      (arrow: Element) => arrow.textContent === '→'
    );
    expect(quickActionArrows.length).toBeGreaterThanOrEqual(3);
  });

  it('shows active category when location state has category', () => {
    const { container } = renderQuickActions(
      { onCategoryClick: mockOnCategoryClick },
      { category: 'Breakfast' }
    );

    // Check if the breakfast button has active class
    const categorySection = container.querySelector('.categories-section');
    const buttons = categorySection?.querySelectorAll('button');
    expect(buttons).toBeTruthy();

    let hasActiveBreakfastButton = false;
    buttons?.forEach(button => {
      if (
        button.textContent?.includes('Breakfast') &&
        button.classList.contains('active')
      ) {
        hasActiveBreakfastButton = true;
      }
    });
    expect(hasActiveBreakfastButton).toBe(true);
  });

  it('passes onCategoryClick callback to Categories component', () => {
    renderQuickActions({ onCategoryClick: mockOnCategoryClick });

    const categorySection = screen
      .getByText('Categories')
      .closest('.categories-section');
    const dinnerButton = categorySection?.querySelector(
      '.category-item:last-child'
    ) as HTMLElement;

    expect(dinnerButton).toBeTruthy();
    fireEvent.click(dinnerButton);
    expect(mockOnCategoryClick).toHaveBeenCalledTimes(1);
  });

  it('works with mobile menu state', () => {
    const { container } = renderQuickActions(
      { isMobileOpen: true, onCategoryClick: mockOnCategoryClick },
      { category: 'Lunch' }
    );

    const quickActionsAside = container.querySelector('.quick-actions');
    expect(quickActionsAside).toHaveClass('mobile-open');

    // Categories should still be rendered and interactive
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });
});
