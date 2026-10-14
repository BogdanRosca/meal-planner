import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Recipes from './Recipes';
import { recipeService } from '../../services/recipeService';
import { Recipe, RecipeDraft } from '../../types/recipe';

jest.mock('../../services/recipeService');

const mockService = recipeService as jest.Mocked<typeof recipeService>;

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const existingRecipes: Recipe[] = [
  {
    id: 1,
    name: 'Pancakes',
    category: 'breakfast',
    main_ingredients: [{ name: 'flour', quantity: 200, unit: 'g' }],
    common_ingredients: ['salt'],
    instructions: 'Mix and cook',
    prep_time: 15,
    portions: 4,
  },
];

const draft: RecipeDraft = {
  name: 'Spaghetti Carbonara',
  category: 'dinner',
  main_ingredients: [{ name: 'spaghetti', quantity: 200, unit: 'g' }],
  common_ingredients: ['salt'],
  instructions: '1. Boil pasta',
  prep_time: 25,
  portions: null,
  foto_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  video_url: VIDEO_URL,
  field_flags: { portions: 'missing' },
  duplicate_of: { id: 1, name: 'Pancakes' },
  source: {
    video_id: 'dQw4w9WgXcQ',
    title: 'Carbonara!!',
    channel: 'Chef',
    transcript_used: true,
  },
};

const renderRecipes = (state?: unknown) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/recipes', state }]}>
      <Recipes />
    </MemoryRouter>
  );

const openImportAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>
) => {
  await user.click(screen.getByRole('button', { name: 'Import from YouTube' }));
  await user.type(screen.getByLabelText('YouTube video URL'), VIDEO_URL);
  await user.click(screen.getByRole('button', { name: 'Import' }));
};

describe('Recipes – import from YouTube', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getAllRecipes.mockResolvedValue(existingRecipes);
  });

  it('imports a video, shows the prefilled form and saves it', async () => {
    const user = userEvent.setup();
    mockService.importFromYoutube.mockResolvedValue({
      status: 'success',
      draft,
    });
    mockService.addRecipe.mockResolvedValue({
      ...existingRecipes[0],
      id: 2,
      name: 'Spaghetti Carbonara',
    });
    renderRecipes();
    await screen.findByText('Pancakes');

    await openImportAndSubmit(user);

    expect(
      await screen.findByText(
        'Prefilled from YouTube — please review before saving.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('YouTube video URL')
    ).not.toBeInTheDocument();
    expect(mockService.importFromYoutube).toHaveBeenCalledWith(
      VIDEO_URL,
      expect.any(AbortSignal)
    );
    expect(screen.getByRole('note')).toHaveTextContent(
      'You already have Pancakes from this video.'
    );
    expect(screen.getByLabelText('Recipe Name')).toHaveValue(
      'Spaghetti Carbonara'
    );

    await user.type(screen.getByLabelText('Portions'), '2');
    await user.click(screen.getByRole('button', { name: 'Add Recipe' }));

    await waitFor(() =>
      expect(
        screen.queryByText(/Prefilled from YouTube/)
      ).not.toBeInTheDocument()
    );
    expect(mockService.addRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Spaghetti Carbonara',
        portions: 2,
        video_url: VIDEO_URL,
      })
    );
    expect(await screen.findByText('Spaghetti Carbonara')).toBeInTheDocument();
  });

  it('keeps the prefilled form open when saving fails', async () => {
    const user = userEvent.setup();
    mockService.importFromYoutube.mockResolvedValue({
      status: 'success',
      draft: { ...draft, portions: 2, field_flags: {} },
    });
    mockService.addRecipe.mockRejectedValue(new Error('save failed'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    renderRecipes();
    await screen.findByText('Pancakes');

    await openImportAndSubmit(user);
    await screen.findByText(/Prefilled from YouTube/);
    await user.click(screen.getByRole('button', { name: 'Add Recipe' }));

    await waitFor(() => expect(mockService.addRecipe).toHaveBeenCalled());
    expect(screen.getByText(/Prefilled from YouTube/)).toBeInTheDocument();
  });

  it('discards the draft when the prefilled form is cancelled', async () => {
    const user = userEvent.setup();
    mockService.importFromYoutube.mockResolvedValue({
      status: 'success',
      draft,
    });
    renderRecipes();
    await screen.findByText('Pancakes');

    await openImportAndSubmit(user);
    await screen.findByText(/Prefilled from YouTube/);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.queryByText(/Prefilled from YouTube/)
    ).not.toBeInTheDocument();
  });

  it('offers an empty manual form when the import fails', async () => {
    const user = userEvent.setup();
    mockService.importFromYoutube.mockRejectedValue(new Error('502'));
    renderRecipes();
    await screen.findByText('Pancakes');

    await openImportAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Import failed, try again or add manually.'
    );
    await user.click(screen.getByRole('button', { name: 'Add manually' }));

    expect(
      screen.queryByLabelText('YouTube video URL')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipe Name')).toHaveValue('');
    expect(
      screen.queryByText(/Prefilled from YouTube/)
    ).not.toBeInTheDocument();
  });

  it('closes the import modal while an import is running', async () => {
    const user = userEvent.setup();
    mockService.importFromYoutube.mockReturnValue(new Promise(() => {}));
    renderRecipes();
    await screen.findByText('Pancakes');

    await openImportAndSubmit(user);
    expect(await screen.findByText('Fetching video…')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(
      screen.queryByLabelText('YouTube video URL')
    ).not.toBeInTheDocument();
  });

  it('opens the import modal from the quick action navigation state', async () => {
    renderRecipes({ openImport: true });

    expect(
      await screen.findByLabelText('YouTube video URL')
    ).toBeInTheDocument();
  });

  it.each([[null], [{ category: 'lunch' }], [{ openImport: 'yes' }]])(
    'does not open the import modal for state %p',
    async state => {
      renderRecipes(state);
      await screen.findByText(/Pancakes|No recipes/);

      expect(
        screen.queryByLabelText('YouTube video URL')
      ).not.toBeInTheDocument();
    }
  );
});
