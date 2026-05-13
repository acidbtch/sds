import assert from 'node:assert/strict';
import {
  buildExecutorProfileUpdatePayload,
  getExecutorProfileModerationResult,
} from './executorProfilePayload';

const payload = buildExecutorProfileUpdatePayload(
  {
    legalStatus: 'company',
    name: 'ООО Тест Сервис',
    unp: '123456789',
    shortName: 'Тест Сервис',
    description: 'Ремонт автомобилей',
    services: ['Диагностика'],
    regions: ['Минск'],
    address: 'Минск',
    schedule: { monday: { enabled: true, from: '09:00', to: '18:00' } },
    phone: '+375 29 123 45 67',
    instagram: 'https://instagram.com/test',
    tiktok: '',
    website: 'https://example.com',
    profileType: 'pro',
    bannerText: '',
    logo: '',
    logoKey: 'logos/test.png',
    legalDocumentFiles: [
      { name: 'document.pdf', key: 'documents/document.pdf' },
    ],
    portfolioPhotoFiles: [
      { name: 'work.jpg', key: 'portfolio/work.jpg' },
    ],
  },
  ['service-1'],
  ['region-1'],
);

assert.equal(
  payload.moderation_status,
  'PENDING',
  'executor profile edits should explicitly request moderation',
);
assert.equal(payload.legal_name, 'ООО Тест Сервис');
assert.equal(payload.tier, 'PROFI');
assert.equal(payload.phone, '+375291234567');
assert.equal(payload.instagram_url, 'https://instagram.com/test');
assert.equal(payload.website_url, 'https://example.com');
assert.deepEqual(payload.service_ids, ['service-1']);
assert.deepEqual(payload.region_ids, ['region-1']);
assert.deepEqual(payload.legal_document_keys, ['documents/document.pdf']);
assert.deepEqual(payload.portfolio_photo_keys, ['portfolio/work.jpg']);

assert.equal(
  getExecutorProfileModerationResult({ moderation_status: 'PENDING' }),
  'success',
  'PENDING backend status should confirm moderation submission',
);
assert.equal(
  getExecutorProfileModerationResult({ moderationStatus: 'PENDING' }),
  'success',
  'camelCase PENDING backend status should also confirm moderation submission',
);
assert.equal(
  getExecutorProfileModerationResult({ moderation_status: 'APPROVED' }),
  'failure',
  'APPROVED status means edit was not sent to moderation',
);
assert.equal(
  getExecutorProfileModerationResult(null),
  'failure',
  'empty backend response should not be shown as successful moderation',
);

console.log('executor profile moderation payload passed');
