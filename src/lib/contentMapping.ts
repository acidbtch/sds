export interface ContentFaqItem {
  id: string;
  question: string;
  answer: string;
  order?: number;
}

function textValue(value: unknown) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/\u001E/g, '-')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001D\u001F\u007F]/g, ' ');
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function mapFaqItemsFromApi(items: unknown): ContentFaqItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any, index) => ({
      id: textValue(item?.id || item?.key || index),
      question: textValue(item?.question),
      answer: textValue(item?.answer),
      order: numberValue(item?.order ?? item?.sort_order ?? item?.sortOrder, index),
    }))
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

export function prepareFaqItemsForSave(items: Array<Partial<ContentFaqItem>>) {
  return items.map((item, index) => ({
    ...(item.id ? { id: item.id } : {}),
    question: textValue(item.question),
    answer: textValue(item.answer),
    order: index,
  }));
}

export function getContentTextByKey(items: unknown, key: string) {
  if (!Array.isArray(items)) return '';

  const item = items.find((entry: any) => entry?.key === key);
  return textValue(item?.content ?? item?.value ?? item?.body);
}

export function getContentTextFromApiItem(item: unknown, fallback = '') {
  if (!item || typeof item !== 'object') return fallback;

  const record = item as Record<string, unknown>;
  return textValue(record.content ?? record.value ?? record.body ?? fallback);
}
