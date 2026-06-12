import assert from 'node:assert/strict';
import {
  applyResolvedMediaFiles,
  getUnresolvedMediaKeys,
  resolveOrdersMedia,
} from './mediaResolve';
import { getUploadedFilePreviewSource } from './uploadedFiles';

const unresolvedFiles = [
  { key: 'raw-photo-key', name: 'raw-photo-key', kind: 'file' as const },
  { key: 'https://cdn.example.com/already.jpg', name: 'already.jpg', kind: 'image' as const },
  { key: 'raw-video-key', name: 'raw-video-key', kind: 'file' as const },
];

assert.deepEqual(getUnresolvedMediaKeys(unresolvedFiles), ['raw-photo-key', 'raw-video-key']);

const resolvedFiles = applyResolvedMediaFiles(unresolvedFiles, [
  {
    key: 'raw-photo-key',
    url: 'https://cdn.example.com/orders/photo.jpg',
    name: 'photo.jpg',
    mime_type: 'image/jpeg',
    kind: 'image',
  },
  {
    key: 'raw-video-key',
    url: 'https://cdn.example.com/orders/video.mp4',
    name: 'video.mp4',
    mime_type: 'video/mp4',
    kind: 'video',
  },
]);

assert.equal(resolvedFiles[0].kind, 'image');
assert.equal(getUploadedFilePreviewSource(resolvedFiles[0]), 'https://cdn.example.com/orders/photo.jpg');
assert.equal(resolvedFiles[2].kind, 'video');
assert.equal(getUploadedFilePreviewSource(resolvedFiles[2]), 'https://cdn.example.com/orders/video.mp4');

const resolvedOrders = await resolveOrdersMedia(
  [
    {
      id: 'order-1',
      media: ['raw-photo-key'],
    },
  ],
  async (keys) => {
    assert.deepEqual(keys, ['raw-photo-key']);
    return [
      {
        key: 'raw-photo-key',
        url: 'https://cdn.example.com/orders/resolved-photo.jpg',
        name: 'resolved-photo.jpg',
        mime_type: 'image/jpeg',
        kind: 'image',
      },
    ];
  },
);

assert.equal(
  getUploadedFilePreviewSource(resolvedOrders[0].media?.[0] as any),
  'https://cdn.example.com/orders/resolved-photo.jpg',
);

console.log('media resolve helpers passed');
