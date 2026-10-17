import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddRecipeModal, { RecipeFormValues } from './AddRecipeModal';
import { FieldFlags } from '../../types/recipe';

const initialValues: RecipeFormValues = {
  name: 'Spaghetti Carbonara',
  category: 'dinner',
  main_ingredients: [
    { name: 'spaghetti', quantity: 200, unit: 'g' },
    { name: 'guanciale', quantity: 100, unit: 'g' },
  ],
  common_ingredients: ['salt', 'black pepper'],
  instructions: '1. Boil pasta\n2. Mix with sauce',
  prep_time: 25,
  portions: 2,
  foto_url: 'https://i.ytimg.com/vi/abc/maxresdefault.jpg',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

const allFlags: FieldFlags = {
  name: 'estimated',
  category: 'estimated',
  foto_url: 'missing',
  main_ingredients: 'estimated',
  common_ingredients: 'missing',
  instructions: 'missing',
  video_url: 'estimated',
  prep_time: 'estimated',
  portions: 'missing',
};

describe('AddRecipeModal with an imported draft', () => {
  const onClose = jest.fn();
  const onAddRecipe = jest.fn();

  const renderDraft = (
    values: RecipeFormValues = initialValues,
    flags?: FieldFlags,
    duplicateOf?: { id: number; name: string } | null
  ) =>
    render(
      <AddRecipeModal
        isOpen
        onClose={onClose}
        onAddRecipe={onAddRecipe}
        initialValues={values}
        fieldFlags={flags}
        duplicateOf={duplicateOf}
        importSourceLabel="YouTube"
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefills every field and shows the review banner', () => {
    renderDraft();

    expect(
      screen.getByText('Prefilled from YouTube — please review before saving.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Recipe Name')).toHaveValue(
      'Spaghetti Carbonara'
    );
    expect(screen.getByLabelText('Category')).toHaveValue('dinner');
    expect(screen.getByLabelText('Photo URL (optional)')).toHaveValue(
      initialValues.foto_url
    );
    expect(screen.getByLabelText('Video URL (optional)')).toHaveValue(
      initialValues.video_url
    );
    expect(screen.getByLabelText('Instructions')).toHaveValue(
      initialValues.instructions
    );
    expect(screen.getByLabelText('Prep Time (minutes)')).toHaveValue(25);
    expect(screen.getByLabelText('Portions')).toHaveValue(2);
    expect(screen.getAllByPlaceholderText('Ingredient name')).toHaveLength(2);
    expect(screen.getByDisplayValue('guanciale')).toBeInTheDocument();
    expect(screen.getByText('black pepper')).toBeInTheDocument();
  });

  it('names a generic source when no label is given', () => {
    render(
      <AddRecipeModal
        isOpen
        onClose={onClose}
        onAddRecipe={onAddRecipe}
        initialValues={initialValues}
      />
    );

    expect(
      screen.getByText('Prefilled from link — please review before saving.')
    ).toBeInTheDocument();
  });

  it('does not show the banner or duplicate warning for a manual recipe', () => {
    render(
      <AddRecipeModal isOpen onClose={onClose} onAddRecipe={onAddRecipe} />
    );

    expect(
      screen.queryByText(/Prefilled from YouTube/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/You already have/)).not.toBeInTheDocument();
  });

  it('shows a non-blocking duplicate warning', () => {
    renderDraft(initialValues, {}, { id: 3, name: 'Old Carbonara' });

    expect(screen.getByRole('note')).toHaveTextContent(
      'You already have Old Carbonara from this video.'
    );
  });

  it('leaves missing fields empty and falls back to defaults', () => {
    renderDraft({
      name: null,
      category: null,
      main_ingredients: [],
      common_ingredients: null,
      instructions: null,
      prep_time: null,
      portions: null,
      foto_url: null,
      video_url: null,
    });

    expect(screen.getByLabelText('Recipe Name')).toHaveValue('');
    expect(screen.getByLabelText('Category')).toHaveValue('dinner');
    expect(screen.getByLabelText('Prep Time (minutes)')).toHaveValue(null);
    expect(screen.getByLabelText('Portions')).toHaveValue(null);
    expect(screen.getAllByPlaceholderText('Ingredient name')).toHaveLength(1);
  });

  it('links each flag hint to its field', () => {
    renderDraft(initialValues, allFlags);

    expect(screen.getByLabelText('Recipe Name')).toHaveAccessibleDescription(
      'Estimated — please check'
    );
    expect(screen.getByLabelText('Instructions')).toHaveAccessibleDescription(
      'Missing — please fill in'
    );
    expect(screen.getByLabelText('Portions')).toHaveAccessibleDescription(
      'Missing — please fill in'
    );
    expect(
      screen.getAllByPlaceholderText('Ingredient name')[0]
    ).toHaveAccessibleDescription('Estimated — please check');
    expect(
      screen.getAllByPlaceholderText('Ingredient name')[1]
    ).not.toHaveAccessibleDescription();
    expect(screen.getAllByText('Missing — please fill in')).toHaveLength(4);
    expect(screen.getAllByText('Estimated — please check')).toHaveLength(5);
  });

  it.each([
    ['Recipe Name', 'x'],
    ['Photo URL (optional)', 'x'],
    ['Instructions', 'x'],
    ['Video URL (optional)', 'x'],
    ['Prep Time (minutes)', '5'],
    ['Portions', '3'],
  ])('editing %s clears its flag', async (label, text) => {
    const user = userEvent.setup();
    renderDraft(initialValues, allFlags);

    const field = screen.getByLabelText(label);
    expect(field).toHaveAccessibleDescription();
    await user.type(field, text);
    expect(field).not.toHaveAccessibleDescription();
  });

  it('changing the category clears its flag', async () => {
    const user = userEvent.setup();
    renderDraft(initialValues, allFlags);

    await user.selectOptions(screen.getByLabelText('Category'), 'lunch');
    expect(screen.getByLabelText('Category')).not.toHaveAccessibleDescription();
  });

  it('editing an ingredient clears the ingredients flag', async () => {
    const user = userEvent.setup();
    renderDraft(initialValues, allFlags);

    const firstIngredient =
      screen.getAllByPlaceholderText('Ingredient name')[0];
    await user.type(firstIngredient, 's');
    expect(firstIngredient).not.toHaveAccessibleDescription();
  });

  it('removing an ingredient clears the ingredients flag', async () => {
    const user = userEvent.setup();
    renderDraft(initialValues, { main_ingredients: 'estimated' });

    await user.click(screen.getByRole('button', { name: 'Remove ingredient' }));
    expect(
      screen.queryByText('Estimated — please check')
    ).not.toBeInTheDocument();
  });

  it('adding a common ingredient clears the common ingredients flag', async () => {
    const user = userEvent.setup();
    renderDraft(initialValues, { common_ingredients: 'missing' });

    await user.type(
      screen.getByPlaceholderText('Add common ingredient (salt, pepper, etc.)'),
      'oregano'
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(
      screen.queryByText('Missing — please fill in')
    ).not.toBeInTheDocument();
  });

  it('removing a common ingredient clears the common ingredients flag', async () => {
    const user = userEvent.setup();
    renderDraft(initialValues, { common_ingredients: 'estimated' });

    await user.click(screen.getByRole('button', { name: 'Remove salt' }));
    expect(
      screen.queryByText('Estimated — please check')
    ).not.toBeInTheDocument();
  });

  it('clearing a number field keeps it empty', async () => {
    const user = userEvent.setup();
    renderDraft();

    await user.clear(screen.getByLabelText('Portions'));
    expect(screen.getByLabelText('Portions')).toHaveValue(null);
  });

  it('saves the reviewed draft', async () => {
    const user = userEvent.setup();
    renderDraft(initialValues, allFlags);

    await user.click(screen.getByRole('button', { name: /add recipe/i }));

    expect(onAddRecipe).toHaveBeenCalledWith({
      name: 'Spaghetti Carbonara',
      category: 'dinner',
      instructions: '1. Boil pasta\n2. Mix with sauce',
      prep_time: 25,
      portions: 2,
      main_ingredients: initialValues.main_ingredients,
      common_ingredients: ['salt', 'black pepper'],
      foto_url: initialValues.foto_url,
      video_url: initialValues.video_url,
    });
  });
});
