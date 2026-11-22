import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface Alert {
  id: string;
  farmId: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  dueDate: string | null;
  status: string;
  entityType: string | null;
  entityId: string | null;
  assignedRole: string | null;
  postponeReason: string | null;
  createdAt: string | null;
  closedAt: string | null;
}

export interface Task {
  id: string;
  farmId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  recurrence: string | null;
  status: string;
  createdAt: string | null;
  completedAt: string | null;
}

export interface TodayBundle {
  alerts: Alert[];
  tasks: Task[];
}

export interface PostponeRequest {
  dueDate: string;
  reason: string;
}

export interface TaskRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assignedTo?: string | null;
  recurrence?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly api = inject(ApiClient);

  alerts(query: Record<string, unknown> = {}): Observable<Alert[]> {
    return this.api.get<Alert[]>('alerts', query);
  }

  today(): Observable<TodayBundle> {
    return this.api.get<TodayBundle>('alerts/today');
  }

  close(alertId: string): Observable<Alert> {
    return this.api.post<Alert>(`alerts/${alertId}/close`, {});
  }

  postpone(alertId: string, request: PostponeRequest): Observable<Alert> {
    return this.api.post<Alert>(`alerts/${alertId}/postpone`, request);
  }

  cancel(alertId: string, reason: string): Observable<Alert> {
    return this.api.post<Alert>(`alerts/${alertId}/cancel`, { reason });
  }

  tasks(): Observable<Task[]> {
    return this.api.get<Task[]>('tasks');
  }

  createTask(request: TaskRequest): Observable<Task> {
    return this.api.post<Task>('tasks', request, this.api.newIdempotencyKey());
  }

  completeTask(taskId: string): Observable<Task> {
    return this.api.post<Task>(`tasks/${taskId}/complete`, {});
  }
}
