import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeDetailModal from './RecipeDetailModal';
import { Recipe } from '../../types/recipe';

describe('RecipeDetailModal Component', () => {
  const mockOnClose = jest.fn();

  const mockRecipe: Recipe = {
    id: 1,
    name: 'Spaghetti Carbonara',
    category: 'dinner',
    instructions: 'Cook pasta, add sauce, and serve.',
    prep_time: 30,
    portions: 4,
    main_ingredients: [
      { name: 'Spaghetti', quantity: 400, unit: 'g' },
      { name: 'Eggs', quantity: 4, unit: 'pcs' },
      { name: 'Parmesan', quantity: 100, unit: 'g' },
    ],
    common_ingredients: ['Salt', 'Pepper', 'Olive oil'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
  });

  it('should display recipe name', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
  });

  it('should display recipe category', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('dinner')).toBeInTheDocument();
  });

  it('should display prep time', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should display portions with singular text for 1 portion', () => {
    const singlePortionRecipe = { ...mockRecipe, portions: 1 };
    render(
      <RecipeDetailModal
        recipe={singlePortionRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('1 portion')).toBeInTheDocument();
  });

  it('should display portions with plural text for multiple portions', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('4 portions')).toBeInTheDocument();
  });

  it('should display main ingredients', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Spaghetti')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    expect(screen.getByText('Parmesan')).toBeInTheDocument();
  });

  it('should display ingredient quantities and units', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('400 g')).toBeInTheDocument();
    expect(screen.getByText('4 pcs')).toBeInTheDocument();
    expect(screen.getByText('100 g')).toBeInTheDocument();
  });

  it('should display common ingredients section when present', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Spices and Others')).toBeInTheDocument();
    expect(screen.getByText('Salt')).toBeInTheDocument();
    expect(screen.getByText('Pepper')).toBeInTheDocument();
    expect(screen.getByText('Olive oil')).toBeInTheDocument();
  });

  it('should not display common ingredients section when empty', () => {
    const recipeWithoutCommonIngredients = {
      ...mockRecipe,
      common_ingredients: [],
    };
    render(
      <RecipeDetailModal
        recipe={recipeWithoutCommonIngredients}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByText('Spices and Others')).not.toBeInTheDocument();
  });

  it('should not display common ingredients section when undefined', () => {
    const recipeWithoutCommonIngredients = {
      ...mockRecipe,
      common_ingredients: undefined as unknown as string[],
    };
    render(
      <RecipeDetailModal
        recipe={recipeWithoutCommonIngredients}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByText('Spices and Others')).not.toBeInTheDocument();
  });

  it('should handle recipe with single main ingredient', () => {
    const singleIngredientRecipe = {
      ...mockRecipe,
      main_ingredients: [{ name: 'Pasta', quantity: 500, unit: 'g' }],
    };
    render(
      <RecipeDetailModal
        recipe={singleIngredientRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('500 g')).toBeInTheDocument();
  });

  it('should display cooking instructions', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(
      screen.getByText('Cook pasta, add sauce, and serve.')
    ).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking backdrop', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const backdrop = document.querySelector('.recipe-modal-backdrop');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside modal content', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const modalContent = document.querySelector('.recipe-modal-content');
    expect(modalContent).toBeInTheDocument();
    fireEvent.click(modalContent!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display breakfast emoji for breakfast category', () => {
    const breakfastRecipe = { ...mockRecipe, category: 'breakfast' };
    const { container } = render(
      <RecipeDetailModal
        recipe={breakfastRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const placeholder = container.querySelector('.recipe-modal-placeholder');
    expect(placeholder?.textContent).toBe('🍳');
  });

  it('should display lunch emoji for lunch category', () => {
    const lunchRecipe = { ...mockRecipe, category: 'lunch' };
    const { container } = render(
      <RecipeDetailModal
        recipe={lunchRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const placeholder = container.querySelector('.recipe-modal-placeholder');
    expect(placeholder?.textContent).toBe('🥗');
  });

  it('should display dinner emoji for dinner category', () => {
    const dinnerRecipe = { ...mockRecipe, category: 'dinner' };
    const { container } = render(
      <RecipeDetailModal
        recipe={dinnerRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const placeholder = container.querySelector('.recipe-modal-placeholder');
    expect(placeholder?.textContent).toBe('🍽️');
  });

  it('should display snack emoji for snack category', () => {
    const snackRecipe = { ...mockRecipe, category: 'snack' };
    const { container } = render(
      <RecipeDetailModal
        recipe={snackRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const placeholder = container.querySelector('.recipe-modal-placeholder');
    expect(placeholder?.textContent).toBe('🍿');
  });

  it('should display default emoji for unknown category', () => {
    const unknownCategoryRecipe = { ...mockRecipe, category: 'unknown' };
    const { container } = render(
      <RecipeDetailModal
        recipe={unknownCategoryRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const placeholder = container.querySelector('.recipe-modal-placeholder');
    expect(placeholder?.textContent).toBe('🍴');
  });

  it('should have correct category badge class for breakfast', () => {
    const breakfastRecipe = { ...mockRecipe, category: 'breakfast' };
    const { container } = render(
      <RecipeDetailModal
        recipe={breakfastRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const badge = container.querySelector('.category-breakfast');
    expect(badge).toBeInTheDocument();
  });

  it('should have correct category badge class for lunch', () => {
    const lunchRecipe = { ...mockRecipe, category: 'lunch' };
    const { container } = render(
      <RecipeDetailModal
        recipe={lunchRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const badge = container.querySelector('.category-lunch');
    expect(badge).toBeInTheDocument();
  });

  it('should have correct category badge class for dinner', () => {
    const { container } = render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const badge = container.querySelector('.category-dinner');
    expect(badge).toBeInTheDocument();
  });

  it('should have correct category badge class for snack', () => {
    const snackRecipe = { ...mockRecipe, category: 'snack' };
    const { container } = render(
      <RecipeDetailModal
        recipe={snackRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const badge = container.querySelector('.category-snack');
    expect(badge).toBeInTheDocument();
  });

  it('should display Ingredients section title', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
  });

  it('should display Instructions section title', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Instructions')).toBeInTheDocument();
  });

  it('should render clock icon SVG for prep time', () => {
    const { container } = render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const svgs = container.querySelectorAll('svg');
    const clockIcon = Array.from(svgs).find(svg =>
      svg.querySelector('circle[r="10"]')
    );
    expect(clockIcon).toBeInTheDocument();
  });

  it('should render users icon SVG for portions', () => {
    const { container } = render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const svgs = container.querySelectorAll('svg');
    const usersIcon = Array.from(svgs).find(svg =>
      svg.querySelector('circle[r="4"]')
    );
    expect(usersIcon).toBeInTheDocument();
  });

  it('should handle case-insensitive category emoji mapping', () => {
    const upperCaseRecipe = { ...mockRecipe, category: 'DINNER' };
    const { container } = render(
      <RecipeDetailModal
        recipe={upperCaseRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const placeholder = container.querySelector('.recipe-modal-placeholder');
    expect(placeholder?.textContent).toBe('🍽️');
  });

  it('should render all main ingredients in list', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const ingredientsList = document.querySelectorAll(
      '.recipe-ingredient-item'
    );
    expect(ingredientsList).toHaveLength(3);
  });

  it('should render all common ingredients in list', () => {
    render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const commonIngredientsList = document.querySelectorAll(
      '.recipe-common-ingredient-item'
    );
    expect(commonIngredientsList).toHaveLength(3);
  });

  it('should display recipe image when foto_url is provided', () => {
    const recipeWithPhoto = {
      ...mockRecipe,
      foto_url: 'https://example.com/photo.jpg',
    };
    const { container } = render(
      <RecipeDetailModal
        recipe={recipeWithPhoto}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const img = container.querySelector('.recipe-modal-hero-img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(img).toHaveAttribute('alt', 'Spaghetti Carbonara');
    expect(
      container.querySelector('.recipe-modal-placeholder')
    ).not.toBeInTheDocument();
  });

  it('should display YouTube iframe for youtube.com/watch URL', () => {
    const recipeWithYoutube = {
      ...mockRecipe,
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
    const { container } = render(
      <RecipeDetailModal
        recipe={recipeWithYoutube}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const iframe = container.querySelector('.recipe-video-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
    expect(container.querySelector('video')).not.toBeInTheDocument();
  });

  it('should display YouTube iframe for youtu.be short URL', () => {
    const recipeWithYoutuBe = {
      ...mockRecipe,
      video_url: 'https://youtu.be/dQw4w9WgXcQ',
    };
    const { container } = render(
      <RecipeDetailModal
        recipe={recipeWithYoutuBe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const iframe = container.querySelector('.recipe-video-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('should display YouTube iframe for youtube.com/embed URL', () => {
    const recipeWithEmbed = {
      ...mockRecipe,
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    };
    const { container } = render(
      <RecipeDetailModal
        recipe={recipeWithEmbed}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const iframe = container.querySelector('.recipe-video-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('should display YouTube iframe for youtube.com/shorts URL', () => {
    const recipeWithShorts = {
      ...mockRecipe,
      video_url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    };
    const { container } = render(
      <RecipeDetailModal
        recipe={recipeWithShorts}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const iframe = container.querySelector('.recipe-video-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('should display video element for non-YouTube video URL', () => {
    const recipeWithNonYoutube = {
      ...mockRecipe,
      video_url: 'https://example.com/video.mp4',
    };
    const { container } = render(
      <RecipeDetailModal
        recipe={recipeWithNonYoutube}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const video = container.querySelector('.recipe-video-player');
    expect(video).toBeInTheDocument();
    const source = container.querySelector('video source');
    expect(source).toHaveAttribute('src', 'https://example.com/video.mp4');
    expect(container.querySelector('.recipe-video-iframe')).not.toBeInTheDocument();
  });

  it('should not display Video section when video_url is not set', () => {
    const { container } = render(
      <RecipeDetailModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByText('Video')).not.toBeInTheDocument();
    expect(container.querySelector('.recipe-video-container')).not.toBeInTheDocument();
  });
});
