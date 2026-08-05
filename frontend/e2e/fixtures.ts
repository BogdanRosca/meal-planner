import { test as base } from '@playwright/test';
import { MealPlannerPage } from './pages/MealPlannerPage';

type Fixtures = {
  mealPlannerPage: MealPlannerPage;
};

export const test = base.extend<Fixtures>({
  mealPlannerPage: async ({ page }, use) => {
    const mealPlannerPage = new MealPlannerPage(page);
    await mealPlannerPage.goto();
    await use(mealPlannerPage);
    await mealPlannerPage.removeAnyEntry();
  },
});

export { expect } from '@playwright/test';
