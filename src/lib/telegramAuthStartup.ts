export function shouldAttemptTelegramLogin(initData: string | undefined, accessToken: string | null) {
  return Boolean(initData && !accessToken);
}

export type TelegramStartupAuthAction = 'refresh' | 'login' | 'anonymous';
export type AuthExpiredRecoveryAction = 'telegram-login' | 'clear-session';

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

export function getAuthExpiredRecoveryAction(initData: string | undefined): AuthExpiredRecoveryAction {
  return initData ? 'telegram-login' : 'clear-session';
}
