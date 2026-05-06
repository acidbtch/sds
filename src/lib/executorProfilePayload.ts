export type ExecutorProfileType = 'partner' | 'pro' | 'leader';

export interface ExecutorProfileFormData {
  legalStatus: string;
  name: string;
  unp: string;
  shortName: string;
  description: string;
  services: string[];
  regions: string[];
  address: string;
  schedule: any;
  phone: string;
  instagram: string;
  tiktok: string;
  website: string;
  profileType: ExecutorProfileType;
  bannerText: string;
  logo: string;
  logoKey: string;
}

export function mapExecutorProfileTypeToApiTier(profileType: ExecutorProfileType) {
  switch (profileType) {
    case 'leader':
      return 'LEADER';
    case 'pro':
      return 'PROFI';
    case 'partner':
      return 'PARTNER';
  }
}

export function buildExecutorProfileUpdatePayload(
  form: ExecutorProfileFormData,
  serviceIds: string[],
  regionIds: string[],
) {
  return {
    moderation_status: 'PENDING',
    legal_status: form.legalStatus,
    legal_name: form.name,
    unp: form.unp,
    short_name: form.shortName,
    description: form.description,
    service_ids: serviceIds,
    region_ids: regionIds,
    address: form.address || null,
    schedule: form.schedule,
    phone: form.phone.replace(/\s/g, ''),
    instagram_url: form.instagram || null,
    tiktok_url: form.tiktok || null,
    website_url: form.website || null,
    tier: mapExecutorProfileTypeToApiTier(form.profileType),
    banner_text: form.bannerText || null,
    logo_key: form.logoKey || null,
  };
}

export type ExecutorProfileModerationResult = 'success' | 'failure';

export function getExecutorProfileModerationResult(response: any): ExecutorProfileModerationResult {
  const status =
    response?.moderation_status ||
    response?.moderationStatus ||
    response?.profile?.moderation_status ||
    response?.profile?.moderationStatus;

  return String(status || '').toUpperCase() === 'PENDING' ? 'success' : 'failure';
}
