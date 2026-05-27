import { Order } from '../types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPAQUE_ID_PATTERN = /^[a-z0-9_-]{20,}$/i;

function looksLikeOpaqueId(value: string) {
  const normalized = value.trim();
  return UUID_PATTERN.test(normalized) || OPAQUE_ID_PATTERN.test(normalized);
}

function displayString(value: unknown) {
  if (value === null || value === undefined) return '';
  const normalized = String(value).trim();
  if (!normalized || looksLikeOpaqueId(normalized)) return '';
  return normalized;
}

function idString(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function objectId(value: unknown, ...keys: string[]) {
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const normalized = idString(record[key]);
    if (normalized) return normalized;
  }

  return '';
}

function firstIdValue(...candidates: unknown[]) {
  for (const candidate of candidates) {
    const value = idString(candidate);
    if (value) return value;
  }

  return '';
}

function objectName(value: unknown): string {
  if (!value || typeof value !== 'object') return displayString(value);

  const record = value as Record<string, unknown>;
  return (
    displayString(record.name) ||
    displayString(record.title) ||
    displayString(record.label) ||
    displayString(record.short_name) ||
    displayString(record.legal_name)
  );
}

function displayList(value: unknown) {
  if (!Array.isArray(value)) return '';

  const names = value
    .map((item) => objectName(item))
    .filter(Boolean);

  return Array.from(new Set(names)).join(', ');
}

function firstDisplayValue(...candidates: unknown[]) {
  for (const candidate of candidates) {
    const value = Array.isArray(candidate)
      ? displayList(candidate)
      : objectName(candidate);

    if (value) return value;
  }

  return '';
}

function asArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function isPreviewUrl(value: string) {
  return /^(https?:|blob:|data:|\/(?!\/))/i.test(value);
}

function objectPreviewValue(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  const record = value as Record<string, unknown>;
  return idString(
    record.previewUrl ||
    record.preview_url ||
    record.thumbnailUrl ||
    record.thumbnail_url ||
    record.downloadUrl ||
    record.download_url ||
    record.mediaUrl ||
    record.media_url ||
    record.url ||
    record.href ||
    record.src ||
    record.file_url ||
    record.fileUrl ||
    record.public_url ||
    record.publicUrl
  );
}

function hasResolvedMedia(value: unknown) {
  if (typeof value === 'string') return isPreviewUrl(value);
  return Boolean(objectPreviewValue(value));
}

function mediaIdentity(value: unknown) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return String(value ?? '');

  const record = value as Record<string, unknown>;
  return idString(
    record.key ||
    record.file_key ||
    record.fileKey ||
    record.id ||
    objectPreviewValue(value) ||
    JSON.stringify(value)
  );
}

function uniqueMedia(items: unknown[]) {
  const seen = new Set<string>();
  const result: unknown[] = [];

  items.forEach((item) => {
    const identity = mediaIdentity(item);
    if (!identity || seen.has(identity)) return;

    seen.add(identity);
    result.push(item);
  });

  return result;
}

function collectOrderMedia(o: any) {
  const responseMedia = uniqueMedia([
    ...asArray(o.photos),
    ...asArray(o.video),
  ]);
  const directMedia = uniqueMedia(asArray(o.media));
  const attachments = uniqueMedia(asArray(o.attachments));
  const resolvedMedia = uniqueMedia([
    ...responseMedia,
    ...directMedia,
    ...attachments,
  ].filter(hasResolvedMedia));

  if (resolvedMedia.length > 0) return resolvedMedia;
  if (directMedia.length > 0) return directMedia;
  if (responseMedia.length > 0) return responseMedia;
  return attachments;
}

function formatDate(value: unknown) {
  const raw = displayString(value);
  if (!raw) return '';

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString('ru-RU');
}

function mapOrderStatus(status: unknown): Order['status'] {
  switch (String(status || '').toUpperCase()) {
    case 'SEARCHING':
    case 'PENDING':
    case 'NEW':
      return 'pending';
    case 'MATCHED':
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return 'active';
    case 'COMPLETED':
    case 'DONE':
      return 'completed';
    case 'CANCELLED':
    case 'CANCELED':
    case 'REJECTED':
      return 'cancelled';
    default:
      return 'cancelled';
  }
}

export function mapOrderFromApi(o: any): Order {
  const id = String(o.id || '');
  const publicId = idString(o.public_id || o.publicId);
  const orderNumber = idString(o.order_number || o.orderNumber);

  return {
    id,
    publicId,
    orderNumber,
    displayNumber: orderNumber || publicId,
    serviceType:
      firstDisplayValue(o.service_name, o.services, o.service, o.service_id) ||
      'Услуга',
    carMake: firstDisplayValue(
      o.car_brand_name,
      o.carBrandName,
      o.car_brand,
      o.carBrand,
      o.brand,
      o.car_brand_id
    ),
    carModel: firstDisplayValue(
      o.car_model_name,
      o.carModelName,
      o.car_model,
      o.carModel,
      o.model,
      o.car_model_id
    ),
    year: o.year?.toString() || '',
    gearbox: firstDisplayValue(o.gearbox_type, o.gearbox),
    body: firstDisplayValue(o.body_type, o.body),
    engine: firstDisplayValue(o.engine_type, o.engine),
    drive: firstDisplayValue(o.drive_type, o.drive),
    region: firstDisplayValue(o.region_name, o.region, o.region_id),
    phone: displayString(o.customer_phone || o.customerPhone || o.owner_phone || o.phone),
    customerName: firstDisplayValue(o.customer_name, o.customerName, o.owner_name, o.customer),
    customerId: firstIdValue(
      o.customer_id,
      o.customerId,
      o.owner_id,
      o.ownerId,
      o.client_id,
      o.clientId,
      objectId(o.customer, 'id'),
      objectId(o.owner, 'id')
    ),
    customerUserId: firstIdValue(
      o.customer_user_id,
      o.customerUserId,
      o.owner_user_id,
      o.ownerUserId,
      o.user_id,
      o.userId,
      o.created_by,
      o.createdBy,
      objectId(o.customer, 'user_id', 'userId'),
      objectId(o.owner, 'user_id', 'userId')
    ),
    customerTelegramId: firstIdValue(
      o.customer_telegram_id,
      o.customerTelegramId,
      o.owner_telegram_id,
      o.ownerTelegramId,
      o.telegram_id,
      o.telegramId,
      o.tg_id,
      o.tgId,
      objectId(o.customer, 'telegram_id', 'telegramId', 'tg_id', 'tgId'),
      objectId(o.owner, 'telegram_id', 'telegramId', 'tg_id', 'tgId')
    ),
    customerUsername: firstDisplayValue(
      o.customer_username,
      o.customerUsername,
      o.customer_telegram_username,
      o.customerTelegramUsername,
      o.owner_username,
      o.ownerUsername,
      o.username,
      o.customer?.username,
      o.owner?.username
    ),
    deadline: formatDate(o.deadline),
    vin: displayString(o.vin),
    media: collectOrderMedia(o),
    status: mapOrderStatus(o.status),
    date: formatDate(o.created_at || o.date),
    createdAt: idString(o.created_at || o.date),
    description: displayString(o.description),
    responses: [],
    responsesCount: typeof o.responses_count === 'number' ? o.responses_count : 0,
    refusedBy: o.refused_by || o.refusedBy,
    acceptedContractorId: o.accepted_executor_id || o.acceptedContractorId,
  };
}
