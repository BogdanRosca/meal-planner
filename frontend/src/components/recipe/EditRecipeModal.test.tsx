import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRecipeModal from './EditRecipeModal';
import { Recipe } from '../../types/recipe';

const mockRecipe: Recipe = {
  id: 1,
  name: 'Pasta Carbonara',
  category: 'dinner',
  main_ingredients: [{ quantity: 400, unit: 'g', name: 'pasta' }],
  common_ingredients: ['salt', 'pepper'],
  instructions: 'Cook pasta and mix with eggs',
  prep_time: 20,
  portions: 4,
  foto_url: 'https://example.com/pasta.jpg',
  video_url: 'https://youtube.com/watch?v=pasta',
};

describe('EditRecipeModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnEditRecipe = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnEditRecipe.mockClear();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <EditRecipeModal
        isOpen={false}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    expect(container.firstChild).toBeEmptyDOMNode();
  });

  it('does not render when recipe is null', () => {
    const { container } = render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={null}
      />
    );

    expect(container.firstChild).toBeEmptyDOMNode();
  });

  it('renders modal with recipe data when isOpen and recipe are provided', () => {
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByDisplayValue('dinner')).toBeInTheDocument();
  });

  it('populates form fields with recipe data', () => {
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Cook pasta and mix with eggs')
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.com/pasta.jpg')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onEditRecipe with updated data on form submission', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const nameInput = screen.getByDisplayValue('Pasta Carbonara');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Pasta');

    const submitButton = screen.getByText('Save Changes');
    await user.click(submitButton);

    expect(mockOnEditRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Pasta',
      })
    );
  });

  it('handles adding new main ingredient', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const addIngredientButtons = screen.getAllByText(/Add Ingredient/i);
    await user.click(addIngredientButtons[0]);

    const submitButton = screen.getByText('Save Changes');
    await user.click(submitButton);

    expect(mockOnEditRecipe).toHaveBeenCalled();
  });

  it('handles adding common ingredient', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const commonIngredientInput = screen.getByPlaceholderText(
      /Add common ingredient/i
    );
    await user.type(commonIngredientInput, 'basil');

    const addButtons = screen.getAllByText('Add');
    await user.click(addButtons[0]);

    expect(screen.getByText('basil')).toBeInTheDocument();
  });

  it('updates form data when recipe prop changes', () => {
    const { rerender } = render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();

    const newRecipe: Recipe = {
      ...mockRecipe,
      id: 2,
      name: 'Pizza Margherita',
    };

    rerender(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={newRecipe}
      />
    );

    expect(screen.getByDisplayValue('Pizza Margherita')).toBeInTheDocument();
  });

  it('displays all category options', () => {
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const categorySelect = screen.getByDisplayValue('dinner');
    const options = within(
      categorySelect.parentElement as HTMLElement
    ).getAllByRole('option');

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Breakfast');
    expect(options[1]).toHaveTextContent('Lunch');
    expect(options[2]).toHaveTextContent('Dinner');
    expect(options[3]).toHaveTextContent('Snack');
  });
});
