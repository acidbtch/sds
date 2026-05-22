import { Order } from '../types';
import { isAdminRole, normalizeUserRole, type UserRole } from './authUser';

type CustomerOrderOwner = {
  id?: string | number | null;
  userId?: string | number | null;
  telegramId?: string | number | null;
  tgId?: string | number | null;
  telegramNickname?: string | null;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
};

type CurrentAdminUser = {
  id?: string | number | null;
  username?: string | null;
};

type CustomerContactRow = {
  label: string;
  value: string;
};

type AdminUserRole = UserRole;
type AdminCustomerStatus = 'active' | 'blocked';

export type AdminCustomer = CustomerOrderOwner & {
  id: string;
  userId: string;
  name: string;
  phone: string;
  tgId: string;
  telegramId: string;
  telegramNickname: string;
  username: string;
  regDate: string;
  orders: number;
  status: AdminCustomerStatus;
  role: AdminUserRole;
  previousRole: AdminUserRole;
};

function normalize(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim().toLowerCase();
}

function displayValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function formatTelegramNickname(value: unknown) {
  const nickname = displayValue(value).replace(/^@/, '');
  if (!nickname || /^\d+$/.test(nickname)) return '';
  return nickname;
}

function formatTelegramContact(value: unknown, isOfficialUsername = false) {
  const nickname = formatTelegramNickname(value);
  if (!nickname) return '';
  return isOfficialUsername ? `@${nickname}` : nickname;
}

function normalizeRole(value: unknown): AdminUserRole | '' {
  return normalizeUserRole(value);
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

function shortOrderId(id: unknown) {
  const value = displayValue(id);
  if (!value) return '';
  return value.length > 8 ? value.slice(0, 8) : value;
}

export function getAdminCustomerOrderSummary(order: Pick<Order, 'id' | 'displayNumber' | 'orderNumber' | 'publicId' | 'serviceType' | 'carMake' | 'carModel' | 'year' | 'description' | 'date'>) {
  const displayId = displayValue(order.displayNumber || order.orderNumber || order.publicId) || shortOrderId(order.id);
  const title = displayValue(order.serviceType) || `Заказ #${displayId}`;
  const car = [order.carMake, order.carModel]
    .map(displayValue)
    .filter(Boolean)
    .join(' ');
  const carWithYear = car && order.year ? `${car} (${order.year})` : car;
  const id = displayId;
  const meta = [
    id ? `№ ${id}` : '',
    displayValue(order.date),
  ].filter(Boolean).join(' · ');

  return {
    title,
    car: carWithYear,
    description: displayValue(order.description),
    meta,
  };
}

function orderTimestamp(order: Order) {
  const timestamp = Date.parse(order.createdAt || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getCustomerDisplayContact(orders: Order[], customer: CustomerOrderOwner) {
  const latestOrder = [...getOrdersForCustomer(orders, customer)]
    .sort((left, right) => orderTimestamp(right) - orderTimestamp(left))[0];
  const telegramNickname = displayValue(customer.telegramNickname);

  return {
    name: displayValue(latestOrder?.customerName) || displayValue(customer.name),
    phone: displayValue(latestOrder?.phone) || displayValue(customer.phone),
    username: displayValue(latestOrder?.customerUsername) || displayValue(customer.username),
    ...(telegramNickname ? { telegramNickname } : {}),
  };
}

export function getCustomerContactRows(customer: CustomerOrderOwner): CustomerContactRow[] {
  const officialUsername = formatTelegramContact(customer.username, true);
  const telegramNickname = officialUsername || formatTelegramContact(customer.telegramNickname);

  return [
    { label: 'Telegram', value: telegramNickname },
    { label: 'Телефон', value: displayValue(customer.phone) },
  ].filter(row => row.value);
}

export function getNextCustomerAdminRole(customer: Pick<AdminCustomer, 'role' | 'previousRole'>): AdminUserRole {
  return isAdminRole(customer.role) ? customer.previousRole || 'CUSTOMER' : 'ADMIN';
}

export function canManageCustomerAdminRole(currentUser: CurrentAdminUser | null | undefined, customer: CustomerOrderOwner): boolean {
  if (!currentUser) return true;

  const currentUserIds = uniqueValues([currentUser.id]);
  const customerUserIds = uniqueValues([customer.id, customer.userId]);
  if (currentUserIds.length > 0 && intersects(currentUserIds, customerUserIds)) return false;

  const currentUsernames = uniqueValues([currentUser.username]);
  const customerUsernames = uniqueValues([customer.username]);
  return !(currentUsernames.length > 0 && intersects(currentUsernames, customerUsernames));
}

export function canManageCustomerBlockStatus(currentUser: CurrentAdminUser | null | undefined, customer: CustomerOrderOwner): boolean {
  return canManageCustomerAdminRole(currentUser, customer);
}

export function getCustomerStateBadge(customer: Pick<AdminCustomer, 'role' | 'status'>) {
  if (customer.status === 'blocked') {
    return { label: 'Заблокирован', className: 'bg-red-100 text-red-700' };
  }

  if (isAdminRole(customer.role)) {
    return { label: customer.role === 'SUPERADMIN' ? 'Суперадмин' : 'Админ', className: 'bg-blue-100 text-blue-700' };
  }

  return { label: 'Активен', className: 'bg-green-100 text-green-700' };
}

export function getCustomerStateDotClass(customer: Pick<AdminCustomer, 'role' | 'status'>) {
  if (customer.status === 'blocked') return 'bg-red-500';
  if (isAdminRole(customer.role)) return 'bg-blue-500';
  return 'bg-green-500';
}

export function mapAdminCustomerFromApi(user: any, orders: Order[]): AdminCustomer {
  const userId = displayValue(user.id ?? user.user_id);
  const role = normalizeRole(user.role) || 'CUSTOMER';
  const previousRole =
    normalizeRole(user.previous_role) ||
    normalizeRole(user.previousRole) ||
    normalizeRole(user.role_before_admin) ||
    normalizeRole(user.roleBeforeAdmin) ||
    (isAdminRole(role) ? 'CUSTOMER' : role);
  const telegramId = displayValue(
    user.telegram_id ??
    user.telegramId ??
    user.telegram_user_id ??
    user.telegramUserId ??
    user.tg_id ??
    user.tgId ??
    user.profile?.telegram_id ??
    user.telegram?.id
  );
  const username = displayValue(
    user.username ??
    user.telegram_username ??
    user.telegramUsername ??
    user.tg_username ??
    user.tgUsername ??
    user.profile?.username ??
    user.telegram?.username
  );
  const telegramFullName = `${displayValue(user.first_name)} ${displayValue(user.last_name)}`.trim();
  const telegramNickname = displayValue(
    telegramFullName ||
    displayValue(user.display_name) ||
    displayValue(user.displayName) ||
    displayValue(user.telegram_name) ||
    displayValue(user.telegramName) ||
    displayValue(user.profile?.display_name) ||
    displayValue(user.telegram?.first_name) ||
    displayValue(user.telegram?.name) ||
    username
  );

  const baseCustomer: AdminCustomer = {
    id: userId,
    userId,
    name: `${displayValue(user.first_name)} ${displayValue(user.last_name)}`.trim() || username,
    phone: displayValue(user.profile?.phone),
    tgId: telegramId || username,
    telegramId,
    telegramNickname,
    username,
    regDate: user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '',
    orders: 0,
    status: user.is_blocked ? 'blocked' : 'active',
    role,
    previousRole,
  };

  const displayContact = getCustomerDisplayContact(orders, baseCustomer);
  const displayCustomer = {
    ...baseCustomer,
    name: displayContact.name || baseCustomer.name,
    phone: displayContact.phone || baseCustomer.phone,
    username: displayContact.username || baseCustomer.username,
    telegramNickname: displayContact.telegramNickname || baseCustomer.telegramNickname,
  };

  return {
    ...displayCustomer,
    orders: getOrdersForCustomer(orders, displayCustomer).length,
  };
}
