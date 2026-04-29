export function insertEditorBullet(text: string, selectionStart: number, selectionEnd: number) {
  const start = Math.max(0, Math.min(selectionStart, text.length));
  const end = Math.max(start, Math.min(selectionEnd, text.length));
  const before = text.slice(0, start);
  const after = text.slice(end);
  const bullet = before.length === 0 || before.endsWith('\n') ? '• ' : '\n• ';

  return {
    text: `${before}${bullet}${after}`,
    cursor: before.length + bullet.length,
  };
}

export function insertFaqBullet(text: string, selectionStart: number, selectionEnd: number) {
  return insertEditorBullet(text, selectionStart, selectionEnd);
}

function prependFaqItem<T>(items: T[], item: T) {
  return [item, ...items];
}

export type FaqEditorItem = {
  id: string;
  question: string;
  answer?: string;
};

export function getFaqItemsForEditor<T>(items: T[], draftItem: T | null) {
  return draftItem ? prependFaqItem(items, draftItem) : items;
}

export function saveFaqEditorItem<T extends FaqEditorItem>(items: T[], item: T, isDraft: boolean) {
  if (isDraft) {
    return prependFaqItem(items, item);
  }

  return items.map(existingItem => (
    existingItem.id === item.id ? { ...existingItem, ...item } : existingItem
  ));
}

export function formatContentMarkdown(markdown: string) {
  return markdown.replace(/^(\s{0,3})•\s+/gm, '$1- ');
}

export function formatFaqAnswerMarkdown(markdown: string) {
  return formatContentMarkdown(markdown);
}
