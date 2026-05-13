import assert from 'node:assert/strict';
import { mapExecutorModerationFromApi } from './executorModeration';

const editRequest = mapExecutorModerationFromApi({
  id: 'profile-1',
  moderation_status: 'PENDING',
  tier: 'PROFI',
  created_at: '2026-05-01T10:00:00.000Z',
  current_profile: {
    id: 'profile-1',
    legal_status: 'OOO',
    legal_name: 'Old Legal Name',
    short_name: 'Old Short Name',
    description: 'Old description',
    phone: '+375291111111',
    services: [{ id: 'service-1', name: 'Old service' }],
    regions: [{ id: 'region-1', name: 'Old region' }],
  },
  pending_changes: {
    legal_name: 'New Legal Name',
    short_name: 'New Short Name',
    description: 'New description',
    phone: '+375292222222',
    services: [{ id: 'service-2', name: 'New service' }],
  },
}, 0);

assert.equal(
  editRequest.type,
  'edit',
  'pending profile edits should be shown as edit moderation requests',
);
assert.equal(editRequest.oldData?.name, 'Old Legal Name');
assert.equal(editRequest.data.name, 'New Legal Name');
assert.equal(editRequest.oldData?.phone, '+375291111111');
assert.equal(editRequest.data.phone, '+375292222222');
assert.deepEqual(editRequest.oldData?.services, ['Old service']);
assert.deepEqual(editRequest.data.services, ['New service']);
assert.deepEqual(
  editRequest.data.regions,
  ['Old region'],
  'unchanged fields should stay visible in the new version',
);

const newRequest = mapExecutorModerationFromApi({
  id: 'profile-2',
  moderation_status: 'PENDING',
  tier: 'LEADER',
  legal_name: 'New Executor',
  short_name: 'Executor',
}, 1);

assert.equal(newRequest.type, 'new');
assert.equal(newRequest.oldData, undefined);
assert.equal(newRequest.profile, 'leader');

console.log('executor moderation mapping passed');
