import assert from 'node:assert/strict';
import {
  createAdminRefreshError,
  getFulfilledAdminData,
  getRejectedAdminRefreshError,
} from './adminRefresh';

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

const authError = createAdminRefreshError({ status: 403, message: 'Forbidden' }, 'users');

assert.deepEqual(
  authError,
  {
    key: 'users',
    label: 'users',
    message: 'Forbidden',
    status: 403,
    isAuthError: true,
    isTimeout: false,
  },
  'admin refresh errors should keep the status and mark auth failures',
);

const timeoutError = getRejectedAdminRefreshError(
  { status: 'rejected', reason: Object.assign(new Error('Request timed out after 20000ms'), { name: 'ApiTimeoutError' }) },
  'dashboard',
  'dashboard',
);

assert.equal(timeoutError?.isTimeout, true);
assert.equal(timeoutError?.label, 'dashboard');

assert.equal(
  getRejectedAdminRefreshError({ status: 'fulfilled', value: [] }, 'orders'),
  null,
  'fulfilled admin refresh results should not create visible errors',
);

console.log('admin refresh helpers passed');
