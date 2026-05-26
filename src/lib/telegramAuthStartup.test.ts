import assert from 'node:assert/strict';
import {
  getAuthExpiredRecoveryAction,
  getTelegramStartupAuthAction,
  shouldAttemptTelegramLogin,
} from './telegramAuthStartup';

assert.equal(shouldAttemptTelegramLogin('', null), false);
assert.equal(shouldAttemptTelegramLogin(undefined, null), false);
assert.equal(shouldAttemptTelegramLogin('telegram-init-data', null), true);
assert.equal(shouldAttemptTelegramLogin('telegram-init-data', ''), true);
assert.equal(shouldAttemptTelegramLogin('telegram-init-data', 'stored-token'), false);

assert.equal(
  getTelegramStartupAuthAction({ initData: 'telegram-init-data', accessToken: null }),
  'login',
  'Telegram startup with initData and no stored token should login before showing the app',
);
assert.equal(
  getTelegramStartupAuthAction({ initData: 'telegram-init-data', accessToken: 'stored-token' }),
  'login',
  'Telegram startup with initData should prefer a fresh Telegram login over a stored token',
);
assert.equal(
  getTelegramStartupAuthAction({ initData: '', accessToken: null }),
  'anonymous',
  'Browser startup without Telegram initData can continue anonymously',
);

assert.equal(
  getAuthExpiredRecoveryAction('telegram-init-data'),
  'telegram-login',
  'expired auth inside Telegram should recover through Telegram login instead of clearing the user',
);
assert.equal(
  getAuthExpiredRecoveryAction(''),
  'clear-session',
  'expired auth without Telegram initData should clear the session',
);
assert.equal(
  getAuthExpiredRecoveryAction(undefined),
  'clear-session',
  'missing Telegram initData cannot recover an expired session',
);

console.log('telegram auth startup helpers passed');
