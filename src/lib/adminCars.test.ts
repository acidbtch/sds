import assert from 'node:assert/strict';
import {
  getAdminCarBrandOptions,
  getAdminCarModelOptions,
} from './adminCars';

const brands = [
  { id: 'c9e2c8fa-5887-47e2-b254-d0cf86a35c0d', name: 'BMW' },
  { id: '8b68d375-c139-4777-b1aa-a0bc49e5b18b', title: 'Audi' },
];

const modelsByBrand = {
  'c9e2c8fa-5887-47e2-b254-d0cf86a35c0d': [
    { id: 'model-1', name: '3 серия' },
    { id: 'model-2', title: '5 серия' },
  ],
};

assert.deepEqual(getAdminCarBrandOptions(brands, modelsByBrand), [
  { id: 'c9e2c8fa-5887-47e2-b254-d0cf86a35c0d', name: 'BMW' },
  { id: '8b68d375-c139-4777-b1aa-a0bc49e5b18b', name: 'Audi' },
]);

assert.deepEqual(
  getAdminCarModelOptions(modelsByBrand, 'c9e2c8fa-5887-47e2-b254-d0cf86a35c0d'),
  [
    { id: 'model-1', name: '3 серия' },
    { id: 'model-2', name: '5 серия' },
  ],
);

assert.deepEqual(
  getAdminCarModelOptions(
    {
      Legacy: ['Golf', { id: 'jetta-id', name: 'Jetta' }],
    },
    'Legacy',
  ),
  [
    { id: 'Golf', name: 'Golf' },
    { id: 'jetta-id', name: 'Jetta' },
  ],
  'legacy string models should remain editable',
);

assert.deepEqual(
  getAdminCarBrandOptions([], { BMW: ['3 серия'] }),
  [{ id: 'BMW', name: 'BMW' }],
  'legacy local dictionaries should still show brand names',
);

console.log('admin car helpers passed');
