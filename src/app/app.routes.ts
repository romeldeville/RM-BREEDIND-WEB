import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
    title: 'Connexion — RM Breeding',
  },
  {
    path: 'login/otp',
    loadComponent: () => import('./features/login/otp.page').then((m) => m.OtpPage),
    title: 'Code de connexion — RM Breeding',
  },
  {
    path: 'invitations/accept',
    loadComponent: () =>
      import('./features/invitations/accept-invitation.page').then((m) => m.AcceptInvitationPage),
    title: 'Invitation — RM Breeding',
  },
  {
    path: 'select-tenant',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tenant/select-tenant.page').then((m) => m.SelectTenantPage),
    title: 'Choisir une exploitation — RM Breeding',
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'Tableau de bord — RM Breeding',
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage),
        title: 'Rapports — RM Breeding',
      },
      {
        path: 'herd',
        loadComponent: () =>
          import('./features/herd/animal-list.page').then((m) => m.AnimalListPage),
        title: 'Cheptel — RM Breeding',
      },
      {
        path: 'herd/new',
        loadComponent: () =>
          import('./features/herd/animal-form.page').then((m) => m.AnimalFormPage),
        title: 'Nouvel animal — RM Breeding',
      },
      {
        path: 'herd/:id/edit',
        loadComponent: () =>
          import('./features/herd/animal-form.page').then((m) => m.AnimalFormPage),
        title: 'Animal — RM Breeding',
      },
      {
        path: 'herd/:id/status',
        loadComponent: () =>
          import('./features/herd/animal-status.page').then((m) => m.AnimalStatusPage),
        title: 'Statut et filiation — RM Breeding',
      },
      {
        path: 'herd/:id',
        loadComponent: () =>
          import('./features/herd/animal-detail.page').then((m) => m.AnimalDetailPage),
        title: 'Fiche animal — RM Breeding',
      },
      {
        path: 'lots',
        loadComponent: () => import('./features/herd/lot-list.page').then((m) => m.LotListPage),
        title: 'Lots — RM Breeding',
      },
      {
        path: 'lots/new',
        loadComponent: () => import('./features/herd/lot-form.page').then((m) => m.LotFormPage),
        title: 'Nouveau lot — RM Breeding',
      },
      {
        path: 'lots/:id/edit',
        loadComponent: () => import('./features/herd/lot-form.page').then((m) => m.LotFormPage),
        title: 'Lot — RM Breeding',
      },
      {
        path: 'lots/:id/movements',
        loadComponent: () =>
          import('./features/herd/lot-movements.page').then((m) => m.LotMovementsPage),
        title: 'Mouvements du lot — RM Breeding',
      },
      {
        path: 'lots/:id/close',
        loadComponent: () => import('./features/herd/lot-close.page').then((m) => m.LotClosePage),
        title: 'Clôture du lot — RM Breeding',
      },
      {
        path: 'lots/:id',
        loadComponent: () => import('./features/herd/lot-detail.page').then((m) => m.LotDetailPage),
        title: 'Fiche lot — RM Breeding',
      },
      {
        path: 'reproduction',
        loadComponent: () =>
          import('./features/reproduction/reproduction.page').then((m) => m.ReproductionPage),
        title: 'Reproduction - RM Breeding',
      },
      {
        path: 'reproduction/heats',
        loadComponent: () => import('./features/reproduction/heat.page').then((m) => m.HeatPage),
        title: 'Chaleurs - RM Breeding',
      },
      {
        path: 'reproduction/matings',
        loadComponent: () =>
          import('./features/reproduction/mating.page').then((m) => m.MatingPage),
        title: 'Saillie - RM Breeding',
      },
      {
        path: 'reproduction/diagnoses',
        loadComponent: () =>
          import('./features/reproduction/diagnosis.page').then((m) => m.DiagnosisPage),
        title: 'Diagnostic - RM Breeding',
      },
      {
        path: 'reproduction/births',
        loadComponent: () => import('./features/reproduction/birth.page').then((m) => m.BirthPage),
        title: 'Mise bas - RM Breeding',
      },
      {
        path: 'reproduction/weanings',
        loadComponent: () =>
          import('./features/reproduction/weaning.page').then((m) => m.WeaningPage),
        title: 'Sevrage - RM Breeding',
      },
      {
        path: 'reproduction/cycles/:id',
        loadComponent: () =>
          import('./features/reproduction/cycle-detail.page').then((m) => m.CycleDetailPage),
        title: 'Fiche cycle - RM Breeding',
      },
      {
        path: 'health',
        loadComponent: () => import('./features/health/health.page').then((m) => m.HealthPage),
        title: 'Santé — RM Breeding',
      },
      {
        path: 'health/products',
        loadComponent: () =>
          import('./features/health/products.page').then((m) => m.HealthProductsPage),
        title: 'Produits vétérinaires — RM Breeding',
      },
      {
        path: 'health/vaccinations',
        loadComponent: () =>
          import('./features/health/vaccination.page').then((m) => m.HealthVaccinationPage),
        title: 'Vaccination — RM Breeding',
      },
      {
        path: 'health/treatments',
        loadComponent: () =>
          import('./features/health/treatment.page').then((m) => m.HealthTreatmentPage),
        title: 'Traitement — RM Breeding',
      },
      {
        path: 'health/withdrawals',
        loadComponent: () =>
          import('./features/health/withdrawals.page').then((m) => m.HealthWithdrawalsPage),
        title: 'Délais d’attente — RM Breeding',
      },
      {
        path: 'health/mortalities',
        loadComponent: () =>
          import('./features/health/mortality.page').then((m) => m.HealthMortalityPage),
        title: 'Mortalité — RM Breeding',
      },
      {
        path: 'health/quarantines',
        loadComponent: () =>
          import('./features/health/quarantine.page').then((m) => m.HealthQuarantinePage),
        title: 'Quarantaine — RM Breeding',
      },
      {
        path: 'feeding',
        loadComponent: () => import('./features/feeding/feeding.page').then((m) => m.FeedingPage),
        title: 'Alimentation - RM Breeding',
      },
      {
        path: 'feeding/feeds',
        loadComponent: () =>
          import('./features/feeding/feeds.page').then((m) => m.FeedingFeedsPage),
        title: 'Aliments - RM Breeding',
      },
      {
        path: 'feeding/receipts',
        loadComponent: () =>
          import('./features/feeding/receipt.page').then((m) => m.FeedingReceiptPage),
        title: 'Réception - RM Breeding',
      },
      {
        path: 'feeding/distributions',
        loadComponent: () =>
          import('./features/feeding/distribution.page').then((m) => m.FeedingDistributionPage),
        title: 'Distribution - RM Breeding',
      },
      {
        path: 'feeding/stocks',
        loadComponent: () =>
          import('./features/feeding/stock.page').then((m) => m.FeedingStockPage),
        title: 'Stocks - RM Breeding',
      },
      {
        path: 'feeding/plans',
        loadComponent: () =>
          import('./features/feeding/plans.page').then((m) => m.FeedingPlansPage),
        title: 'Plans - RM Breeding',
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./features/production/production.page').then((m) => m.ProductionPage),
        title: 'Production - RM Breeding',
      },
      {
        path: 'production/weighings',
        loadComponent: () =>
          import('./features/production/weighing.page').then((m) => m.ProductionWeighingPage),
        title: 'Pesées - RM Breeding',
      },
      {
        path: 'production/growth',
        loadComponent: () =>
          import('./features/production/growth.page').then((m) => m.ProductionGrowthPage),
        title: 'Croissance - RM Breeding',
      },
      {
        path: 'production/collections',
        loadComponent: () =>
          import('./features/production/collection.page').then((m) => m.ProductionCollectionPage),
        title: 'Ramassage - RM Breeding',
      },
      {
        path: 'production/egg-stocks',
        loadComponent: () =>
          import('./features/production/egg-stock.page').then((m) => m.ProductionEggStockPage),
        title: 'Stock d’œufs - RM Breeding',
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/sales.page').then((m) => m.SalesPage),
        title: 'Ventes — RM Breeding',
      },
      {
        path: 'sales/new',
        loadComponent: () => import('./features/sales/sale-form.page').then((m) => m.SaleFormPage),
        title: 'Nouvelle vente — RM Breeding',
      },
      {
        path: 'sales/payments',
        loadComponent: () =>
          import('./features/sales/payments.page').then((m) => m.SalesPaymentsPage),
        title: 'Paiements — RM Breeding',
      },
      {
        path: 'sales/clients',
        loadComponent: () =>
          import('./features/sales/clients.page').then((m) => m.SalesClientsPage),
        title: 'Clients — RM Breeding',
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance.page').then((m) => m.FinancePage),
        title: 'Finances — RM Breeding',
      },
      {
        path: 'finance/expenses',
        loadComponent: () =>
          import('./features/finance/expense.page').then((m) => m.FinanceExpensePage),
        title: 'Dépenses — RM Breeding',
      },
      {
        path: 'finance/revenues',
        loadComponent: () =>
          import('./features/finance/revenue.page').then((m) => m.FinanceRevenuePage),
        title: 'Revenus — RM Breeding',
      },
      {
        path: 'finance/costs',
        loadComponent: () =>
          import('./features/finance/costs.page').then((m) => m.FinanceCostsPage),
        title: 'Coûts & marges — RM Breeding',
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/alerts/alerts.page').then((m) => m.AlertsPage),
        title: 'Alertes — RM Breeding',
      },
      {
        path: 'alerts/today',
        loadComponent: () => import('./features/alerts/today.page').then((m) => m.AlertsTodayPage),
        title: "À faire aujourd'hui — RM Breeding",
      },
      {
        path: 'alerts/tasks',
        loadComponent: () => import('./features/alerts/tasks.page').then((m) => m.AlertsTasksPage),
        title: 'Tâches — RM Breeding',
      },
      {
        path: 'species',
        loadComponent: () =>
          import('./features/species/species-list.page').then((m) => m.SpeciesListPage),
        title: 'Référentiel — RM Breeding',
      },
      {
        path: 'species/new',
        loadComponent: () =>
          import('./features/species/species-form.page').then((m) => m.SpeciesFormPage),
        title: 'Nouvelle espèce — RM Breeding',
      },
      {
        path: 'species/:id/edit',
        loadComponent: () =>
          import('./features/species/species-form.page').then((m) => m.SpeciesFormPage),
        title: 'Espèce — RM Breeding',
      },
      {
        path: 'species/:id/breeds',
        loadComponent: () => import('./features/species/breeds.page').then((m) => m.BreedsPage),
        title: 'Races — RM Breeding',
      },
      {
        path: 'species/:id/plans',
        loadComponent: () =>
          import('./features/species/species-plans.page').then((m) => m.SpeciesPlansPage),
        title: 'Plans — RM Breeding',
      },
      {
        path: 'sites',
        loadComponent: () => import('./features/sites/sites.page').then((m) => m.SitesPage),
        title: 'Sites — RM Breeding',
      },
      {
        path: 'sites/plan',
        loadComponent: () => import('./features/sites/farm-plan.page').then((m) => m.FarmPlanPage),
        title: 'Plan de ferme — RM Breeding',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
        title: 'Paramètres — RM Breeding',
      },
      {
        path: 'settings/members',
        loadComponent: () => import('./features/members/members.page').then((m) => m.MembersPage),
        title: 'Membres — RM Breeding',
      },
      {
        path: 'settings/subscription',
        loadComponent: () => import('./features/billing/subscription.page').then((m) => m.SubscriptionPage),
        title: 'Abonnement — RM Breeding',
      },
      {
        path: 'platform',
        loadComponent: () => import('./features/platform/platform-dashboard.page').then((m) => m.PlatformDashboardPage),
        title: 'Console Plateforme — RM Breeding',
      },
      {
        path: 'platform/tenants',
        loadComponent: () => import('./features/platform/platform-tenants.page').then((m) => m.PlatformTenantsPage),
        title: 'Tenants — RM Breeding',
      },
      {
        path: 'platform/announcements',
        loadComponent: () => import('./features/platform/platform-announcements.page').then((m) => m.PlatformAnnouncementsPage),
        title: 'Annonces — RM Breeding',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
