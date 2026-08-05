import { test, expect } from './fixtures';

test.describe('Meal Planner calendar', () => {
  test('adds a recipe to the calendar via search', async ({
    mealPlannerPage,
  }) => {
    /* Arrange */
    await test.step('Click Monday to add new breakfast', async () => {
      await mealPlannerPage.openMealSlot('breakfast', 0);
      await expect(mealPlannerPage.recipeOptions).toHaveCount(3);
    });

    await test.step("Partial type to seach for 'Turkish eggs'", async () => {
      await mealPlannerPage.searchRecipes('turk');
      await expect(mealPlannerPage.recipeOptions).toHaveCount(1);
    });

    /* Act */
    await test.step("Add 'Turkish eggs' recipe to breakfast", async () => {
      await mealPlannerPage.selectRecipe(/Turkish eggs/i);
    });

    /* Assert */
    await test.step("Check 'Turkish eggs' was added to calendar as breakfast", async () => {
      await expect(mealPlannerPage.mealCell('breakfast', 0)).toContainText(
        'Turkish eggs'
      );
    });
  });
});
