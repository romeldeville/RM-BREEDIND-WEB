import { Injectable, signal } from '@angular/core';

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: number;
  severity: ToastSeverity;
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private sequence = 0;
  private readonly toastsSignal = signal<Toast[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string, title?: string): void {
    this.push('success', message, title);
  }

  info(message: string, title?: string): void {
    this.push('info', message, title);
  }

  warning(message: string, title?: string): void {
    this.push('warning', message, title);
  }

  error(message: string, title?: string): void {
    this.push('error', message, title);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(severity: ToastSeverity, message: string, title?: string): void {
    const id = ++this.sequence;
    this.toastsSignal.update((toasts) => [...toasts, { id, severity, message, title }]);
    if (typeof setTimeout === 'function') {
      setTimeout(() => this.dismiss(id), severity === 'error' ? 8000 : 4500);
    }
  }
}
