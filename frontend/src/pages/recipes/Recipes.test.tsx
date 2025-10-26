import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Recipes from './Recipes';
import { recipeService } from '../../services/recipeService';
import { Recipe } from '../../types/recipe';

// Mock the recipeService
jest.mock('../../services/recipeService');

const mockRecipes: Recipe[] = [
  {
    id: 1,
    name: 'Pancakes',
    category: 'breakfast',
    main_ingredients: [
      { name: 'flour', quantity: 200, unit: 'g' },
      { name: 'eggs', quantity: 2, unit: 'pcs' },
    ],
    common_ingredients: ['milk', 'sugar', 'salt'],
    instructions: 'Mix ingredients and cook on griddle',
    prep_time: 15,
    portions: 4,
  },
  {
    id: 2,
    name: 'Caesar Salad',
    category: 'lunch',
    main_ingredients: [
      { name: 'lettuce', quantity: 1, unit: 'head' },
      { name: 'chicken breast', quantity: 200, unit: 'g' },
    ],
    common_ingredients: ['croutons', 'parmesan', 'dressing'],
    instructions: 'Toss ingredients together',
    prep_time: 20,
    portions: 2,
  },
  {
    id: 3,
    name: 'Pasta Carbonara',
    category: 'dinner',
    main_ingredients: [
      { name: 'spaghetti', quantity: 400, unit: 'g' },
      { name: 'bacon', quantity: 150, unit: 'g' },
    ],
    common_ingredients: ['eggs', 'parmesan', 'black pepper'],
    instructions: 'Cook pasta, mix with bacon and egg sauce',
    prep_time: 25,
    portions: 4,
  },
  {
    id: 4,
    name: 'Popcorn',
    category: 'snack',
    main_ingredients: [{ name: 'corn kernels', quantity: 100, unit: 'g' }],
    common_ingredients: ['butter', 'salt'],
    instructions: 'Pop kernels in pot with oil',
    prep_time: 5,
    portions: 2,
  },
];

describe('Recipes Component', () => {
  const mockGetAllRecipes = recipeService.getAllRecipes as jest.MockedFunction<
    typeof recipeService.getAllRecipes
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading message while fetching recipes', () => {
      mockGetAllRecipes.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<Recipes />);

      expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
    });
  });

  describe('Successful Data Fetching', () => {
    it('should render recipes after successful fetch', async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);

      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Popcorn')).toBeInTheDocument();
    });

    it('should display recipe details correctly', async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);

      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Check category badges
      expect(screen.getByText('breakfast')).toBeInTheDocument();
      expect(screen.getByText('lunch')).toBeInTheDocument();
      expect(screen.getByText('dinner')).toBeInTheDocument();
      expect(screen.getByText('snack')).toBeInTheDocument();

      // Check prep time
      expect(screen.getByText('⏱️ 15 min')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 20 min')).toBeInTheDocument();

      // Check portions
      expect(screen.getAllByText(/4 portions/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2 portions/).length).toBeGreaterThan(0);
    });

    it('should render correct category emojis', async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);

      const { container } = render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const placeholders = container.querySelectorAll('.recipe-placeholder');
      expect(placeholders.length).toBe(4);

      // Check that placeholders contain emojis
      expect(placeholders[0].textContent).toMatch(/[🍳🥗🍽️🍿🍴]/);
    });

    it('should display correct portions text for singular and plural', async () => {
      const singlePortionRecipe: Recipe = {
        ...mockRecipes[0],
        portions: 1,
      };

      mockGetAllRecipes.mockResolvedValue([
        singlePortionRecipe,
        mockRecipes[1],
      ]);

      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText(/1 portion(?!s)/)).toBeInTheDocument();
      });

      expect(screen.getByText(/2 portions/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Network error';
      mockGetAllRecipes.mockRejectedValue(new Error(errorMessage));

      render(<Recipes />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load recipes. Please try again later.')
        ).toBeInTheDocument();
      });
    });

    it('should log error to console when fetch fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Network error');
      mockGetAllRecipes.mockRejectedValue(error);

      render(<Recipes />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error loading recipes:',
          error
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);
    });

    it('should render search input', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter recipes based on search query', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      fireEvent.change(searchInput, { target: { value: 'pasta' } });

      // Should show only Pasta Carbonara
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();
      expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
      expect(screen.queryByText('Popcorn')).not.toBeInTheDocument();
    });

    it('should be case-insensitive when searching', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');

      // Test uppercase
      fireEvent.change(searchInput, { target: { value: 'PASTA' } });
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();

      // Test mixed case
      fireEvent.change(searchInput, { target: { value: 'PaNcAkEs' } });
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
    });

    it('should display filtered results when searching', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      fireEvent.change(searchInput, { target: { value: 'salad' } });

      // Should show Caesar Salad but not Pancakes
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();
    });

    it('should show no results message when no recipes match', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(
        screen.getByText('No recipes found matching your search.')
      ).toBeInTheDocument();
    });

    it('should update search results dynamically', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');

      // Search for "a" should return multiple results
      fireEvent.change(searchInput, { target: { value: 'a' } });
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Pancakes')).toBeInTheDocument();

      // Search for "pasta" should return 1 result
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();
    });

    it('should handle search form submission', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      const form = searchInput.closest('form');

      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      fireEvent.submit(form!);

      // Should still display filtered results
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();
    });

    it('should clear search results when search query is cleared', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');

      // Search for something
      fireEvent.change(searchInput, { target: { value: 'pasta' } });
      expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // All recipes should be visible again
      expect(screen.getByText('Pancakes')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Popcorn')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no recipes message when no recipes exist', async () => {
      mockGetAllRecipes.mockResolvedValue([]);

      render(<Recipes />);

      await waitFor(() => {
        expect(
          screen.getByText('No recipes available yet.')
        ).toBeInTheDocument();
      });
    });

    it('should not display search info when no recipes and no search query', async () => {
      mockGetAllRecipes.mockResolvedValue([]);

      render(<Recipes />);

      await waitFor(() => {
        expect(
          screen.getByText('No recipes available yet.')
        ).toBeInTheDocument();
      });

      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });
  });

  describe('Recipe Grid Layout', () => {
    it('should render recipes in a grid', async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);

      const { container } = render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const grid = container.querySelector('.recipes-grid');
      expect(grid).toBeInTheDocument();

      const recipeCards = container.querySelectorAll('.recipe-card');
      expect(recipeCards.length).toBe(4);
    });

    it('should render recipe cards with correct structure', async () => {
      mockGetAllRecipes.mockResolvedValue([mockRecipes[0]]);

      const { container } = render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const recipeCard = container.querySelector('.recipe-card');
      expect(recipeCard).toBeInTheDocument();

      const cardImage = recipeCard?.querySelector('.recipe-card-image');
      expect(cardImage).toBeInTheDocument();

      const cardContent = recipeCard?.querySelector('.recipe-card-content');
      expect(cardContent).toBeInTheDocument();

      const cardTitle = recipeCard?.querySelector('.recipe-card-title');
      expect(cardTitle).toBeInTheDocument();

      const categoryBadge = recipeCard?.querySelector('.recipe-category-badge');
      expect(categoryBadge).toBeInTheDocument();

      const cardFooter = recipeCard?.querySelector('.recipe-card-footer');
      expect(cardFooter).toBeInTheDocument();
    });

    it('should apply correct category class to category badge', async () => {
      mockGetAllRecipes.mockResolvedValue([mockRecipes[0]]);

      const { container } = render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      const categoryBadge = container.querySelector('.recipe-category-badge');
      expect(categoryBadge).toHaveClass('category-breakfast');
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch recipes on mount', async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);

      render(<Recipes />);

      await waitFor(() => {
        expect(mockGetAllRecipes).toHaveBeenCalledTimes(1);
      });
    });

    it('should not refetch recipes on re-render with same props', async () => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);

      const { rerender } = render(<Recipes />);

      await waitFor(() => {
        expect(mockGetAllRecipes).toHaveBeenCalledTimes(1);
      });

      rerender(<Recipes />);

      // Should still be called only once
      expect(mockGetAllRecipes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Recipe Functionality', () => {
    const mockDeleteRecipe = recipeService.deleteRecipe as jest.MockedFunction<
      typeof recipeService.deleteRecipe
    >;

    beforeEach(() => {
      mockGetAllRecipes.mockResolvedValue(mockRecipes);
    });

    it('should show delete confirmation popup when delete button is clicked', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Find the first recipe card delete button and click it
      const deleteButtons = screen.getAllByAltText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Check if confirmation popup appears
      expect(screen.getByText('Delete Recipe')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete recipe?')
      ).toBeInTheDocument();
    });

    it('should close confirmation popup when cancel button is clicked', async () => {
      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Open the delete confirmation
      const deleteButtons = screen.getAllByAltText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Click the cancel button
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Check if confirmation popup has disappeared
      expect(screen.queryByText('Delete Recipe')).not.toBeInTheDocument();
    });

    it('should delete the recipe when confirm button is clicked', async () => {
      mockDeleteRecipe.mockResolvedValue();

      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Check that we have 4 recipes initially
      expect(
        screen.getAllByText(/Pancakes|Caesar Salad|Pasta Carbonara|Popcorn/)
          .length
      ).toBe(4);

      // Open the delete confirmation for the first recipe
      const deleteButtons = screen.getAllByAltText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Click the delete/confirm button
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      // Check if the recipe service deleteRecipe method was called
      expect(mockDeleteRecipe).toHaveBeenCalledWith(1);

      // Check if the recipe was removed from the UI
      await waitFor(() => {
        expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();
      });

      // Check that we now have 3 recipes
      expect(
        screen.getAllByText(/Caesar Salad|Pasta Carbonara|Popcorn/).length
      ).toBe(3);
    });

    it('should handle API errors when deleting a recipe', async () => {
      // Mock console.error to prevent error messages in test output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock the deleteRecipe to throw an error
      mockDeleteRecipe.mockRejectedValue(new Error('API Error'));

      render(<Recipes />);

      await waitFor(() => {
        expect(screen.getByText('Pancakes')).toBeInTheDocument();
      });

      // Open the delete confirmation
      const deleteButtons = screen.getAllByAltText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Click the delete/confirm button
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      // Check if the recipe service deleteRecipe method was called
      expect(mockDeleteRecipe).toHaveBeenCalledWith(1);

      // Check that the console.error was called with the error
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error deleting recipe:',
          expect.any(Error)
        );
      });

      // Check that the recipe is still in the DOM (deletion failed)
      expect(screen.getByText('Pancakes')).toBeInTheDocument();

      // Clean up
      consoleErrorSpy.mockRestore();
    });
  });
});
