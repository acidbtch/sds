export function isAdminRoleEndpointMissing(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: number }).status === 404
  );
}

export function getAdminRoleUpdateErrorMessage(error: unknown) {
  if (isAdminRoleEndpointMissing(error)) {
    return 'Смена роли пока не поддерживается сервером. Нужно добавить endpoint для обновления роли пользователя.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ошибка при изменении роли пользователя';
}

export function hasAdminRoleUpdateEndpoint(openApiSpec: unknown) {
  if (!openApiSpec || typeof openApiSpec !== 'object') return false;

  const paths = (openApiSpec as { paths?: Record<string, Record<string, unknown>> }).paths;
  if (!paths) return false;

  return [
    '/api/v1/admin/users/{user_id}/role',
    '/admin/users/{user_id}/role',
  ].some((path) => {
    const methods = paths[path];
    return Boolean(methods?.patch || methods?.put || methods?.post);
  });
}
