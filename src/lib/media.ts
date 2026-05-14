import { mediaApi } from './api';

export type MediaKind = 'image' | 'video' | 'file';

export interface UploadedMediaPreview {
  key: string;
  previewUrl: string;
  kind: MediaKind;
  name: string;
}

const uploadImageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg']);
const uploadVideoExtensions = new Set(['mp4', 'webm', 'mov', 'm4v', 'avi']);
const uploadedMediaPreviews = new Map<string, UploadedMediaPreview>();
const UPLOADED_MEDIA_PREVIEWS_STORAGE_KEY = 'sds:uploaded-media-previews';

function getFileExtension(fileName: string) {
  const clean = fileName.split('?')[0].split('#')[0].toLowerCase();
  return clean.includes('.') ? clean.split('.').pop() || '' : '';
}

export function getMediaKindForUpload(fileName: string, contentType = ''): MediaKind {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';

  const extension = getFileExtension(fileName);
  if (uploadImageExtensions.has(extension)) return 'image';
  if (uploadVideoExtensions.has(extension)) return 'video';
  return 'file';
}

function getSessionStorage() {
  try {
    return typeof globalThis !== 'undefined' ? globalThis.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

function readStoredUploadedMediaPreviews() {
  const storage = getSessionStorage();
  if (!storage) return {};

  try {
    return JSON.parse(storage.getItem(UPLOADED_MEDIA_PREVIEWS_STORAGE_KEY) || '{}') as Record<string, UploadedMediaPreview>;
  } catch {
    return {};
  }
}

function storeUploadedMediaPreview(file: UploadedMediaPreview) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    const current = readStoredUploadedMediaPreviews();
    current[file.key] = file;
    storage.setItem(UPLOADED_MEDIA_PREVIEWS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Session storage can be unavailable or full; the in-memory map still covers the current page.
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image preview'));
    image.src = url;
  });
}

async function createCompressedImagePreview(file: File) {
  if (getFileExtension(file.name) === 'svg') {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1200;
    const width = image.naturalWidth || image.width || maxSide;
    const height = image.naturalHeight || image.height || maxSide;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      return readFileAsDataUrl(file);
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function createLocalPreviewUrl(file: File, kind: MediaKind) {
  if (kind !== 'image') {
    return URL.createObjectURL(file);
  }

  // Store a small durable preview instead of the original image. It survives in-session
  // refreshes and lets moderation render files when the API only returns file keys.
  try {
    return await createCompressedImagePreview(file);
  } catch {
    return URL.createObjectURL(file);
  }
}

export function rememberUploadedMediaPreview(file: UploadedMediaPreview) {
  uploadedMediaPreviews.set(file.key, file);
  if (file.previewUrl.startsWith('data:')) {
    storeUploadedMediaPreview(file);
  }
}

export function getUploadedMediaPreview(key: string) {
  const remembered = uploadedMediaPreviews.get(key);
  if (remembered) return remembered;

  const stored = readStoredUploadedMediaPreviews()[key];
  if (stored) {
    uploadedMediaPreviews.set(key, stored);
  }

  return stored;
}

export async function uploadMediaFile(file: File): Promise<{
  key: string;
  previewUrl: string;
  kind: MediaKind;
  name: string;
}> {
  const { upload_url, file_key } = await mediaApi.getPresignedUrl(file.name, file.type);
  await mediaApi.uploadToS3(upload_url, file);

  const kind = getMediaKindForUpload(file.name, file.type);
  const previewUrl = await createLocalPreviewUrl(file, kind);
  const uploadedFile = {
    key: file_key,
    previewUrl,
    kind,
    name: file.name,
  };

  rememberUploadedMediaPreview(uploadedFile);

  return uploadedFile;
}
