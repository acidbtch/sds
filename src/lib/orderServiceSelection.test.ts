import { strict as assert } from 'node:assert';
import {
  getServicesForCategory,
  resetServicesForCategoryChange,
} from './orderServiceSelection';

const categories = [
  {
    id: 'engine',
    name: 'Engine',
    services: [
      { id: 'diagnostics', name: 'Diagnostics' },
      { id: 'repair', name: 'Repair' },
    ],
  },
  {
    id: 'body',
    name: 'Body',
    services: [{ id: 'paint', name: 'Paint' }],
  },
];

assert.deepEqual(getServicesForCategory(categories, ''), []);
assert.deepEqual(getServicesForCategory(categories, 'missing'), []);
assert.deepEqual(getServicesForCategory(categories, 'engine'), [
  { value: 'diagnostics', label: 'Diagnostics' },
  { value: 'repair', label: 'Repair' },
]);

assert.deepEqual(
  resetServicesForCategoryChange('engine', 'body', ['diagnostics', 'repair']),
  []
);

assert.deepEqual(
  resetServicesForCategoryChange('engine', 'engine', ['diagnostics']),
  ['diagnostics']
);

console.log('order service selection passed');
