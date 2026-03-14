import React, { useState } from 'react';
import styles from './App.module.css';
import TopBar from './components/top-bar/TopBar';
import QuickActions from './components/quick-actions/QuickActions';
import Home from './pages/home/Home';
import Recipes from './pages/recipes/Recipes';
import MealPlanner from './pages/meal-planner/MealPlanner';
import ShoppingList from './pages/shopping-list/ShoppingList';

function App() {
  const [currentSection, setCurrentSection] = useState('Meal Planner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Categories');

  const handleNavigation = (section: string) => {
    setCurrentSection(section);
  };

  const handleQuickAction = (action: string) => {
    let target = action;
    if (action === 'Plan Meals') {
      target = 'Meal Planner';
    } else if (action === 'Add Recipe') {
      target = 'Recipes';
    }
    setCurrentSection(target);
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentSection('Recipes');
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
        selectedCategory={selectedCategory}
        isMobileOpen={isMobileMenuOpen}
      />
      <main className={styles['App-main']}>
        {currentSection === 'Recipes' ? (
          <Recipes selectedCategory={selectedCategory} />
        ) : currentSection === 'Meal Planner' ? (
          <MealPlanner />
        ) : currentSection === 'Shopping List' ? (
          <ShoppingList />
        ) : (
          <Home />
        )}
      </main>
    </div>
  );
}

export default App;
