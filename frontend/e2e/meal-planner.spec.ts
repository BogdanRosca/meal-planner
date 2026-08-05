import { test, expect } from './fixtures';

test.describe('Meal Planner calendar', () => {
  test('adds a recipe to the calendar via search', async ({
    mealPlannerPage,
  }) => {
    await mealPlannerPage.openMealSlot('breakfast', 0);
    await expect(mealPlannerPage.recipeOptions).toHaveCount(3);

    await mealPlannerPage.searchRecipes('turk');
    await expect(mealPlannerPage.recipeOptions).toHaveCount(1);

    await mealPlannerPage.selectRecipe(/Turkish eggs/i);

    await expect(mealPlannerPage.mealCell('breakfast', 0)).toContainText(
      'Turkish eggs'
    );
  });
});
