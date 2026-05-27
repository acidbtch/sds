import assert from 'node:assert/strict';
import {
  getExecutorModerationProfileId,
  getExecutorModerationRequestId,
  mapExecutorModerationFromApi,
  removeExecutorModerationItem,
} from './executorModeration';

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
    legal_document_keys: ['old-doc.pdf'],
    legal_documents: [{ url: 'https://cdn.example.com/old-doc.pdf', name: 'Старый документ.pdf' }],
    portfolio_photo_keys: ['old-photo.jpg'],
    portfolio_photos: [{ url: 'https://cdn.example.com/old-photo.jpg', name: 'Старое фото.jpg' }],
    logo_key: 'old-logo.png',
    logo_url: 'https://cdn.example.com/old-logo.png',
  },
  pending_changes: {
    legal_name: 'New Legal Name',
    short_name: 'New Short Name',
    description: 'New description',
    phone: '+375292222222',
    service_ids: ['service-2'],
    region_ids: ['region-2'],
    legal_document_keys: ['new-doc.pdf'],
    portfolio_photo_keys: ['new-video.mp4'],
    logo_key: 'new-logo.png',
  },
}, 0, {
  services: [{ id: 'service-2', name: 'New service' }],
  regions: [{ id: 'region-2', name: 'New region' }],
});

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
  ['New region'],
  'region ids from pending changes should be displayed as region names',
);
assert.equal(editRequest.oldData?.legalDocumentFiles?.[0].name, 'Старый документ.pdf');
assert.equal(editRequest.oldData?.portfolioPhotoFiles?.[0].kind, 'image');
assert.equal(editRequest.oldData?.logoFiles?.[0].previewUrl, 'https://cdn.example.com/old-logo.png');
assert.equal(editRequest.data.legalDocumentFiles?.[0].key, 'new-doc.pdf');
assert.equal(editRequest.data.portfolioPhotoFiles?.[0].kind, 'video');
assert.equal(editRequest.data.logoFiles?.[0].key, 'new-logo.png');

const newRequest = mapExecutorModerationFromApi({
  id: 'profile-2',
  moderation_status: 'PENDING',
  moderation_request: {
    moderation_request_id: 'moderation-request-2',
    type: 'new',
    status: 'PENDING',
  },
  tier: 'LEADER',
  pending_changes: {
    legal_name: 'New Executor',
    short_name: 'Executor',
    logo: {
      key: 'new-logo-key',
      url: 'https://cdn.example.com/new-logo.jpg',
      name: 'logo.jpg',
      kind: 'image',
    },
  },
}, 1);

assert.equal(newRequest.type, 'new');
assert.equal(newRequest.oldData, undefined);
assert.equal(newRequest.profile, 'leader');
assert.equal(newRequest.data.name, 'New Executor');
assert.equal(newRequest.data.logoFiles?.[0].previewUrl, 'https://cdn.example.com/new-logo.jpg');
assert.equal(getExecutorModerationProfileId(newRequest), 'profile-2');
assert.equal(
  getExecutorModerationRequestId(newRequest),
  'moderation-request-2',
  'moderation actions should use the backend moderation request id, not the executor profile id',
);
assert.equal(getExecutorModerationProfileId({ ...newRequest, data: {} }), null);
assert.equal(
  getExecutorModerationRequestId({
    ...newRequest,
    moderationRequestId: '',
    data: { moderation_request: { moderation_request_id: 'nested-action-id' } },
  }),
  'nested-action-id',
);
assert.equal(getExecutorModerationRequestId({ ...newRequest, moderationRequestId: '', data: {} }), null);

const directModerationRequest = mapExecutorModerationFromApi({
  id: 'moderation-request-direct',
  type: 'edit',
  status: 'PENDING',
  executor_profile_id: 'profile-direct',
  current_profile: {
    id: 'profile-direct',
    legal_name: 'Current Executor',
    short_name: 'Current',
  },
  pending_changes: {
    legal_name: 'Changed Executor',
    short_name: 'Changed',
  },
}, 2);

assert.equal(
  getExecutorModerationRequestId(directModerationRequest),
  'moderation-request-direct',
  'direct moderation request responses should use their own id for moderation actions',
);
assert.equal(
  getExecutorModerationProfileId(directModerationRequest),
  'profile-direct',
  'direct moderation request responses should keep the executor profile id separately',
);

const directModerationWithNestedProfile = mapExecutorModerationFromApi({
  id: 'moderation-request-nested-profile',
  request_type: 'edit',
  status: 'PENDING',
  executor_profile: {
    id: 'profile-nested',
    legal_name: 'Nested Executor',
    short_name: 'Nested',
  },
  pending_changes: {
    legal_name: 'Nested Executor Changed',
  },
}, 3);

assert.equal(
  getExecutorModerationRequestId(directModerationWithNestedProfile),
  'moderation-request-nested-profile',
  'direct moderation request responses with nested executor_profile should use their own id',
);
assert.equal(
  getExecutorModerationProfileId(directModerationWithNestedProfile),
  'profile-nested',
  'direct moderation request responses with nested executor_profile should keep the nested profile id',
);

const pendingRequestIdInChanges = mapExecutorModerationFromApi({
  id: 'profile-pending-change-id',
  moderation_status: 'PENDING',
  pending_changes: {
    moderation_request_id: 'moderation-request-from-pending-changes',
    legal_name: 'Pending Change Executor',
  },
}, 4);

assert.equal(
  getExecutorModerationRequestId(pendingRequestIdInChanges),
  'moderation-request-from-pending-changes',
  'moderation_request_id inside pending_changes should be used for moderation actions',
);

const moderationRequestWithUuid = mapExecutorModerationFromApi({
  id: 'profile-request-uuid',
  moderation_status: 'PENDING',
  moderation_request: {
    uuid: 'moderation-request-uuid',
    type: 'new',
    status: 'PENDING',
  },
}, 5);

assert.equal(
  getExecutorModerationRequestId(moderationRequestWithUuid),
  'moderation-request-uuid',
  'moderation request uuid aliases should be accepted as action ids',
);

const logoOnlyKeyRequest = mapExecutorModerationFromApi({
  id: 'profile-logo',
  moderation_status: 'PENDING',
  logo_key: 'c49341f9-without-extension',
}, 6);

assert.equal(
  logoOnlyKeyRequest.data.logoFiles?.[0].kind,
  'image',
  'moderation logo keys without extension should still render as image files',
);

assert.deepEqual(
  removeExecutorModerationItem([editRequest, newRequest], newRequest.id).map((item) => item.id),
  [editRequest.id],
  'moderated request should be removed from the visible moderation queue',
);

console.log('executor moderation mapping passed');
