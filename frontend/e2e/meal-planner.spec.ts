import { test } from '@playwright/test';
import { MealPlannerPage } from './pages/meal-planner.page';
import {
  MOCK_ENTRY,
  mockAddMealPlanEntry,
  mockDeleteMealPlanEntry,
  mockMealPlanEntries,
  mockRecipes,
} from './mocks/meal-planner.mocks';

test.describe('Meal Planner - Add and remove a meal', () => {
  let mealPlanner: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    await mockRecipes(page);
    await mockMealPlanEntries(page, []);

    mealPlanner = new MealPlannerPage(page);
    await mealPlanner.goto();
  });

  test.afterEach(async ({ page }) => {
    await mockDeleteMealPlanEntry(page);
    await mealPlanner.removeRecipe('Scrambled Eggs');
    await mealPlanner.assertRecipeNotInSlot('Scrambled Eggs');
  });

  test('adds a recipe to a meal slot and then removes it', async ({ page }) => {
    await test.step('Add a breakfast recipe', async () => {
      await mealPlanner.openMealSlot(0);
      await mealPlanner.assertOnlyMatchingRecipes(
        'Scrambled Eggs',
        'Grilled Chicken'
      );
    });

    await test.step('Select Scrambled Eggs', async () => {
      await mockAddMealPlanEntry(page, MOCK_ENTRY);
      await mealPlanner.selectRecipe(/Scrambled Eggs/i);
      await mealPlanner.assertSelectorClosed();
    });

    await test.step('Verify recipe appears in slot', async () => {
      await mealPlanner.assertRecipeInSlot('Scrambled Eggs');
    });
  });
});
