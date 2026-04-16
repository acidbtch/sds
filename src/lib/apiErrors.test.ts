import { strict as assert } from 'node:assert';
import { formatApiErrorMessage } from './api';

assert.equal(
  formatApiErrorMessage({
    detail: [
      {
        loc: ['body', 'message'],
        msg: 'String should have at least 5 characters',
        type: 'string_too_short',
      },
      {
        loc: ['body', 'subject'],
        msg: 'String should have at least 3 characters',
        type: 'string_too_short',
      },
    ],
  }),
  'message: String should have at least 5 characters; subject: String should have at least 3 characters'
);

assert.equal(
  formatApiErrorMessage({ detail: { msg: 'Invalid request' } }),
  'Invalid request'
);

assert.equal(
  formatApiErrorMessage({ message: 'Token expired' }),
  'Token expired'
);

console.log('api error formatting passed');
