import assert from 'node:assert/strict';
import {
  areUploadedFilesEqual,
  getUploadedFilePreviewSource,
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

const imageOnly = normalizeUploadedFiles({
  resolvedFiles: ['https://cdn.example.com/photos/result.webp'],
  fallbackPrefix: 'Фото',
});

assert.equal(imageOnly[0].kind, 'image');
assert.equal(imageOnly[0].name, 'result.webp');

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

console.log('uploaded files helpers passed');
