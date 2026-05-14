export type ExecutorModerationStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'UNKNOWN';

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

export function getExecutorModerationStatus(executor: any): ExecutorModerationStatus {
  const rawStatus = String(firstValue(
    executor?.moderation_status,
    executor?.moderationStatus,
    executor?.executor_profile?.moderation_status,
    executor?.executorProfile?.moderationStatus,
    executor?.status,
  ) || '').trim().toUpperCase();

  if (rawStatus === 'APPROVED') return 'APPROVED';
  if (rawStatus === 'PENDING' || rawStatus === 'MODERATION') return 'PENDING';
  if (rawStatus === 'REJECTED' || rawStatus === 'DECLINED') return 'REJECTED';
  return 'UNKNOWN';
}

export function isExecutorApproved(executor: any) {
  return getExecutorModerationStatus(executor) === 'APPROVED';
}

export function filterApprovedExecutors<T>(executors: T[]) {
  return executors.filter((executor) => isExecutorApproved(executor));
}
