import { Order } from '../types';
import { mediaApi } from './api';
import {
  getUploadedFilePreviewSource,
  normalizeOrderMediaFiles,
  type UploadedFileItem,
} from './uploadedFiles';

type MediaResolver = (keys: string[]) => Promise<unknown[]>;

function isRemoteOrLocalUrl(value: string) {
  return /^(https?:|blob:|data:|\/(?!\/))/i.test(value);
}

export function getUnresolvedMediaKeys(files: UploadedFileItem[]) {
  return Array.from(new Set(
    files
      .filter(file => file.key && !getUploadedFilePreviewSource(file) && !isRemoteOrLocalUrl(file.key))
      .map(file => file.key)
  ));
}

function toResolvedMediaMap(resolvedFiles: unknown[]) {
  const resolvedByKey = new Map<string, UploadedFileItem>();

  normalizeOrderMediaFiles(resolvedFiles).forEach((file) => {
    if (!file.key || !file.previewUrl) return;
    resolvedByKey.set(file.key, file);
  });

  return resolvedByKey;
}

export function applyResolvedMediaFiles(files: UploadedFileItem[], resolvedFiles: unknown[]) {
  const resolvedByKey = toResolvedMediaMap(resolvedFiles);

  return files.map((file) => {
    const resolved = resolvedByKey.get(file.key);
    if (!resolved) return file;

    return {
      ...file,
      name: resolved.name || file.name,
      kind: resolved.kind || file.kind,
      previewUrl: resolved.previewUrl || file.previewUrl,
    };
  });
}

export async function resolveUploadedFiles(
  files: UploadedFileItem[],
  resolver: MediaResolver = mediaApi.resolve,
) {
  const keys = getUnresolvedMediaKeys(files);
  if (keys.length === 0) return files;

  try {
    const resolved = await resolver(keys);
    return applyResolvedMediaFiles(files, resolved);
  } catch (error) {
    console.error('Failed to resolve media keys:', error);
    return files;
  }
}

export async function resolveOrdersMedia<T extends Pick<Order, 'media'>>(
  orders: T[],
  resolver?: MediaResolver,
) {
  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      media: await resolveUploadedFiles(normalizeOrderMediaFiles(order.media), resolver),
    }))
  );
}
