export interface DashboardAlert {
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

export interface DashboardSummary {
  herdSize: number;
  openAlerts: number;
  birthsThisMonth: number;
  averageDailyGain: number | null;
  grossMargin: number | null;
  criticalAlerts: DashboardAlert[];
}

export interface IndicatorValue {
  code: string;
  label: string;
  unit: string;
  value: number | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface IndicatorPoint {
  label: string;
  value: number | null;
}
