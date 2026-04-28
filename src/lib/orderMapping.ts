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
  return {
    id: String(o.id || ''),
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
    phone: displayString(o.owner_phone || o.phone),
    customerName: firstDisplayValue(o.owner_name, o.customer_name, o.customer),
    deadline: formatDate(o.deadline),
    vin: displayString(o.vin),
    media: o.photos || o.media || o.attachments || [],
    status: mapOrderStatus(o.status),
    date: formatDate(o.created_at || o.date),
    description: displayString(o.description),
    responses: [],
    responsesCount: typeof o.responses_count === 'number' ? o.responses_count : 0,
    refusedBy: o.refused_by || o.refusedBy,
    acceptedContractorId: o.accepted_executor_id || o.acceptedContractorId,
  };
}
