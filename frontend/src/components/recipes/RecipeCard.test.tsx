import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeCard from './RecipeCard';
import { Recipe } from '../../types/recipe';

describe('RecipeCard', () => {
  const mockRecipe: Recipe = {
    id: 1,
    name: 'Test Recipe',
    category: 'breakfast',
    instructions: 'Test instructions',
    prep_time: 30,
    portions: 4,
    main_ingredients: [
      { name: 'Flour', quantity: 200, unit: 'g' },
      { name: 'Eggs', quantity: 2, unit: 'pcs' },
    ],
    common_ingredients: ['Salt', 'Sugar'],
    foto_url: null,
  };

  const mockOnRecipeClick = jest.fn();
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render recipe card with all elements', () => {
      const { container } = render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-card')).toBeInTheDocument();
      expect(container.querySelector('.recipe-card-main')).toBeInTheDocument();
      expect(container.querySelector('.recipe-card-image')).toBeInTheDocument();
      expect(
        container.querySelector('.recipe-card-content')
      ).toBeInTheDocument();
    });

    it('should display recipe name', () => {
      render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    it('should display category badge', () => {
      const { container } = render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const badge = container.querySelector('.recipe-category-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('breakfast');
      expect(badge).toHaveClass('category-breakfast');
    });

    it('should display prep time', () => {
      render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText(/30 min/)).toBeInTheDocument();
    });

    it('should display portions correctly for multiple portions', () => {
      render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText(/4 portions/)).toBeInTheDocument();
    });

    it('should display portion correctly for single portion', () => {
      const singlePortionRecipe = { ...mockRecipe, portions: 1 };

      render(
        <RecipeCard
          _recipe={singlePortionRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText(/1 portion(?!s)/)).toBeInTheDocument();
    });

    it('should display delete button', () => {
      render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const deleteButton = screen.getByAltText('Delete');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('delete-icon');
    });
  });

  describe('Category Emojis', () => {
    it('should display breakfast emoji for breakfast category', () => {
      const breakfastRecipe = { ...mockRecipe, category: 'breakfast' };
      const { container } = render(
        <RecipeCard
          _recipe={breakfastRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-placeholder')).toHaveTextContent(
        '🍳'
      );
    });

    it('should display lunch emoji for lunch category', () => {
      const lunchRecipe = { ...mockRecipe, category: 'lunch' };
      const { container } = render(
        <RecipeCard
          _recipe={lunchRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-placeholder')).toHaveTextContent(
        '🥗'
      );
    });

    it('should display dinner emoji for dinner category', () => {
      const dinnerRecipe = { ...mockRecipe, category: 'dinner' };
      const { container } = render(
        <RecipeCard
          _recipe={dinnerRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-placeholder')).toHaveTextContent(
        '🍽️'
      );
    });

    it('should display snack emoji for snack category', () => {
      const snackRecipe = { ...mockRecipe, category: 'snack' };
      const { container } = render(
        <RecipeCard
          _recipe={snackRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-placeholder')).toHaveTextContent(
        '🍿'
      );
    });

    it('should display default emoji for unknown category', () => {
      const unknownRecipe = { ...mockRecipe, category: 'dessert' };
      const { container } = render(
        <RecipeCard
          _recipe={unknownRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-placeholder')).toHaveTextContent(
        '🍴'
      );
    });

    it('should handle case-insensitive category matching', () => {
      const upperCaseRecipe = { ...mockRecipe, category: 'BREAKFAST' };
      const { container } = render(
        <RecipeCard
          _recipe={upperCaseRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(container.querySelector('.recipe-placeholder')).toHaveTextContent(
        '🍳'
      );
    });
  });

  describe('Interactions', () => {
    it('should call onRecipeClick when card is clicked', () => {
      const { container } = render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const cardMain = container.querySelector('.recipe-card-main');
      fireEvent.click(cardMain!);

      expect(mockOnRecipeClick).toHaveBeenCalledTimes(1);
      expect(mockOnRecipeClick).toHaveBeenCalledWith(mockRecipe);
    });

    it('should call onDeleteClick when delete button is clicked', () => {
      const { container } = render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const deleteButton = container.querySelector('.recipe-delete-button');
      const mockEvent = { stopPropagation: jest.fn() } as any;

      fireEvent.click(deleteButton!, mockEvent);

      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteClick).toHaveBeenCalledWith(
        expect.any(Object),
        mockRecipe
      );
    });

    it('should not trigger onRecipeClick when delete button is clicked', () => {
      const { container } = render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const deleteButton = container.querySelector('.recipe-delete-button');
      fireEvent.click(deleteButton!);

      // Only delete should be called, not recipe click
      expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle recipe with zero prep time', () => {
      const zeroTimeRecipe = { ...mockRecipe, prep_time: 0 };
      render(
        <RecipeCard
          _recipe={zeroTimeRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText(/0 min/)).toBeInTheDocument();
    });

    it('should handle recipe with large prep time', () => {
      const longTimeRecipe = { ...mockRecipe, prep_time: 999 };
      render(
        <RecipeCard
          _recipe={longTimeRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText(/999 min/)).toBeInTheDocument();
    });

    it('should display foto_url when provided', () => {
      const recipeWithFoto = {
        ...mockRecipe,
        foto_url: 'https://example.com/recipe.jpg',
      };
      const { container } = render(
        <RecipeCard
          _recipe={recipeWithFoto}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      const img = container.querySelector('.recipe-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/recipe.jpg');
      expect(img).toHaveAttribute('alt', 'Test Recipe');
      expect(
        container.querySelector('.recipe-placeholder')
      ).not.toBeInTheDocument();
    });

    it('should display emoji placeholder when foto_url is null', () => {
      const { container } = render(
        <RecipeCard
          _recipe={mockRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(
        container.querySelector('.recipe-placeholder')
      ).toBeInTheDocument();
      expect(container.querySelector('.recipe-image')).not.toBeInTheDocument();
    });

    it('should display emoji placeholder when foto_url is undefined', () => {
      const recipeWithoutFoto = { ...mockRecipe, foto_url: undefined };
      const { container } = render(
        <RecipeCard
          _recipe={recipeWithoutFoto}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(
        container.querySelector('.recipe-placeholder')
      ).toBeInTheDocument();
      expect(container.querySelector('.recipe-image')).not.toBeInTheDocument();
    });

    it('should handle recipe with very long name', () => {
      const longNameRecipe = {
        ...mockRecipe,
        name: 'A'.repeat(100),
      };

      render(
        <RecipeCard
          _recipe={longNameRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle recipe with zero portions', () => {
      const zeroPortionsRecipe = { ...mockRecipe, portions: 0 };
      render(
        <RecipeCard
          _recipe={zeroPortionsRecipe}
          onRecipeClick={mockOnRecipeClick}
          onDeleteClick={mockOnDeleteClick}
        />
      );

      expect(screen.getByText(/0 portions/)).toBeInTheDocument();
    });
  });
});
