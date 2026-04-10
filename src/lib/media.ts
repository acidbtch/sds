import { mediaApi } from './api';

export type MediaKind = 'image' | 'video';

export async function uploadMediaFile(file: File): Promise<{
  key: string;
  previewUrl: string;
  kind: MediaKind;
  name: string;
}> {
  const { upload_url, file_key } = await mediaApi.getPresignedUrl(file.name, file.type);
  await mediaApi.uploadToS3(upload_url, file);

  return {
    key: file_key,
    previewUrl: URL.createObjectURL(file),
    kind: file.type.startsWith('video/') ? 'video' : 'image',
    name: file.name,
  };
}
