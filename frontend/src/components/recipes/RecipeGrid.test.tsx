import React from 'react';
import { render, screen } from '@testing-library/react';
import RecipeGrid from './RecipeGrid';
import { Recipe } from '../../types/recipe';

const mockRecipes: Recipe[] = [
  {
    id: 1,
    name: 'Pasta Carbonara',
    category: 'dinner',
    main_ingredients: [{ quantity: 400, unit: 'g', name: 'pasta' }],
    common_ingredients: ['salt', 'pepper'],
    instructions: 'Cook and serve',
    prep_time: 20,
    portions: 4,
    foto_url: 'https://example.com/pasta.jpg',
    video_url: null,
  },
  {
    id: 2,
    name: 'Caesar Salad',
    category: 'lunch',
    main_ingredients: [{ quantity: 300, unit: 'g', name: 'lettuce' }],
    common_ingredients: ['parmesan'],
    instructions: 'Mix ingredients',
    prep_time: 10,
    portions: 2,
    foto_url: 'https://example.com/salad.jpg',
    video_url: null,
  },
];

describe('RecipeGrid Component', () => {
  const mockOnRecipeClick = jest.fn();
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    mockOnRecipeClick.mockClear();
    mockOnDeleteClick.mockClear();
  });

  it('renders recipe cards when recipes are provided', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery=""
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
  });

  it('displays empty message when no recipes are available', () => {
    render(
      <RecipeGrid
        recipes={[]}
        searchQuery=""
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText(/No recipes available yet/i)).toBeInTheDocument();
  });

  it('filters recipes based on search query', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery="pasta"
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
  });

  it('displays empty message when search query returns no results', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery="nonexistent"
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(
      screen.getByText(/No recipes found matching your search/i)
    ).toBeInTheDocument();
  });

  it('filters recipes case-insensitively', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery="CAESAR"
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('renders all recipes when search query is empty', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery=""
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
  });

  it('passes correct props to RecipeCard', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery=""
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
  });

  it('handles partial search matches', () => {
    render(
      <RecipeGrid
        recipes={mockRecipes}
        searchQuery="car"
        onRecipeClick={mockOnRecipeClick}
        onDeleteClick={mockOnDeleteClick}
      />
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
  });
});
