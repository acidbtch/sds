import assert from 'node:assert/strict';
import { mapUserProfileFromApi } from './authUser';

assert.deepEqual(
  mapUserProfileFromApi({
    id: 'user-1',
    username: 'alex',
    role: 'CUSTOMER',
    is_blocked: true,
  }),
  {
    id: 'user-1',
    username: 'alex',
    role: 'CUSTOMER',
    is_blocked: true,
    isBlocked: true,
  },
  'snake_case backend blocked flag should become frontend isBlocked',
);

assert.equal(
  mapUserProfileFromApi({ id: 'user-2', status: 'blocked' }).isBlocked,
  true,
  'blocked status should also become frontend isBlocked',
);

assert.equal(
  mapUserProfileFromApi({ id: 'user-3', is_blocked: false }).isBlocked,
  false,
  'active users should not be marked as blocked',
);

console.log('auth user helpers passed');
