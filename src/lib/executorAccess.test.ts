import assert from 'node:assert/strict';
import {
  filterApprovedExecutors,
  getExecutorModerationStatus,
  isExecutorApproved,
} from './executorAccess';

assert.equal(getExecutorModerationStatus({ moderation_status: 'APPROVED' }), 'APPROVED');
assert.equal(getExecutorModerationStatus({ moderationStatus: 'approved' }), 'APPROVED');
assert.equal(
  getExecutorModerationStatus({ status: 'active' }),
  'UNKNOWN',
  'generic active user status must not grant executor order access',
);
assert.equal(getExecutorModerationStatus({ status: 'APPROVED' }), 'APPROVED');
assert.equal(getExecutorModerationStatus({ moderation_status: 'PENDING' }), 'PENDING');
assert.equal(getExecutorModerationStatus({ moderation_status: 'REJECTED' }), 'REJECTED');
assert.equal(getExecutorModerationStatus({}), 'UNKNOWN');

assert.equal(isExecutorApproved({ moderation_status: 'APPROVED' }), true);
assert.equal(isExecutorApproved({ moderation_status: 'PENDING' }), false);
assert.equal(isExecutorApproved({ moderation_status: 'REJECTED' }), false);
assert.equal(isExecutorApproved({}), false);

const approvedOnly = filterApprovedExecutors([
  { id: 'approved', moderation_status: 'APPROVED' },
  { id: 'pending', moderation_status: 'PENDING' },
  { id: 'rejected', moderation_status: 'REJECTED' },
  { id: 'unknown' },
]);

assert.deepEqual(
  approvedOnly.map((executor) => executor.id),
  ['approved'],
  'only approved executors should be visible in public executor lists',
);

console.log('executor access helpers passed');
