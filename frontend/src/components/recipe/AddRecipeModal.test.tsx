import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddRecipeModal from './AddRecipeModal';

describe('AddRecipeModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnAddRecipe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AddRecipeModal
        isOpen={false}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should update recipe name input', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const nameInput = screen.getByLabelText('Recipe Name');
    fireEvent.change(nameInput, { target: { value: 'Spaghetti Carbonara' } });
    expect(nameInput).toHaveValue('Spaghetti Carbonara');
  });

  it('should update category selection', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'breakfast' } });
    expect(categorySelect).toHaveValue('breakfast');
  });

  it('should update instructions textarea', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const instructionsTextarea = screen.getByLabelText('Instructions');
    fireEvent.change(instructionsTextarea, {
      target: { value: 'Cook pasta and add sauce' },
    });
    expect(instructionsTextarea).toHaveValue('Cook pasta and add sauce');
  });

  it('should update prep time input', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const prepTimeInput = screen.getByLabelText('Prep Time (minutes)');
    fireEvent.change(prepTimeInput, { target: { value: '30' } });
    expect(prepTimeInput).toHaveValue(30);
  });

  it('should update portions input', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const portionsInput = screen.getByLabelText('Portions');
    fireEvent.change(portionsInput, { target: { value: '4' } });
    expect(portionsInput).toHaveValue(4);
  });

  it('should add a new main ingredient', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const addButton = screen.getByText('+ Add Ingredient');
    fireEvent.click(addButton);

    // Should now have 2 ingredient rows (1 default + 1 added)
    const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs).toHaveLength(2);
  });

  it('should update main ingredient name', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const ingredientNameInput = screen.getByPlaceholderText('Ingredient name');
    fireEvent.change(ingredientNameInput, { target: { value: 'Pasta' } });
    expect(ingredientNameInput).toHaveValue('Pasta');
  });

  it('should update main ingredient quantity', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const quantityInput = screen.getByPlaceholderText('Qty');
    fireEvent.change(quantityInput, { target: { value: '200' } });
    expect(quantityInput).toHaveValue(200);
  });

  it('should update main ingredient unit', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );
    const unitSelects = screen.getAllByRole('combobox');
    const ingredientUnitSelect = unitSelects[1]; // First is category, second is ingredient unit
    fireEvent.change(ingredientUnitSelect, { target: { value: 'ml' } });
    expect(ingredientUnitSelect).toHaveValue('ml');
  });

  it('should remove a main ingredient', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    // Add a second ingredient
    const addButton = screen.getByText('+ Add Ingredient');
    fireEvent.click(addButton);

    // Should have 2 ingredient rows
    let ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs).toHaveLength(2);

    // Remove the second ingredient
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    const ingredientRemoveButton = removeButtons.find(
      btn => btn.className === 'remove-btn'
    );
    if (ingredientRemoveButton) {
      fireEvent.click(ingredientRemoveButton);
    }

    // Should now have 1 ingredient row
    ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs).toHaveLength(1);
  });

  it('should add a common ingredient', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    const commonIngredientInput = screen.getByPlaceholderText(
      'Add common ingredient (salt, pepper, etc.)'
    );
    fireEvent.change(commonIngredientInput, { target: { value: 'Salt' } });

    const addCommonButton = screen.getByText('Add');
    fireEvent.click(addCommonButton);

    expect(screen.getByText('Salt')).toBeInTheDocument();
    expect(commonIngredientInput).toHaveValue('');
  });

  it('should not add empty common ingredient', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    const commonIngredientInput = screen.getByPlaceholderText(
      'Add common ingredient (salt, pepper, etc.)'
    );
    const addCommonButton = screen.getByText('Add');

    // Try to add empty string
    fireEvent.change(commonIngredientInput, { target: { value: '' } });
    fireEvent.click(addCommonButton);

    // Should not add any tag
    const tags = document.querySelectorAll('.common-ingredient-tag');
    expect(tags).toHaveLength(0);
  });

  it('should not add whitespace-only common ingredient', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    const commonIngredientInput = screen.getByPlaceholderText(
      'Add common ingredient (salt, pepper, etc.)'
    );
    const addCommonButton = screen.getByText('Add');

    // Try to add whitespace
    fireEvent.change(commonIngredientInput, { target: { value: '   ' } });
    fireEvent.click(addCommonButton);

    // Should not add any tag
    const tags = document.querySelectorAll('.common-ingredient-tag');
    expect(tags).toHaveLength(0);
  });

  it('should remove a common ingredient', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    // Add a common ingredient
    const commonIngredientInput = screen.getByPlaceholderText(
      'Add common ingredient (salt, pepper, etc.)'
    );
    fireEvent.change(commonIngredientInput, { target: { value: 'Pepper' } });
    fireEvent.click(screen.getByText('Add'));

    expect(screen.getByText('Pepper')).toBeInTheDocument();

    // Remove it
    const removeTagButtons = screen.getAllByRole('button', { name: '×' });
    const tagRemoveButton = removeTagButtons.find(
      btn => btn.className === 'remove-tag-btn'
    );
    if (tagRemoveButton) {
      fireEvent.click(tagRemoveButton);
    }

    expect(screen.queryByText('Pepper')).not.toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Recipe Name'), {
      target: { value: 'Test Recipe' },
    });

    fireEvent.change(screen.getByPlaceholderText('Ingredient name'), {
      target: { value: 'Flour' },
    });

    fireEvent.change(screen.getByPlaceholderText('Qty'), {
      target: { value: '500' },
    });

    fireEvent.change(screen.getByLabelText('Instructions'), {
      target: { value: 'Mix and bake' },
    });

    // Submit form
    const submitButton = screen.getByText('Add Recipe');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
    });

    expect(mockOnAddRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Recipe',
        category: 'dinner',
        instructions: 'Mix and bake',
        prep_time: 15,
        portions: 2,
        main_ingredients: [
          {
            name: 'Flour',
            quantity: 500,
            unit: 'g',
          },
        ],
        common_ingredients: [],
      })
    );
  });

  it('should filter out empty main ingredients when submitting', async () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Recipe Name'), {
      target: { value: 'Test Recipe' },
    });

    // Add valid ingredient
    fireEvent.change(screen.getByPlaceholderText('Ingredient name'), {
      target: { value: 'Flour' },
    });

    fireEvent.change(screen.getByPlaceholderText('Qty'), {
      target: { value: '500' },
    });

    // Add another ingredient but leave it empty
    fireEvent.click(screen.getByText('+ Add Ingredient'));

    fireEvent.change(screen.getByLabelText('Instructions'), {
      target: { value: 'Mix and bake' },
    });

    // Submit form
    const submitButton = screen.getByText('Add Recipe');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
    });

    // Should only include the valid ingredient
    expect(mockOnAddRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        main_ingredients: [
          {
            name: 'Flour',
            quantity: 500,
            unit: 'g',
          },
        ],
      })
    );
  });

  it('should include common ingredients in submission', async () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Recipe Name'), {
      target: { value: 'Test Recipe' },
    });

    fireEvent.change(screen.getByPlaceholderText('Ingredient name'), {
      target: { value: 'Flour' },
    });

    fireEvent.change(screen.getByPlaceholderText('Qty'), {
      target: { value: '500' },
    });

    fireEvent.change(screen.getByLabelText('Instructions'), {
      target: { value: 'Mix and bake' },
    });

    // Add common ingredients
    const commonInput = screen.getByPlaceholderText(
      'Add common ingredient (salt, pepper, etc.)'
    );
    fireEvent.change(commonInput, { target: { value: 'Salt' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.change(commonInput, { target: { value: 'Pepper' } });
    fireEvent.click(screen.getByText('Add'));

    // Submit form
    const submitButton = screen.getByText('Add Recipe');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
    });

    expect(mockOnAddRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        common_ingredients: ['Salt', 'Pepper'],
      })
    );
  });

  it('should handle all category options', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    const categorySelect = screen.getByLabelText('Category');

    // Test each category
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(category => {
      fireEvent.change(categorySelect, { target: { value: category } });
      expect(categorySelect).toHaveValue(category);
    });
  });

  it('should handle all unit options', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    const unitSelects = screen.getAllByRole('combobox');
    const unitSelect = unitSelects[1]; // First is category, second is unit

    // Test each unit
    ['g', 'ml', 'pcs', 'tbsp'].forEach(unit => {
      fireEvent.change(unitSelect, { target: { value: unit } });
      expect(unitSelect).toHaveValue(unit);
    });
  });

  it('should prevent form submission without preventDefault', () => {
    render(
      <AddRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onAddRecipe={mockOnAddRecipe}
      />
    );

    // Fill in minimal required data
    fireEvent.change(screen.getByLabelText('Recipe Name'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ingredient name'), {
      target: { value: 'Test Ingredient' },
    });
    fireEvent.change(screen.getByPlaceholderText('Qty'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('Instructions'), {
      target: { value: 'Test instructions' },
    });

    const form = screen
      .getByRole('button', { name: 'Add Recipe' })
      .closest('form');
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });

    // Mock preventDefault to verify it's called
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

    form?.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
