import { Order } from '../types';

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
  return {
    id: o.id,
    serviceType: o.service_name || o.service_id || 'Услуга',
    carMake: o.car_brand_name || o.car_brand_id || '',
    carModel: o.car_model_name || o.car_model_id || '',
    year: o.year?.toString() || '',
    region: o.region_name || o.region_id || '',
    customerName: o.owner_name || '',
    date: o.created_at ? new Date(o.created_at).toLocaleDateString('ru-RU') : '',
    deadline: o.deadline ? new Date(o.deadline).toLocaleDateString('ru-RU') : '',
    status: (
      o.status === 'SEARCHING'
        ? 'pending'
        : o.status === 'MATCHED'
          ? 'active'
          : o.status === 'COMPLETED'
            ? 'completed'
            : 'cancelled'
    ) as Order['status'],
    description: o.description || '',
    responses: [],
    responsesCount: typeof o.responses_count === 'number' ? o.responses_count : 0,
    engine: o.engine_type,
    gearbox: o.gearbox_type,
    drive: o.drive_type,
    body: o.body_type,
    phone: o.owner_phone,
    media: o.photos || [],
  };
}
