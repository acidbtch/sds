export function shouldAttemptTelegramLogin(initData: string | undefined, accessToken: string | null) {
  return Boolean(initData && !accessToken);
}

export type TelegramStartupAuthAction = 'refresh' | 'login' | 'anonymous';

export function getTelegramStartupAuthAction({
  initData,
  accessToken,
}: {
  initData: string | undefined;
  accessToken: string | null;
}): TelegramStartupAuthAction {
  if (accessToken) return 'refresh';
  if (shouldAttemptTelegramLogin(initData, accessToken)) return 'login';
  return 'anonymous';
}
