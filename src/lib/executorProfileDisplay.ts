function firstObject(...values: unknown[]) {
  return values.find((value) => Boolean(value && typeof value === 'object' && !Array.isArray(value))) as Record<string, any> | undefined;
}

function hasObjectValue(value: unknown) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0);
}

export function getExecutorDisplayProfile(executor: any, options: { preferPending?: boolean } = {}) {
  const currentProfile = firstObject(
    executor?.current_profile,
    executor?.currentProfile,
    executor?.executor_profile,
    executor?.executorProfile,
  );
  const pendingChanges = firstObject(executor?.pending_changes, executor?.pendingChanges);

  if (options.preferPending && hasObjectValue(pendingChanges)) {
    return { ...(currentProfile || {}), ...pendingChanges };
  }

  return currentProfile || executor || {};
}

export function getExecutorMediaUrl(value: unknown) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  return String(record.url || record.public_url || record.publicUrl || record.href || record.src || '');
}
