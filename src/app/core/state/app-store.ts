import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly sidebarOpenSignal = signal(false);
  private readonly onlineSignal = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  readonly sidebarOpen = this.sidebarOpenSignal.asReadonly();
  readonly online = this.onlineSignal.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onlineSignal.set(true));
      window.addEventListener('offline', () => this.onlineSignal.set(false));
    }
  }

  toggleSidebar(): void {
    this.sidebarOpenSignal.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpenSignal.set(false);
  }
}
