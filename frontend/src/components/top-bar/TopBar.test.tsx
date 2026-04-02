import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

const renderTopBar = (
  props: React.ComponentProps<typeof TopBar> = {},
  initialPath = '/meal-planner'
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TopBar {...props} />
    </MemoryRouter>
  );

describe('TopBar Component', () => {
  const mockOnMenuToggle = jest.fn();
  const mockUser = { name: 'John Doe', avatar: 'avatar.jpg' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the TopBar component with default props', () => {
    renderTopBar();

    expect(screen.getByText('MealCraft')).toBeInTheDocument();
    expect(screen.getByText('🍴')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Default user
  });

  it('renders logo section correctly', () => {
    renderTopBar();

    const logoIcon = screen.getByText('🍴');
    const logoText = screen.getByText('MealCraft');

    expect(logoIcon).toBeInTheDocument();
    expect(logoText).toBeInTheDocument();

    // Check if they are in the logo section
    const logoSection = logoIcon.closest('.logo-section');
    expect(logoSection).toContainElement(logoText);
  });

  it('renders all navigation items', () => {
    renderTopBar();

    expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('sets "Meal Planner" as active tab by default', () => {
    renderTopBar({}, '/meal-planner');

    const mealPlannerButton = screen.getByRole('button', {
      name: 'Meal Planner',
    });
    expect(mealPlannerButton).toHaveClass('active');

    const recipesButton = screen.getByRole('button', { name: 'Recipes' });
    expect(recipesButton).not.toHaveClass('active');
  });

  it('updates active tab when navigation items are clicked', () => {
    renderTopBar();

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
    const { container } = renderTopBar({ onMenuToggle: mockOnMenuToggle });

    const mobileMenuButton = container.querySelector('.mobile-menu-btn');
    const svgElement = mobileMenuButton?.querySelector('svg');

    expect(mobileMenuButton).toBeInTheDocument();
    expect(mobileMenuButton).toHaveClass('mobile-menu-btn');
    expect(svgElement).toBeInTheDocument();
  });

  it('calls onMenuToggle when mobile menu button is clicked', () => {
    renderTopBar({ onMenuToggle: mockOnMenuToggle });

    const mobileMenuButton = document.querySelector('.mobile-menu-btn');
    fireEvent.click(mobileMenuButton!);

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('renders user section with default user', () => {
    renderTopBar();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Avatar placeholder
  });

  it('renders user section with custom user', () => {
    renderTopBar({ currentUser: mockUser });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // When avatar is provided, initials are not shown
    expect(screen.queryByText('JD')).not.toBeInTheDocument();
  });

  it('renders user avatar when provided', () => {
    renderTopBar({ currentUser: mockUser });

    const avatarImg = screen.getByAltText('John Doe');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'avatar.jpg');
  });

  it('renders avatar placeholder when no avatar provided', () => {
    const userWithoutAvatar = { name: 'Jane Smith' };
    renderTopBar({ currentUser: userWithoutAvatar });

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
      const { unmount } = renderTopBar({ currentUser: { name } });
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders language selector', () => {
    renderTopBar();

    const flagElement = screen.getByText('🇬🇧');
    expect(flagElement).toBeInTheDocument();
    expect(flagElement).toHaveClass('flag');
  });

  it('has proper semantic structure', () => {
    renderTopBar();

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('top-bar');

    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveClass('navigation');
  });

  it('works without optional callback props', () => {
    renderTopBar();

    const recipesButton = screen.getByRole('button', { name: 'Recipes' });
    const mobileMenuButton = document.querySelector('.mobile-menu-btn');

    // Should not throw errors when clicked without callbacks
    expect(() => {
      fireEvent.click(recipesButton);
      fireEvent.click(mobileMenuButton!);
    }).not.toThrow();
  });

  it('renders mobile menu SVG icon correctly', () => {
    renderTopBar();

    const mobileMenuButton = document.querySelector('.mobile-menu-btn');
    const svgElement = mobileMenuButton?.querySelector('svg');
    const lines = svgElement?.querySelectorAll('line');

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('width', '24');
    expect(svgElement).toHaveAttribute('height', '24');
    expect(lines).toHaveLength(3); // Hamburger menu has 3 lines
  });

  it('has correct CSS classes for styling', () => {
    const { container } = renderTopBar();

    expect(container.querySelector('.top-bar')).toBeInTheDocument();
    expect(container.querySelector('.top-bar-container')).toBeInTheDocument();
    expect(container.querySelector('.logo-section')).toBeInTheDocument();
    expect(container.querySelector('.navigation')).toBeInTheDocument();
    expect(container.querySelector('.user-section')).toBeInTheDocument();
  });

  it('navigates to each section when nav items are clicked', () => {
    renderTopBar();

    const navItems = ['Meal Planner', 'Recipes', 'Shopping List', 'Analytics'];

    navItems.forEach(item => {
      const button = screen.getByRole('button', { name: item });
      fireEvent.click(button);
      expect(button).toHaveClass('active');
    });
  });
});
