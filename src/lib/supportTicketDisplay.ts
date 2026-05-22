function cleanDisplayValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function firstDisplayValue(...values: unknown[]) {
  return values.map(cleanDisplayValue).find(Boolean) || '';
}

function collectIds(record: Record<string, any>) {
  return [
    record.id,
    record.user_id,
    record.userId,
    record.customer_id,
    record.customerId,
    record.telegram_id,
    record.telegramId,
    record.tg_id,
    record.tgId,
  ].map(cleanDisplayValue).filter(Boolean);
}

function joinName(firstName: unknown, lastName: unknown) {
  return [cleanDisplayValue(firstName), cleanDisplayValue(lastName)].filter(Boolean).join(' ');
}

function formatTelegramUsername(username: string) {
  const normalized = username.replace(/^@/, '').trim();
  if (!normalized || /^\d+$/.test(normalized)) return '';
  return `@${normalized}`;
}

function formatTelegramNickname(nickname: string) {
  const normalized = nickname.trim();
  if (!normalized || /^\d+$/.test(normalized)) return '';
  return normalized;
}

function looksLikeTechnicalUserLabel(value: string) {
  return /^Пользователь\s+[0-9a-f-]{12,}$/i.test(value) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value);
}

function normalizeCompare(value: string) {
  return value.trim().replace(/^@/, '').toLowerCase();
}

function firstDifferentDisplayValue(compareTo: string, ...values: unknown[]) {
  const compareValue = normalizeCompare(compareTo);
  return values
    .map(cleanDisplayValue)
    .find((value) => value && normalizeCompare(value) !== compareValue) || '';
}

function findSupportTicketUser(ticket: Record<string, any>, users: Array<Record<string, any>>) {
  const ticketUserIds = new Set(collectIds({
    id: ticket.user_id,
    user_id: ticket.user_id,
    userId: ticket.userId,
    customer_id: ticket.customer_id,
    customerId: ticket.customerId,
    telegram_id: ticket.telegram_id,
    telegramId: ticket.telegramId,
    tg_id: ticket.tg_id,
    tgId: ticket.tgId,
  }));

  if (ticketUserIds.size === 0) return {};

  return users.find((user) => collectIds(user).some((id) => ticketUserIds.has(id))) || {};
}

export function getSupportTicketUserLabel(ticket: Record<string, any>, users: Array<Record<string, any>> = []) {
  const nestedUser = ticket.user && typeof ticket.user === 'object' ? ticket.user : {};
  const matchedUser = findSupportTicketUser(ticket, users);
  const stringUser = typeof ticket.user === 'string' ? ticket.user : '';

  const name = firstDisplayValue(
    nestedUser.user_name,
    nestedUser.userName,
    nestedUser.full_name,
    nestedUser.fullName,
    nestedUser.display_name,
    nestedUser.displayName,
    nestedUser.name,
    joinName(nestedUser.first_name, nestedUser.last_name),
    matchedUser.name,
    matchedUser.customerName,
    matchedUser.customer_name,
    matchedUser.full_name,
    matchedUser.fullName,
    matchedUser.display_name,
    matchedUser.displayName,
    matchedUser.user_name,
    matchedUser.userName,
    joinName(matchedUser.first_name, matchedUser.last_name),
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
    looksLikeTechnicalUserLabel(stringUser) ? '' : stringUser
  );

  const username = firstDisplayValue(
    nestedUser.telegram_username,
    nestedUser.telegramUsername,
    nestedUser.tg_username,
    nestedUser.tgUsername,
    nestedUser.username,
    matchedUser.username,
    matchedUser.telegram_username,
    matchedUser.telegramUsername,
    matchedUser.tg_username,
    matchedUser.tgUsername,
    ticket.telegram_username,
    ticket.telegramUsername,
    ticket.tg_username,
    ticket.tgUsername,
    ticket.customer_username,
    ticket.customerUsername,
    ticket.username
  );
  const displayNickname = firstDifferentDisplayValue(
    name,
    nestedUser.user_name,
    nestedUser.userName,
    nestedUser.telegramNickname,
    nestedUser.telegram_nickname,
    matchedUser.telegramNickname,
    matchedUser.telegram_nickname,
    matchedUser.telegramDisplayName,
    matchedUser.telegram_display_name,
    ticket.user_name,
    ticket.userName,
    ticket.telegram_name,
    ticket.telegramName,
    ticket.display_name,
    ticket.displayName
  );

  const formattedUsername = formatTelegramUsername(username);
  if (name && formattedUsername) return `${name} (${formattedUsername})`;
  const formattedDisplayNickname = formatTelegramNickname(displayNickname);
  if (name && formattedDisplayNickname) return `${name} (${formattedDisplayNickname})`;
  if (name) return name;
  if (formattedUsername) return formattedUsername;
  if (formattedDisplayNickname) return formattedDisplayNickname;
  return 'Пользователь';
}
