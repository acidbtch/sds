import assert from 'node:assert/strict';
import {
  getExecutorDisplayProfile,
  getExecutorMediaUrl,
} from './executorProfileDisplay';

const approved = {
  id: 'executor-1',
  legal_name: 'Top level',
  current_profile: {
    legal_name: 'Published profile',
    logo: { url: 'https://cdn.example.com/logo.png' },
  },
};

assert.equal(
  getExecutorDisplayProfile(approved).legal_name,
  'Published profile',
  'published current_profile should be preferred over top-level executor meta',
);

assert.equal(
  getExecutorMediaUrl(getExecutorDisplayProfile(approved).logo),
  'https://cdn.example.com/logo.png',
  'MediaFile logo object should provide a display URL',
);

const pendingNew = {
  id: 'executor-2',
  moderation_status: 'PENDING',
  pending_changes: {
    legal_name: 'Pending profile',
  },
};

assert.equal(
  getExecutorDisplayProfile(pendingNew, { preferPending: true }).legal_name,
  'Pending profile',
  'new pending profiles can be displayed from pending_changes when there is no published profile',
);

console.log('executor profile display helpers passed');
