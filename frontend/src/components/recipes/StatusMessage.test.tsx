import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusMessage from './StatusMessage';

describe('StatusMessage Component', () => {
  it('renders loading message when loading is true', () => {
    render(<StatusMessage loading={true} error={null} />);

    expect(screen.getByText(/Loading recipes.../i)).toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    const errorMessage = 'Failed to load recipes';
    render(<StatusMessage loading={false} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('returns null when not loading and no error', () => {
    const { container } = render(
      <StatusMessage loading={false} error={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows loading message even if error is present (loading takes precedence)', () => {
    const errorMessage = 'Failed to load recipes';
    render(<StatusMessage loading={true} error={errorMessage} />);

    expect(screen.getByText(/Loading recipes.../i)).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it('does not render when loading is false and error is empty string', () => {
    const { container } = render(<StatusMessage loading={false} error="" />);

    expect(container.firstChild).toBeNull();
  });

  it('renders error message with icon when error occurs', () => {
    const errorMessage = 'Network error occurred';
    const { container } = render(
      <StatusMessage loading={false} error={errorMessage} />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    const errorDiv = container.querySelector('[class*="error-message"]');
    expect(errorDiv).toBeInTheDocument();
  });

  it('renders loading spinner with text', () => {
    const { container } = render(<StatusMessage loading={true} error={null} />);

    expect(screen.getByText(/Loading recipes.../i)).toBeInTheDocument();
    const spinner = container.querySelector('[class*="loading-spinner"]');
    expect(spinner).toBeInTheDocument();
  });
});
