export type RecordsTransitionKind = "detail" | "filter";

let pendingNavigation: {resolve: () => void; timer: number} | null = null;

export function settleRecordsNavigation(): void {
  if (!pendingNavigation) {
    return;
  }

  window.clearTimeout(pendingNavigation.timer);
  pendingNavigation.resolve();
  pendingNavigation = null;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function startRecordsTransition(
  kind: RecordsTransitionKind,
  update: () => void | Promise<void>,
): ViewTransition | null {
  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    return null;
  }

  const root = document.documentElement;
  const clear = (): void => {
    if (root.dataset.recordsTransition === kind) {
      delete root.dataset.recordsTransition;
    }
  };

  root.dataset.recordsTransition = kind;

  const transition = document.startViewTransition(update);

  transition.ready.catch(() => undefined);
  transition.finished.then(clear, clear);

  return transition;
}

export function navigateWithRecordsTransition(kind: RecordsTransitionKind, navigate: () => void): ViewTransition | null {
  return startRecordsTransition(kind, () => new Promise<void>((resolve) => {
    settleRecordsNavigation();
    pendingNavigation = {
      resolve,
      timer: window.setTimeout(settleRecordsNavigation, 1800),
    };
    navigate();
  }));
}
