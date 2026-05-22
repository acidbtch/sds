import assert from 'node:assert/strict';
import { rememberUploadedMediaPreview } from './media';
import {
  areUploadedFilesEqual,
  getUploadedFilePreviewKind,
  getUploadedFilePreviewSource,
  normalizeOrderMediaFiles,
  normalizeUploadedFiles,
} from './uploadedFiles';

const files = normalizeUploadedFiles({
  keys: ['docs/unp.pdf', 'videos/work.mp4'],
  resolvedFiles: [
    { url: 'https://cdn.example.com/docs/unp.pdf', name: 'УНП.pdf' },
    { url: 'https://cdn.example.com/videos/work.mp4', name: 'Видео работ.mp4' },
  ],
  fallbackPrefix: 'Файл',
});

assert.equal(files[0].name, 'УНП.pdf');
assert.equal(files[0].kind, 'file');
assert.equal(files[0].previewUrl, 'https://cdn.example.com/docs/unp.pdf');
assert.equal(files[1].kind, 'video');
assert.equal(getUploadedFilePreviewSource(files[1]), 'https://cdn.example.com/videos/work.mp4');
assert.equal(
  getUploadedFilePreviewKind({
    key: 'uploaded-image-key',
    name: 'Загруженное фото',
    kind: 'image',
    previewUrl: 'blob:http://127.0.0.1/local-image',
  }),
  'image',
  'blob previews should keep the uploaded file kind for click preview',
);
assert.equal(
  getUploadedFilePreviewSource({
    key: 'uploaded-image-key',
    name: 'Загруженное фото',
    kind: 'image',
    previewUrl: 'blob:http://127.0.0.1/local-image',
  }),
  'blob:http://127.0.0.1/local-image',
);

rememberUploadedMediaPreview({
  key: 'admin-logo-key',
  name: 'Логотип из текущей сессии.png',
  kind: 'image',
  previewUrl: 'blob:http://127.0.0.1/admin-logo',
});

const rememberedOnlyByKey = normalizeUploadedFiles({
  keys: ['admin-logo-key'],
  fallbackPrefix: 'Логотип',
});

assert.equal(rememberedOnlyByKey[0].name, 'Логотип из текущей сессии.png');
assert.equal(rememberedOnlyByKey[0].kind, 'image');
assert.equal(rememberedOnlyByKey[0].previewUrl, 'blob:http://127.0.0.1/admin-logo');

const imageOnly = normalizeUploadedFiles({
  resolvedFiles: ['https://cdn.example.com/photos/result.webp'],
  fallbackPrefix: 'Фото',
});

assert.equal(imageOnly[0].kind, 'image');
assert.equal(imageOnly[0].name, 'result.webp');

const relativeUrlImage = normalizeUploadedFiles({
  resolvedFiles: ['/media/orders/photo.png'],
  fallbackPrefix: 'Фото',
});

assert.equal(getUploadedFilePreviewSource(relativeUrlImage[0]), '/media/orders/photo.png');

assert.equal(
  areUploadedFilesEqual(files, files.map(file => ({ ...file }))),
  true,
  'same uploaded files should compare by key, name, kind and preview source',
);
assert.equal(
  areUploadedFilesEqual(files, [{ ...files[0], key: 'changed' }, files[1]]),
  false,
  'changed uploaded file keys should be detected',
);

const orderMedia = normalizeOrderMediaFiles([
  { file_key: 'order-photo-key', url: 'https://cdn.example.com/orders/photo.jpg', name: 'Фото заказа.jpg' },
  'https://cdn.example.com/orders/video.mp4',
]);

assert.equal(orderMedia[0].key, 'order-photo-key');
assert.equal(orderMedia[0].kind, 'image');
assert.equal(getUploadedFilePreviewSource(orderMedia[0]), 'https://cdn.example.com/orders/photo.jpg');
assert.equal(orderMedia[1].kind, 'video');

const backendDocument = normalizeUploadedFiles({
  resolvedFiles: [
    {
      key: 'legal-doc-key',
      url: 'https://cdn.example.com/legal.docx',
      name: 'legal.docx',
      kind: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  ],
  fallbackPrefix: 'Document',
});

assert.equal(backendDocument[0].kind, 'document');
assert.equal(backendDocument[0].previewUrl, 'https://cdn.example.com/legal.docx');

console.log('uploaded files helpers passed');
