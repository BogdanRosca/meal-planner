import { test, expect } from '@playwright/test';

const MONDAY_BREAKFAST_CELL = 'meal-cell-breakfast-0';

test.describe('Meal Planner calendar', () => {
  test.afterEach(async ({ page }) => {
    const removeButton = page.getByRole('button', { name: /^Remove /i });
    if (await removeButton.isVisible().catch(() => false)) {
      await removeButton.click();
    }
  });

  test('adds a recipe to the calendar via search', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId(MONDAY_BREAKFAST_CELL).click();

    const recipeOptions = page.locator('[data-testid^="recipe-option-"]');
    await expect(recipeOptions).toHaveCount(3);

    await page.getByTestId('recipe-search-input').fill('turk');
    await expect(recipeOptions).toHaveCount(1);

    await page.getByRole('button', { name: /Turkish eggs/i }).click();

    await expect(page.getByTestId(MONDAY_BREAKFAST_CELL)).toContainText(
      'Turkish eggs'
    );
  });
});
