import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WeekNavigator from './WeekNavigator';

describe('WeekNavigator', () => {
  const mockOnNavigate = jest.fn();
  const monday = new Date(2026, 2, 2); // March 2, 2026 (Monday)

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display the week range', () => {
    render(<WeekNavigator weekStart={monday} onNavigate={mockOnNavigate} />);

    expect(screen.getByText(/Mar 2/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 8/)).toBeInTheDocument();
  });

  it('should call onNavigate(-1) when previous button is clicked', () => {
    render(<WeekNavigator weekStart={monday} onNavigate={mockOnNavigate} />);

    const prevBtn = screen.getByLabelText('Previous week');
    fireEvent.click(prevBtn);

    expect(mockOnNavigate).toHaveBeenCalledWith(-1);
  });

  it('should call onNavigate(1) when next button is clicked', () => {
    render(<WeekNavigator weekStart={monday} onNavigate={mockOnNavigate} />);

    const nextBtn = screen.getByLabelText('Next week');
    fireEvent.click(nextBtn);

    expect(mockOnNavigate).toHaveBeenCalledWith(1);
  });

  it('should render two navigation buttons', () => {
    render(<WeekNavigator weekStart={monday} onNavigate={mockOnNavigate} />);

    expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
    expect(screen.getByLabelText('Next week')).toBeInTheDocument();
  });
});
