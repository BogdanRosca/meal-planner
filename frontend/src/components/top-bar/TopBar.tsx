import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './TopBar.module.css';
import { SECTION_TO_PATH, PATH_TO_SECTION } from '../../config/routes';

const NAVIGATION_ITEMS = [
  'Meal Planner',
  'Recipes',
  'Shopping List',
  'Analytics',
];

interface TopBarProps {
  currentUser?: {
    name: string;
    avatar?: string;
  };
  onMenuToggle?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentUser = { name: 'John Doe' },
  onMenuToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = PATH_TO_SECTION[location.pathname] ?? '';

  const handleNavClick = (item: string) => {
    const path = SECTION_TO_PATH[item];
    if (path) navigate(path);
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
          {NAVIGATION_ITEMS.map(item => (
            <button
              key={item}
              className={[
                styles['nav-item'],
                activeSection === item ? styles.active : '',
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
            <span className={styles.flag}>🇬🇧</span>
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
