import assert from 'node:assert/strict';
import { mapOrderFromApi } from './orderMapping';

const orderWithNestedNames = mapOrderFromApi({
  id: 'order-1',
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
  description: 'Test order',
  responses_count: 1,
});

assert.equal(orderWithNestedNames.serviceType, 'Ремонт двигателя, Ремонт турбины');
assert.equal(orderWithNestedNames.carMake, 'Abarth');
assert.equal(orderWithNestedNames.carModel, '124 Spider');
assert.equal(orderWithNestedNames.region, 'Белоозёрск');
assert.equal(orderWithNestedNames.status, 'active');
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

console.log('order mapping passed');
