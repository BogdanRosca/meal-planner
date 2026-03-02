import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarGrid from './CalendarGrid';
import { MealPlanEntry } from '../../types/recipe';

const mockEntry: MealPlanEntry = {
  id: 1,
  week_start: '2026-03-02',
  day_of_week: 0,
  meal_slot: 'breakfast',
  recipe_id: 10,
  recipe_name: 'Pancakes',
  recipe_category: 'breakfast',
  recipe_foto_url: null,
};

describe('CalendarGrid', () => {
  const monday = new Date(2026, 2, 2);
  const mockOnCellClick = jest.fn();
  const mockOnRemoveEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render day headers', () => {
    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={() => undefined}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('should render meal slot labels', () => {
    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={() => undefined}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getAllByText('Snack')).toHaveLength(2);
  });

  it('should show "+" for empty cells', () => {
    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={() => undefined}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    const addButtons = screen.getAllByText('+');
    // 7 days * 5 slots = 35 empty cells
    expect(addButtons).toHaveLength(35);
  });

  it('should display recipe name in filled cells', () => {
    const getEntry = (day: number, slot: string) => {
      if (day === 0 && slot === 'breakfast') return mockEntry;
      return undefined;
    };

    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={getEntry}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    // 34 empty cells (35 - 1 filled)
    expect(screen.getAllByText('+')).toHaveLength(34);
  });

  it('should call onCellClick when an empty cell is clicked', () => {
    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={() => undefined}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0].closest('[role="button"]')!);

    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
  });

  it('should call onRemoveEntry when remove button is clicked', () => {
    const getEntry = (day: number, slot: string) => {
      if (day === 0 && slot === 'breakfast') return mockEntry;
      return undefined;
    };

    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={getEntry}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    const removeBtn = screen.getByLabelText('Remove Pancakes');
    fireEvent.click(removeBtn);

    expect(mockOnRemoveEntry).toHaveBeenCalledWith(1);
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('should display day dates', () => {
    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={() => undefined}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    // March 2 (Mon) through March 8 (Sun)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should handle keyboard navigation on empty cells', () => {
    render(
      <CalendarGrid
        weekStart={monday}
        getEntry={() => undefined}
        onCellClick={mockOnCellClick}
        onRemoveEntry={mockOnRemoveEntry}
      />
    );

    const emptyCells = document.querySelectorAll('[role="button"]');
    fireEvent.keyDown(emptyCells[0], { key: 'Enter' });

    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
  });
});
