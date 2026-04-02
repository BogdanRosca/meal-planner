import React from 'react';
import { render } from '@testing-library/react';
import Analytics from './Analytics';

describe('Analytics Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Analytics />);
    expect(container.querySelector('.analytics-content')).toBeInTheDocument();
  });
});
