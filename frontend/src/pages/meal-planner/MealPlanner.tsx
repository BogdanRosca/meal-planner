import React, { useState } from 'react';
import { Recipe } from '../../types/recipe';
import { useMealPlanner } from '../../hooks/useMealPlanner';
import WeekNavigator from './WeekNavigator';
import CalendarGrid from './CalendarGrid';
import RecipeSelectorModal from './RecipeSelectorModal';
import styles from './MealPlanner.module.css';

const SLOT_TO_CATEGORY: Record<string, string> = {
  breakfast: 'breakfast',
  morning_snack: 'snack',
  lunch: 'lunch',
  afternoon_snack: 'snack',
  dinner: 'dinner',
};

const MealPlanner: React.FC = () => {
  const {
    weekStart,
    recipes,
    loading,
    error,
    navigateWeek,
    addEntry,
    removeEntry,
    getEntry,
  } = useMealPlanner();

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: number;
    mealSlot: string;
  } | null>(null);

  const handleCellClick = (dayOfWeek: number, mealSlot: string) => {
    setSelectedSlot({ dayOfWeek, mealSlot });
    setSelectorOpen(true);
  };

  const handleRecipeSelect = async (recipe: Recipe) => {
    if (!selectedSlot) return;
    await addEntry(selectedSlot.dayOfWeek, selectedSlot.mealSlot, recipe.id);
    setSelectorOpen(false);
    setSelectedSlot(null);
  };

  const handleCloseSelector = () => {
    setSelectorOpen(false);
    setSelectedSlot(null);
  };

  const categoryFilter = selectedSlot
    ? SLOT_TO_CATEGORY[selectedSlot.mealSlot] || 'dinner'
    : 'dinner';

  if (loading) {
    return (
      <div className={styles['meal-planner']}>
        <div className={styles['loading-message']}>Loading meal plan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['meal-planner']}>
        <div className={styles['error-message']}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles['meal-planner']}>
      <h2 className={styles['meal-planner-title']}>Weekly Meal Plan</h2>
      <WeekNavigator weekStart={weekStart} onNavigate={navigateWeek} />
      <CalendarGrid
        weekStart={weekStart}
        getEntry={getEntry}
        onCellClick={handleCellClick}
        onRemoveEntry={removeEntry}
      />
      <RecipeSelectorModal
        isOpen={selectorOpen}
        recipes={recipes}
        categoryFilter={categoryFilter}
        onSelect={handleRecipeSelect}
        onClose={handleCloseSelector}
      />
    </div>
  );
};

export default MealPlanner;
