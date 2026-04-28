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

export function prependFaqItem<T>(items: T[], item: T) {
  return [item, ...items];
}

export function formatFaqAnswerMarkdown(markdown: string) {
  return markdown.replace(/^(\s{0,3})•\s+/gm, '$1- ');
}
