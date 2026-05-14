import { Page } from '@playwright/test';

export interface MockRecipe {
  id: number;
  name: string;
  category: string;
  prep_time: number;
  portions: number;
  instructions: string;
  main_ingredients: unknown[];
  common_ingredients: unknown[];
  foto_url: string | null;
}

export interface MockMealPlanEntry {
  id: number;
  week_start: string;
  day_of_week: number;
  meal_slot: string;
  recipe_id: number;
  recipe_name: string;
}

export const MOCK_RECIPES: MockRecipe[] = [
  {
    id: 1,
    name: 'Scrambled Eggs',
    category: 'breakfast',
    prep_time: 10,
    portions: 2,
    instructions: 'Cook eggs.',
    main_ingredients: [],
    common_ingredients: [],
    foto_url: null,
  },
  {
    id: 2,
    name: 'Grilled Chicken',
    category: 'dinner',
    prep_time: 30,
    portions: 4,
    instructions: 'Grill chicken.',
    main_ingredients: [],
    common_ingredients: [],
    foto_url: null,
  },
];

export const MOCK_ENTRY: MockMealPlanEntry = {
  id: 99,
  week_start: '2026-04-27',
  day_of_week: 0,
  meal_slot: 'breakfast',
  recipe_id: 1,
  recipe_name: 'Scrambled Eggs',
};

export async function mockRecipes(
  page: Page,
  recipes: MockRecipe[] = MOCK_RECIPES
) {
  await page.route('**/recipes', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', recipes }),
      });
    } else {
      await route.continue();
    }
  });
}

export async function mockMealPlanEntries(
  page: Page,
  entries: MockMealPlanEntry[]
) {
  await page.route('**/meal-plans**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', entries }),
      });
    } else {
      await route.continue();
    }
  });
}

export async function mockAddMealPlanEntry(
  page: Page,
  entry: MockMealPlanEntry
) {
  await page.route('**/meal-plans**', async route => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(entry),
      });
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', entries: [entry] }),
      });
    } else {
      await route.continue();
    }
  });
}

export async function mockDeleteMealPlanEntry(page: Page) {
  await page.route('**/meal-plans**', async route => {
    const method = route.request().method();
    if (method === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', entries: [] }),
      });
    } else {
      await route.continue();
    }
  });
}
