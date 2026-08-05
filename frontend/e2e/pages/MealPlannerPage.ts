import { expect, type Locator, type Page } from '@playwright/test';

export class MealPlannerPage {
  readonly page: Page;
  readonly recipeSearchInput: Locator;
  readonly recipeOptions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recipeSearchInput = page.getByTestId('recipe-search-input');
    this.recipeOptions = page.locator('[data-testid^="recipe-option-"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  mealCell(mealSlot: string, dayIndex: number): Locator {
    return this.page.getByTestId(`meal-cell-${mealSlot}-${dayIndex}`);
  }

  async openMealSlot(mealSlot: string, dayIndex: number) {
    await this.mealCell(mealSlot, dayIndex).click();
    await expect(this.recipeSearchInput).toBeVisible();
  }

  async searchRecipes(query: string) {
    await this.recipeSearchInput.fill(query);
  }

  async selectRecipe(name: string | RegExp) {
    await this.page.getByRole('button', { name }).click();
  }

  async removeAnyEntry() {
    const removeButton = this.page.getByRole('button', { name: /^Remove /i });
    if (await removeButton.isVisible().catch(() => false)) {
      await removeButton.click();
    }
  }
}
