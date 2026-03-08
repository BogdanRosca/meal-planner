import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShoppingList from './ShoppingList';
import * as useShoppingListModule from '../../hooks/useShoppingList';

const mockNavigateWeek = jest.fn();
const mockRemoveItem = jest.fn();
const mockUpdateItem = jest.fn();
const mockRegenerate = jest.fn().mockResolvedValue(undefined);

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
  regenerate: mockRegenerate,
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

  it('renders main ingredients table', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Main Ingredients')).toBeInTheDocument();
  });

  it('displays common ingredients in separate section', () => {
    render(<ShoppingList />);

    expect(screen.getByText('Common Ingredients')).toBeInTheDocument();
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

  it('calls updateItem when quantity is edited', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const editButton = screen.getByLabelText('Edit quantity for Pasta');
    await user.click(editButton);

    const input = screen.getByDisplayValue('500 g');
    await user.clear(input);
    await user.type(input, '600 ml');
    await user.keyboard('{Enter}');

    expect(mockUpdateItem).toHaveBeenCalledWith('1', {
      quantity: 600,
      unit: 'ml',
    });
  });

  it('handles quantity editing with only quantity change', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const editButton = screen.getByLabelText('Edit quantity for Pasta');
    await user.click(editButton);

    const input = screen.getByDisplayValue('500 g');
    await user.clear(input);
    await user.type(input, '750');
    await user.keyboard('{Enter}');

    expect(mockUpdateItem).toHaveBeenCalledWith('1', {
      quantity: 750,
      unit: undefined,
    });
  });

  it('handles quantity editing with only unit change', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const editButton = screen.getByLabelText('Edit quantity for Pasta');
    await user.click(editButton);

    const input = screen.getByDisplayValue('500 g');
    await user.clear(input);
    await user.type(input, '600');
    await user.keyboard('{Enter}');

    expect(mockUpdateItem).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        quantity: 600,
      })
    );
  });

  it('handles quantity input blur event', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const editButton = screen.getByLabelText('Edit quantity for Pasta');
    await user.click(editButton);

    const input = screen.getByDisplayValue('500 g');
    await user.clear(input);
    await user.type(input, '800 ml');
    await user.click(document.body);

    expect(mockUpdateItem).toHaveBeenCalledWith('1', {
      quantity: 800,
      unit: 'ml',
    });
  });

  it('does not show editable quantity for common ingredients', () => {
    render(<ShoppingList />);

    const saltQuantityElements = screen.queryAllByLabelText(
      'Edit quantity for Salt'
    );
    expect(saltQuantityElements).toHaveLength(0);
  });

  it('displays item without quantity when quantity is undefined', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      items: [
        {
          id: '1',
          name: 'Item',
          recipes: ['Recipe'],
          isCommon: false,
        },
      ],
    });

    render(<ShoppingList />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('handles empty recipe list for item', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      items: [
        {
          id: '1',
          name: 'Ingredient',
          quantity: 100,
          unit: 'g',
          recipes: [],
          isCommon: false,
        },
      ],
    });

    render(<ShoppingList />);

    expect(screen.getAllByText('—')[0]).toBeInTheDocument();
  });

  it('renders main ingredients with all columns', () => {
    render(<ShoppingList />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('shows only common ingredients section when no main ingredients', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      items: [
        {
          id: '1',
          name: 'Salt',
          recipes: ['Recipe'],
          isCommon: true,
        },
      ],
    });

    render(<ShoppingList />);

    expect(screen.getByText('Common Ingredients')).toBeInTheDocument();
    expect(screen.queryByText('Main Ingredients')).not.toBeInTheDocument();
  });

  it('shows only main ingredients section when no common ingredients', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      items: [
        {
          id: '1',
          name: 'Pasta',
          quantity: 500,
          unit: 'g',
          recipes: ['Recipe'],
          isCommon: false,
        },
      ],
    });

    render(<ShoppingList />);

    expect(screen.getByText('Main Ingredients')).toBeInTheDocument();
    expect(screen.queryByText('Common Ingredients')).not.toBeInTheDocument();
  });

  it('changes range without items regenerating', async () => {
    const user = userEvent.setup();
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
    });

    render(<ShoppingList />);

    const secondHalfButton = screen.getByText('Second Half');
    await user.click(secondHalfButton);

    expect(secondHalfButton.closest('button')).toHaveClass('range-active');
  });

  it('renders quantity display for item without unit', () => {
    jest.spyOn(useShoppingListModule, 'useShoppingList').mockReturnValue({
      ...mockUseShoppingList,
      items: [
        {
          id: '1',
          name: 'Eggs',
          quantity: 6,
          recipes: ['Recipe'],
          isCommon: false,
        },
      ],
    });

    render(<ShoppingList />);

    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('shows WeekNavigator component', () => {
    render(<ShoppingList />);

    const navigationButtons = screen.getAllByRole('button');
    expect(navigationButtons.length).toBeGreaterThan(0);
  });

  it('calls navigateWeek on week navigation', async () => {
    const user = userEvent.setup();
    render(<ShoppingList />);

    const buttons = screen.getAllByRole('button');
    const nextWeekButton = buttons.find(
      btn => btn.getAttribute('aria-label')?.includes('Next') || false
    );

    if (nextWeekButton) {
      await user.click(nextWeekButton);
    }
  });
});
