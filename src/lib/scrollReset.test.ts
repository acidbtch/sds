import assert from 'node:assert/strict';
import {
  resetScrollableDescendants,
  resetScrollElement,
} from './scrollReset';

const nestedNodes = [
  { scrollTop: 50, scrollLeft: 1 },
  { scrollTop: 0, scrollLeft: 22 },
  { scrollTop: 300, scrollLeft: 0 },
];
const root = {
  scrollTop: 120,
  scrollLeft: 7,
  querySelectorAll: () => nestedNodes,
};

resetScrollableDescendants(root as any);

assert.equal(root.scrollTop, 0);
assert.equal(root.scrollLeft, 0);
assert.deepEqual(
  nestedNodes.map((node) => [node.scrollTop, node.scrollLeft]),
  [[0, 0], [0, 0], [0, 0]],
  'all nested scroll containers should be reset to the top-left corner',
);

const element = { scrollTop: 12, scrollLeft: 3 };
resetScrollElement(element);
assert.deepEqual(element, { scrollTop: 0, scrollLeft: 0 });

console.log('scroll reset helpers passed');
