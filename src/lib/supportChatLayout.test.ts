import { strict as assert } from 'node:assert';
import {
  SUPPORT_CHAT_BUBBLE_BASE_CLASS,
  SUPPORT_CHAT_MESSAGE_TEXT_CLASS,
} from './supportChatLayout';

assert.match(SUPPORT_CHAT_BUBBLE_BASE_CLASS, /\bmin-w-0\b/);
assert.match(SUPPORT_CHAT_MESSAGE_TEXT_CLASS, /\bwhitespace-pre-wrap\b/);
assert.match(SUPPORT_CHAT_MESSAGE_TEXT_CLASS, /\bbreak-words\b/);
assert.match(SUPPORT_CHAT_MESSAGE_TEXT_CLASS, /\[overflow-wrap:anywhere\]/);

console.log('support chat layout helpers passed');
