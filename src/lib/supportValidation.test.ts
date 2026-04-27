import { strict as assert } from 'node:assert';
import {
  parseSupportTicketApiError,
  validateSupportTicketForm,
} from './supportValidation';

assert.deepEqual(validateSupportTicketForm('1', '123456789'), {
  subject: 'Тема должна содержать минимум 3 символа',
  message: 'Сообщение должно содержать минимум 10 символов',
});

assert.deepEqual(validateSupportTicketForm('123', '1234567890'), {});

assert.deepEqual(
  parseSupportTicketApiError(
    'subject: String should have at least 3 characters; message: String should have at least 10 characters'
  ),
  {
    subject: 'Тема должна содержать минимум 3 символа',
    message: 'Сообщение должно содержать минимум 10 символов',
  }
);

assert.deepEqual(parseSupportTicketApiError('Token expired'), {
  form: 'Token expired',
});

console.log('support validation passed');
