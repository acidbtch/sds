import assert from 'node:assert/strict';
import {
  BANNER_ROTATION_INTERVAL_MS,
  getNextBannerIndex,
  getVisibleBannerIndex,
} from './bannerRotation';

assert.equal(
  BANNER_ROTATION_INTERVAL_MS,
  5 * 60 * 1000,
  'leader banners should rotate about once every five minutes',
);

assert.equal(
  getNextBannerIndex(0, 3),
  1,
  'banner rotation should advance to the next banner',
);

assert.equal(
  getNextBannerIndex(2, 3),
  0,
  'banner rotation should wrap after the last banner',
);

assert.equal(
  getNextBannerIndex(4, 0),
  0,
  'banner rotation should stay safe when there are no banners',
);

assert.equal(
  getVisibleBannerIndex(4, 2),
  0,
  'visible banner index should reset when the current index is outside the new banner list',
);

console.log('banner rotation helpers passed');
