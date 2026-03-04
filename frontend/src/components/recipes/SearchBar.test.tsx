import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar Component', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnSearchSubmit = jest.fn();

  beforeEach(() => {
    mockOnSearchChange.mockClear();
    mockOnSearchSubmit.mockClear();
  });

  it('renders search input with placeholder', () => {
    render(
      <SearchBar
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const input = screen.getByPlaceholderText('Search recipes...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('displays the current search query value', () => {
    render(
      <SearchBar
        searchQuery="pasta"
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const input = screen.getByPlaceholderText(
      'Search recipes...'
    ) as HTMLInputElement;
    expect(input.value).toBe('pasta');
  });

  it('calls onSearchChange when input value changes', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const input = screen.getByPlaceholderText('Search recipes...');
    await user.type(input, 'pizza');

    expect(mockOnSearchChange).toHaveBeenCalled();
  });

  it('renders search form', () => {
    render(
      <SearchBar
        searchQuery="pizza"
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const form = screen.getByRole('button').closest('form');
    expect(form).toBeInTheDocument();
  });

  it('has a submit button', () => {
    render(
      <SearchBar
        searchQuery="pizza"
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders search button', () => {
    render(
      <SearchBar
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
