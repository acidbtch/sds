export function shouldAttemptTelegramLogin(initData: string | undefined, accessToken: string | null) {
  return Boolean(initData && !accessToken);
}
