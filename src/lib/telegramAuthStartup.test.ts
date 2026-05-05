import assert from 'node:assert/strict';
import { shouldAttemptTelegramLogin } from './telegramAuthStartup';

assert.equal(shouldAttemptTelegramLogin('', null), false);
assert.equal(shouldAttemptTelegramLogin(undefined, null), false);
assert.equal(shouldAttemptTelegramLogin('telegram-init-data', null), true);
assert.equal(shouldAttemptTelegramLogin('telegram-init-data', ''), true);
assert.equal(shouldAttemptTelegramLogin('telegram-init-data', 'stored-token'), false);

console.log('telegram auth startup helpers passed');
