import assert from 'node:assert/strict';
import { formatFaqAnswerMarkdown, insertEditorBullet, insertFaqBullet, prependFaqItem } from './faqEditor';

assert.deepEqual(
  insertFaqBullet('', 0, 0),
  { text: '• ', cursor: 2 },
  'empty answer should start a bullet item',
);

const introText = 'Перед пунктом';
assert.deepEqual(
  insertFaqBullet(introText, introText.length, introText.length),
  { text: 'Перед пунктом\n• ', cursor: introText.length + 3 },
  'bullet should be inserted on a new line after existing text',
);

const textWithLineBreak = 'Первая строка\n';
assert.deepEqual(
  insertFaqBullet(textWithLineBreak, textWithLineBreak.length, textWithLineBreak.length),
  { text: 'Первая строка\n• ', cursor: textWithLineBreak.length + 2 },
  'line that already starts after a newline should not get an extra blank line',
);

assert.deepEqual(
  insertFaqBullet('Начало конец', 7, 7),
  { text: 'Начало \n• конец', cursor: 10 },
  'inserting in the middle should break the text and put the rest after the bullet',
);

assert.equal(
  formatFaqAnswerMarkdown('• Первый пункт\n• Второй пункт'),
  '- Первый пункт\n- Второй пункт',
  'manual dot bullets should render as markdown bullets with list indentation',
);

assert.equal(
  formatFaqAnswerMarkdown('1. Первый пункт\n2. Второй пункт'),
  '1. Первый пункт\n2. Второй пункт',
  'numbered lists should keep standard markdown indentation',
);

assert.deepEqual(
  insertEditorBullet('Правило', 7, 7),
  { text: 'Правило\n• ', cursor: 10 },
  'shared editor helper should insert dot bullets for long text sections',
);

const existingFaq = [{ id: 'old', question: 'Старый вопрос' }];
const newFaq = { id: 'new', question: 'Новый вопрос' };
assert.deepEqual(
  prependFaqItem(existingFaq, newFaq),
  [newFaq, ...existingFaq],
  'new FAQ drafts should appear at the beginning of the list',
);
assert.deepEqual(existingFaq, [{ id: 'old', question: 'Старый вопрос' }], 'existing FAQ list should not be mutated');

console.log('faq editor helpers passed');
