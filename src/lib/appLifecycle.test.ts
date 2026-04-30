import assert from 'node:assert/strict';
import {
  APP_LONG_BACKGROUND_MS,
  APP_RESUME_REFRESH_THROTTLE_MS,
  shouldRefreshAfterAppResume,
} from './appLifecycle';

assert.equal(
  shouldRefreshAfterAppResume({
    now: 10_000,
    hiddenAt: null,
    lastRefreshAt: 9_000,
  }),
  false,
  'quick repeated focus events should not trigger extra refreshes',
);

assert.equal(
  shouldRefreshAfterAppResume({
    now: APP_RESUME_REFRESH_THROTTLE_MS + 1,
    hiddenAt: null,
    lastRefreshAt: 0,
  }),
  true,
  'stale visible sessions should refresh after the throttle window',
);

assert.equal(
  shouldRefreshAfterAppResume({
    now: 5_000 + APP_LONG_BACKGROUND_MS + 1,
    hiddenAt: 5_000,
    lastRefreshAt: 5_000 + APP_LONG_BACKGROUND_MS,
  }),
  true,
  'returning after a long hidden period should refresh even if recently refreshed',
);

console.log('app lifecycle helpers passed');
