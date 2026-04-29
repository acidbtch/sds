export interface AdminCarOption {
  id: string;
  name: string;
}

export type AdminCarModelsByBrand = Record<string, unknown[]>;

function getTextField(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const rawValue = record[key];
    if (typeof rawValue === 'string' && rawValue.trim()) {
      return rawValue.trim();
    }
    if (typeof rawValue === 'number') {
      return String(rawValue);
    }
  }

  return undefined;
}

export function getAdminCarEntityId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  return getTextField(value, ['id', 'value', 'name', 'title', 'label']) || '';
}

export function getAdminCarEntityName(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  return getTextField(value, ['name', 'title', 'label', 'value', 'id']) || '';
}

export function getAdminCarBrandOptions(
  carBrands: unknown[],
  carModels: AdminCarModelsByBrand,
): AdminCarOption[] {
  const seen = new Set<string>();
  const options: AdminCarOption[] = [];

  for (const brand of carBrands) {
    const id = getAdminCarEntityId(brand);
    const name = getAdminCarEntityName(brand);
    if (!id || !name || seen.has(id)) continue;

    seen.add(id);
    options.push({ id, name });
  }

  for (const id of Object.keys(carModels)) {
    if (!id || seen.has(id)) continue;

    seen.add(id);
    options.push({ id, name: id });
  }

  return options;
}

export function getAdminCarModelOptions(
  carModels: AdminCarModelsByBrand,
  brandId: string | null | undefined,
): AdminCarOption[] {
  if (!brandId) return [];

  return (carModels[brandId] || [])
    .map((model) => ({
      id: getAdminCarEntityId(model),
      name: getAdminCarEntityName(model),
    }))
    .filter((model) => model.id && model.name);
}
