import { expect, test } from '@playwright/test';

test.describe('public pages', () => {
  test('login page renders the form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
  });

  test('demo mode opens the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrer en mode démonstration' }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/app/herd');
    await expect(page).toHaveURL(/\/login/);
  });
});
