import React from 'react';
import styles from './QuickActions.module.css';
import Categories from '../categories/Categories';

interface QuickActionsProps {
  onActionClick?: (_action: string) => void;
  onCategoryClick?: (_category: string) => void;
  isMobileOpen?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick,
  onCategoryClick: _onCategoryClick,
  isMobileOpen = false,
}) => {
  const actions = [
    {
      id: 'add-recipe',
      title: 'Add Recipe',
      icon: '🍳',
      description: 'Create a new recipe',
    },
    {
      id: 'plan-meals',
      title: 'Plan Meals',
      icon: '📅',
      description: 'Plan your weekly meals',
    },
    {
      id: 'shopping-list',
      title: 'Shopping List',
      icon: '🛒',
      description: 'Create shopping list',
    },
  ];

  const handleActionClick = (action: string) => {
    onActionClick?.(action);
  };

  return (
    <aside
      className={[
        styles['quick-actions'],
        isMobileOpen ? styles['mobile-open'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles['quick-actions-header']}>
        <h3>Quick Actions</h3>
      </div>
      <div className={styles['quick-actions-list']}>
        {actions.map(action => (
          <button
            key={action.id}
            className={styles['quick-action-item']}
            onClick={() => handleActionClick(action.title)}
          >
            <div className={styles['action-icon']}>{action.icon}</div>
            <div className={styles['action-content']}>
              <h4>{action.title}</h4>
              <p>{action.description}</p>
            </div>
            <div className={styles['action-arrow']}>→</div>
          </button>
        ))}
      </div>

      {/* Categories Section */}
      <Categories onCategoryClick={_onCategoryClick} />
    </aside>
  );
};

export default QuickActions;
