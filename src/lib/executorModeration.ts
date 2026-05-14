import { normalizeUploadedFiles } from './uploadedFiles';

export type ExecutorModerationProfileType = 'partner' | 'pro' | 'leader';

export interface ExecutorModerationItem {
  id: number;
  type: 'new' | 'edit';
  name: string;
  profile: ExecutorModerationProfileType;
  date: string;
  status: 'new';
  data: Record<string, any>;
  oldData?: Record<string, any>;
}

export interface ExecutorModerationDictionaries {
  services?: any[];
  regions?: any[];
}

function profileTypeFromTier(tier: unknown): ExecutorModerationProfileType {
  switch (String(tier || '').toUpperCase()) {
    case 'LEADER':
      return 'leader';
    case 'PROFI':
      return 'pro';
    default:
      return 'partner';
  }
}

function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null);
}

function hasObjectValue(value: unknown) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0);
}

function createNameLookup(items: any[] | undefined) {
  const lookup = new Map<string, string>();

  (items || []).forEach((item: any) => {
    if (!item) return;
    const id = firstValue(item.id, item.value, item.key);
    const name = firstValue(item.name, item.label, item.title);
    if (id && name) {
      lookup.set(String(id), String(name));
    }

    if (Array.isArray(item.services)) {
      item.services.forEach((service: any) => {
        const serviceId = firstValue(service?.id, service?.value, service?.key);
        const serviceName = firstValue(service?.name, service?.label, service?.title);
        if (serviceId && serviceName) {
          lookup.set(String(serviceId), String(serviceName));
        }
      });
    }
  });

  return lookup;
}

function toNames(values: any, lookup?: Map<string, string>) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => {
      const raw = value?.name || value?.label || value;
      return lookup?.get(String(raw)) || raw;
    })
    .filter(Boolean);
}

function mapProfileData(profile: any, dictionaries: ExecutorModerationDictionaries = {}) {
  const serviceLookup = createNameLookup(dictionaries.services);
  const regionLookup = createNameLookup(dictionaries.regions);

  return {
    id: profile?.id,
    legalStatus: firstValue(profile?.legal_status, profile?.legalStatus),
    name: firstValue(profile?.legal_name, profile?.legalName, profile?.name),
    unp: profile?.unp,
    shortName: firstValue(profile?.short_name, profile?.shortName),
    description: profile?.description,
    services: toNames(firstValue(profile?.service_names, profile?.service_ids, profile?.services), serviceLookup),
    regions: toNames(firstValue(profile?.region_names, profile?.region_ids, profile?.regions), regionLookup),
    address: profile?.address,
    schedule: firstValue(profile?.schedule, profile?.working_hours, profile?.workingHours),
    phone: profile?.phone,
    instagram: firstValue(profile?.instagram_url, profile?.instagram),
    tiktok: firstValue(profile?.tiktok_url, profile?.tiktok),
    website: firstValue(profile?.website_url, profile?.website),
    bannerText: firstValue(profile?.banner_text, profile?.bannerText),
    logo: firstValue(profile?.logo_url, profile?.logo, profile?.logo_key),
    logoFiles: normalizeUploadedFiles({
      keys: firstValue(profile?.logo_key, profile?.logoKey),
      resolvedFiles: firstValue(
        profile?.logo_url,
        profile?.logoUrl,
        profile?.logo,
        firstValue(profile?.logo_key, profile?.logoKey)
          ? { key: firstValue(profile?.logo_key, profile?.logoKey), name: 'Логотип', kind: 'image' }
          : undefined,
      ),
      fallbackPrefix: 'Логотип',
    }),
    legalDocumentFiles: normalizeUploadedFiles({
      keys: firstValue(profile?.legal_document_keys, profile?.legalDocumentKeys),
      resolvedFiles: firstValue(profile?.legal_documents, profile?.legalDocuments),
      fallbackPrefix: 'Документ',
    }),
    portfolioPhotoFiles: normalizeUploadedFiles({
      keys: firstValue(profile?.portfolio_photo_keys, profile?.portfolioPhotoKeys),
      resolvedFiles: firstValue(profile?.portfolio_photos, profile?.portfolioPhotos),
      fallbackPrefix: 'Фото',
    }),
  };
}

function stripOldResolvedFilesFromPendingChanges(pendingChanges: Record<string, any>) {
  const cleaned = { ...pendingChanges };

  if (('legal_document_keys' in cleaned || 'legalDocumentKeys' in cleaned) &&
    !('legal_documents' in cleaned) &&
    !('legalDocuments' in cleaned)) {
    cleaned.legal_documents = undefined;
    cleaned.legalDocuments = undefined;
  }

  if (('portfolio_photo_keys' in cleaned || 'portfolioPhotoKeys' in cleaned) &&
    !('portfolio_photos' in cleaned) &&
    !('portfolioPhotos' in cleaned)) {
    cleaned.portfolio_photos = undefined;
    cleaned.portfolioPhotos = undefined;
  }

  if (('logo_key' in cleaned || 'logoKey' in cleaned) &&
    !('logo_url' in cleaned) &&
    !('logoUrl' in cleaned)) {
    cleaned.logo_url = undefined;
    cleaned.logoUrl = undefined;
    cleaned.logo = undefined;
  }

  return cleaned;
}

export function mapExecutorModerationFromApi(
  profile: any,
  index: number,
  dictionaries: ExecutorModerationDictionaries = {},
): ExecutorModerationItem {
  const pendingChanges = firstValue(profile?.pending_changes, profile?.pendingChanges);
  const currentProfile = firstValue(profile?.current_profile, profile?.currentProfile);
  const isEdit = hasObjectValue(pendingChanges);
  const oldSource = isEdit ? (hasObjectValue(currentProfile) ? currentProfile : profile) : undefined;
  const cleanPendingChanges = isEdit
    ? stripOldResolvedFilesFromPendingChanges(pendingChanges as Record<string, any>)
    : undefined;
  const newSource = isEdit
    ? { ...(oldSource || {}), ...(cleanPendingChanges as Record<string, any>), id: profile?.id ?? (oldSource as any)?.id }
    : profile;
  const data = mapProfileData(newSource, dictionaries);
  const oldData = oldSource ? mapProfileData(oldSource, dictionaries) : undefined;

  return {
    id: index + 1,
    type: isEdit ? 'edit' : 'new',
    name: data.shortName || data.name || '',
    profile: profileTypeFromTier(firstValue(newSource?.tier, profile?.tier)),
    date: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '',
    status: 'new',
    data,
    oldData,
  };
}

export function getExecutorModerationProfileId(request: Pick<ExecutorModerationItem, 'data'>) {
  const id = firstValue(request.data?.id, request.data?.profileId, request.data?.profile_id);
  return id ? String(id) : null;
}

export function removeExecutorModerationItem<T extends Pick<ExecutorModerationItem, 'id'>>(items: T[], id: number) {
  return items.filter((item) => item.id !== id);
}
