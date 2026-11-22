export const HERD_STYLES = `
  .page-header .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .panel {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
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
  .row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    justify-content: flex-end;
  }
  .row-actions .btn {
    min-height: 36px;
    padding: 0 var(--space-3);
    font-size: var(--font-size-xs);
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
  .field input,
  .field select,
  .field textarea {
    min-height: var(--touch-target);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
  .field small,
  .muted {
    color: var(--color-text-muted);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-4);
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-3);
  }
  .detail-grid div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  .detail-grid span {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .badge {
    display: inline-block;
    margin-left: var(--space-2);
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-border);
    font-size: var(--font-size-xs);
  }
  .error {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: #fef3f2;
    color: var(--color-danger);
  }
  .notice {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted, #f5f5f4);
  }
`;
