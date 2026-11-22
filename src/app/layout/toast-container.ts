import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/notifications/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.severity">
          <div class="toast__body">
            @if (toast.title) {
              <strong>{{ toast.title }}</strong>
            }
            <span>{{ toast.message }}</span>
          </div>
          <button
            type="button"
            class="toast__close"
            aria-label="Fermer"
            (click)="notifications.dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 360px;
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-text);
        box-shadow: var(--shadow-dialog);
        border-left: 4px solid var(--color-info);
      }
      .toast--success {
        border-left-color: var(--color-success);
      }
      .toast--warning {
        border-left-color: var(--color-warning);
      }
      .toast--error {
        border-left-color: var(--color-danger);
      }
      .toast__body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: var(--font-size-sm);
        flex: 1;
      }
      .toast__close {
        background: transparent;
        border: none;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class ToastContainer {
  readonly notifications = inject(NotificationService);
}
