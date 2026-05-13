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
  tier: 'LEADER',
  legal_name: 'New Executor',
  short_name: 'Executor',
}, 1);

assert.equal(newRequest.type, 'new');
assert.equal(newRequest.oldData, undefined);
assert.equal(newRequest.profile, 'leader');

console.log('executor moderation mapping passed');
