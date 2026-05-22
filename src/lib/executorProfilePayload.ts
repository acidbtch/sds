export type ExecutorProfileType = 'partner' | 'pro' | 'leader';

export interface ExecutorProfileFile {
  name: string;
  key: string;
  kind?: 'image' | 'video' | 'document' | 'file';
  previewUrl?: string;
}

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
  legalDocumentFiles: ExecutorProfileFile[];
  portfolioPhotoFiles: ExecutorProfileFile[];
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
    legal_document_keys: form.legalDocumentFiles.map(file => file.key).filter(Boolean),
    portfolio_photo_keys: form.portfolioPhotoFiles.map(file => file.key).filter(Boolean),
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
