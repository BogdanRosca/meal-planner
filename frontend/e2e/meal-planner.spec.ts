import { test, expect } from '@playwright/test';
import { MealPlannerPage } from './pages/MealPlannerPage';

test.describe('Meal Planner calendar', () => {
  let mealPlanner: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mealPlanner = new MealPlannerPage(page);
  });

  test.afterEach(async () => {
    await mealPlanner.removeAnyEntry();
  });

  test('adds a recipe to the calendar via search', async () => {
    await mealPlanner.goto();

    await mealPlanner.openMealSlot('breakfast', 0);
    await expect(mealPlanner.recipeOptions).toHaveCount(3);

    await mealPlanner.searchRecipes('turk');
    await expect(mealPlanner.recipeOptions).toHaveCount(1);

    await mealPlanner.selectRecipe(/Turkish eggs/i);

    await expect(mealPlanner.mealCell('breakfast', 0)).toContainText(
      'Turkish eggs'
    );
  });
});
