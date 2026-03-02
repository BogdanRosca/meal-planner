import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeSelectorModal from './RecipeSelectorModal';
import { Recipe } from '../../types/recipe';

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
    instructions: 'Toss ingredients',
    prep_time: 10,
    portions: 2,
  },
  {
    id: 3,
    name: 'Oatmeal',
    category: 'breakfast',
    main_ingredients: [{ name: 'oats', quantity: 100, unit: 'g' }],
    common_ingredients: [],
    instructions: 'Cook oats',
    prep_time: 5,
    portions: 1,
  },
];

describe('RecipeSelectorModal', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <RecipeSelectorModal
        isOpen={false}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Select a breakfast recipe')).toBeInTheDocument();
  });

  it('should filter recipes by category', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.getByText('Oatmeal')).toBeInTheDocument();
    expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
  });

  it('should show empty message when no recipes match', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="snack"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No snack recipes available.')).toBeInTheDocument();
  });

  it('should call onSelect when a recipe is clicked', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Pancakes'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const backdrop = document.querySelector('.selector-backdrop');
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const modal = document.querySelector('.selector-modal');
    fireEvent.click(modal!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display prep time and portions for each recipe', () => {
    render(
      <RecipeSelectorModal
        isOpen={true}
        recipes={mockRecipes}
        categoryFilter="breakfast"
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/15 min/)).toBeInTheDocument();
    expect(screen.getByText(/4 portions/)).toBeInTheDocument();
    expect(screen.getByText(/1 portion(?!s)/)).toBeInTheDocument();
  });
});
