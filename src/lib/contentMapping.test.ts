import assert from 'node:assert/strict';
import {
  getContentTextByKey,
  mapFaqItemsFromApi,
  prepareFaqItemsForSave,
} from './contentMapping';

const faq = mapFaqItemsFromApi([
  { id: 'second', question: 'Second', answer: 'Answer 2', order: 2 },
  { id: 'first', question: 'First', answer: 'Answer 1', order: 1 },
  { id: 'legacy', question: 'Legacy', answer: 'Answer 0', sort_order: 0 },
]);

assert.deepEqual(
  faq.map(item => item.id),
  ['legacy', 'first', 'second'],
  'FAQ should be sorted by backend order fields before display',
);

assert.deepEqual(
  prepareFaqItemsForSave([
    { id: 'legacy', question: '  Question\n', answer: '  Answer\n' },
    { id: 'new', question: 'New', answer: 'Answer' },
  ]),
  [
    { id: 'legacy', question: '  Question\n', answer: '  Answer\n', order: 0 },
    { id: 'new', question: 'New', answer: 'Answer', order: 1 },
  ],
  'FAQ save payload should preserve text and send explicit order values',
);

assert.equal(
  getContentTextByKey([
    { key: 'rules', content: '# New rules' },
    { key: 'privacy', value: '# Legacy privacy' },
  ], 'rules'),
  '# New rules',
  'static content should read the new content field',
);

assert.equal(
  getContentTextByKey([{ key: 'privacy', value: '# Legacy privacy' }], 'privacy'),
  '# Legacy privacy',
  'static content should keep a legacy value fallback during migration',
);

console.log('content mapping passed');
