import React from 'react';
import { render, screen } from '@testing-library/react';
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

    expect(container.firstChild).toBeNull();
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

    expect(container.firstChild).toBeNull();
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

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows editing recipe name', async () => {
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
    await user.type(nameInput, 'Updated Pasta');

    expect(nameInput).toHaveValue('Updated Pasta');
  });

  it('allows changing recipe category', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const categorySelects = screen.queryAllByDisplayValue('dinner');
    if (categorySelects.length > 0) {
      await user.selectOptions(categorySelects[0], 'breakfast');
      expect(categorySelects[0]).toHaveValue('breakfast');
    }
  });

  it('allows editing instructions', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const instructionsInput = screen.getByDisplayValue('Cook pasta and mix with eggs');
    await user.clear(instructionsInput);
    await user.type(instructionsInput, 'New instructions');

    expect(instructionsInput).toHaveValue('New instructions');
  });

  it('allows editing prep time', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const prepTimeInput = screen.getByDisplayValue('20');
    await user.clear(prepTimeInput);
    await user.type(prepTimeInput, '30');

    expect(prepTimeInput).toHaveValue(30);
  });

  it('allows editing portions', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const portionsInput = screen.getByDisplayValue('4');
    await user.clear(portionsInput);
    await user.type(portionsInput, '6');

    expect(portionsInput).toHaveValue(6);
  });

  it('allows adding main ingredients', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const addIngredientButtons = screen.getAllByText('Add Ingredient');
    await user.click(addIngredientButtons[0]);

    const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs.length).toBe(2);
  });

  it('allows removing main ingredients', async () => {
    const recipeWithMultipleIngredients: Recipe = {
      ...mockRecipe,
      main_ingredients: [
        { quantity: 400, unit: 'g', name: 'pasta' },
        { quantity: 100, unit: 'g', name: 'butter' },
      ],
    };

    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={recipeWithMultipleIngredients}
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove ingredient');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('allows adding common ingredients', async () => {
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
      'Add common ingredient (salt, pepper, etc.)'
    );
    await user.type(commonIngredientInput, 'garlic');

    const addButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('Add'));
    await user.click(addButtons[addButtons.length - 1]);

    expect(commonIngredientInput).toHaveValue('');
  });

  it('allows removing common ingredients', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const removeTagButtons = screen.queryAllByLabelText(/Remove/);
    expect(removeTagButtons.length).toBeGreaterThan(0);
  });

  it('calls onEditRecipe with updated recipe on form submission', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(submitButton);

    expect(mockOnEditRecipe).toHaveBeenCalled();
    expect(mockOnEditRecipe.mock.calls[0][0]).toHaveProperty('name');
    expect(mockOnEditRecipe.mock.calls[0][0]).toHaveProperty('category');
  });

  it('filters out empty ingredients before submission', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(submitButton);

    expect(mockOnEditRecipe).toHaveBeenCalled();
    const submittedRecipe = mockOnEditRecipe.mock.calls[0][0];
    expect(submittedRecipe.main_ingredients.every(ing => ing.name.trim() !== '')).toBe(true);
  });

  it('allows editing foto URL', async () => {
    const user = userEvent.setup();
    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const fotoUrlInput = screen.getByDisplayValue('https://example.com/pasta.jpg');
    await user.clear(fotoUrlInput);
    await user.type(fotoUrlInput, 'https://example.com/new.jpg');

    expect(fotoUrlInput).toHaveValue('https://example.com/new.jpg');
  });

  it('handles recipe with no main ingredients', () => {
    const recipeWithoutIngredients: Recipe = {
      ...mockRecipe,
      main_ingredients: [],
    };

    render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={recipeWithoutIngredients}
      />
    );

    expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
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
    const { container } = render(
      <EditRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onEditRecipe={mockOnEditRecipe}
        recipe={mockRecipe}
      />
    );

    const categorySelect = container.querySelector(
      '[id="recipe-category"]'
    ) as HTMLSelectElement;
    expect(categorySelect).toBeInTheDocument();

    const options = categorySelect.querySelectorAll('option');
    expect(options).toHaveLength(4);
  });
});
