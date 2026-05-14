import { Page, Locator, expect } from '@playwright/test';

export class MealPlannerPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly recipeSelectorHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Weekly Meal Plan' });
    this.recipeSelectorHeading = page.getByRole('heading', {
      name: /breakfast/i,
    });
  }

  recipeOption(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name });
  }

  mealCard(recipeName: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`View ${recipeName} details`, 'i'),
    });
  }

  removeButton(recipeName: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`Remove ${recipeName}`, 'i'),
    });
  }

  emptyMealSlots(): Locator {
    return this.page.locator('[role="button"]').filter({ hasText: '+' });
  }

  async goto() {
    await this.page.goto('/meal-planner');
    await expect(this.heading).toBeVisible();
  }

  async openMealSlot(index = 0) {
    await this.emptyMealSlots().nth(index).click();
    await expect(this.recipeSelectorHeading).toBeVisible();
  }

  async selectRecipe(name: string | RegExp) {
    await this.recipeOption(name).click();
  }

  async removeRecipe(recipeName: string) {
    await this.removeButton(recipeName).click();
  }

  async assertRecipeInSlot(recipeName: string) {
    await expect(this.mealCard(recipeName)).toBeVisible();
  }

  async assertRecipeNotInSlot(recipeName: string) {
    await expect(this.mealCard(recipeName)).not.toBeVisible();
  }

  async assertSelectorClosed() {
    await expect(this.recipeSelectorHeading).not.toBeVisible();
  }

  async assertOnlyMatchingRecipes(visible: string, hidden: string) {
    await expect(this.recipeOption(new RegExp(visible, 'i'))).toBeVisible();
    await expect(this.recipeOption(new RegExp(hidden, 'i'))).not.toBeVisible();
  }
}
