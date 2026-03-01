import React, { useState } from 'react';
import styles from './App.module.css';
import TopBar from './components/top-bar/TopBar';
import QuickActions from './components/quick-actions/QuickActions';
import Home from './pages/home/Home';
import Recipes from './pages/recipes/Recipes';
import MealPlanner from './pages/meal-planner/MealPlanner';

function App() {
  const [currentSection, setCurrentSection] = useState('Meal Planner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (section: string) => {
    setCurrentSection(section);
  };

  const handleQuickAction = (action: string) => {
    const target = action === 'Plan Meals' ? 'Meal Planner' : action;
    setCurrentSection(target);
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCategoryClick = (category: string) => {
    setCurrentSection(category);
    setIsMobileMenuOpen(false); // Close mobile menu when category is selected
  };

  const handleRecipeClick = (recipe: { name: string }) => {
    setCurrentSection(`Recipe: ${recipe.name}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.App}>
      <TopBar
        currentUser={{ name: 'John Doe' }}
        onNavigate={handleNavigation}
        onMenuToggle={handleMobileMenuToggle}
      />
      <QuickActions
        onActionClick={handleQuickAction}
        onCategoryClick={handleCategoryClick}
        onRecipeClick={handleRecipeClick}
        isMobileOpen={isMobileMenuOpen}
      />
      <main className={styles['App-main']}>
        {currentSection === 'Recipes' ? (
          <Recipes />
        ) : currentSection === 'Meal Planner' ? (
          <MealPlanner />
        ) : (
          <Home />
        )}
      </main>
    </div>
  );
}

export default App;
