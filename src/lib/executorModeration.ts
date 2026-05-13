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

function toNames(values: any) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => value?.name || value).filter(Boolean);
}

function mapProfileData(profile: any) {
  return {
    id: profile?.id,
    legalStatus: firstValue(profile?.legal_status, profile?.legalStatus),
    name: firstValue(profile?.legal_name, profile?.legalName, profile?.name),
    unp: profile?.unp,
    shortName: firstValue(profile?.short_name, profile?.shortName),
    description: profile?.description,
    services: toNames(firstValue(profile?.services, profile?.service_names, profile?.service_ids)),
    regions: toNames(firstValue(profile?.regions, profile?.region_names, profile?.region_ids)),
    address: profile?.address,
    schedule: firstValue(profile?.schedule, profile?.working_hours, profile?.workingHours),
    phone: profile?.phone,
    instagram: firstValue(profile?.instagram_url, profile?.instagram),
    tiktok: firstValue(profile?.tiktok_url, profile?.tiktok),
    website: firstValue(profile?.website_url, profile?.website),
    bannerText: firstValue(profile?.banner_text, profile?.bannerText),
    logo: firstValue(profile?.logo_url, profile?.logo, profile?.logo_key),
  };
}

export function mapExecutorModerationFromApi(profile: any, index: number): ExecutorModerationItem {
  const pendingChanges = firstValue(profile?.pending_changes, profile?.pendingChanges);
  const currentProfile = firstValue(profile?.current_profile, profile?.currentProfile);
  const isEdit = hasObjectValue(pendingChanges);
  const oldSource = isEdit ? (hasObjectValue(currentProfile) ? currentProfile : profile) : undefined;
  const newSource = isEdit
    ? { ...(oldSource || {}), ...(pendingChanges as Record<string, any>), id: profile?.id ?? (oldSource as any)?.id }
    : profile;
  const data = mapProfileData(newSource);
  const oldData = oldSource ? mapProfileData(oldSource) : undefined;

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
