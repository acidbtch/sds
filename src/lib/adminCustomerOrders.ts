import { Order } from '../types';

type CustomerOrderOwner = {
  id?: string | number | null;
  userId?: string | number | null;
  telegramId?: string | number | null;
  tgId?: string | number | null;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
};

type CustomerContactRow = {
  label: string;
  value: string;
};

function normalize(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim().toLowerCase();
}

function displayValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function uniqueValues(values: unknown[]) {
  return Array.from(new Set(values.map(normalize).filter(Boolean)));
}

function intersects(left: string[], right: string[]) {
  return left.some(value => right.includes(value));
}

export function getOrdersForCustomer(orders: Order[], customer: CustomerOrderOwner) {
  const customerUserIds = uniqueValues([customer.id, customer.userId]);
  const customerTelegramIds = uniqueValues([customer.telegramId, customer.tgId]);
  const customerUsernames = uniqueValues([customer.username]);
  const customerPhones = uniqueValues([customer.phone]);
  const customerNames = uniqueValues([customer.name]);

  return orders.filter(order => {
    const orderUserIds = uniqueValues([order.customerId, order.customerUserId]);
    const orderTelegramIds = uniqueValues([order.customerTelegramId]);
    const orderUsernames = uniqueValues([order.customerUsername]);

    if (intersects(customerUserIds, orderUserIds)) return true;
    if (intersects(customerTelegramIds, orderTelegramIds)) return true;
    if (intersects(customerUsernames, orderUsernames)) return true;

    const orderPhones = uniqueValues([order.phone]);
    if (customerPhones.length > 0 && intersects(customerPhones, orderPhones)) return true;

    const orderNames = uniqueValues([order.customerName]);
    return customerNames.length > 0 && intersects(customerNames, orderNames);
  });
}

function orderTimestamp(order: Order) {
  const timestamp = Date.parse(order.createdAt || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getCustomerDisplayContact(orders: Order[], customer: CustomerOrderOwner) {
  const latestOrder = [...getOrdersForCustomer(orders, customer)]
    .sort((left, right) => orderTimestamp(right) - orderTimestamp(left))[0];

  return {
    name: displayValue(latestOrder?.customerName) || displayValue(customer.name),
    phone: displayValue(latestOrder?.phone) || displayValue(customer.phone),
  };
}

export function getCustomerContactRows(customer: CustomerOrderOwner): CustomerContactRow[] {
  return [
    { label: 'Telegram ID', value: displayValue(customer.telegramId || customer.tgId || customer.username) },
    { label: 'Телефон', value: displayValue(customer.phone) },
  ].filter(row => row.value);
}
