import { HERD_STYLES } from '../herd/herd-page.styles';

export const HEALTH_STYLES = `${HERD_STYLES}
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
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
  .status-ok {
    color: var(--color-success, #067647);
  }
  .status-blocked {
    color: var(--color-danger, #b42318);
  }
`;
