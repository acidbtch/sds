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
  if (shouldAttemptTelegramLogin(initData, accessToken)) return 'login';
  if (initData) return 'login';
  if (accessToken) return 'refresh';
  return 'anonymous';
}

export function getAuthExpiredRecoveryAction(initData: string | undefined): AuthExpiredRecoveryAction {
  return initData ? 'telegram-login' : 'clear-session';
}
