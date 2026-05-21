export type UserRole = 'CUSTOMER' | 'EXECUTOR' | 'ADMIN' | 'SUPERADMIN';

export interface UserProfile {
  id: string;
  username?: string;
  role: UserRole;
  customer_profile?: any | null;
  executor_profile?: any | null;
  isBlocked: boolean;
}

function isBlockedStatus(value: unknown) {
  return String(value || '').toLowerCase() === 'blocked';
}

export function normalizeUserRole(value: unknown): UserRole | '' {
  const role = String(value || '').trim().toUpperCase().replace(/[\s-]/g, '_');

  if (role === 'SUPERADMIN' || role === 'SUPER_ADMIN') return 'SUPERADMIN';
  if (role === 'ADMIN' || role === 'EXECUTOR' || role === 'CUSTOMER') return role;
  return '';
}

export function isAdminRole(value: unknown) {
  const role = normalizeUserRole(value);
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function mapUserProfileFromApi<T extends Record<string, any>>(userData: T): T & { isBlocked: boolean } {
  const role = normalizeUserRole(userData.role);

  return {
    ...userData,
    ...(role ? { role } : {}),
    isBlocked: userData.is_blocked === true || userData.isBlocked === true || isBlockedStatus(userData.status),
  };
}
