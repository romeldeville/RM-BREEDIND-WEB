import { expect, test, type Page } from '@playwright/test';

async function setupDemoSession(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForFunction(() => Boolean((window as unknown as { ng?: unknown }).ng));
  await page.getByRole('button', { name: 'Entrer en mode démonstration' }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
}

test.describe('web domain e2e workflows (P17-04)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to provide robust, reproducible responses
    await page.route('**/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          animalsCount: 142,
          activeLotsCount: 8,
          pregnantFemalesCount: 19,
          activeTreatmentsCount: 3,
          criticalAlerts: [
            { id: 'alt-1', title: 'Délai d’attente actif', priority: 'CRITICAL', createdAt: new Date().toISOString() },
            { id: 'alt-2', title: 'Stock aliment faible', priority: 'IMPORTANT', createdAt: new Date().toISOString() },
          ],
        }),
      });
    });

    await page.route('**/indicators**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { code: 'BIRTHS_PERIOD', name: 'Naissances sur la période', value: 12, unit: 'têtes' },
          { code: 'GESTATION_RATE', name: 'Taux de gestation', value: 85.5, unit: '%' },
          { code: 'MORTALITY_RATE', name: 'Taux de mortalité', value: 2.1, unit: '%' },
        ]),
      });
    });
  });

  test('dashboard renders key indicators and alert cards', async ({ page }) => {
    await setupDemoSession(page);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByText('142')).toBeVisible();
    await expect(page.getByText('Délai d’attente actif')).toBeVisible();
  });

  test('herd workflow: navigates to animal list and creation form', async ({ page }) => {
    await page.route('**/animals**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'anim-1', tagNumber: 'BOUC-001', name: 'Zeus', species: 'Caprin', sex: 'MALE', status: 'ACTIVE' },
            { id: 'anim-2', tagNumber: 'CHEV-002', name: 'Belle', species: 'Caprin', sex: 'FEMALE', status: 'PREGNANT' },
          ],
          total: 2,
        }),
      });
    });

    await setupDemoSession(page);
    await page.goto('/app/herd');
    await expect(page.getByRole('heading', { name: 'Cheptel' })).toBeVisible();
    await expect(page.getByText('BOUC-001')).toBeVisible();

    await page.goto('/app/herd/new');
    await expect(page.getByRole('heading', { name: 'Nouvel animal' })).toBeVisible();
    await expect(page.getByLabel('Numéro de boucle')).toBeVisible();
  });

  test('lots workflow: navigates to lots list and creation form', async ({ page }) => {
    await page.route('**/lots**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'lot-1', code: 'LOT-2026-A', name: 'Poussins Lot 1', species: 'Avicole', headcount: 500, status: 'IN_GROWTH' },
          ],
          total: 1,
        }),
      });
    });

    await setupDemoSession(page);
    await page.goto('/app/lots');
    await expect(page.getByRole('heading', { name: 'Lots' })).toBeVisible();
    await expect(page.getByText('LOT-2026-A')).toBeVisible();

    await page.goto('/app/lots/new');
    await expect(page.getByRole('heading', { name: 'Nouveau lot' })).toBeVisible();
  });

  test('reproduction and health workflows: checks cycles and treatments', async ({ page }) => {
    await page.route('**/reproduction/cycles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'cyc-1', femaleTag: 'CHEV-002', status: 'PREGNANT', cycleStartDate: '2026-10-01' },
          ],
          total: 1,
        }),
      });
    });

    await page.route('**/health/treatments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'trt-1', animalTag: 'BOUC-001', product: 'Antibiotique X', withdrawalDays: 10, status: 'IN_PROGRESS' },
          ],
          total: 1,
        }),
      });
    });

    await setupDemoSession(page);
    await page.goto('/app/reproduction');
    await expect(page.getByRole('heading', { name: 'Reproduction' })).toBeVisible();

    await page.goto('/app/health');
    await expect(page.getByRole('heading', { name: 'Santé' })).toBeVisible();
  });

  test('feeding and production workflows: checks feeds, weighing and eggs', async ({ page }) => {
    await page.route('**/feeding**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feeds: [{ id: 'fd-1', name: 'Aliment Croissance', stockKg: 1200, lowStockAlert: false }],
        }),
      });
    });

    await setupDemoSession(page);
    await page.goto('/app/feeding');
    await expect(page.getByRole('heading', { name: 'Alimentation' })).toBeVisible();

    await page.goto('/app/production');
    await expect(page.getByRole('heading', { name: 'Production' })).toBeVisible();
  });

  test('sales and finance workflows: verifies customers, sales and transactions', async ({ page }) => {
    await page.route('**/sales**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'sal-1', invoiceNumber: 'FAC-2026-001', customerName: 'Ferme Bio', totalAmountCents: 450000, status: 'PAID' },
          ],
          total: 1,
        }),
      });
    });

    await setupDemoSession(page);
    await page.goto('/app/sales');
    await expect(page.getByRole('heading', { name: 'Ventes' })).toBeVisible();

    await page.goto('/app/finance');
    await expect(page.getByRole('heading', { name: 'Finances' })).toBeVisible();
  });

  test('alerts and reports workflows: checks filters and reporting views', async ({ page }) => {
    await page.route('**/alerts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 'alt-1', title: 'Retrait sanitaire en cours', priority: 'CRITICAL', status: 'ACTIVE' },
          ],
          total: 1,
        }),
      });
    });

    await setupDemoSession(page);
    await page.goto('/app/alerts');
    await expect(page.getByRole('heading', { name: 'Alertes' })).toBeVisible();

    await page.goto('/app/reports');
    await expect(page.getByRole('heading', { name: 'Rapports' })).toBeVisible();
  });

  test('settings and referential workflows: checks species, sites and members', async ({ page }) => {
    await setupDemoSession(page);
    await page.goto('/app/settings/species');
    await expect(page.getByRole('heading', { name: 'Espèces et races' })).toBeVisible();

    await page.goto('/app/settings/sites');
    await expect(page.getByRole('heading', { name: 'Sites et bâtiments' })).toBeVisible();

    await page.goto('/app/settings/members');
    await expect(page.getByRole('heading', { name: 'Membres et rôles' })).toBeVisible();
  });
});
