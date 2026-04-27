export const API_URL_MISSING_MESSAGE =
  'VITE_API_URL is not configured. Set it in your environment before using the app.';

export function normalizeApiUrl(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
}

export function resolveApiUrl(value: string | null | undefined) {
  return normalizeApiUrl(value);
}
