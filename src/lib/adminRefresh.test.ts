import assert from 'node:assert/strict';
import { getFulfilledAdminData } from './adminRefresh';

const emptySuccess = getFulfilledAdminData<string[]>(
  { status: 'fulfilled', value: [] },
  'orders',
);

assert.deepEqual(
  emptySuccess,
  [],
  'a successful empty backend response should be applied as an empty list',
);

const loggedErrors: unknown[][] = [];
const failedRefresh = getFulfilledAdminData<string[]>(
  { status: 'rejected', reason: new Error('timeout') },
  'orders',
  (...args) => loggedErrors.push(args),
);

assert.equal(
  failedRefresh,
  undefined,
  'a failed refresh should not be converted to an empty list',
);

assert.equal(loggedErrors.length, 1);
assert.match(String(loggedErrors[0][0]), /orders/);

console.log('admin refresh helpers passed');
