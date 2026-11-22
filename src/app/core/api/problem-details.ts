export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string>;
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null && ('title' in value || 'detail' in value);
}

export function problemMessage(problem: ProblemDetails | null, fallback: string): string {
  if (!problem) {
    return fallback;
  }
  return problem.detail ?? problem.title ?? fallback;
}
