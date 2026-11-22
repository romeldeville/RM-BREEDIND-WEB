import { expect, test, type Page } from '@playwright/test';

async function openLogin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForFunction(() => Boolean((window as unknown as { ng?: unknown }).ng));
}

test.describe('authentication flows', () => {
  test('login form validates required fields', async ({ page }) => {
    await openLogin(page);
    await page.getByLabel('Adresse e-mail').fill('');
    await page.getByLabel('Mot de passe').fill('');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('E-mail invalide')).toBeVisible();
    await expect(page.getByText('8 caractères minimum')).toBeVisible();
  });

  test('otp screen is reachable from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Recevoir un code de connexion' }).click();
    await expect(page).toHaveURL(/\/login\/otp/);
    await expect(page.getByRole('heading', { name: 'Connexion par code' })).toBeVisible();
    await expect(page.getByLabel('E-mail ou téléphone')).toBeVisible();
    await expect(page.getByLabel('Code à 6 chiffres')).toBeVisible();
  });

  test('mfa challenge opens the verification screen', async ({ page }) => {
    await page.goto('/login/otp?challenge=11111111-1111-1111-1111-111111111111');
    await expect(page.getByRole('heading', { name: 'Vérification en deux étapes' })).toBeVisible();
    await expect(page.getByLabel('E-mail ou téléphone')).toHaveCount(0);
  });

  test('invitation link without token shows an error', async ({ page }) => {
    await page.goto('/invitations/accept');
    await expect(page.getByRole('heading', { name: 'Rejoindre l’exploitation' })).toBeVisible();
    await expect(page.getByText('Lien d’invitation invalide ou incomplet.')).toBeVisible();
  });

  test('tenant selection page is protected', async ({ page }) => {
    await page.goto('/select-tenant');
    await expect(page).toHaveURL(/\/login/);
  });

  test('members page is protected', async ({ page }) => {
    await page.goto('/app/settings/members');
    await expect(page).toHaveURL(/\/login/);
  });

  test('demo session opens tenant selector', async ({ page }) => {
    await openLogin(page);
    await page.getByRole('button', { name: 'Entrer en mode démonstration' }).click();
    await page.goto('/select-tenant');
    await expect(page.getByRole('heading', { name: 'Choisir une exploitation' })).toBeVisible();
    await expect(page.getByText('Ferme Démo')).toBeVisible();
  });
});
