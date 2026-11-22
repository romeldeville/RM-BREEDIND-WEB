import { HERD_STYLES } from '../herd/herd-page.styles';

export const REPRODUCTION_STYLES = `${HERD_STYLES}
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .event-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .event-list li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  .event-list span {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .section-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .empty {
    color: var(--color-text-muted);
    margin: 0;
  }
`;
