import React, { useState } from 'react';
import './TopBar.css';

interface TopBarProps {
  currentUser?: {
    name: string;
    avatar?: string;
  };
  onNavigate?: (_section: string) => void;
  onMenuToggle?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentUser = { name: 'John Doe' },
  onNavigate,
  onMenuToggle,
}) => {
  const [activeTab, setActiveTab] = useState('Meal Planner');

  const navigationItems = [
    'Meal Planner',
    'Recipes',
    'Shopping List',
    'Analytics',
  ];

  const handleNavClick = (item: string) => {
    setActiveTab(item);
    onNavigate?.(item);
  };

  return (
    <header className="top-bar">
      <div className="top-bar-container">
        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">🍴</div>
          <span className="logo-text">MealCraft</span>
        </div>

        {/* Navigation Section */}
        <nav className="navigation">
          {navigationItems.map(item => (
            <button
              key={item}
              className={`nav-item ${activeTab === item ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="user-section">
          <div className="language-selector">
            <span className="flag">🇺🇸</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <div className="avatar-placeholder">
                  {currentUser.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
              )}
            </div>
            <span className="user-name">{currentUser.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
