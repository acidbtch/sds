export const BANNER_ROTATION_INTERVAL_MS = 5 * 60 * 1000;

export function getNextBannerIndex(currentIndex: number, bannersCount: number) {
  if (bannersCount <= 0) return 0;
  return (currentIndex + 1) % bannersCount;
}

export function getVisibleBannerIndex(currentIndex: number, bannersCount: number) {
  if (bannersCount <= 0) return 0;
  return currentIndex >= 0 && currentIndex < bannersCount ? currentIndex : 0;
}
