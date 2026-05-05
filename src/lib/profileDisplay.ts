export function normalizeNamedList(items: unknown) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object' && 'name' in item && typeof (item as { name?: unknown }).name === 'string') {
        return (item as { name: string }).name.trim();
      }

      return '';
    })
    .filter(Boolean);
}
