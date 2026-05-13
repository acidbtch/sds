import assert from 'node:assert/strict';
import { getMediaKindForUpload } from './media';

assert.equal(getMediaKindForUpload('photo.jpg', ''), 'image');
assert.equal(getMediaKindForUpload('scan.PNG', ''), 'image');
assert.equal(getMediaKindForUpload('clip.MOV', ''), 'video');
assert.equal(getMediaKindForUpload('document.pdf', ''), 'file');
assert.equal(getMediaKindForUpload('unknown', 'image/webp'), 'image');
assert.equal(getMediaKindForUpload('unknown', 'video/mp4'), 'video');

console.log('media helpers passed');
