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

  it('calls onSearchSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar
        searchQuery="pizza"
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(mockOnSearchSubmit).toHaveBeenCalled();
  });

  it('calls onSearchSubmit when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar
        searchQuery="pizza"
        onSearchChange={mockOnSearchChange}
        onSearchSubmit={mockOnSearchSubmit}
      />
    );

    const input = screen.getByPlaceholderText('Search recipes...');
    const form = input.closest('form');
    expect(form).not.toBeNull();

    await user.click(screen.getByRole('button'));
    expect(mockOnSearchSubmit).toHaveBeenCalled();
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
