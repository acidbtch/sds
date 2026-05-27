import assert from 'node:assert/strict';
import { mapOrderFromApi } from './orderMapping';

const orderWithNestedNames = mapOrderFromApi({
  id: 'order-1',
  public_id: 'ORD-12345',
  order_number: '12345',
  services: [
    { id: 'svc-1', name: 'Ремонт двигателя' },
    { id: 'svc-2', name: 'Ремонт турбины' },
  ],
  car_brand: { id: 'brand-1', name: 'Abarth' },
  car_model: { id: 'model-1', name: '124 Spider' },
  region: { id: 'region-1', name: 'Белоозёрск' },
  year: 2025,
  created_at: '2026-04-28T00:00:00.000Z',
  deadline: '2026-04-29T00:00:00.000Z',
  status: 'MATCHED',
  owner_name: '1111',
  owner_phone: '+375555555555',
  customer_name: 'Ivan',
  customer_phone: '+375291234567',
  customer_telegram_username: 'ivanov',
  description: 'Test order',
  responses_count: 1,
});

assert.equal(orderWithNestedNames.serviceType, 'Ремонт двигателя, Ремонт турбины');
assert.equal(orderWithNestedNames.publicId, 'ORD-12345');
assert.equal(orderWithNestedNames.orderNumber, '12345');
assert.equal(orderWithNestedNames.displayNumber, '12345');
assert.equal(orderWithNestedNames.carMake, 'Abarth');
assert.equal(orderWithNestedNames.carModel, '124 Spider');
assert.equal(orderWithNestedNames.region, 'Белоозёрск');
assert.equal(orderWithNestedNames.status, 'active');
assert.equal(orderWithNestedNames.phone, '+375291234567');
assert.equal(orderWithNestedNames.customerName, 'Ivan');
assert.equal(orderWithNestedNames.customerUsername, 'ivanov');
assert.equal(orderWithNestedNames.responsesCount, 1);

const orderWithOnlyRawIds = mapOrderFromApi({
  id: 'order-2',
  service_id: '2bc1bfd0-3405-4941-923f-b6ff2a3b2ae9',
  car_brand_id: '8b68d375-c139-4777-b1aa-a0bc49e5b18b',
  car_model_id: 'd7f2e9b8-6546-40a1-a2a6-0cd3820707de',
  region_id: '11605143-22bf-4d32-91e1-dbd7487e3f70',
  created_at: '2026-04-28T00:00:00.000Z',
  status: 'SEARCHING',
});

assert.equal(orderWithOnlyRawIds.serviceType, 'Услуга');
assert.equal(orderWithOnlyRawIds.carMake, '');
assert.equal(orderWithOnlyRawIds.carModel, '');
assert.equal(orderWithOnlyRawIds.region, '');

const orderWithResolvedMedia = mapOrderFromApi({
  id: 'order-3',
  photos: ['https://cdn.example.com/orders/photo-1.jpg'],
  video: 'https://cdn.example.com/orders/video-1.mp4',
  attachments: ['raw-storage-key-that-should-not-win'],
  created_at: '2026-04-28T00:00:00.000Z',
  status: 'SEARCHING',
});

assert.deepEqual(orderWithResolvedMedia.media, [
  'https://cdn.example.com/orders/photo-1.jpg',
  'https://cdn.example.com/orders/video-1.mp4',
]);

const orderWithOnlyVideo = mapOrderFromApi({
  id: 'order-4',
  photos: [],
  video: 'https://cdn.example.com/orders/video-only.mp4',
  created_at: '2026-04-28T00:00:00.000Z',
  status: 'SEARCHING',
});

assert.deepEqual(orderWithOnlyVideo.media, [
  'https://cdn.example.com/orders/video-only.mp4',
]);

const orderWithRawAttachmentFallback = mapOrderFromApi({
  id: 'order-5',
  attachments: ['raw-storage-key'],
  created_at: '2026-04-28T00:00:00.000Z',
  status: 'SEARCHING',
});

assert.deepEqual(orderWithRawAttachmentFallback.media, ['raw-storage-key']);

const orderWithResolvedMediaPreferred = mapOrderFromApi({
  id: 'order-6',
  photos: ['raw-photo-key'],
  media: [{ key: 'raw-photo-key', url: 'https://cdn.example.com/orders/resolved-photo.jpg' }],
  created_at: '2026-04-28T00:00:00.000Z',
  status: 'SEARCHING',
});

assert.deepEqual(orderWithResolvedMediaPreferred.media, [
  { key: 'raw-photo-key', url: 'https://cdn.example.com/orders/resolved-photo.jpg' },
]);

console.log('order mapping passed');
