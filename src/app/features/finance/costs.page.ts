import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FinanceService, LotCost, LotMargin } from '../../core/api/finance.service';
import { HerdService, Lot } from '../../core/api/herd.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { FINANCE_STYLES } from './finance-page.styles';
import { formatAmount } from './finance-shared';

@Component({
  selector: 'app-finance-costs-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Coûts &amp; marges</h1>
          <p>Analyser le coût et la marge d’un lot.</p>
        </div>
      </header>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      <section class="card panel">
        <h2>Lot</h2>
        <form class="filters" [formGroup]="form">
          <label class="field">
            <span>Lot</span>
            <select formControlName="lotId">
              @for (lot of lots(); track lot.id) {
                <option [value]="lot.id">{{ lot.name }}</option>
              }
            </select>
          </label>
        </form>
      </section>

      <section class="card panel">
        <h2>Coût du lot</h2>
        @if (!cost()) {
          <p class="empty">Aucune donnée de coût.</p>
        } @else {
          <table class="table">
            <tbody>
              <tr>
                <td>Coût aliment</td>
                <td>{{ formatAmount(cost()!.feedCost) }}</td>
              </tr>
              <tr>
                <td>Coûts alloués</td>
                <td>{{ formatAmount(cost()!.allocatedCost) }}</td>
              </tr>
              <tr>
                <td><strong>Coût total</strong></td>
                <td><strong>{{ formatAmount(cost()!.totalCost) }}</strong></td>
              </tr>
            </tbody>
          </table>
        }
      </section>

      <section class="card panel">
        <h2>Marge du lot</h2>
        @if (!margin()) {
          <p class="empty">Aucune donnée de marge.</p>
        } @else {
          <table class="table">
            <tbody>
              <tr>
                <td>Revenus</td>
                <td>{{ formatAmount(margin()!.revenue) }}</td>
              </tr>
              <tr>
                <td>Coûts</td>
                <td>{{ formatAmount(margin()!.cost) }}</td>
              </tr>
              <tr>
                <td><strong>Marge</strong></td>
                <td><strong>{{ formatAmount(margin()!.margin) }}</strong></td>
              </tr>
              @if (margin()!.marginRate !== null) {
                <tr>
                  <td>Taux de marge</td>
                  <td>{{ margin()!.marginRate }} %</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </section>
  `,
  styles: [FINANCE_STYLES],
})
export class FinanceCostsPage {
  private readonly financeService = inject(FinanceService);
  private readonly herd = inject(HerdService);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly lots = signal<Lot[]>([]);
  readonly cost = signal<LotCost | null>(null);
  readonly margin = signal<LotMargin | null>(null);
  readonly error = signal<string | null>(null);

  readonly formatAmount = formatAmount;

  readonly form = this.fb.nonNullable.group({
    lotId: ['', [Validators.required]],
  });

  constructor() {
    this.form.controls.lotId.valueChanges.subscribe((lotId) => this.load(lotId));
    this.herd.lots({ limit: 100 }).subscribe({
      next: (page) => {
        this.lots.set(page.items);
        if (page.items.length > 0) {
          this.form.controls.lotId.setValue(page.items[0].id);
          this.load(page.items[0].id);
        }
      },
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  load(lotId: string): void {
    if (!lotId) {
      this.cost.set(null);
      this.margin.set(null);
      return;
    }
    this.financeService.lotCost(lotId).subscribe({
      next: (cost) => this.cost.set(cost),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
    this.financeService.lotMargin(lotId).subscribe({
      next: (margin) => this.margin.set(margin),
      error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    const detail = error.error?.detail;
    return typeof detail === 'string' ? detail : this.i18n.t('common.error');
  }
}
