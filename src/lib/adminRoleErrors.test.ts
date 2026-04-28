import assert from 'node:assert/strict';
import { getAdminRoleUpdateErrorMessage, hasAdminRoleUpdateEndpoint, isAdminRoleEndpointMissing } from './adminRoleErrors';

assert.equal(
  isAdminRoleEndpointMissing({ status: 404 }),
  true,
  '404 from role update endpoint should mark the backend capability as missing',
);

assert.equal(
  getAdminRoleUpdateErrorMessage({ status: 404, message: 'Not Found' }),
  'Смена роли пока не поддерживается сервером. Нужно добавить endpoint для обновления роли пользователя.',
  'missing endpoint should show a specific admin-facing message',
);

assert.equal(
  getAdminRoleUpdateErrorMessage(new Error('Forbidden')),
  'Forbidden',
  'other API errors should keep their backend message',
);

assert.equal(
  hasAdminRoleUpdateEndpoint({
    paths: {
      '/api/v1/admin/users/{user_id}/role': { patch: {} },
    },
  }),
  true,
  'OpenAPI specs with a role update path should enable the role button',
);

assert.equal(
  hasAdminRoleUpdateEndpoint({
    paths: {
      '/api/v1/admin/users': { get: {} },
      '/api/v1/admin/users/{user_id}/block': { post: {} },
    },
  }),
  false,
  'OpenAPI specs without a role update path should disable the role button',
);

console.log('admin role error helpers passed');
