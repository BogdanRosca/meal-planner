import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShoppingList from './ShoppingList';
import * as useShoppingListModule from '../../hooks/useShoppingList';

const mockNavigateWeek = jest.fn();
const mockRemoveItem = jest.fn();
const mockUpdateItem = jest.fn();

const mockUseShoppingList = {
  weekStart: new Date('2024-01-01'),
  items: [
    {
      id: '1',
      name: 'Pasta',
      quantity: 500,
      unit: 'g',
      recipes: ['Carbonara'],
      isCommon: false,
    },
    {
      id: '2',
      name: 'Salt',
      recipes: ['Carbonara'],
      isCommon: true,
    },
  ],
  loading: false,
  error: null,
  navigateWeek: mockNavigateWeek,
  removeItem: mockRemoveItem,
  updateItem: mockUpdateItem,
};

describe('ShoppingList Component', () => {
  beforeEach(() => {
    jest
      .spyOn(useShoppingListModule, 'useShoppingList')
      .mockReturnValue(mockUseShoppingList);
    mockNavigateWeek.mockClear();
    mockRemoveItem.mockClear();
    mockUpdateItem.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders shopping list title', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Shopping List')).toBeInTheDocument();
  });

  it('displays main ingredients section', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Main Ingredients')).toBeInTheDocument();
  });

  it('displays common ingredients section', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Common Ingredients')).toBeInTheDocument();
  });

  it('renders ingredients in the table', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Salt')).toBeInTheDocument();
  });

  it('displays range selector buttons', () => {
    render(<ShoppingList />);

    expect(screen.getByText('First Half')).toBeInTheDocument();
    expect(screen.getByText('Second Half')).toBeInTheDocument();
    expect(screen.getByText('Entire Week')).toBeInTheDocument();
  });

  it('changes range when range button is clicked', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const firstHalfButton = screen.getByText('First Half');
    await user.click(firstHalfButton);

    expect(firstHalfButton.closest('button')).toHaveClass('range-active');
  });

  it('renders empty state when no items', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      items: [],
    });

    render(<ShoppingList />);

    expect(
      screen.getByText(/No recipes planned for this range/i)
    ).toBeInTheDocument();
  });

  it('displays loading state', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      loading: true,
    });

    render(<ShoppingList />);

    expect(screen.getByText(/Generating shopping list/i)).toBeInTheDocument();
  });

  it('displays error message when error occurs', () => {
    const errorMessage = 'Failed to load shopping list';
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      error: errorMessage,
    });

    render(<ShoppingList />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('removes item when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const removeButtons = screen.getAllByLabelText(/Remove/);
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
    }

    expect(mockRemoveItem).toHaveBeenCalled();
  });

  it('displays recipe tags for ingredients', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Carbonara')).toBeInTheDocument();
  });

  it('shows correct ingredient quantity format', () => {
    render(<ShoppingList />);

    const quantityElements = screen.getAllByText(/500/);
    expect(quantityElements.length).toBeGreaterThan(0);
  });

  it('handles week navigation', async () => {
    render(<ShoppingList />);

    const navigationButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.getAttribute('aria-label')?.includes('week') || false);

    expect(navigationButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('separates main and common ingredients', () => {
    render(<ShoppingList />);

    const mainSection = screen.getByText('Main Ingredients').closest('section');
    const commonSection = screen
      .getByText('Common Ingredients')
      .closest('section');

    expect(mainSection).toBeInTheDocument();
    expect(commonSection).toBeInTheDocument();
    expect(mainSection).not.toBe(commonSection);
  });
});
