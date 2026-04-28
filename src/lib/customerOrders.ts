import { Order } from '../types';
import { mapOrderFromApi } from './orderMapping';

type CustomerOrderUser = {
  id?: string | number | null;
  customer_profile?: {
    id?: string | number | null;
    user_id?: string | number | null;
  } | null;
} | null | undefined;

const toKey = (value: unknown) =>
  value === null || value === undefined || value === '' ? null : String(value);

const getCurrentUserKeys = (user: CustomerOrderUser) =>
  new Set(
    [
      toKey(user?.id),
      toKey(user?.customer_profile?.id),
      toKey(user?.customer_profile?.user_id),
    ].filter((value): value is string => Boolean(value))
  );

const getOrderOwnerKeys = (order: any) =>
  [
    toKey(order.customer_id),
    toKey(order.customerId),
    toKey(order.customer_profile_id),
    toKey(order.customerProfileId),
    toKey(order.owner_id),
    toKey(order.ownerId),
    toKey(order.user_id),
    toKey(order.userId),
    toKey(order.created_by),
    toKey(order.createdBy),
  ].filter((value): value is string => Boolean(value));

export function isOrderOwnedByCurrentCustomer(order: any, user: CustomerOrderUser) {
  const ownerKeys = getOrderOwnerKeys(order);

  if (ownerKeys.length === 0) {
    return true;
  }

  const currentUserKeys = getCurrentUserKeys(user);

  if (currentUserKeys.size === 0) {
    return false;
  }

  return ownerKeys.some((key) => currentUserKeys.has(key));
}

export function filterCustomerOrdersForUser<T>(orders: T[], user: CustomerOrderUser) {
  return orders.filter((order) => isOrderOwnedByCurrentCustomer(order, user));
}

export function mapCustomerOrderFromApi(o: any): Order {
  return mapOrderFromApi(o);
}
