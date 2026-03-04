import React from 'react';
import { render } from '@testing-library/react';
import Home from './Home';

describe('Home Component', () => {
  it('renders home page', () => {
    const { container } = render(<Home />);

    const homeContent = container.querySelector('[class*="home-content"]');
    expect(homeContent).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => {
      render(<Home />);
    }).not.toThrow();
  });

  it('has correct CSS class', () => {
    const { container } = render(<Home />);

    const homeContent = container.querySelector('[class*="home-content"]');
    expect(homeContent?.className).toMatch(/home-content/);
  });
});
