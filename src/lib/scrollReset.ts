type ScrollElement = {
  scrollTop?: number;
  scrollLeft?: number;
};

type ScrollRoot = ScrollElement & {
  querySelectorAll?: (selector: string) => Iterable<ScrollElement>;
};

export function resetScrollElement(element: ScrollElement | null | undefined) {
  if (!element) return;

  if (typeof element.scrollTop === 'number') {
    element.scrollTop = 0;
  }

  if (typeof element.scrollLeft === 'number') {
    element.scrollLeft = 0;
  }
}

export function resetScrollableDescendants(root: ScrollRoot | null | undefined) {
  if (!root) return;

  resetScrollElement(root);

  if (typeof root.querySelectorAll !== 'function') return;

  Array.from(root.querySelectorAll('*')).forEach(resetScrollElement);
}

export function resetAppScrollPosition(root?: ScrollRoot | null) {
  if (typeof window !== 'undefined') {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  if (typeof document !== 'undefined') {
    resetScrollElement(document.documentElement);
    resetScrollElement(document.body);
  }

  resetScrollableDescendants(root);
}

export function scheduleAppScrollReset(root?: ScrollRoot | null) {
  resetAppScrollPosition(root);

  if (typeof window === 'undefined') {
    return () => {};
  }

  let secondFrameId = 0;
  const firstFrameId = window.requestAnimationFrame(() => {
    resetAppScrollPosition(root);
    secondFrameId = window.requestAnimationFrame(() => resetAppScrollPosition(root));
  });
  const timeoutId = window.setTimeout(() => resetAppScrollPosition(root), 80);

  return () => {
    window.cancelAnimationFrame(firstFrameId);
    if (secondFrameId) {
      window.cancelAnimationFrame(secondFrameId);
    }
    window.clearTimeout(timeoutId);
  };
}
