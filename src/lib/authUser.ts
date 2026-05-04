export type UserRole = 'CUSTOMER' | 'EXECUTOR' | 'ADMIN';

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

export function mapUserProfileFromApi<T extends Record<string, any>>(userData: T): T & { isBlocked: boolean } {
  return {
    ...userData,
    isBlocked: userData.is_blocked === true || userData.isBlocked === true || isBlockedStatus(userData.status),
  };
}
