export interface AdminRefreshError {
  key: string;
  label: string;
  message: string;
  status?: number;
  isAuthError: boolean;
  isTimeout: boolean;
}

function getReasonMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message;

  if (reason && typeof reason === 'object') {
    const record = reason as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.detail === 'string') return record.detail;
  }

  return String(reason || 'Unknown error');
}

function getReasonStatus(reason: unknown) {
  if (!reason || typeof reason !== 'object') return undefined;

  const status = (reason as Record<string, unknown>).status;
  return typeof status === 'number' ? status : undefined;
}

function getReasonName(reason: unknown) {
  if (reason instanceof Error) return reason.name;

  if (reason && typeof reason === 'object') {
    const name = (reason as Record<string, unknown>).name;
    return typeof name === 'string' ? name : '';
  }

  return '';
}

export function createAdminRefreshError(
  reason: unknown,
  label: string,
  key = label,
): AdminRefreshError {
  const status = getReasonStatus(reason);
  const name = getReasonName(reason);

  return {
    key,
    label,
    message: getReasonMessage(reason),
    status,
    isAuthError: status === 401 || status === 403,
    isTimeout: name === 'ApiTimeoutError' || /timed out|timeout/i.test(getReasonMessage(reason)),
  };
}

export function getRejectedAdminRefreshError<T>(
  result: PromiseSettledResult<T>,
  label: string,
  key = label,
): AdminRefreshError | null {
  if (result.status === 'fulfilled') return null;

  return createAdminRefreshError(result.reason, label, key);
}

export function getFulfilledAdminData<T>(
  result: PromiseSettledResult<T>,
  label: string,
  logError: (...args: unknown[]) => void = console.error,
): T | undefined {
  if (result.status === 'fulfilled') {
    return result.value;
  }

  logError(`Failed to refresh admin ${label}:`, result.reason);
  return undefined;
}
