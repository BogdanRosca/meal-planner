import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

const pressedStars = () =>
  screen
    .getAllByRole('button')
    .filter(star => star.getAttribute('aria-pressed') === 'true')
    .map(star => star.getAttribute('aria-label'));

describe('StarRating', () => {
  const onRate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders five stars labelled for the recipe', () => {
    render(<StarRating rating={null} recipeName="Soup" onRate={onRate} />);

    expect(
      screen.getByRole('group', { name: 'Rating for Soup' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(pressedStars()).toEqual([]);
  });

  it('marks the current rating', () => {
    render(<StarRating rating={3} recipeName="Soup" onRate={onRate} />);

    expect(pressedStars()).toEqual(['3 stars']);
  });

  it('rates with the clicked star', () => {
    render(<StarRating rating={null} recipeName="Soup" onRate={onRate} />);

    fireEvent.click(screen.getByRole('button', { name: '1 star' }));

    expect(onRate).toHaveBeenCalledWith(1);
  });

  it('clears the rating when the current star is clicked again', () => {
    render(<StarRating rating={2} recipeName="Soup" onRate={onRate} />);

    fireEvent.click(screen.getByRole('button', { name: '2 stars' }));

    expect(onRate).toHaveBeenCalledWith(null);
  });

  it('does not bubble clicks to the parent', () => {
    const onParentClick = jest.fn();
    render(
      <div onClick={onParentClick}>
        <StarRating rating={null} recipeName="Soup" onRate={onRate} />
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: '5 stars' }));

    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('previews the hovered rating', () => {
    const { container } = render(
      <StarRating rating={1} recipeName="Soup" onRate={onRate} />
    );
    const filledCount = () => container.querySelectorAll('.filled').length;

    fireEvent.mouseEnter(screen.getByRole('button', { name: '4 stars' }));
    expect(filledCount()).toBe(4);

    fireEvent.mouseLeave(screen.getByRole('group'));
    expect(filledCount()).toBe(1);
  });
});
