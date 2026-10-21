// [temp] trigger CI
import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import styles from './App.module.css';
import TopBar from './components/top-bar/TopBar';
import QuickActions from './components/quick-actions/QuickActions';
import Recipes from './pages/recipes/Recipes';
import MealPlanner from './pages/meal-planner/MealPlanner';
import ShoppingList from './pages/shopping-list/ShoppingList';
import Analytics from './pages/analytics/Analytics';
import Login from './pages/login/Login';
import RequireAuth from './components/require-auth/RequireAuth';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './config/routes';

const QUICK_ACTION_ROUTES: Record<string, string> = {
  'Plan Meals': ROUTES.MEAL_PLANNER,
  'Add Recipe': ROUTES.RECIPES,
  'Import from link': ROUTES.RECIPES,
  'Shopping List': ROUTES.SHOPPING_LIST,
};

// Tells the Recipes page which modal to open on arrival
const QUICK_ACTION_STATE: Record<string, { openModal: 'add' | 'import' }> = {
  'Add Recipe': { openModal: 'add' },
  'Import from link': { openModal: 'import' },
};

function AppShell() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleQuickAction = (action: string) => {
    navigate(QUICK_ACTION_ROUTES[action] ?? ROUTES.MEAL_PLANNER, {
      state: QUICK_ACTION_STATE[action],
    });
    setIsMobileMenuOpen(false);
  };

  const handleCategoryClick = (category: string) => {
    navigate(ROUTES.RECIPES, { state: { category } });
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const userName = state.status === 'authenticated' ? state.user.email : '';

  return (
    <>
      <TopBar
        currentUser={{ name: userName }}
        onMenuToggle={handleMobileMenuToggle}
        onLogout={handleLogout}
      />
      <QuickActions
        onActionClick={handleQuickAction}
        onCategoryClick={handleCategoryClick}
        isMobileOpen={isMobileMenuOpen}
      />
      <main className={styles['App-main']}>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <div className={styles.App}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={<Navigate to={ROUTES.MEAL_PLANNER} replace />}
            />
            <Route path={ROUTES.MEAL_PLANNER} element={<MealPlanner />} />
            <Route path={ROUTES.RECIPES} element={<Recipes />} />
            <Route path={ROUTES.SHOPPING_LIST} element={<ShoppingList />} />
            <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
