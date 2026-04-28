import assert from 'node:assert/strict';
import {
  canManageCustomerAdminRole,
  getCustomerContactRows,
  getCustomerDisplayContact,
  getNextCustomerAdminRole,
  getOrdersForCustomer,
  mapAdminCustomerFromApi,
} from './adminCustomerOrders';
import { mapOrderFromApi } from './orderMapping';

const customer = {
  id: 'user-1',
  userId: 'user-1',
  telegramId: '1783624604',
  tgId: '1783624604',
  name: 'Alex Customer',
  phone: '+375291111111',
};

const orderByUserId = mapOrderFromApi({
  id: 'order-user',
  customer_user_id: 'user-1',
  service_name: 'Engine repair',
  status: 'NEW',
});

const orderByTelegramId = mapOrderFromApi({
  id: 'order-telegram',
  customer_telegram_id: '1783624604',
  service_name: 'Brake service',
  status: 'NEW',
});

const orderByPhoneFallback = mapOrderFromApi({
  id: 'order-phone',
  owner_phone: '+375291111111',
  service_name: 'Oil change',
  status: 'NEW',
});

const olderContactOrder = mapOrderFromApi({
  id: 'order-old-contact',
  customer_user_id: 'user-1',
  owner_name: 'Old Name',
  owner_phone: '+375291111111',
  created_at: '2026-04-27T10:00:00.000Z',
  service_name: 'Old contact',
  status: 'NEW',
});

const newerContactOrder = mapOrderFromApi({
  id: 'order-new-contact',
  customer_user_id: 'user-1',
  owner_name: 'New Name',
  owner_phone: '+375292222222',
  created_at: '2026-04-28T10:00:00.000Z',
  service_name: 'New contact',
  status: 'NEW',
});

const unrelatedOrder = mapOrderFromApi({
  id: 'order-other',
  customer_user_id: 'user-2',
  owner_phone: '+375292222222',
  service_name: 'Other service',
  status: 'NEW',
});

assert.equal(orderByUserId.customerUserId, 'user-1');
assert.equal(orderByTelegramId.customerTelegramId, '1783624604');

assert.deepEqual(
  getOrdersForCustomer([orderByUserId, orderByTelegramId, orderByPhoneFallback, unrelatedOrder], customer).map(order => order.id),
  ['order-user', 'order-telegram', 'order-phone'],
  'customer order history should use backend ids and then safe phone fallback',
);

assert.deepEqual(
  getCustomerDisplayContact([olderContactOrder, newerContactOrder], customer),
  { name: 'New Name', phone: '+375292222222' },
  'customer contact should use the newest order owner values when the customer changed them in the order',
);

assert.deepEqual(
  getCustomerContactRows({ telegramId: '1783624604', phone: '+375292222222' }),
  [
    { label: 'Telegram ID', value: '1783624604' },
    { label: 'Телефон', value: '+375292222222' },
  ],
  'customer card should render Telegram ID and phone as separate rows without a dot separator',
);

assert.deepEqual(
  getCustomerContactRows({ telegramId: '', phone: '+375292222222' }),
  [{ label: 'Телефон', value: '+375292222222' }],
  'empty contact values should be hidden',
);

const adminCustomerOrders = [
  mapOrderFromApi({
    id: 'linked-order-old-phone',
    customer_user_id: 'artem-user',
    owner_name: 'Артем',
    owner_phone: '+375291912105',
    created_at: '2026-04-27T10:00:00.000Z',
    service_name: 'Linked order',
    status: 'NEW',
  }),
  ...[1, 2, 3, 4].map(index => mapOrderFromApi({
    id: `phone-order-${index}`,
    owner_name: 'Артем',
    owner_phone: '+375291912105',
    created_at: `2026-04-28T1${index}:00:00.000Z`,
    service_name: `Phone order ${index}`,
    status: 'NEW',
  })),
];

const mappedAdminCustomer = mapAdminCustomerFromApi({
  id: 'artem-user',
  role: 'CUSTOMER',
  first_name: 'Артем',
  telegram_id: '8264937938',
  profile: { phone: '+375291000000' },
  created_at: '2026-04-13T10:00:00.000Z',
}, adminCustomerOrders);

assert.equal(
  mappedAdminCustomer.phone,
  '+375291912105',
  'admin customer should display the phone from the newest matching order',
);

assert.equal(
  mappedAdminCustomer.orders,
  5,
  'admin customer list count should be calculated after applying the displayed phone',
);

assert.equal(
  mappedAdminCustomer.role,
  'CUSTOMER',
  'admin customer should keep the backend user role',
);

assert.equal(
  mappedAdminCustomer.previousRole,
  'CUSTOMER',
  'a regular customer should remember CUSTOMER as the role to restore',
);

assert.equal(
  getNextCustomerAdminRole(mappedAdminCustomer),
  'ADMIN',
  'a regular customer should be promoted to ADMIN on first click',
);

assert.equal(
  getNextCustomerAdminRole({ ...mappedAdminCustomer, role: 'ADMIN', previousRole: 'CUSTOMER' }),
  'CUSTOMER',
  'an admin promoted from customer should be restored to CUSTOMER on second click',
);

assert.equal(
  canManageCustomerAdminRole({ id: 'artem-user', username: 'artem' }, mappedAdminCustomer),
  false,
  'an admin should not be allowed to change their own admin role',
);

assert.equal(
  canManageCustomerAdminRole({ id: 'another-admin', username: 'boss' }, mappedAdminCustomer),
  true,
  'an admin should be allowed to change another user admin role',
);

console.log('admin customer orders helpers passed');
