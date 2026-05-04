import assert from 'node:assert/strict';
import {
  ApiBlockedError,
  ApiError,
  ApiTimeoutError,
  isAuthExpiredError,
  isTransientApiError,
  isUserBlockedError,
} from './api';

assert.equal(isAuthExpiredError(new ApiError(401, 'Token expired')), true);
assert.equal(isAuthExpiredError(new ApiError(403, 'Forbidden')), true);
assert.equal(isAuthExpiredError(new ApiBlockedError('User is blocked')), false);
assert.equal(isAuthExpiredError(new ApiError(500, 'Server error')), false);
assert.equal(isAuthExpiredError(new ApiTimeoutError('/users/me', 20_000)), false);

assert.equal(isUserBlockedError(new ApiBlockedError('User is blocked')), true);
assert.equal(isUserBlockedError(new ApiError(403, 'Forbidden')), false);

assert.equal(isTransientApiError(new ApiTimeoutError('/users/me', 20_000)), true);
assert.equal(isTransientApiError(new TypeError('Failed to fetch')), true);
assert.equal(isTransientApiError(new ApiError(401, 'Token expired')), false);
assert.equal(isTransientApiError(new ApiBlockedError('User is blocked')), false);
assert.equal(isTransientApiError(new Error('Unexpected error')), false);

console.log('api recovery helpers passed');
