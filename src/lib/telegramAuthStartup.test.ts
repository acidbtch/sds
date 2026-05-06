import assert from 'node:assert/strict';
import { getTelegramStartupAuthAction, shouldAttemptTelegramLogin } from './telegramAuthStartup';

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
  'refresh',
  'Stored tokens should be refreshed before showing the app',
);
assert.equal(
  getTelegramStartupAuthAction({ initData: '', accessToken: null }),
  'anonymous',
  'Browser startup without Telegram initData can continue anonymously',
);

console.log('telegram auth startup helpers passed');
