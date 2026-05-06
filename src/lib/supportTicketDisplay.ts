function cleanDisplayValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function firstDisplayValue(...values: unknown[]) {
  return values.map(cleanDisplayValue).find(Boolean) || '';
}

function joinName(firstName: unknown, lastName: unknown) {
  return [cleanDisplayValue(firstName), cleanDisplayValue(lastName)].filter(Boolean).join(' ');
}

function formatTelegramUsername(username: string) {
  if (!username) return '';
  return username.startsWith('@') ? username : `@${username}`;
}

function looksLikeTechnicalUserLabel(value: string) {
  return /^Пользователь\s+[0-9a-f-]{12,}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);
}

export function getSupportTicketUserLabel(ticket: Record<string, any>) {
  const nestedUser = ticket.user && typeof ticket.user === 'object' ? ticket.user : {};
  const stringUser = typeof ticket.user === 'string' ? ticket.user : '';

  const name = firstDisplayValue(
    ticket.user_name,
    ticket.userName,
    ticket.customer_name,
    ticket.customerName,
    ticket.full_name,
    ticket.fullName,
    ticket.display_name,
    ticket.displayName,
    ticket.name,
    joinName(ticket.first_name, ticket.last_name),
    nestedUser.user_name,
    nestedUser.userName,
    nestedUser.full_name,
    nestedUser.fullName,
    nestedUser.display_name,
    nestedUser.displayName,
    nestedUser.name,
    joinName(nestedUser.first_name, nestedUser.last_name),
    looksLikeTechnicalUserLabel(stringUser) ? '' : stringUser
  );

  const username = firstDisplayValue(
    ticket.telegram_username,
    ticket.telegramUsername,
    ticket.tg_username,
    ticket.tgUsername,
    ticket.customer_username,
    ticket.customerUsername,
    ticket.username,
    nestedUser.telegram_username,
    nestedUser.telegramUsername,
    nestedUser.tg_username,
    nestedUser.tgUsername,
    nestedUser.username
  );

  const formattedUsername = formatTelegramUsername(username);
  if (name && formattedUsername) return `${name} (${formattedUsername})`;
  if (name) return name;
  if (formattedUsername) return formattedUsername;
  return 'Пользователь';
}
