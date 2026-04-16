import { strict as assert } from 'node:assert';
import {
  filterCustomerOrdersForUser,
  mapCustomerOrderFromApi,
} from './customerOrders';

const currentUser = {
  id: 'user-1',
  customer_profile: { id: 'customer-1' },
};

const ownByCustomerId = {
  id: 'own-by-customer',
  customer_id: 'customer-1',
  service_name: 'Engine repair',
  status: 'SEARCHING',
  created_at: '2026-04-16T10:00:00.000Z',
};

const ownByUserId = {
  id: 'own-by-user',
  user_id: 'user-1',
  service_name: 'Diagnostics',
  status: 'MATCHED',
  created_at: '2026-04-16T11:00:00.000Z',
};

const otherCustomerOrder = {
  id: 'other-customer',
  customer_id: 'customer-2',
  user_id: 'user-2',
  service_name: ' чужой заказ ',
  status: 'SEARCHING',
  created_at: '2026-04-16T12:00:00.000Z',
};

const orders = filterCustomerOrdersForUser(
  [ownByCustomerId, ownByUserId, otherCustomerOrder],
  currentUser
).map(mapCustomerOrderFromApi);

assert.deepEqual(
  orders.map((order) => order.id),
  ['own-by-customer', 'own-by-user']
);

assert.equal(orders[0].status, 'pending');
assert.equal(orders[1].status, 'active');

console.log('customer order ownership filtering passed');
