import React, { useState } from 'react';
import styles from './TopBar.module.css';

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
    <header className={styles['top-bar']}>
      <div className={styles['top-bar-container']}>
        {/* Mobile Menu Button */}
        <button className={styles['mobile-menu-btn']} onClick={onMenuToggle}>
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
        <div className={styles['logo-section']}>
          <div className={styles['logo-icon']}>🍴</div>
          <span className={styles['logo-text']}>MealCraft</span>
        </div>

        {/* Navigation Section */}
        <nav className={styles.navigation}>
          {navigationItems.map(item => (
            <button
              key={item}
              className={[
                styles['nav-item'],
                activeTab === item ? styles.active : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className={styles['user-section']}>
          <div className={styles['language-selector']}>
            <span className={styles.flag}>🇺🇸</span>
          </div>
          <div className={styles['user-profile']}>
            <div className={styles['user-avatar']}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <div className={styles['avatar-placeholder']}>
                  {currentUser.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
              )}
            </div>
            <span className={styles['user-name']}>{currentUser.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
