import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-module-page',
  standalone: true,
  imports: [TranslatePipe, ButtonModule],
  templateUrl: './module.page.html',
  styleUrl: './module.page.scss',
})
export class ModulePage {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey = this.route.snapshot.data['titleKey'] as string;
  readonly descKey = this.route.snapshot.data['descKey'] as string;
  readonly bullets = (this.route.snapshot.data['bullets'] as string[] | undefined) ?? [];
}
