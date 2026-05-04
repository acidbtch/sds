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
