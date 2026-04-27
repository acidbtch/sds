import { strict as assert } from 'node:assert';
import { API_URL_MISSING_MESSAGE, resolveApiUrl } from './apiConfig';

assert.equal(resolveApiUrl(' https://example.com/api/v1/ '), 'https://example.com/api/v1');
assert.equal(resolveApiUrl(''), '');
assert.equal(resolveApiUrl(undefined), '');
assert.equal(
  API_URL_MISSING_MESSAGE,
  'VITE_API_URL is not configured. Set it in your environment before using the app.'
);

console.log('api config passed');
