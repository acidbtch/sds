import { getUploadedMediaPreview, type MediaKind } from './media';

export type UploadedFileKind = MediaKind | 'document' | 'file';

export interface UploadedFileItem {
  name: string;
  key: string;
  kind?: UploadedFileKind;
  previewUrl?: string;
}

interface NormalizeUploadedFilesOptions {
  keys?: unknown;
  resolvedFiles?: unknown;
  fallbackPrefix: string;
}

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg']);
const videoExtensions = new Set(['mp4', 'webm', 'mov', 'm4v', 'avi']);

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function asArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function stringValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value);
}

function isPreviewUrl(value: string) {
  return /^(https?:|blob:|data:|\/(?!\/))/i.test(value);
}

function objectValue(value: unknown, ...keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const record = value as Record<string, unknown>;
  return firstValue(...keys.map((key) => record[key]));
}

export function getUploadedFileName(value: unknown, fallback: string) {
  if (!value) return fallback;
  const text = stringValue(value);
  const clean = text.split('?')[0].split('#')[0];
  return clean.split('/').filter(Boolean).pop() || fallback;
}

export function inferUploadedFileKind(value: unknown, explicitKind?: unknown): UploadedFileKind {
  const normalizedKind = stringValue(explicitKind).toLowerCase();
  if (normalizedKind === 'image' || normalizedKind.startsWith('image/')) return 'image';
  if (normalizedKind === 'video' || normalizedKind.startsWith('video/')) return 'video';
  if (normalizedKind === 'document') return 'document';
  if (
    normalizedKind === 'application/pdf' ||
    normalizedKind.includes('wordprocessingml') ||
    normalizedKind.includes('spreadsheetml') ||
    normalizedKind.includes('presentationml') ||
    normalizedKind === 'text/plain'
  ) return 'document';

  const text = stringValue(value).split('?')[0].split('#')[0].toLowerCase();
  const extension = text.includes('.') ? text.split('.').pop() || '' : '';

  if (imageExtensions.has(extension)) return 'image';
  if (videoExtensions.has(extension)) return 'video';
  return 'file';
}

function normalizeFileCandidate(candidate: unknown, key: unknown, fallbackName: string): UploadedFileItem {
  const isObject = Boolean(candidate && typeof candidate === 'object' && !Array.isArray(candidate));
  const fileObject = isObject ? candidate as Record<string, unknown> : {};
  const rawKey = firstValue(key, fileObject.key, fileObject.file_key, fileObject.fileKey, fileObject.id, fileObject.url, fileObject.href, fileObject.src, candidate);
  const keyText = stringValue(rawKey);
  const rememberedPreview = keyText ? getUploadedMediaPreview(keyText) : undefined;
  const candidateText = stringValue(candidate);
  const rawPreview = firstValue(
    rememberedPreview?.previewUrl,
    fileObject.previewUrl,
    fileObject.preview_url,
    fileObject.thumbnailUrl,
    fileObject.thumbnail_url,
    fileObject.downloadUrl,
    fileObject.download_url,
    fileObject.mediaUrl,
    fileObject.media_url,
    fileObject.url,
    fileObject.href,
    fileObject.src,
    fileObject.file_url,
    fileObject.fileUrl,
    fileObject.public_url,
    fileObject.publicUrl,
    objectValue(fileObject.file, 'previewUrl', 'preview_url', 'downloadUrl', 'download_url', 'url', 'href', 'src', 'file_url', 'fileUrl', 'public_url', 'publicUrl'),
    objectValue(fileObject.media, 'previewUrl', 'preview_url', 'downloadUrl', 'download_url', 'url', 'href', 'src', 'file_url', 'fileUrl', 'public_url', 'publicUrl'),
    objectValue(fileObject.preview, 'url', 'href', 'src'),
    objectValue(fileObject.thumbnail, 'url', 'href', 'src'),
    !isObject && isPreviewUrl(candidateText) ? candidateText : undefined,
  );
  const previewText = stringValue(rawPreview || (isPreviewUrl(keyText) ? keyText : ''));
  const rawName = firstValue(
    fileObject.name,
    fileObject.displayName,
    fileObject.display_name,
    fileObject.originalName,
    fileObject.original_name,
    fileObject.filename,
    fileObject.file_name,
    fileObject.fileName,
    objectValue(fileObject.file, 'name', 'displayName', 'display_name', 'originalName', 'original_name', 'filename', 'file_name', 'fileName'),
    objectValue(fileObject.media, 'name', 'displayName', 'display_name', 'originalName', 'original_name', 'filename', 'file_name', 'fileName'),
  );
  const name = stringValue(rawName || rememberedPreview?.name || getUploadedFileName(previewText || keyText, fallbackName));
  const kind = inferUploadedFileKind(
    firstValue(previewText, name, keyText),
    firstValue(
      fileObject.kind,
      fileObject.type,
      fileObject.content_type,
      fileObject.contentType,
      fileObject.mime,
      fileObject.mime_type,
      fileObject.mimeType,
      fileObject.media_type,
      fileObject.mediaType,
      objectValue(fileObject.file, 'kind', 'type', 'content_type', 'contentType', 'mime', 'mime_type', 'mimeType', 'media_type', 'mediaType'),
      objectValue(fileObject.media, 'kind', 'type', 'content_type', 'contentType', 'mime', 'mime_type', 'mimeType', 'media_type', 'mediaType'),
      rememberedPreview?.kind,
    ),
  );

  return {
    key: keyText || previewText || name,
    name,
    kind,
    previewUrl: previewText || undefined,
  };
}

export function normalizeUploadedFiles({ keys, resolvedFiles, fallbackPrefix }: NormalizeUploadedFilesOptions) {
  const keyList = asArray(keys);
  const resolvedList = asArray(resolvedFiles);

  if (keyList.length > 0) {
    return keyList
      .map((key, index) => normalizeFileCandidate(resolvedList[index], key, `${fallbackPrefix} ${index + 1}`))
      .filter(file => file.key);
  }

  return resolvedList
    .map((file, index) => normalizeFileCandidate(file, undefined, `${fallbackPrefix} ${index + 1}`))
    .filter(file => file.key);
}

export function normalizeOrderMediaFiles(media: unknown) {
  return normalizeUploadedFiles({
    resolvedFiles: media,
    fallbackPrefix: 'Медиафайл',
  });
}

export function getUploadedFilePreviewSource(file: UploadedFileItem) {
  const kind = getUploadedFilePreviewKind(file);
  if (kind !== 'image' && kind !== 'video') return '';
  return file.previewUrl || (isPreviewUrl(file.key) ? file.key : '');
}

export function getUploadedFilePreviewKind(file: UploadedFileItem) {
  return file.kind || inferUploadedFileKind(file.previewUrl || file.name || file.key);
}

export function areUploadedFilesEqual(left: UploadedFileItem[] = [], right: UploadedFileItem[] = []) {
  if (left.length !== right.length) return false;
  return left.every((file, index) => {
    const other = right[index];
    return file.key === other?.key &&
      file.name === other?.name &&
      file.kind === other?.kind &&
      getUploadedFilePreviewSource(file) === getUploadedFilePreviewSource(other);
  });
}
