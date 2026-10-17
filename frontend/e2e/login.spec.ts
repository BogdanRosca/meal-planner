import { expect, test } from '@playwright/test';
import {
  mockAnonymousUser,
  mockLogin,
  mockMealPlanEntries,
  mockRecipes,
} from './mocks/meal-planner.mocks';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousUser(page);
    await mockRecipes(page);
    await mockMealPlanEntries(page, []);
  });

  test('logged-out visitors land on the login page', async ({ page }) => {
    await page.goto('/meal-planner');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });

  test('wrong credentials show an error', async ({ page }) => {
    await mockLogin(page, false);
    await page.goto('/login');

    await page.getByLabel('Email').fill('cook@example.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Invalid email or password'
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logging in opens the page the visitor asked for', async ({ page }) => {
    await mockLogin(page, true);
    await page.goto('/shopping-list');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill('cook@example.com');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/shopping-list$/);
    await expect(page.getByText('cook@example.com')).toBeVisible();
  });
});
