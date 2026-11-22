export const REPORTS_STYLES = `
  .panel {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: flex-end;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--font-size-sm);
  }
  .field input {
    min-height: var(--touch-target);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }
  .table th,
  .table td {
    text-align: left;
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }
  .table th {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .value {
    font-weight: 600;
    white-space: nowrap;
  }
  .value--unavailable,
  .muted {
    color: var(--color-text-muted);
  }
  .code {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .error {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: #fef3f2;
    color: var(--color-danger);
  }
  .empty {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    padding: var(--space-4) 0;
  }
`;
