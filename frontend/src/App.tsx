import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import styles from './App.module.css';
import TopBar from './components/top-bar/TopBar';
import QuickActions from './components/quick-actions/QuickActions';
import Recipes from './pages/recipes/Recipes';
import MealPlanner from './pages/meal-planner/MealPlanner';
import ShoppingList from './pages/shopping-list/ShoppingList';
import Analytics from './pages/analytics/Analytics';
import { ROUTES } from './config/routes';

const QUICK_ACTION_ROUTES: Record<string, string> = {
  'Plan Meals': ROUTES.MEAL_PLANNER,
  'Add Recipe': ROUTES.RECIPES,
  'Shopping List': ROUTES.SHOPPING_LIST,
};

function App() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleQuickAction = (action: string) => {
    navigate(QUICK_ACTION_ROUTES[action] ?? ROUTES.MEAL_PLANNER);
    setIsMobileMenuOpen(false);
  };

  const handleCategoryClick = (category: string) => {
    navigate(ROUTES.RECIPES, { state: { category } });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.App}>
      <TopBar
        currentUser={{ name: 'John Doe' }}
        onMenuToggle={handleMobileMenuToggle}
      />
      <QuickActions
        onActionClick={handleQuickAction}
        onCategoryClick={handleCategoryClick}
        isMobileOpen={isMobileMenuOpen}
      />
      <main className={styles['App-main']}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={ROUTES.MEAL_PLANNER} replace />}
          />
          <Route path={ROUTES.MEAL_PLANNER} element={<MealPlanner />} />
          <Route path={ROUTES.RECIPES} element={<Recipes />} />
          <Route path={ROUTES.SHOPPING_LIST} element={<ShoppingList />} />
          <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
