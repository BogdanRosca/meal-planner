import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from './TopBar';

describe('TopBar Component', () => {
  const mockOnNavigate = jest.fn();
  const mockOnMenuToggle = jest.fn();
  const mockUser = { name: 'John Doe', avatar: 'avatar.jpg' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the TopBar component with default props', () => {
    render(<TopBar />);

    expect(screen.getByText('MealCraft')).toBeInTheDocument();
    expect(screen.getByText('🍴')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Default user
  });

  it('renders logo section correctly', () => {
    render(<TopBar />);

    const logoIcon = screen.getByText('🍴');
    const logoText = screen.getByText('MealCraft');

    expect(logoIcon).toBeInTheDocument();
    expect(logoText).toBeInTheDocument();

    // Check if they are in the logo section
    const logoSection = logoIcon.closest('.logo-section');
    expect(logoSection).toContainElement(logoText);
  });

  it('renders all navigation items', () => {
    render(<TopBar />);

    expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('sets "Meal Planner" as active tab by default', () => {
    render(<TopBar />);

    const mealPlannerButton = screen.getByRole('button', {
      name: 'Meal Planner',
    });
    expect(mealPlannerButton).toHaveClass('active');

    const recipesButton = screen.getByRole('button', { name: 'Recipes' });
    expect(recipesButton).not.toHaveClass('active');
  });

  it('calls onNavigate when navigation items are clicked', () => {
    render(<TopBar onNavigate={mockOnNavigate} />);

    const recipesButton = screen.getByRole('button', { name: 'Recipes' });
    fireEvent.click(recipesButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('Recipes');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it('updates active tab when navigation items are clicked', () => {
    render(<TopBar onNavigate={mockOnNavigate} />);

    const recipesButton = screen.getByRole('button', { name: 'Recipes' });
    const mealPlannerButton = screen.getByRole('button', {
      name: 'Meal Planner',
    });

    // Initially Meal Planner is active
    expect(mealPlannerButton).toHaveClass('active');
    expect(recipesButton).not.toHaveClass('active');

    // Click Recipes
    fireEvent.click(recipesButton);

    expect(recipesButton).toHaveClass('active');
    expect(mealPlannerButton).not.toHaveClass('active');
  });

  it('renders mobile menu button', () => {
    const { container } = render(<TopBar onMenuToggle={mockOnMenuToggle} />);

    const mobileMenuButton = container.querySelector('.mobile-menu-btn');
    const svgElement = mobileMenuButton?.querySelector('svg');

    expect(mobileMenuButton).toBeInTheDocument();
    expect(mobileMenuButton).toHaveClass('mobile-menu-btn');
    expect(svgElement).toBeInTheDocument();
  });

  it('calls onMenuToggle when mobile menu button is clicked', () => {
    render(<TopBar onMenuToggle={mockOnMenuToggle} />);

    const mobileMenuButton = document.querySelector('.mobile-menu-btn');
    fireEvent.click(mobileMenuButton!);

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('renders user section with default user', () => {
    render(<TopBar />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Avatar placeholder
  });

  it('renders user section with custom user', () => {
    render(<TopBar currentUser={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // When avatar is provided, initials are not shown
    expect(screen.queryByText('JD')).not.toBeInTheDocument();
  });

  it('renders user avatar when provided', () => {
    render(<TopBar currentUser={mockUser} />);

    const avatarImg = screen.getByAltText('John Doe');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'avatar.jpg');
  });

  it('renders avatar placeholder when no avatar provided', () => {
    const userWithoutAvatar = { name: 'Jane Smith' };
    render(<TopBar currentUser={userWithoutAvatar} />);

    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('generates correct initials for avatar placeholder', () => {
    const users = [
      { name: 'John Doe', expected: 'JD' },
      { name: 'Mary Jane Watson', expected: 'MJW' },
      { name: 'Single', expected: 'S' },
      { name: 'Anne-Marie Louise', expected: 'AL' },
    ];

    users.forEach(({ name, expected }) => {
      const { unmount } = render(<TopBar currentUser={{ name }} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders language selector', () => {
    render(<TopBar />);

    const flagElement = screen.getByText('🇺🇸');
    expect(flagElement).toBeInTheDocument();
    expect(flagElement).toHaveClass('flag');
  });

  it('has proper semantic structure', () => {
    render(<TopBar />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('top-bar');

    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveClass('navigation');
  });

  it('works without optional callback props', () => {
    render(<TopBar />);

    const recipesButton = screen.getByRole('button', { name: 'Recipes' });
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    const mobileMenuButton = document.querySelector('.mobile-menu-btn');

    // Should not throw errors when clicked without callbacks
    expect(() => {
      fireEvent.click(recipesButton);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.click(mobileMenuButton!);
    }).not.toThrow();
  });

  it('renders search SVG icon correctly', () => {
    render(<TopBar />);

    const searchButton = document.querySelector('.search-button');
    const svgElement = searchButton?.querySelector('svg');

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('width', '16');
    expect(svgElement).toHaveAttribute('height', '16');
    expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders mobile menu SVG icon correctly', () => {
    render(<TopBar />);

    const mobileMenuButton = document.querySelector('.mobile-menu-btn');
    const svgElement = mobileMenuButton?.querySelector('svg');
    const lines = svgElement?.querySelectorAll('line');

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('width', '24');
    expect(svgElement).toHaveAttribute('height', '24');
    expect(lines).toHaveLength(3); // Hamburger menu has 3 lines
  });

  it('maintains search query state internally', () => {
    render(<TopBar />);

    const searchInput = screen.getByPlaceholderText('Search recipes...');

    fireEvent.change(searchInput, { target: { value: 'pizza' } });
    expect(searchInput).toHaveValue('pizza');

    fireEvent.change(searchInput, { target: { value: 'burger' } });
    expect(searchInput).toHaveValue('burger');
  });

  it('has correct CSS classes for styling', () => {
    const { container } = render(<TopBar />);

    expect(container.querySelector('.top-bar')).toBeInTheDocument();
    expect(container.querySelector('.top-bar-container')).toBeInTheDocument();
    expect(container.querySelector('.logo-section')).toBeInTheDocument();
    expect(container.querySelector('.navigation')).toBeInTheDocument();
    expect(container.querySelector('.search-section')).toBeInTheDocument();
    expect(container.querySelector('.user-section')).toBeInTheDocument();
  });

  it('calls all navigation callbacks for different nav items', () => {
    render(<TopBar onNavigate={mockOnNavigate} />);

    const navItems = ['Meal Planner', 'Recipes', 'Shopping List', 'Analytics'];

    navItems.forEach((item, index) => {
      const button = screen.getByRole('button', { name: item });
      fireEvent.click(button);
      expect(mockOnNavigate).toHaveBeenNthCalledWith(index + 1, item);
    });

    expect(mockOnNavigate).toHaveBeenCalledTimes(4);
  });
});
