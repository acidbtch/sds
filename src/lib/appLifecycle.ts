export const APP_RESUME_REFRESH_THROTTLE_MS = 15 * 1000;
export const APP_LONG_BACKGROUND_MS = 5 * 60 * 1000;
export const APP_IDLE_SESSION_MS = 10 * 60 * 1000;

interface AppResumeState {
  now: number;
  hiddenAt: number | null;
  lastRefreshAt: number;
}

export function isLongAppPause(now: number, hiddenAt: number | null) {
  return hiddenAt !== null && now - hiddenAt >= APP_LONG_BACKGROUND_MS;
}

export function shouldRefreshAfterAppResume({ now, hiddenAt, lastRefreshAt }: AppResumeState) {
  if (isLongAppPause(now, hiddenAt)) return true;
  return now - lastRefreshAt >= APP_RESUME_REFRESH_THROTTLE_MS;
}
